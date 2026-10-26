import type { Role } from "../../../../packages/contracts/roles";
import { newId, randomToken, sha256Hex } from "../lib/crypto";
import { fail, readCookie, SESSION_COOKIE, type Ctx } from "../lib/http";
import type { D1Database } from "../types/env";

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const THROTTLE_WINDOW_MS = 15 * 60 * 1000;
export const USER_ATTEMPT_LIMIT = 5;
export const IP_ATTEMPT_LIMIT = 30;

export type Session = {
  sessionId: string;
  userId: string;
  workspaceId: string;
  workspaceName: string;
  username: string;
  displayName: string;
  role: Role;
  mustChangePassword: boolean;
};

export const sessionView = (s: Session) => ({
  user: { id: s.userId, username: s.username, displayName: s.displayName, role: s.role, mustChangePassword: s.mustChangePassword },
  workspace: { id: s.workspaceId, name: s.workspaceName },
});

type AuditEvent = { action: string; outcome: "success" | "denied" | "failed"; workspaceId?: string | null; actorId?: string | null; resourceType?: string; resourceId?: string };

export const auditStatement = (ctx: Ctx, e: AuditEvent) =>
  ctx.env.DB.prepare(
    "INSERT INTO audit_events (id, workspace_id, actor_user_id, action, resource_type, resource_id, outcome, request_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(newId("aud"), e.workspaceId ?? null, e.actorId ?? null, e.action, e.resourceType ?? null, e.resourceId ?? null, e.outcome, ctx.requestId, ctx.now);

export const audit = (ctx: Ctx, e: AuditEvent) => auditStatement(ctx, e).run();

/** Counts an attempt for `key` (atomic upsert) and returns the attempts in the current window. */
export async function countAttempt(db: D1Database, key: string, now: number) {
  const row = await db
    .prepare(
      `INSERT INTO login_throttle (key, attempts, window_started_at) VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         attempts = CASE WHEN window_started_at <= ?3 THEN 1 ELSE attempts + 1 END,
         window_started_at = CASE WHEN window_started_at <= ?3 THEN ?2 ELSE window_started_at END
       RETURNING attempts`,
    )
    .bind(key, now, now - THROTTLE_WINDOW_MS)
    .first<{ attempts: number }>();
  return row?.attempts ?? Number.POSITIVE_INFINITY;
}
// ponytail: throttle rows are never pruned; add a scheduled cleanup in Phase 19 if the table grows.

export const clearAttempts = (db: D1Database, key: string) => db.prepare("DELETE FROM login_throttle WHERE key = ?").bind(key);

/** Inserts a session statement; the caller runs it (alone or in a batch) and sets the cookie. */
export async function newSession(db: D1Database, userId: string, workspaceId: string, now: number) {
  const token = randomToken();
  const statement = db
    .prepare("INSERT INTO sessions (id, token_hash, user_id, workspace_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(newId("ses"), await sha256Hex(token), userId, workspaceId, now, now + SESSION_TTL_MS);
  return { token, statement };
}

export const revokeUserSessions = (db: D1Database, userId: string, reason: string, now: number) =>
  db.prepare("UPDATE sessions SET revoked_at = ?, revoked_reason = ? WHERE user_id = ? AND revoked_at IS NULL").bind(now, reason, userId);

type SessionRow = {
  session_id: string; user_id: string; workspace_id: string; workspace_name: string; username: string;
  display_name: string; role: Role; must_change_password: number;
};

/** Resolves the cookie to a live session: unexpired, unrevoked and an active membership, read fresh each request. */
export async function findSession(ctx: Ctx): Promise<Session | null> {
  const token = readCookie(ctx.request, SESSION_COOKIE);
  if (!token || token.length > 128) return null;
  const row = await ctx.env.DB.prepare(
    `SELECT s.id AS session_id, s.user_id, s.workspace_id, w.name AS workspace_name, u.username, u.display_name, m.role, u.must_change_password
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     JOIN workspaces w ON w.id = s.workspace_id
     JOIN workspace_members m ON m.workspace_id = s.workspace_id AND m.user_id = s.user_id
     WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND m.status = 'active'`,
  )
    .bind(await sha256Hex(token), ctx.now)
    .first<SessionRow>();
  if (!row) return null;
  return {
    sessionId: row.session_id, userId: row.user_id, workspaceId: row.workspace_id, workspaceName: row.workspace_name,
    username: row.username, displayName: row.display_name, role: row.role, mustChangePassword: row.must_change_password === 1,
  };
}

/** Returns the session or a generic 401. Until a temporary password is changed, only session routes are allowed. */
export async function requireSession(ctx: Ctx, { allowPasswordChange = false } = {}): Promise<Session | Response> {
  const session = await findSession(ctx);
  if (!session) return fail(ctx, 401, "unauthenticated", "Sign in to continue.");
  if (session.mustChangePassword && !allowPasswordChange) {
    return fail(ctx, 403, "password_change_required", "Change your temporary password to continue.");
  }
  return session;
}
