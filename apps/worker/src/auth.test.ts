import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { can, canManageMember, roles } from "../../../packages/contracts/roles";
import { createTestD1 } from "../../../packages/test-utils/sqliteD1";
import { handleApi } from "./index";
import { ARGON2_PARAMS, hashPassword, verifyPassword } from "./lib/crypto";
import { SESSION_TTL_MS, THROTTLE_WINDOW_MS } from "./services/auth";
import type { Env } from "./types/env";

// Full-cost Argon2 is covered once below; the API tests use a cheap profile to stay fast.
vi.mock("./lib/crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/crypto")>();
  const cheap = { m: 64, t: 1, p: 1 };
  const dummy = actual.hashPassword("dummy", cheap);
  return { ...actual, hashPassword: (password: string) => actual.hashPassword(password, cheap), getDummyHash: () => dummy };
});

const ORIGIN = "https://qc.test";
const OWNER = { username: "Owner.Admin", password: "owner-secret-passphrase" };
let db: ReturnType<typeof createTestD1>;
let env: Env;
let clock = Date.UTC(2026, 9, 26);

type Options = { body?: unknown; cookie?: string; origin?: string | null; ip?: string; contentType?: string };
function call(method: string, path: string, { body, cookie, origin = ORIGIN, ip = "203.0.113.1", contentType = "application/json" }: Options = {}) {
  const headers = new Headers({ "CF-Connecting-IP": ip });
  if (origin) headers.set("Origin", origin);
  if (cookie) headers.set("Cookie", cookie);
  if (body !== undefined) headers.set("Content-Type", contentType);
  const payload = body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body);
  return handleApi(new Request(`${ORIGIN}${path}`, { method, headers, body: payload }), env, clock);
}
const json = async (res: Response) => (await res.json()) as { data?: any; error?: { code: string; message: string; requestId: string } };
const cookieOf = (res: Response) => res.headers.get("Set-Cookie")!.split(";")[0];
const count = (sql: string, ...values: (string | number)[]) => (db.raw.prepare(sql).get(...values) as { n: number }).n;

async function signIn(username: string, password: string, ip?: string) {
  const res = await call("POST", "/api/v1/session", { body: { username, password }, ip });
  expect(res.status).toBe(200);
  return cookieOf(res);
}

async function bootstrapOwner() {
  expect((await call("POST", "/api/v1/bootstrap")).status).toBe(201);
  return signIn(OWNER.username, OWNER.password);
}

async function addMember(owner: string, username: string, role: string) {
  const res = await call("POST", "/api/v1/members", { cookie: owner, body: { username, displayName: username, role } });
  expect(res.status).toBe(201);
  const { data } = await json(res);
  return { id: data.member.id as string, temporaryPassword: data.temporaryPassword as string };
}

/** Creates a member and completes the forced password change; returns their session cookie. */
async function activeMember(owner: string, username: string, role: string) {
  const member = await addMember(owner, username, role);
  const first = await signIn(username, member.temporaryPassword);
  const changed = await call("POST", "/api/v1/session/password", { cookie: first, body: { currentPassword: member.temporaryPassword, newPassword: `${username}-new-password` } });
  expect(changed.status).toBe(200);
  return { ...member, cookie: cookieOf(changed), password: `${username}-new-password` };
}

beforeEach(() => {
  db = createTestD1();
  clock = Date.UTC(2026, 9, 26);
  env = {
    DB: db,
    ASSETS: { fetch: async () => new Response("asset") },
    OWNER_USERNAME: OWNER.username,
    OWNER_PASSWORD: OWNER.password,
    OWNER_DISPLAY_NAME: "Studio Owner",
    WORKSPACE_NAME: "Kepler Post",
  };
});

afterEach(() => vi.restoreAllMocks());

describe("TC-UNIT-008 role policy", () => {
  it("grants member management only to owner and admin, and Owner changes only to owners", () => {
    expect(roles.filter((r) => can(r, "members.manage"))).toEqual(["owner", "admin"]);
    expect(can("client", "assets.view")).toBe(false);
    expect(canManageMember("admin", "producer", "editor")).toBe(true);
    expect(canManageMember("admin", "producer", "owner")).toBe(false);
    expect(canManageMember("admin", "owner")).toBe(false);
    expect(canManageMember("owner", "owner", "admin")).toBe(true);
    expect(canManageMember("producer", "reviewer")).toBe(false);
  });
});

describe("ADR-003 password hashing", () => {
  it("hashes with the full Argon2id profile in PHC format and verifies only the right password", async () => {
    const actual = await vi.importActual<typeof import("./lib/crypto")>("./lib/crypto");
    const stored = actual.hashPassword("correct horse battery");
    expect(stored).toMatch(new RegExp(`^\\$argon2id\\$v=19\\$m=${ARGON2_PARAMS.m},t=${ARGON2_PARAMS.t},p=${ARGON2_PARAMS.p}\\$`));
    expect(stored).not.toContain("correct horse");
    expect(verifyPassword("correct horse battery", stored)).toBe(true);
    expect(verifyPassword("correct horse batterY", stored)).toBe(false);
    expect(verifyPassword("correct horse battery", stored.replace(",t=2,", ",t=3,"))).toBe(false);
    expect(verifyPassword("x", "plaintext")).toBe(false);
    expect(actual.hashPassword("same")).not.toBe(actual.hashPassword("same"));
    expect(hashPassword("cheap profile")).toContain("m=64,t=1,p=1");
    // The fixed unknown-user hash must cost the same as a real one.
    expect(actual.getDummyHash()).toMatch(new RegExp(`^\\$argon2id\\$v=19\\$m=${ARGON2_PARAMS.m},t=${ARGON2_PARAMS.t},p=${ARGON2_PARAMS.p}\\$`));
    expect(verifyPassword("anything", actual.getDummyHash())).toBe(false);
  }, 30_000);
});

describe("TC-API-004 / TC-SEC-001 owner bootstrap", () => {
  it("creates the owner once from secrets and then denies every repeat without disclosure", async () => {
    expect((await json(await call("GET", "/api/v1/bootstrap"))).data).toEqual({ available: true });
    // Credentials in the request body are ignored; only operator secrets are used.
    const created = await call("POST", "/api/v1/bootstrap", { body: { username: "attacker", password: "attacker-password" } });
    expect(created.status).toBe(201);
    expect(await created.text()).not.toContain(OWNER.password);
    expect(count("SELECT COUNT(*) AS n FROM users")).toBe(1);
    expect(count("SELECT COUNT(*) AS n FROM workspace_members WHERE role = 'owner'")).toBe(1);
    expect(count("SELECT COUNT(*) AS n FROM users WHERE password_hash LIKE ?", `%${OWNER.password}%`)).toBe(0);

    env.OWNER_USERNAME = "second";
    const repeat = await call("POST", "/api/v1/bootstrap");
    expect(repeat.status).toBe(403);
    expect((await json(repeat)).error).toMatchObject({ code: "forbidden", message: "Setup is not available." });
    expect((await json(await call("GET", "/api/v1/bootstrap"))).data).toEqual({ available: false });
    expect(count("SELECT COUNT(*) AS n FROM users")).toBe(1);
    expect(count("SELECT COUNT(*) AS n FROM audit_events WHERE action = 'bootstrap' AND outcome = 'denied'")).toBe(1);
  });

  it("lets exactly one of two concurrent bootstraps win", async () => {
    const results = await Promise.all([call("POST", "/api/v1/bootstrap"), call("POST", "/api/v1/bootstrap")]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 403]);
    expect(count("SELECT COUNT(*) AS n FROM users")).toBe(1);
    expect(count("SELECT COUNT(*) AS n FROM workspaces")).toBe(1);
  });

  it("refuses to bootstrap without valid secrets and creates nothing", async () => {
    env.OWNER_PASSWORD = undefined;
    expect((await call("POST", "/api/v1/bootstrap")).status).toBe(503);
    env.OWNER_PASSWORD = "short";
    const weak = await call("POST", "/api/v1/bootstrap");
    expect(weak.status).toBe(503);
    expect(await weak.text()).not.toContain("short");
    expect(count("SELECT COUNT(*) AS n FROM users")).toBe(0);
    expect((await json(await call("GET", "/api/v1/bootstrap"))).data).toEqual({ available: true });
  });
});

describe("TC-E2E-001 (API) / TC-SEC-002 sign-in, session and sign-out", () => {
  it("signs in with secure cookie flags, stores only a token hash, and signs out", async () => {
    await call("POST", "/api/v1/bootstrap");
    const res = await call("POST", "/api/v1/session", { body: { username: "owner.admin", password: OWNER.password } });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("Set-Cookie")!;
    expect(setCookie).toMatch(/^__Host-qc_session=[A-Za-z0-9_-]{43};/);
    for (const flag of ["Path=/", "Secure", "HttpOnly", "SameSite=Strict", `Max-Age=${SESSION_TTL_MS / 1000}`]) expect(setCookie).toContain(flag);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect((await json(res)).data).toEqual({
      user: { id: expect.stringMatching(/^usr_/), username: OWNER.username, displayName: "Studio Owner", role: "owner", mustChangePassword: false },
      workspace: { id: expect.stringMatching(/^wsp_/), name: "Kepler Post" },
    });
    const token = cookieOf(res).split("=")[1];
    expect(count("SELECT COUNT(*) AS n FROM sessions WHERE token_hash = ?", token)).toBe(0);
    expect(count("SELECT COUNT(*) AS n FROM sessions WHERE length(token_hash) = 64")).toBe(1);

    const cookie = cookieOf(res);
    expect((await call("GET", "/api/v1/session", { cookie })).status).toBe(200);
    const out = await call("DELETE", "/api/v1/session", { cookie });
    expect(out.status).toBe(200);
    expect(out.headers.get("Set-Cookie")).toContain("Max-Age=0");
    expect((await call("GET", "/api/v1/session", { cookie })).status).toBe(401);
    expect(count("SELECT COUNT(*) AS n FROM audit_events WHERE action = 'session.delete' AND outcome = 'success'")).toBe(1);
  });

  it("gives one generic answer for a wrong password, an unknown user and a disabled member", async () => {
    const owner = await bootstrapOwner();
    const member = await activeMember(owner, "editor1", "editor");
    await call("PATCH", `/api/v1/members/${member.id}`, { cookie: owner, body: { status: "disabled" } });
    const attempts = [
      { username: OWNER.username, password: "wrong-password-123" },
      { username: "nobody", password: "wrong-password-123" },
      { username: "editor1", password: member.password },
    ];
    const answers = [];
    for (const body of attempts) {
      const res = await call("POST", "/api/v1/session", { body });
      expect(res.headers.get("Set-Cookie")).toBeNull();
      const { error } = await json(res);
      answers.push([res.status, error!.code, error!.message]);
    }
    expect(new Set(answers.map((a) => JSON.stringify(a))).size).toBe(1);
    expect(answers[0]).toEqual([401, "unauthenticated", "Username or password is incorrect."]);
  });

  it("expires sessions after the TTL", async () => {
    const owner = await bootstrapOwner();
    clock += SESSION_TTL_MS + 1;
    expect((await call("GET", "/api/v1/session", { cookie: owner })).status).toBe(401);
  });

  it("rotates on sign-in: a cookie presented with the login is revoked", async () => {
    const first = await bootstrapOwner();
    const res = await call("POST", "/api/v1/session", { cookie: first, body: OWNER });
    expect(res.status).toBe(200);
    expect((await call("GET", "/api/v1/session", { cookie: first })).status).toBe(401);
    expect((await call("GET", "/api/v1/session", { cookie: cookieOf(res) })).status).toBe(200);
  });

  it("throttles sign-in per username and per IP, even for the right password, then recovers after the window", async () => {
    await call("POST", "/api/v1/bootstrap");
    for (let i = 0; i < 5; i++) await call("POST", "/api/v1/session", { body: { username: OWNER.username, password: "wrong-password-123" }, ip: `198.51.100.${i}` });
    const blocked = await call("POST", "/api/v1/session", { body: OWNER, ip: "198.51.100.99" });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("900");
    expect((await json(blocked)).error!.code).toBe("rate_limited");

    clock += THROTTLE_WINDOW_MS + 1;
    expect((await call("POST", "/api/v1/session", { body: OWNER })).status).toBe(200);

    for (let i = 0; i < 30; i++) await call("POST", "/api/v1/session", { body: { username: `guess${i}`, password: "x" }, ip: "192.0.2.7" });
    expect((await call("POST", "/api/v1/session", { body: OWNER, ip: "192.0.2.7" })).status).toBe(429);
    expect((await call("POST", "/api/v1/session", { body: OWNER, ip: "192.0.2.8" })).status).toBe(200);
  });
});

describe("TC-SEC-003 revocation and forced password change", () => {
  it("denies a disabled member's existing session on every protected route", async () => {
    const owner = await bootstrapOwner();
    const admin = await activeMember(owner, "admin1", "admin");
    expect((await call("GET", "/api/v1/members", { cookie: admin.cookie })).status).toBe(200);
    expect((await call("PATCH", `/api/v1/members/${admin.id}`, { cookie: owner, body: { status: "disabled" } })).status).toBe(200);
    for (const [method, path, body] of [["GET", "/api/v1/session"], ["GET", "/api/v1/members"], ["POST", "/api/v1/members", { username: "x1x", displayName: "x", role: "editor" }]] as const) {
      const res = await call(method, path, { cookie: admin.cookie, body });
      expect(res.status).toBe(401);
    }
    // Even an unrevoked session row is refused once the membership is disabled.
    db.raw.prepare("UPDATE sessions SET revoked_at = NULL").run();
    expect((await call("GET", "/api/v1/session", { cookie: admin.cookie })).status).toBe(401);
    // Re-enabling does not resurrect old sessions after revocation.
    await call("PATCH", `/api/v1/members/${admin.id}`, { cookie: owner, body: { status: "active" } });
    expect((await call("GET", "/api/v1/session", { cookie: admin.cookie })).status).toBe(401);
    expect((await call("POST", "/api/v1/session", { body: { username: "admin1", password: admin.password } })).status).toBe(200);
  });

  it("revokes sessions on a role change so the new role needs a fresh sign-in", async () => {
    const owner = await bootstrapOwner();
    const admin = await activeMember(owner, "admin2", "admin");
    await call("PATCH", `/api/v1/members/${admin.id}`, { cookie: owner, body: { role: "reviewer" } });
    expect((await call("GET", "/api/v1/members", { cookie: admin.cookie })).status).toBe(401);
    const fresh = await signIn("admin2", admin.password);
    expect((await json(await call("GET", "/api/v1/session", { cookie: fresh }))).data.user.role).toBe("reviewer");
    expect((await call("GET", "/api/v1/members", { cookie: fresh })).status).toBe(403);
  });

  it("issues a one-time temporary password that must be changed before anything else", async () => {
    const owner = await bootstrapOwner();
    const member = await addMember(owner, "producer1", "producer");
    expect(member.temporaryPassword).toMatch(/^[A-Za-z0-9_-]{24}$/);
    const listed = await call("GET", "/api/v1/members", { cookie: owner });
    expect(await listed.text()).not.toContain(member.temporaryPassword);

    const temp = await signIn("producer1", member.temporaryPassword);
    expect((await json(await call("GET", "/api/v1/session", { cookie: temp }))).data.user.mustChangePassword).toBe(true);
    const blocked = await call("GET", "/api/v1/members", { cookie: temp });
    expect(blocked.status).toBe(403);
    expect((await json(blocked)).error!.code).toBe("password_change_required");

    const weak = await call("POST", "/api/v1/session/password", { cookie: temp, body: { currentPassword: member.temporaryPassword, newPassword: "short" } });
    expect(weak.status).toBe(400);
    const wrong = await call("POST", "/api/v1/session/password", { cookie: temp, body: { currentPassword: "not-it", newPassword: "a-long-new-password" } });
    expect(wrong.status).toBe(403);
    const changed = await call("POST", "/api/v1/session/password", { cookie: temp, body: { currentPassword: member.temporaryPassword, newPassword: "a-long-new-password" } });
    expect(changed.status).toBe(200);
    expect((await json(changed)).data.user.mustChangePassword).toBe(false);
    expect((await call("GET", "/api/v1/session", { cookie: temp })).status).toBe(401);
    expect((await call("GET", "/api/v1/session", { cookie: cookieOf(changed) })).status).toBe(200);
    expect((await call("POST", "/api/v1/session", { body: { username: "producer1", password: member.temporaryPassword } })).status).toBe(401);
  });

  it("an admin reset revokes sessions and forces a new password", async () => {
    const owner = await bootstrapOwner();
    const member = await activeMember(owner, "reviewer1", "reviewer");
    const reset = await call("POST", `/api/v1/members/${member.id}/reset-password`, { cookie: owner });
    expect(reset.status).toBe(200);
    const { data } = await json(reset);
    expect(data.member.mustChangePassword).toBe(true);
    expect((await call("GET", "/api/v1/session", { cookie: member.cookie })).status).toBe(401);
    expect((await call("POST", "/api/v1/session", { body: { username: "reviewer1", password: member.password } })).status).toBe(401);
    const temp = await signIn("reviewer1", data.temporaryPassword);
    expect((await json(await call("GET", "/api/v1/session", { cookie: temp }))).data.user.mustChangePassword).toBe(true);
  });
});

describe("TC-SEC-004 member role matrix and scope", () => {
  it("enforces who may manage whom", async () => {
    const owner = await bootstrapOwner();
    const ownerId = (await json(await call("GET", "/api/v1/session", { cookie: owner }))).data.user.id;
    const admin = await activeMember(owner, "admin3", "admin");
    const reviewer = await activeMember(owner, "reviewer3", "reviewer");

    for (const res of [
      await call("GET", "/api/v1/members", { cookie: reviewer.cookie }),
      await call("POST", "/api/v1/members", { cookie: reviewer.cookie, body: { username: "sneaky", displayName: "S", role: "admin" } }),
      await call("POST", "/api/v1/members", { cookie: admin.cookie, body: { username: "owner2", displayName: "O", role: "owner" } }),
      await call("PATCH", `/api/v1/members/${ownerId}`, { cookie: admin.cookie, body: { status: "disabled" } }),
      await call("POST", `/api/v1/members/${ownerId}/reset-password`, { cookie: admin.cookie }),
      await call("PATCH", `/api/v1/members/${reviewer.id}`, { cookie: admin.cookie, body: { role: "owner" } }),
      await call("PATCH", `/api/v1/members/${ownerId}`, { cookie: owner, body: { role: "admin" } }),
      await call("PATCH", `/api/v1/members/${admin.id}`, { cookie: admin.cookie, body: { role: "owner" } }),
    ]) {
      expect(res.status).toBe(403);
      expect((await json(res)).error!.code).toBe("forbidden");
    }
    expect(count("SELECT COUNT(*) AS n FROM workspace_members WHERE role = 'owner' AND status = 'active'")).toBe(1);
    expect((await call("PATCH", `/api/v1/members/${reviewer.id}`, { cookie: admin.cookie, body: { role: "producer" } })).status).toBe(200);
    expect((await call("POST", "/api/v1/members", { cookie: admin.cookie, body: { username: "Editor9", displayName: "E", role: "editor" } })).status).toBe(201);
    const dup = await call("POST", "/api/v1/members", { cookie: admin.cookie, body: { username: "editor9", displayName: "E", role: "editor" } });
    expect(dup.status).toBe(409);
    expect(count("SELECT COUNT(*) AS n FROM audit_events WHERE outcome = 'denied'")).toBeGreaterThanOrEqual(7);
  });

  it("treats a member of another workspace as not found", async () => {
    const owner = await bootstrapOwner();
    db.raw.exec(`INSERT INTO workspaces VALUES ('wsp_other', 'Other', 0, 0);
      INSERT INTO users (id, username, username_normalized, display_name, password_hash, created_at, updated_at) VALUES ('usr_other', 'other', 'other', 'Other', 'x', 0, 0);
      INSERT INTO workspace_members (workspace_id, user_id, role, created_at, updated_at) VALUES ('wsp_other', 'usr_other', 'editor', 0, 0);`);
    for (const res of [
      await call("PATCH", "/api/v1/members/usr_other", { cookie: owner, body: { status: "disabled" } }),
      await call("POST", "/api/v1/members/usr_other/reset-password", { cookie: owner }),
    ]) expect(res.status).toBe(404);
    expect(await (await call("GET", "/api/v1/members", { cookie: owner })).text()).not.toContain("usr_other");
    expect(count("SELECT COUNT(*) AS n FROM workspace_members WHERE status = 'disabled'")).toBe(0);
  });
});

describe("TC-SEC-007 / TC-API-001 / TC-API-002 request defences and envelopes", () => {
  it("rejects state-changing requests without an allowed Origin", async () => {
    const owner = await bootstrapOwner();
    for (const origin of [null, "https://evil.test", "null"]) {
      const res = await call("DELETE", "/api/v1/session", { cookie: owner, origin });
      expect(res.status).toBe(403);
    }
    expect((await call("GET", "/api/v1/session", { cookie: owner })).status).toBe(200);
    expect((await call("POST", "/api/v1/session", { body: OWNER, origin: "http://localhost:5173" })).status).toBe(403);
    env.ALLOWED_ORIGINS = "http://localhost:5173";
    expect((await call("POST", "/api/v1/session", { body: OWNER, origin: "http://localhost:5173" })).status).toBe(200);
    expect((await call("GET", "/api/v1/session")).headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("returns stable error envelopes for malformed, oversized, non-JSON and unauthenticated requests", async () => {
    const malformed = await call("POST", "/api/v1/session", { body: "{not json" });
    expect(malformed.status).toBe(400);
    const { error } = await json(malformed);
    expect(error).toEqual({ code: "validation_failed", message: "The request body is not valid JSON.", requestId: malformed.headers.get("X-Request-Id") });
    expect((await call("POST", "/api/v1/session", { body: "username=a", contentType: "text/plain" })).status).toBe(415);
    expect((await call("POST", "/api/v1/session", { body: { username: "a", password: "b".repeat(9000) } })).status).toBe(413);
    // 5,000 characters but 10,000 UTF-8 bytes: the cap counts bytes, not characters.
    expect((await call("POST", "/api/v1/session", { body: { username: "a", password: "é".repeat(5000) } })).status).toBe(413);
    expect((await json(await call("POST", "/api/v1/session", { body: { username: "" } }))).error!.code).toBe("validation_failed");
    const anon = await call("GET", "/api/v1/members");
    expect(anon.status).toBe(401);
    expect((await json(anon)).error).toMatchObject({ code: "unauthenticated", message: "Sign in to continue." });
    expect((await call("GET", "/api/v1/nope")).status).toBe(404);
    expect((await call("GET", "/api/v1/session", { cookie: "__Host-qc_session=forged" })).status).toBe(401);
  });

  it("fails closed with a generic error and a redacted log when D1 is unavailable", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    env.DB = { prepare: () => { throw new Error(`D1 down: SELECT * FROM users WHERE password = '${OWNER.password}'`); }, batch: async () => [] };
    const res = await call("POST", "/api/v1/session", { body: OWNER });
    expect(res.status).toBe(503);
    expect(res.headers.get("Set-Cookie")).toBeNull();
    const text = await res.text();
    expect(text).toContain("dependency_failed");
    expect(text).not.toMatch(/SELECT|password =/);
    expect(log).toHaveBeenCalledOnce();
    expect(String(log.mock.calls[0][0])).not.toContain(OWNER.password);
    expect((await call("GET", "/api/v1/session", { cookie: "__Host-qc_session=abc" })).status).toBe(503);
  });

  it("audits outcomes without secrets or tokens", async () => {
    const owner = await bootstrapOwner();
    await call("POST", "/api/v1/session", { body: { username: OWNER.username, password: "wrong-password-123" } });
    const rows = db.raw.prepare("SELECT * FROM audit_events").all();
    expect(rows.map((r) => `${r.action}:${r.outcome}`)).toEqual(expect.arrayContaining(["bootstrap:success", "session.create:success", "session.create:failed"]));
    const dump = JSON.stringify(rows);
    expect(dump).not.toContain(OWNER.password);
    expect(dump).not.toContain(owner.split("=")[1]);
  });
});
