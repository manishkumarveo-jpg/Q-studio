# CHANGELOG

+## Unreleased

### Added

- Stage A complete repository documentation and source scaffold.
- Documentation gate design for a Cloudflare-native, first-party-authenticated media/QC product.
- Validated standalone Cloudflare architecture diagram.
- Phase 1 UI foundation: Vite/React/TypeScript app, Tailwind entrypoint, theme persistence, accessible primitives, responsive shell and route fallback.
- Phase 2 navigation and dashboard: React Router routes for all 16 primary navigation items, grouped and collapsible sidebar, focus-trapped mobile drawer, breadcrumbs, ⌘K page switcher, help dialog, and a dashboard built from a deterministic seed labelled "Demo data". Placeholder pages name the phase that delivers each feature.
- Phase 3 projects, folders and assets: project list, nested folder tree with folder-path trail, asset grid/list with sort, selection and bulk move/archive, asset details panel, rename/move/archive for projects, folders and assets, and an Archive page with restore. Data is a normalized, ID-keyed local seed (`services/mock/librarySeed.ts`) held in memory and labelled "Demo data"; nothing is persisted or sent to a server. Invalid names or moves show an inline error and leave state unchanged.
- Phase 4 search, metadata and collections: URL-driven combined filters on All Assets (text, type, project, collection, metadata field/value, favorites), metadata fields with soft delete that keeps historical values readable, per-asset metadata editing, collections that reference assets without copying them, Favorites, Recent, and asset results in ⌘K. Saved filters and grid/list/sort preferences are stored in this browser only; everything else is in-memory Demo data.

- Phase 5 first-party auth and roles: Cloudflare Worker API (`apps/worker`) with one-time owner bootstrap from operator secrets, Argon2id password hashing (`@noble/hashes`), hashed opaque session cookies (`__Host-`, Secure, HttpOnly, SameSite=Strict), sign-in throttling, Origin checks on mutations, password change, and Owner/Admin member management (add with a one-time temporary password, role change, disable/enable, reset), all audited. D1 migration `0001_auth.sql`. Shared role policy in `packages/contracts/roles.ts`. The SPA now requires sign-in: login and first-time setup screens, forced temporary-password change, sign-out, and a Settings page with Your account, Members and the permission matrix. Local `wrangler.jsonc`, `.dev.vars.example` and the `devops/owner-bootstrap.md` runbook.

### Changed

- Breadcrumbs match nested routes (e.g. `/projects/:id/folders/:id` shows Projects). The disabled Create button now says uploads arrive in Phase 07.
- All workspace routes require a server session; the shell shows the signed-in user and workspace instead of the demo placeholders. Web tests run against the real Worker handler with an in-memory D1.
- Dependencies: added `@noble/hashes` 2.4.0, `zod` 4.6.6, and `wrangler` 4.149.0 (dev), with an `undici` 7.30.1 override that resolves wrangler's audit findings.
- The route fallback now reads "This route is not available" and links back to `/dashboard`.

### Verified

- Phase 1: `npm run typecheck`, `npm test` (2/2), `npm run build`, and `npm audit --json` pass on 2026-10-26.
- Phase 2: `npm run typecheck`, `npm test` (10/10), `npm run build`, and `npm audit --json` pass on 2026-10-26. A Playwright E2E suite is Blocked (not installed).
- Phase 4: `npm run typecheck`, `npm test` (59/59), `npm run build`, and `npm audit --json` (0 vulnerabilities) pass on 2026-10-26. Playwright E2E remains Blocked.
- Phase 5: `npm run typecheck`, `npm test` (86/86), `npm run build`, and `npm audit` (0 vulnerabilities) pass on 2026-10-26. The auth flow was also checked under local workerd (`wrangler dev`). Playwright E2E remains Blocked. Phase status: **Pending** until the ADR-003 hashing record is reviewed.
- Phase 3: `npm run typecheck`, `npm test` (33/33), `npm run build`, and `npm audit --json` (0 vulnerabilities) pass on 2026-10-26. Playwright E2E remains Blocked.

### Not yet implemented

Authentication, members and roles are real (local Worker + D1). There is no deployed environment, production binding, project/asset API or persistence, real dashboard data, upload, media review, OCR or production integration yet.
