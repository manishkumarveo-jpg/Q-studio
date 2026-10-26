import { argon2id } from "@noble/hashes/argon2.js";

// ADR-003: Argon2id via @noble/hashes (audited, pure JS, runs on Workers). OWASP minimum profile.
// Benchmark (Node 26, pure JS): ~420 ms per hash. Needs Workers Paid CPU limits; see ADR-003.
export const ARGON2_PARAMS = { m: 19456, t: 2, p: 1 };

const encoder = new TextEncoder();
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/=+$/, "");
const unb64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const PHC = /^\$argon2id\$v=19\$m=(\d{1,7}),t=(\d{1,3}),p=(\d{1,2})\$([A-Za-z0-9+/]{16,})\$([A-Za-z0-9+/]{16,})$/;

/** Returns a PHC string: $argon2id$v=19$m=..,t=..,p=..$salt$hash. */
export function hashPassword(password: string, params = ARGON2_PARAMS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = argon2id(encoder.encode(password), salt, { ...params, dkLen: 32 });
  return `$argon2id$v=19$m=${params.m},t=${params.t},p=${params.p}$${b64(salt)}$${b64(hash)}`;
}

export function verifyPassword(password: string, stored: string) {
  const match = PHC.exec(stored);
  if (!match) return false;
  const expected = unb64(match[5]);
  const actual = argon2id(encoder.encode(password), unb64(match[4]), { m: +match[1], t: +match[2], p: +match[3], dkLen: expected.length });
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

// Verifying against this when a username is unknown keeps the response time the same. It is a fixed,
// precomputed hash of a throwaway value (not a credential), so no request pays an extra hashing cost.
// Regenerate it whenever ARGON2_PARAMS change.
const DUMMY_HASH = "$argon2id$v=19$m=19456,t=2,p=1$QmSbBgMG0rSxDLZDCQqnhA$yseFwhGd13VKiobLgKgkOB/WeOxhqbTPsBX9smR0Gq8";
export const getDummyHash = () => DUMMY_HASH;

export const randomToken = (bytes = 32) =>
  b64(crypto.getRandomValues(new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_");

export async function sha256Hex(value: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
