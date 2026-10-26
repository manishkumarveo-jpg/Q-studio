import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";
import { createApiHarness, type ApiHarness } from "./apiHarness";

const values = new Map<string, string>();

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  },
});

// Cheap Argon2 profile for UI tests; the full profile is covered in the Worker suite.
vi.mock("../../../worker/src/lib/crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../worker/src/lib/crypto")>();
  const cheap = { m: 64, t: 1, p: 1 };
  const dummy = actual.hashPassword("dummy", cheap);
  return { ...actual, hashPassword: (password: string) => actual.hashPassword(password, cheap), getDummyHash: () => dummy };
});

/** The real Worker API behind `fetch`. Each test starts with a bootstrapped owner who is signed in. */
export let api: ApiHarness;

beforeEach(async () => {
  api = createApiHarness();
  vi.stubGlobal("fetch", api.fetch);
  await api.bootstrap();
  await api.signIn();
});
