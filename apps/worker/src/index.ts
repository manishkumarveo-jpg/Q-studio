import { fail, originAllowed, type Ctx } from "./lib/http";
import { createMember, listMembers, resetMemberPassword, updateMember } from "./routes/admin/members";
import { bootstrap, bootstrapStatus, changePassword, getSession, login, logout } from "./routes/auth";
import type { Env } from "./types/env";

type Handler = (ctx: Ctx, ...params: string[]) => Promise<Response>;

const ID = "([A-Za-z0-9_]{1,64})";
const routes: [string, RegExp, Handler][] = [
  ["GET", /^\/api\/v1\/bootstrap$/, bootstrapStatus],
  ["POST", /^\/api\/v1\/bootstrap$/, bootstrap],
  ["GET", /^\/api\/v1\/session$/, getSession],
  ["POST", /^\/api\/v1\/session$/, login],
  ["DELETE", /^\/api\/v1\/session$/, logout],
  ["POST", /^\/api\/v1\/session\/password$/, changePassword],
  ["GET", /^\/api\/v1\/members$/, listMembers],
  ["POST", /^\/api\/v1\/members$/, createMember],
  ["PATCH", new RegExp(`^/api/v1/members/${ID}$`), updateMember],
  ["POST", new RegExp(`^/api/v1/members/${ID}/reset-password$`), resetMemberPassword],
];

export async function handleApi(request: Request, env: Env, now = Date.now()): Promise<Response> {
  const ctx: Ctx = { request, env, now, requestId: crypto.randomUUID(), ip: request.headers.get("CF-Connecting-IP") ?? "unknown" };
  const { pathname } = new URL(request.url);
  try {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !originAllowed(request, env)) {
      return fail(ctx, 403, "forbidden", "Request origin is not allowed.");
    }
    for (const [method, pattern, handler] of routes) {
      const match = pattern.exec(pathname);
      if (match && method === request.method) return await handler(ctx, ...match.slice(1));
    }
    return fail(ctx, 404, "not_found", "Not found.");
  } catch (error) {
    // Fail closed. Log only the error class and request ID, never SQL, bodies, cookies or tokens.
    console.error(JSON.stringify({ requestId: ctx.requestId, path: pathname, outcome: "dependency_failed", error: error instanceof Error ? error.name : "unknown" }));
    return fail(ctx, 503, "dependency_failed", "QC Studio could not complete the request. Try again.");
  }
}

export default {
  fetch(request: Request, env: Env) {
    return new URL(request.url).pathname.startsWith("/api/") ? handleApi(request, env) : env.ASSETS.fetch(request);
  },
};
