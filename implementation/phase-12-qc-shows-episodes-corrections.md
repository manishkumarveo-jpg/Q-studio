# Phase 12 Qc Shows Episodes Corrections

+## Phase 12 plan

### Objectives and scope

Implement shows/episodes and six-column correction sheet with deterministic sort, filters, status/fixed/priority, remarks, assignees, audit and keyboard review.

### Dependencies and preconditions

Phase 11 passed; episode/QC schema and role policy available.

### Concrete implementation tasks and deliverables

Build episode dashboard, correction filters/views, timecode sorting, mutually exclusive feasibility, independent fixed, optimistic remarks, quick replies and selected-row shortcuts.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given Possible is selected then Not Possible is selected, then the first clears while Fixed remains. Given sort/filter changes, then display index changes but stable IDs do not.

### Test strategy and executable test cases

TC-UNIT-002–004; TC-E2E-006; TC-UX-003/004.

### Regression tests

Review/share/auth regressions.

### Security checks

Producer/editor role checks, audit visibility/redaction and validation fuzzing.

### Performance checks

Measure 50/200/larger dense-table render/filter.

### Failure and recovery cases

Concurrent remark conflict returns current state; sort invalid timecode follows documented policy.

### Risks and mitigations

Table density/keyboard errors/data drift; fixture tests and clear focus selection.

### Explicit exit criteria

QC invariants, sorting, filters and keyboard cases pass.

### Run results

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
