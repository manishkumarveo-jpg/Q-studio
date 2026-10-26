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

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
