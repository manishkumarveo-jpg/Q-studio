import type { Role } from "../../../../../packages/contracts/roles";

// Same-origin JSON client for the Worker API. The session lives in an HttpOnly cookie the app never reads.
export type ApiError = { code: string; message: string };
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: ApiError };

export type SessionData = {
  user: { id: string; username: string; displayName: string; role: Role; mustChangePassword: boolean };
  workspace: { id: string; name: string };
};

export type Member = { id: string; username: string; displayName: string; role: Role; status: "active" | "disabled"; mustChangePassword: boolean; createdAt: number };

const unreachable: ApiError = { code: "dependency_failed", message: "QC Studio could not be reached. Check your connection and try again." };
const unexpected: ApiError = { code: "dependency_failed", message: "QC Studio returned an unexpected response. Try again." };

export async function api<T>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, error: unreachable };
  }
  const payload = (await response.json().catch(() => null)) as { data?: T; error?: ApiError } | null;
  if (response.ok && payload && "data" in payload) return { ok: true, data: payload.data as T };
  const error = payload?.error;
  return { ok: false, status: response.status, error: error && typeof error.message === "string" ? error : unexpected };
}

/** Only same-app absolute paths are accepted as a post-sign-in destination. */
export const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") && !next.startsWith("/login") ? next : "/dashboard");
