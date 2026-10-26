# Phase 18 Exports Printing And Nle Markers

+## Phase 18 plan

### Objectives and scope

Implement current-state CSV, print/PDF layouts, summaries, report distribution and configurable NLE marker profiles marked unverified until compatibility proof.

### Dependencies and preconditions

Phase 17 passed; QC data/export authorization and print style policy defined.

### Concrete implementation tasks and deliverables

Build CSV/marker serializers, print media CSS, individual/re-stacked layouts, report totals, copy summary and export audit actions.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given values contain commas/newlines/Unicode, when CSV opens, then columns/values parse correctly. Given print, then controls hide, A4 landscape uses repeating headers and preserves content gracefully.

### Test strategy and executable test cases

TC-UNIT-005; TC-E2E-008; TC-PERF-008.

### Regression tests

QC status/sort/remark and access-control suite.

### Security checks

Authorize export scope, escape spreadsheet/CSV injection-sensitive values per policy and audit export.

### Performance checks

Measure long-row/image pagination and large sheet export.

### Failure and recovery cases

Export/render error: retain data, show retry/fallback; no claim target NLE profile is verified.

### Risks and mitigations

Pagination/NLE variance; fixtures and version-specific compatibility evidence.

### Explicit exit criteria

Export output correctness, print behavior and authorization evidence complete.

### Run results

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
