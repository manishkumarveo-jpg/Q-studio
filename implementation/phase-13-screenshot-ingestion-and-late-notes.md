# Phase 13 Screenshot Ingestion And Late Notes

+## Phase 13 plan

### Objectives and scope

Implement screenshot selection/import batches, source records, mock extraction review, crop/original lightbox, duplicate warning, retry/cancel and additive late-note UI.

### Dependencies and preconditions

Phase 12 passed; R2/source screenshot and job tables live.

### Concrete implementation tasks and deliverables

Build batch creation/status UI, independent result editing, source/crop lightbox, duplicate heuristics and append workflow that never replaces existing records.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given late notes sort before earlier rows, when processed, then old IDs/status/remarks/assignees/history stay unchanged. Given partial failure, then successful items stay untouched and failed items retry alone.

### Test strategy and executable test cases

TC-INT-008; TC-E2E-007; crop/source UI cases.

### Regression tests

QC sorting/status/assignment and R2 access tests.

### Security checks

Validate screenshot type/scope; source/crop authorization and input sanitization.

### Performance checks

Measure batch list updates and duplicate comparison on target fixtures.

### Failure and recovery cases

Partial batch failure/cancel: retain batch state, retry only safe failed items.

### Risks and mitigations

Overwrite/reprocessing risk; additive keys and preservation regression tests.

### Explicit exit criteria

Additive batch lifecycle and late-note preservation demonstrated.

### Run results

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
