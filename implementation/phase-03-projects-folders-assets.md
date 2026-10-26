# Phase 03 Projects Folders Assets

+## Phase 03 plan

### Objectives and scope

Implement workspace/project listing, nested folders, asset grid/list, selection, local previews, sorting, rename/archive/restore and bulk UI with stable mock IDs.

### Dependencies and preconditions

Phases 01–02 passed; local data boundary documented.

### Concrete implementation tasks and deliverables

Create project browser/folder tree/asset grid/list/details panel; validate names and preserve relationships in local store.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given a folder is renamed or archived, when browsing, then child/asset identities remain stable. Given no assets, then an actionable empty state appears.

### Test strategy and executable test cases

TC-E2E-002; TC-FE-003; TC-UNIT stable-ID fixture tests.

### Regression tests

Navigation/dashboard tests.

### Security checks

No server or storage success claim; local operations say Demo data.

### Performance checks

Measure 50/200 mock asset view renders.

### Failure and recovery cases

Invalid name/move: show inline error and preserve prior state.

### Risks and mitigations

Nested-state drift; use normalized local entities.

### Explicit exit criteria

Stable navigation, selection and lifecycle UI; tests/results recorded.

### Run results

**Status: Passed — 2026-10-26.** Implemented `/projects` (project cards), `/projects/:projectId[/folders/:folderId]` (folder tree, folder-path trail, folder/project rename/move/archive), `/assets` (all visible assets across projects) and `/archive` (restore). Assets render as a grid or list with name/updated/size sorting, per-item and select-all checkboxes, a bulk bar (move within project, archive) and a details panel showing the stable ID, location and rename/move/archive. Data is a normalized `Record<id, entity>` seed (`apps/web/src/services/mock/librarySeed.ts`); operations are pure functions in `apps/web/src/features/projects/library.ts` that return a new library or an error, held in memory by `LibraryProvider`. Every page carries a "Demo data" badge and says changes stay in this browser tab; success notices say "in this browser tab (Demo data)". Previews are placeholders (media playback is Phase 08). No server, storage or persistence exists.

- `npm run typecheck`: pass. `npm test`: 33/33 pass (4 files). `npm run build`: pass. `npm audit --json`: 0 vulnerabilities.
- TC-E2E-002 (project → nested folder, URL IDs, folder trail, rename keeps child IDs and assets): pass in jsdom with Testing Library. Playwright suite **Blocked** (not installed).
- TC-UNIT-009 (stable-ID fixtures; rename/archive/restore/move keep IDs and relationships; invalid names, duplicate siblings incl. archived, self/descendant folder move, cross-project, archived/missing destination, failed bulk move leaves input unchanged): pass.
- TC-FE-003 (actionable empty folder state naming Phase 07 and linking to All Assets; Demo labels): pass. Unknown/mismatched IDs show "not available" without data: pass.
- TC-FE-007 (bulk select → move → archive; selection cleared for items that leave the view): pass.
- Failure/recovery: invalid rename and invalid folder move show an inline `role="alert"` error, keep the dialog open and preserve prior state: pass.
- Regression: Phase 01/02 suites (theme, fallback, all 16 routes, drawer focus, collapsed rail, ⌘K, seed error): pass.
- Performance (jsdom, dev, 3 runs, includes first-render warm-up in the 50 case): AssetList 50 assets 101–104 ms; 200 assets 132–167 ms. A real-browser production measurement is not yet recorded.
- Browser QA (Chrome, Vite dev): folder view grid, list view and details panel checked; at 390 px `/projects`, `/projects/…/folders/…` (with details open), `/assets` and `/archive` have no horizontal scroll.
- Not in scope / deferred: creating projects or folders (needs Phase 06 API), persistence across reloads, virtualization for large lists.
