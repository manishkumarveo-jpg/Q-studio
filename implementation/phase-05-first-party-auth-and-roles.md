# Phase 05 First Party Auth And Roles

+## Phase 05 plan

### Objectives and scope

Implement first-party owner bootstrap, login/logout, secure sessions, admin member actions and role UI without hosted identity.

### Dependencies and preconditions

Phase 04 passed; password-library ADR benchmark/review approved; secret operator runbook ready.

### Concrete implementation tasks and deliverables

Implement one-time bootstrap, maintained password hashing, token-hash sessions, secure cookie policy, throttle, CSRF/origin checks, revocation/disable/reset flows and permission matrix UI.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given an owner exists, when bootstrap repeats, then it is denied. Given a disabled user, when using old session, then protected routes deny. Given a role change, then sessions rotate/revoke.

### Test strategy and executable test cases

TC-SEC-001–004/007; TC-E2E-001; API login cases.

### Regression tests

All prior UI routes plus anonymous/protected transitions.

### Security checks

Attack login/CSRF/rate/role paths; no phase exit on auth bypass.

### Performance checks

Measure login/throttle response without weakening controls.

### Failure and recovery cases

D1/session dependency failure: fail closed, generic error, audit safe outcome.

### Risks and mitigations

Crypto/runtime mismatch and privilege escalation; benchmark maintained library and complete role matrix.

### Explicit exit criteria

Auth/security suite passes; no bypass, plaintext, hardcoded secret or unrevoked privilege.

### Run results

**Status: Pending — 2026-10-26.** Implementation and automated checks below pass, but human review of the ADR-003 implementation record (a precondition of this phase) is not complete. Mark Passed only after that review.

Implemented. The Worker (`apps/worker/src`) serves `/api/v1` bootstrap, session (sign-in, read, sign-out), password change, and members (list, add, role/status change, password reset) on D1 migration `database/migrations/0001_auth.sql`. Workers Static Assets serves the SPA (`wrangler.jsonc`, local only). Passwords use Argon2id via `@noble/hashes` (ADR-003 record). Sessions are random 32-byte tokens in a `__Host-qc_session` cookie (Secure, HttpOnly, SameSite=Strict, 12 h); only the SHA-256 is stored. The shared role policy is in `packages/contracts/roles.ts`. In the SPA, every workspace route sits behind `RequireAuth` (`/login?next=` keeps only same-app targets), with a first-time setup panel, a forced change of temporary passwords, a sign-out control and real workspace and user names in the shell. Settings shows Your account, Members (Owner/Admin only) and the permission matrix. Project and asset data is still in-memory Demo data. Operator steps are in `devops/owner-bootstrap.md`.

- `npm run typecheck`: pass. `npm test`: 86/86 pass (8 files: Worker 20, web 66). `npm run build`: pass, and the browser bundle holds no Worker, SQLite or Argon2 code. `npm audit`: 0 vulnerabilities, after moving to zod 4.6.6 and wrangler 4.149.0 and overriding undici to 7.30.1.
- Worker integration tests run the real handler against the real migration in in-memory `node:sqlite`; `batch` runs as one transaction, as in D1.
- TC-API-004 / TC-SEC-001 / AC-AUTH-001: bootstrap uses secrets only and ignores the request body. A repeat returns 403 with no new user and an audited denial. Of two concurrent bootstraps exactly one wins. Missing or weak secrets → 503 and nothing created: pass.
- TC-SEC-002: a wrong password, an unknown user and a disabled member get an identical 401 and message, with no cookie. Unknown users are verified against a fixed full-cost hash. Sign-in throttles at 5 attempts per username and 30 per IP per 15 minutes (429 + Retry-After), blocks even the correct password while throttled, and recovers after the window: pass.
- TC-SEC-003 / AC-AUTH-002: a disabled member's session is denied on every protected route, even if the session row is unrevoked. A role change revokes sessions, and the new role applies after a fresh sign-in. A reset revokes sessions and forces a change. A temporary password blocks other routes (403 `password_change_required`) until changed. Password change revokes all sessions and issues a new one. Logout revokes. Sign-in rotates a presented cookie. Sessions expire after 12 h: pass.
- TC-SEC-004 / TC-UNIT-008: the role matrix holds. A reviewer cannot list or add members. An Admin cannot grant Owner or change, disable or reset an Owner. Nobody can change their own access, so the last Owner stays. A member of another workspace returns 404 and is not listed. A duplicate username (case-insensitive) → 409: pass.
- TC-SEC-007 / TC-API-001 / TC-API-002: a mutation with no Origin, a foreign Origin or `null` → 403; `ALLOWED_ORIGINS` admits the Vite origin; no CORS headers are sent. Malformed JSON, non-JSON, oversized and schema-invalid bodies → stable envelopes with a requestId. Anonymous → 401. A forged cookie → 401: pass.
- Failure and recovery: with D1 unavailable, sign-in and session reads return 503 `dependency_failed` with no cookie, and the response and log hold no SQL or password. In the UI, an unreachable API shows "QC Studio is unavailable" with Try again, and no workspace UI renders: pass. Audit rows hold no password or token: pass.
- TC-E2E-001 (jsdom against the real Worker handler): first-time setup → wrong password (generic alert, field cleared) → sign-in lands on the requested `/projects` → sign-out returns to sign-in, and the server session is gone. Anonymous visits to protected routes redirect with `next`; `next=//evil.test` lands on `/dashboard`. Owner adds a member and sees the temporary password once; duplicate-name error; role change; disable/enable; reset. Forced temporary-password change, including the mismatch error. A non-manager sees the matrix but no member controls. Revoking the session while the app is open returns to sign-in: pass. Playwright: **Blocked** (not installed).
- Regression: every Phase 01–04 suite now runs signed in through the real Worker: 59/59 pass.
- Real runtime (`wrangler dev`, workerd, local D1 with the migration applied): bootstrap 201 then 403. Cookie flags as specified. Logout → 401. SPA fallback serves `/settings`. Cross-origin POST → 403. Sign-in throttles on the 6th attempt.
- Performance (local workerd): a successful sign-in takes 0.36–0.38 s. Failed sign-ins take 0.36–0.48 s for both known and unknown usernames. A throttled response takes ~0.01 s, because no hash runs. Needs Workers Paid CPU (ADR-003).
- Not run: manual browser QA of the login and Settings screens (responsive and focus checks beyond jsdom), and a deployed-environment test.
- Deferred: idle session timeout, rehash-on-login when the cost changes, throttle row pruning (Phase 19), member pagination beyond 200, member removal, and per-workspace credentials for multi-workspace users.
