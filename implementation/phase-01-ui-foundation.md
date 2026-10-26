# Phase 01 Ui Foundation

+## Phase 01 plan

### Objectives and scope

Create React/Vite/TypeScript foundation, tokens, theme, accessible primitives, route fallback, app shell skeleton and explicit local-demo indicator.

### Dependencies and preconditions

No prior implementation; documentation gate and approved design tokens.

### Concrete implementation tasks and deliverables

Set up project tooling only after this plan; build AppShell, button/form/dialog/menu/toast/table state primitives, dark/light tokens and responsive layout.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given a user changes theme, when they reload, then the preference persists. Given an unknown route, when opened, then a safe route fallback appears.

### Test strategy and executable test cases

TC-FE-001; TC-A11Y-001; visual viewport checks.

### Regression tests

Theme, focus, fallback and responsive shell.

### Security checks

No auth claims, no secret/config or production data.

### Performance checks

Measure initial render and route fallback; record baseline.

### Failure and recovery cases

Persisted preference unavailable: use system/default theme and show no false save state.

### Risks and mitigations

Token drift and inaccessible primitives; centralize tokens and test keyboard.

### Explicit exit criteria

Foundation components, tests, docs and no critical accessibility failure.

### Run results

**Status: Passed — 2026-10-26.** Implemented the Vite/React/TypeScript foundation, Tailwind CSS entrypoint, theme persistence, accessible Radix dialog, button/status primitives, responsive application shell, and honest route fallback. Executed `npm run typecheck` (pass), `npm test` (2/2 pass), `npm run build` (pass; 1644 modules transformed), and `npm audit --json` (0 vulnerabilities). Browser visual QA was attempted but the in-app browser surface was unavailable; visual checks are therefore **Blocked** rather than passed. No backend, auth, dashboard, asset, upload, media or cloud capabilities were included.
