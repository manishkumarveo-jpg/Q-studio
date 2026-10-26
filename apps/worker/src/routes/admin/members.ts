import { can, canManageMember, type Role } from "../../../../../packages/contracts/roles";
import { hashPassword, newId, randomToken } from "../../lib/crypto";
import { fail, ok, readJson, type Ctx } from "../../lib/http";
import { audit, auditStatement, requireSession, revokeUserSessions, type Session } from "../../services/auth";
import { createMemberSchema, updateMemberSchema } from "../../validators/auth";

type MemberRow = { id: string; username: string; display_name: string; role: Role; status: "active" | "disabled"; must_change_password: number; created_at: number };

const memberView = (m: MemberRow) => ({
  id: m.id, username: m.username, displayName: m.display_name, role: m.role, status: m.status,
  mustChangePassword: m.must_change_password === 1, createdAt: m.created_at,
});

const MEMBER_SELECT = `SELECT u.id, u.username, u.display_name, m.role, m.status, u.must_change_password, m.created_at
  FROM workspace_members m JOIN users u ON u.id = m.user_id WHERE m.workspace_id = ?`;

// Shown once to the admin, who passes it to the member out of band; it must be changed at first sign-in.
const temporaryPassword = () => randomToken(18);

async function requireManager(ctx: Ctx): Promise<Session | Response> {
  const session = await requireSession(ctx);
  if (session instanceof Response) return session;
  if (can(session.role, "members.manage")) return session;
  await audit(ctx, { action: "members.access", outcome: "denied", actorId: session.userId, workspaceId: session.workspaceId });
  return fail(ctx, 403, "forbidden", "You do not have permission to manage members.");
}

export async function listMembers(ctx: Ctx) {
  const session = await requireManager(ctx);
  if (session instanceof Response) return session;
  // ponytail: one studio workspace, bounded at 200 rows; add cursor pagination when a workspace can exceed it.
  const { results } = await ctx.env.DB.prepare(`${MEMBER_SELECT} ORDER BY u.username_normalized LIMIT 200`).bind(session.workspaceId).all<MemberRow>();
  return ok(ctx, { members: results.map(memberView) });
}

export async function createMember(ctx: Ctx) {
  const session = await requireManager(ctx);
  if (session instanceof Response) return session;
  const body = await readJson(ctx, createMemberSchema);
  if (body instanceof Response) return body;
  if (!canManageMember(session.role, body.role, body.role)) {
    await audit(ctx, { action: "member.create", outcome: "denied", actorId: session.userId, workspaceId: session.workspaceId });
    return fail(ctx, 403, "forbidden", "You cannot grant that role.");
  }
  const db = ctx.env.DB;
  const normalized = body.username.toLowerCase();
  if (await db.prepare("SELECT 1 AS taken FROM users WHERE username_normalized = ?").bind(normalized).first()) {
    return fail(ctx, 409, "conflict", "That username is already in use.");
  }
  const userId = newId("usr");
  const password = temporaryPassword();
  try {
    await db.batch([
      db.prepare("INSERT INTO users (id, username, username_normalized, display_name, password_hash, must_change_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)")
        .bind(userId, body.username, normalized, body.displayName, hashPassword(password), ctx.now, ctx.now),
      db.prepare("INSERT INTO workspace_members (workspace_id, user_id, role, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(session.workspaceId, userId, body.role, session.userId, session.userId, ctx.now, ctx.now),
      auditStatement(ctx, { action: "member.create", outcome: "success", actorId: session.userId, workspaceId: session.workspaceId, resourceType: "user", resourceId: userId }),
    ]);
  } catch (error) {
    // Lost a race on the unique username.
    if (await db.prepare("SELECT 1 AS taken FROM users WHERE username_normalized = ?").bind(normalized).first()) {
      return fail(ctx, 409, "conflict", "That username is already in use.");
    }
    throw error;
  }
  const member = await db.prepare(`${MEMBER_SELECT} AND u.id = ?`).bind(session.workspaceId, userId).first<MemberRow>();
  return ok(ctx, { member: member && memberView(member), temporaryPassword: password }, 201);
}

/** Loads a member of the caller's workspace and checks the caller may change them. Other workspaces look like not found. */
async function targetFor(ctx: Ctx, session: Session, memberId: string, action: string, nextRole?: Role): Promise<MemberRow | Response> {
  const target = await ctx.env.DB.prepare(`${MEMBER_SELECT} AND u.id = ?`).bind(session.workspaceId, memberId).first<MemberRow>();
  if (!target) return fail(ctx, 404, "not_found", "Member not found.");
  const denied = async (message: string) => {
    await audit(ctx, { action, outcome: "denied", actorId: session.userId, workspaceId: session.workspaceId, resourceType: "user", resourceId: memberId });
    return fail(ctx, 403, "forbidden", message);
  };
  // Refusing self-changes also guarantees the last owner cannot be demoted or disabled: only an owner can change an owner.
  if (target.id === session.userId) return denied("You cannot change your own access here.");
  if (!canManageMember(session.role, target.role, nextRole)) return denied("You do not have permission to change this member.");
  return target;
}

export async function updateMember(ctx: Ctx, memberId: string) {
  const session = await requireManager(ctx);
  if (session instanceof Response) return session;
  const body = await readJson(ctx, updateMemberSchema);
  if (body instanceof Response) return body;
  const target = await targetFor(ctx, session, memberId, "member.update", body.role);
  if (target instanceof Response) return target;
  const db = ctx.env.DB;
  // Any role or status change revokes the member's sessions so new privileges need a fresh sign-in.
  await db.batch([
    db.prepare("UPDATE workspace_members SET role = ?, status = ?, updated_by = ?, updated_at = ? WHERE workspace_id = ? AND user_id = ?")
      .bind(body.role ?? target.role, body.status ?? target.status, session.userId, ctx.now, session.workspaceId, target.id),
    revokeUserSessions(db, target.id, "access_changed", ctx.now),
    auditStatement(ctx, { action: "member.update", outcome: "success", actorId: session.userId, workspaceId: session.workspaceId, resourceType: "user", resourceId: target.id }),
  ]);
  return ok(ctx, { member: memberView({ ...target, role: body.role ?? target.role, status: body.status ?? target.status }) });
}

export async function resetMemberPassword(ctx: Ctx, memberId: string) {
  const session = await requireManager(ctx);
  if (session instanceof Response) return session;
  const target = await targetFor(ctx, session, memberId, "member.reset_password");
  if (target instanceof Response) return target;
  const db = ctx.env.DB;
  const password = temporaryPassword();
  // ponytail: credentials are global per user; with one workspace that is fine. Scope resets when users span workspaces.
  await db.batch([
    db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = ? WHERE id = ?").bind(hashPassword(password), ctx.now, target.id),
    revokeUserSessions(db, target.id, "password_reset", ctx.now),
    auditStatement(ctx, { action: "member.reset_password", outcome: "success", actorId: session.userId, workspaceId: session.workspaceId, resourceType: "user", resourceId: target.id }),
  ]);
  return ok(ctx, { member: memberView({ ...target, must_change_password: 1 }), temporaryPassword: password });
}
