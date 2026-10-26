import type { z } from "zod";
import type { Env } from "../types/env";

export type Ctx = { request: Request; env: Env; requestId: string; now: number; ip: string };

export type ErrorCode = "validation_failed" | "unauthenticated" | "forbidden" | "not_found" | "conflict" | "rate_limited" | "dependency_failed" | "password_change_required";

const baseHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function send(ctx: Ctx, status: number, body: unknown, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...baseHeaders, "X-Request-Id": ctx.requestId, ...extra } });
}

export const ok = (ctx: Ctx, data: unknown, status = 200, headers?: Record<string, string>) => send(ctx, status, { data, requestId: ctx.requestId }, headers);

export const fail = (ctx: Ctx, status: number, code: ErrorCode, message: string, headers?: Record<string, string>) =>
  send(ctx, status, { error: { code, message, requestId: ctx.requestId } }, headers);

const MAX_BODY = 8 * 1024;

/** Parses a JSON body against `schema`, or returns the error response. */
export async function readJson<T>(ctx: Ctx, schema: z.ZodType<T>): Promise<T | Response> {
  if (!ctx.request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return fail(ctx, 415, "validation_failed", "Send the request body as JSON.");
  }
  const tooLarge = () => fail(ctx, 413, "validation_failed", "The request body is too large.");
  if (Number(ctx.request.headers.get("Content-Length") ?? 0) > MAX_BODY) return tooLarge();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (ctx.request.body) {
    const reader = ctx.request.body.getReader();
    for (let r = await reader.read(); !r.done; r = await reader.read()) {
      size += r.value.byteLength;
      if (size > MAX_BODY) {
        await reader.cancel();
        return tooLarge();
      }
      chunks.push(r.value);
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  const text = new TextDecoder().decode(bytes);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return fail(ctx, 400, "validation_failed", "The request body is not valid JSON.");
  }
  const result = schema.safeParse(value);
  return result.success ? result.data : fail(ctx, 400, "validation_failed", result.error.issues[0]?.message ?? "Check the request fields.");
}

export const SESSION_COOKIE = "__Host-qc_session";
const cookieAttrs = "Path=/; Secure; HttpOnly; SameSite=Strict";
export const sessionCookie = (token: string, maxAgeMs: number) => `${SESSION_COOKIE}=${token}; ${cookieAttrs}; Max-Age=${Math.floor(maxAgeMs / 1000)}`;
export const clearSessionCookie = `${SESSION_COOKIE}=; ${cookieAttrs}; Max-Age=0`;

export function readCookie(request: Request, name: string) {
  for (const part of (request.headers.get("Cookie") ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=") || null;
  }
  return null;
}

/** CSRF/origin defence for state-changing requests: Origin must be this Worker's origin or an allow-listed one. */
export function originAllowed(request: Request, env: Env) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  const allowed = [new URL(request.url).origin, ...(env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean)];
  return allowed.includes(origin);
}
