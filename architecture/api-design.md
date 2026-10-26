# Api Design

+## API conventions

Prefix APIs with /api/v1; return { data, requestId } or { error: { code, message, requestId } }. Generic denials use 401/403 without resource enumeration. All mutation inputs use Zod on the Worker; pagination is bounded cursor pagination; mutation requests carry an idempotency key where duplicate harm is plausible.

| Group | Representative routes | Authorization |
|---|---|---|
| Auth | POST /bootstrap, /session, DELETE /session | bootstrap only when no owner; self-session |
| Members | GET/POST /members, PATCH /members/:id | Owner/Admin scoped workspace |
| Projects/assets | CRUD /projects, /folders, /assets, /versions | resource role + membership |
| Transfers | POST /uploads/intents, POST /uploads/:id/complete, GET /assets/:id/download | server validates scope/key/content policy |
| Review | CRUD /comments, /replies, /annotations | exact asset version access |
| Shares/approvals | CRUD /shares, POST /shares/:token/actions | hashed scoped guest token |
| QC | CRUD /shows, /episodes, /qc-items, /ingestion-batches | production role in episode workspace |
| Exports/realtime | POST /exports, POST /realtime/authorize | explicit resource permissions |

Implemented in Phase 05 (`apps/worker/src`):

| Route | Auth | Notes |
|---|---|---|
| GET /api/v1/bootstrap | none | `{ available }` |
| POST /api/v1/bootstrap | none | one-time; owner from operator secrets only; 201 / 403 forbidden / 503 not configured |
| GET /api/v1/session | session (also while a temporary password is pending) | `{ user, workspace }` |
| POST /api/v1/session | none, throttled | generic 401 "Username or password is incorrect."; 429 + Retry-After; rotates any presented session |
| DELETE /api/v1/session | session optional | revokes and clears the cookie |
| POST /api/v1/session/password | session | revokes every session of the user, issues a new one, clears the temporary-password flag |
| GET/POST /api/v1/members | `members.manage` | POST returns a one-time `temporaryPassword` |
| PATCH /api/v1/members/:id | `members.manage` + target rule | role/status; revokes the member's sessions |
| POST /api/v1/members/:id/reset-password | `members.manage` + target rule | one-time temporary password; revokes sessions |

Cross-cutting: every POST/PATCH/DELETE requires an `Origin` equal to the Worker origin or listed in `ALLOWED_ORIGINS`, and bodies must be JSON of at most 8 KiB. No CORS headers are sent. API responses carry `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` and `X-Request-Id`. A protected route returns 401 `unauthenticated`, or 403 `password_change_required` while a temporary password is pending. A member outside the caller's workspace returns 404. Dependency errors fail closed with 503 `dependency_failed` and a log entry that holds only the error class. The role policy lives in `packages/contracts/roles.ts`: an Admin cannot grant Owner or change an Owner, and nobody can change their own role or status, which also keeps the last Owner in place.

Every implemented route records actor/action/resource/outcome. Route-level schemas and error tests are added with the relevant implementation phase.
