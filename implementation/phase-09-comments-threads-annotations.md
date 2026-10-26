# Phase 09 Comments Threads Annotations

+## Phase 09 plan

### Objectives and scope

Implement version-specific timestamp/range/general comments, replies, reactions, mentions UI, resolution, filtering, attachments UI and relative annotations.

### Dependencies and preconditions

Phase 08 passed; comments/annotation schema and permission policy available.

### Concrete implementation tasks and deliverables

Persist comments against asset version; validate ranges; add thread/reaction/status flows and drawing coordinates normalized to viewport/media.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given resize, when annotation redraws, then its relative position remains aligned. Given version change, then comment remains on original version.

### Test strategy and executable test cases

TC-E2E-004; TC-UNIT range/coordinate tests; TC-SEC-006.

### Regression tests

Player/timecode and authorization suites.

### Security checks

Test comment edit/delete policy, XSS escaping and attachment permission.

### Performance checks

Measure marker/comment-list update with representative count.

### Failure and recovery cases

Conflict/failure: preserve draft with retry; invalid range reports error.

### Risks and mitigations

Annotation geometry/version drift; normalized coordinates and IDs.

### Explicit exit criteria

Comments and annotations pass version, resize, security and recovery tests.

### Run results

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
