# Phase 07 R2 Storage And Transfers

+## Phase 07 plan

### Objectives and scope

Implement private R2 bindings, scoped upload/download, completion verification, queue-backed transfer state and failure/cancel/retry UX.

### Dependencies and preconditions

Phase 06 passed; isolated R2 binding/CORS and capability approach reviewed.

### Concrete implementation tasks and deliverables

Create upload intents, generated keys, type/size policy, direct transfer client, completion verification, authorized media/download path, cleanup policy and transfer queue.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given an unauthorized asset request, when download is requested, then no object or usable URL is returned. Given interrupted upload, when retried, then only verified completion creates records.

### Test strategy and executable test cases

TC-API-005; TC-INT-005/006; TC-SEC-005/008; upload E2E.

### Regression tests

API scope/auth tests.

### Security checks

Test MIME/key manipulation, URL expiry/CORS and private-bucket posture.

### Performance checks

Measure intent generation, cancel/retry and representative large transfer.

### Failure and recovery cases

Object completion mismatch: retain failed intent, permit safe retry; no assumed success.

### Risks and mitigations

Bearer URL leakage/multipart complexity; short expiry/redaction and staged implementation.

### Explicit exit criteria

Private object flow, interruption recovery and abuse tests pass.

### Run results

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
