import type { Role } from "../../../../../packages/contracts/roles";
import { getDummyHash, hashPassword, newId, sha256Hex, verifyPassword } from "../../lib/crypto";
import { clearSessionCookie, fail, ok, readCookie, readJson, SESSION_COOKIE, sessionCookie, type Ctx } from "../../lib/http";
import {
  audit, auditStatement, clearAttempts, countAttempt, findSession, IP_ATTEMPT_LIMIT, newSession, requireSession,
  revokeUserSessions, SESSION_TTL_MS, sessionView, THROTTLE_WINDOW_MS, USER_ATTEMPT_LIMIT,
} from "../../services/auth";
import { bootstrapSecretsSchema, changePasswordSchema, loginSchema } from "../../validators/auth";

const bootstrapped = (ctx: Ctx) => ctx.env.DB.prepare("SELECT 1 AS done FROM bootstrap_state WHERE id = 1").first();

export async function bootstrapStatus(ctx: Ctx) {
  return ok(ctx, { available: !(await bootstrapped(ctx)) });
}

/** One-time owner creation from operator secrets. Never accepts credentials from the request. */
export async function bootstrap(ctx: Ctx) {
  const denied = async () => {
    await audit(ctx, { action: "bootstrap", outcome: "denied" });
    return fail(ctx, 403, "forbidden", "Setup is not available.");
  };
  if (await bootstrapped(ctx)) return denied();

  const secrets = bootstrapSecretsSchema.safeParse({
    username: ctx.env.OWNER_USERNAME,
    password: ctx.env.OWNER_PASSWORD,
    displayName: ctx.env.OWNER_DISPLAY_NAME || undefined,
    workspaceName: ctx.env.WORKSPACE_NAME || undefined,
  });
  if (!secrets.success) {
    await audit(ctx, { action: "bootstrap", outcome: "failed" });
    return fail(ctx, 503, "dependency_failed", "Setup is not configured. Ask the operator to set the owner secrets.");
  }

  const { username, password, displayName, workspaceName } = secrets.data;
  const db = ctx.env.DB;
  const userId = newId("usr");
  const workspaceId = newId("wsp");
  const hash = hashPassword(password);
  try {
    await db.batch([
      db.prepare("INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)").bind(workspaceId, workspaceName ?? "QC Studio", ctx.now, ctx.now),
      db.prepare("INSERT INTO users (id, username, username_normalized, display_name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(userId, username, username.toLowerCase(), displayName ?? username, hash, ctx.now, ctx.now),
      db.prepare("INSERT INTO workspace_members (workspace_id, user_id, role, created_at, updated_at) VALUES (?, ?, 'owner', ?, ?)").bind(workspaceId, userId, ctx.now, ctx.now),
      db.prepare("INSERT INTO bootstrap_state (id, owner_user_id, completed_at) VALUES (1, ?, ?)").bind(userId, ctx.now),
      auditStatement(ctx, { action: "bootstrap", outcome: "success", workspaceId, actorId: userId, resourceType: "user", resourceId: userId }),
    ]);
  } catch (error) {
    // A concurrent bootstrap won the single-row insert; anything else is a dependency failure.
    if (await bootstrapped(ctx)) return denied();
    throw error;
  }
  return ok(ctx, { bootstrapped: true }, 201);
}

export async function getSession(ctx: Ctx) {
  const session = await requireSession(ctx, { allowPasswordChange: true });
  return session instanceof Response ? session : ok(ctx, sessionView(session));
}

type LoginRow = {
  id: string; username: string; display_name: string; password_hash: string; must_change_password: number;
  workspace_id: string | null; workspace_name: string | null; role: Role | null;
};

export async function login(ctx: Ctx) {
  const body = await readJson(ctx, loginSchema);
  if (body instanceof Response) return body;
  const db = ctx.env.DB;
  const userKey = `user:${body.username.toLowerCase()}`;
  const [userAttempts, ipAttempts] = await Promise.all([countAttempt(db, userKey, ctx.now), countAttempt(db, `ip:${ctx.ip}`, ctx.now)]);
  if (userAttempts > USER_ATTEMPT_LIMIT || ipAttempts > IP_ATTEMPT_LIMIT) {
    await audit(ctx, { action: "session.create", outcome: "denied" });
    return fail(ctx, 429, "rate_limited", "Too many sign-in attempts. Wait 15 minutes and try again.", { "Retry-After": String(THROTTLE_WINDOW_MS / 1000) });
  }

  // Only an active membership can sign in; a disabled member gets the same answer as a wrong password.
  const user = await db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.password_hash, u.must_change_password, m.workspace_id, m.role, w.name AS workspace_name
       FROM users u
       LEFT JOIN workspace_members m ON m.user_id = u.id AND m.status = 'active'
       LEFT JOIN workspaces w ON w.id = m.workspace_id
       WHERE u.username_normalized = ? ORDER BY m.created_at LIMIT 1`,
    )
    .bind(body.username.toLowerCase())
    .first<LoginRow>();
  const valid = verifyPassword(body.password, user?.password_hash ?? getDummyHash());
  if (!user || !valid || !user.workspace_id || !user.role) {
    await audit(ctx, { action: "session.create", outcome: "failed", actorId: user?.id, workspaceId: user?.workspace_id });
    return fail(ctx, 401, "unauthenticated", "Username or password is incorrect.");
  }

  // Rotate: a session cookie presented with the login is revoked, so a planted token cannot be upgraded.
  const prior = readCookie(ctx.request, SESSION_COOKIE);
  const { token, statement } = await newSession(db, user.id, user.workspace_id, ctx.now);
  await db.batch([
    ...(prior && prior.length <= 128
      ? [db.prepare("UPDATE sessions SET revoked_at = ?, revoked_reason = 'rotated' WHERE token_hash = ? AND revoked_at IS NULL").bind(ctx.now, await sha256Hex(prior))]
      : []),
    clearAttempts(db, userKey),
    statement,
    auditStatement(ctx, { action: "session.create", outcome: "success", actorId: user.id, workspaceId: user.workspace_id, resourceType: "user", resourceId: user.id }),
  ]);
  const view = sessionView({
    sessionId: "", userId: user.id, workspaceId: user.workspace_id, workspaceName: user.workspace_name ?? "", username: user.username,
    displayName: user.display_name, role: user.role, mustChangePassword: user.must_change_password === 1,
  });
  return ok(ctx, view, 200, { "Set-Cookie": sessionCookie(token, SESSION_TTL_MS) });
}

export async function logout(ctx: Ctx) {
  const session = await findSession(ctx);
  if (session) {
    await ctx.env.DB.batch([
      ctx.env.DB.prepare("UPDATE sessions SET revoked_at = ?, revoked_reason = 'logout' WHERE id = ?").bind(ctx.now, session.sessionId),
      auditStatement(ctx, { action: "session.delete", outcome: "success", actorId: session.userId, workspaceId: session.workspaceId, resourceType: "session", resourceId: session.sessionId }),
    ]);
  }
  return ok(ctx, { signedOut: true }, 200, { "Set-Cookie": clearSessionCookie });
}

/** Changes the caller's password, clears a temporary-password flag, revokes every session and issues a new one. */
export async function changePassword(ctx: Ctx) {
  const session = await requireSession(ctx, { allowPasswordChange: true });
  if (session instanceof Response) return session;
  const body = await readJson(ctx, changePasswordSchema);
  if (body instanceof Response) return body;
  const db = ctx.env.DB;
  const userKey = `user:${session.username.toLowerCase()}`;
  if ((await countAttempt(db, userKey, ctx.now)) > USER_ATTEMPT_LIMIT) {
    await audit(ctx, { action: "password.change", outcome: "denied", actorId: session.userId, workspaceId: session.workspaceId });
    return fail(ctx, 429, "rate_limited", "Too many attempts. Wait 15 minutes and try again.", { "Retry-After": String(THROTTLE_WINDOW_MS / 1000) });
  }
  const row = await db.prepare("SELECT password_hash FROM users WHERE id = ?").bind(session.userId).first<{ password_hash: string }>();
  if (!row || !verifyPassword(body.currentPassword, row.password_hash)) {
    await audit(ctx, { action: "password.change", outcome: "failed", actorId: session.userId, workspaceId: session.workspaceId });
    return fail(ctx, 403, "forbidden", "Your current password is incorrect.");
  }
  if (body.currentPassword === body.newPassword) return fail(ctx, 400, "validation_failed", "Choose a new password that differs from the current one.");

  const { token, statement } = await newSession(db, session.userId, session.workspaceId, ctx.now);
  await db.batch([
    db.prepare("UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?").bind(hashPassword(body.newPassword), ctx.now, session.userId),
    revokeUserSessions(db, session.userId, "password_changed", ctx.now),
    clearAttempts(db, userKey),
    statement,
    auditStatement(ctx, { action: "password.change", outcome: "success", actorId: session.userId, workspaceId: session.workspaceId, resourceType: "user", resourceId: session.userId }),
  ]);
  return ok(ctx, sessionView({ ...session, mustChangePassword: false }), 200, { "Set-Cookie": sessionCookie(token, SESSION_TTL_MS) });
}
