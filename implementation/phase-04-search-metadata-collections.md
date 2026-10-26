# Phase 04 Search Metadata Collections

+## Phase 04 plan

### Objectives and scope

Implement mock global search, metadata definitions/properties, collections, favorites, saved filters and view preferences.

### Dependencies and preconditions

Phase 03 passed and mock entity relationships available.

### Concrete implementation tasks and deliverables

Build deterministic search index, combined filters, collection membership without duplicate assets, custom-field management and saved local preferences.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given combined filters, when optional metadata is missing, then search remains deterministic. Given collection membership changes, then source asset is not copied.

### Test strategy and executable test cases

TC-FE-006; collection/unit filter tests.

### Regression tests

Phases 01–03 UI/store tests.

### Security checks

Escape rendered metadata and retain local-only label.

### Performance checks

Measure query/filter response against 50/200 fixtures.

### Failure and recovery cases

Deleted metadata field: preserve readable historical fallback; query error shows recovery.

### Risks and mitigations

Overgrown client index; server query plan documented for Phase 06.

### Explicit exit criteria

Combined filters and nonduplicating collections proven by tests.

### Run results

**Status: Passed — 2026-10-26.** The demo library (`services/mock/librarySeed.ts`) now carries metadata fields, per-asset values, collections (asset-ID references), favorites and recent. Pure operations and the deterministic `searchAssets` live in `apps/web/src/features/search/catalog.ts`. `/assets` is a URL-driven search page (`q`, `kind`, `project`, `collection`, `field`, `value`, `favorites`): text, type, project, collection, metadata field/value and favorites-only filters combine with AND. It has a result count, Clear filters, a Metadata fields dialog (add, soft delete) and saved filters. `/favorites`, `/recent`, `/collections` and `/collections/:id` are live. The asset details panel shows metadata (deleted fields are labelled "(deleted field)" with their historical value) and adds Favorite, Edit metadata, Add to collection and Remove from collection; the bulk bar adds the collection and favorite actions. ⌘K also lists up to 5 matching demo assets and "Search all assets"; `?asset=<id>` opens that asset's details. Saved filters and grid/list + sort preferences are stored in localStorage (`lib/local-storage/preferences.ts`). Reads are shape-checked, and when a write fails the UI shows an error instead of a success message. All other data stays in memory, labelled Demo data.

- `npm run typecheck`: pass. `npm test`: 59/59 pass (6 files). `npm run build`: pass. `npm audit --json`: 0 vulnerabilities.
- TC-FE-006 (type + field + value + text + project combined, URL sync, no-match state, Clear filters): pass (jsdom, Testing Library). Unit coverage: `searchAssets` with AND filters, missing metadata never matching, sparse values table, text over project/folder/live metadata, archived exclusion, invalid references → error, param round-trip.
- TC-UNIT-010 search, TC-UNIT-011 collections (adding twice → no duplicate, `assets` table reference unchanged, removal keeps the asset in its folder and other collections, name validation), TC-UNIT-012 metadata (soft delete keeps values, blocks writes, option/length/control-character validation, empty clears, input not mutated, option dedup), TC-UNIT-013 preferences (corrupt/ill-shaped storage → defaults, failed write reported): pass.
- UI: collection add ×2 shows 4 members and All Assets stays at 14; remove from collection; create collection with duplicate-name error; save filter → survives remount → delete; favorite toggle → Favorites; Recent after opening details; view preference persists across remount; ⌘K finds an asset by a metadata value and opens its details: pass.
- Failure/recovery: deleting a field keeps "Vendor (deleted field) · Lumen Post" readable; a URL/saved filter that references the deleted field shows "This search cannot run" with Clear filters, which recovers: pass.
- Security: a metadata value `<img src=x onerror=alert(1)>` renders as text and creates no `<img>` element: pass. Stored/pasted filter params are re-serialized through the validated query shape. Unknown kind/project/collection/field IDs return an error instead of silently matching. The local-only label stays on every page.
- Performance (jsdom, 3 runs): `searchAssets` with combined filters takes 0.10–0.22 ms per query on 50 assets and 0.42–0.49 ms on 200. AssetList renders 50 assets in about 49 ms and 200 in 183–193 ms. A real-browser production measurement is not yet recorded.
- Browser QA (Chrome, Vite dev): combined filters, the details panel with metadata, collections, favorites and recent checked. At the narrowest window Chrome allowed (500 px; 390 px could not be set) no page had horizontal scroll.
- Regression: Phase 01–03 suites pass. In one Phase 02 assertion, "approv" now also matches assets whose Review status is "Approved". The assertion is now scoped to the Pages list and stays as strict as before.
- Playwright E2E: **Blocked** (not installed).
- Deferred: renaming or deleting collections, editing field options, server persistence and sharing of saved filters (Phase 06+), and showing Recent in opened order (it uses the list's sort).
