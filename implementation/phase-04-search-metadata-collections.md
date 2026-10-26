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

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
