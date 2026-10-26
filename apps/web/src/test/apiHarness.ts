import { createTestD1 } from "../../../../packages/test-utils/sqliteD1";
import { handleApi } from "../../../worker/src/index";
import type { Env } from "../../../worker/src/types/env";

export const TEST_OWNER = { username: "casey", password: "owner-test-passphrase" };
const ORIGIN = "http://localhost";

/** Routes the app's fetch calls into the real Worker handler with a fresh in-memory D1 and a cookie jar. */
export function createApiHarness() {
  const env: Env = {
    DB: createTestD1(),
    ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
    OWNER_USERNAME: TEST_OWNER.username,
    OWNER_PASSWORD: TEST_OWNER.password,
    OWNER_DISPLAY_NAME: "Casey Morgan",
    WORKSPACE_NAME: "Kepler Post",
  };
  let cookie = "";
  const state = { offline: false };
  const fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    if (state.offline) throw new TypeError("Failed to fetch");
    const headers = new Headers(init.headers);
    if (cookie) headers.set("Cookie", cookie);
    if (init.method && init.method !== "GET") headers.set("Origin", ORIGIN);
    const response = await handleApi(new Request(new URL(String(input), ORIGIN), { ...init, headers }), env);
    const setCookie = response.headers.get("Set-Cookie");
    if (setCookie) cookie = setCookie.includes("Max-Age=0") ? "" : setCookie.split(";")[0];
    return response;
  };
  const post = (path: string, body?: unknown) =>
    fetch(path, { method: "POST", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  return {
    env,
    fetch,
    state,
    bootstrap: () => post("/api/v1/bootstrap"),
    signIn: (username = TEST_OWNER.username, password = TEST_OWNER.password) => post("/api/v1/session", { username, password }),
    signOut: () => fetch("/api/v1/session", { method: "DELETE" }),
    post,
  };
}
export type ApiHarness = ReturnType<typeof createApiHarness>;
