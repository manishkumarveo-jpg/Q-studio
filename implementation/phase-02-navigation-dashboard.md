# Phase 02 Navigation Dashboard

+## Phase 02 plan

### Objectives and scope

Implement sidebar, top bar, breadcrumbs, dashboard metrics/queues, quick actions, responsive drawer and meaningful destinations backed by deterministic seed data.

### Dependencies and preconditions

Phase 01 exit passed; seed data is visibly Demo data.

### Concrete implementation tasks and deliverables

Add all navigation items, collapsed mode, command/help entry, dashboard cards/activity and route placeholders.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given each navigation item, when selected, then it reaches a labelled route. Given narrow layout, when drawer opens, then focus is contained.

### Test strategy and executable test cases

TC-FE-002; TC-UX-001/002; route navigation E2E.

### Regression tests

Phase 01 focus/theme/fallback cases.

### Security checks

Do not expose protected content or label seed activity as real.

### Performance checks

Measure navigation transition and responsive layout.

### Failure and recovery cases

Seed state error: show empty/error state rather than a success toast.

### Risks and mitigations

Navigation sprawl; retain grouped IA and test all links.

### Explicit exit criteria

All visible routes meaningful, keyboard/drawer tests pass, demo labels clear.

### Run results

**Status: Passed — 2026-10-26.** Implemented a grouped sidebar with all 16 primary navigation items (from `ux/information-architecture.md`), collapsed mode, a narrow-viewport focus-trapped drawer, breadcrumbs, a ⌘K/Ctrl+K "Go to page" command menu, a help dialog, and a dashboard with metrics, queue, recent projects, activity and quick actions. All dashboard figures come from the deterministic seed `apps/web/src/services/mock/dashboardSeed.ts` and are labelled "Demo data". Every non-dashboard route is a labelled placeholder that names the phase that delivers it and offers no action. "Create" is disabled until Phase 03.

- `npm run typecheck`: pass. `npm test`: 10/10 pass. `npm run build`: pass (1660 modules). `npm audit --json`: 0 vulnerabilities.
- TC-FE-002 (all 16 routes reach a labelled route with breadcrumb and `aria-current`): pass.
- TC-UX-001 / AC-UI-001 (drawer traps Tab focus, Escape closes, focus returns to trigger, navigating closes the drawer): pass.
- TC-UX-002 (collapsed sidebar keeps named links and page controls usable): pass.
- Seed failure renders an error state with no figures: pass. Breadcrumb resolves mixed-case and trailing-slash paths the same way the router does: pass. Phase 01 regression (theme persistence, route fallback): pass. The fallback copy now says "This route is not available" and links to `/dashboard`.
- Route navigation E2E: run in jsdom with Testing Library. A Playwright suite is **Blocked** because Playwright is not installed.
- Browser QA (Chrome, Vite dev server): checked the desktop dashboard, collapsed rail and dark theme. A 390 px iframe showed the sidebar hidden, the drawer trigger visible, no horizontal scroll, focus inside the open drawer and focus restored on close. Fixed a horizontal scrollbar in the collapsed rail that this check found.
- Performance baseline (dev build, unminified, StrictMode): sidebar click to the new `<h1>` painted took 66–108 ms across 8 navigations. A production-build measurement is not yet recorded.
