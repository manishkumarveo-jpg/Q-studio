# Phase 14 Local Ocr Cropping And Media Jobs

+## Phase 14 plan

### Objectives and scope

Implement replaceable local OCR/media adapter, deterministic parsing, normalized geometry/crops, idempotent queue handlers, thumbnails/proxy contract and retry/backoff.

### Dependencies and preconditions

Phase 13 passed; labeled fixture corpus, queue/D1/R2 contracts and processor runtime selection available.

### Concrete implementation tasks and deliverables

Implement adapter protocol, OCR block grouping, timecode/department parser, clamp/pad crop converter, confidence state, idempotency key, retries and accurate status/error reporting.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given an out-of-bounds box, when crop runs, then bounds are validated/clamped or needs-review records a safe error. Given same job twice, then no duplicate correction appears.

### Test strategy and executable test cases

TC-MEDIA-004–006; TC-INT-004/006; corrupt/retry tests.

### Regression tests

Ingestion/late-note/storage/private-source regressions.

### Security checks

Treat OCR text/images as untrusted, enforce quotas and constrain processor credentials.

### Performance checks

Measure defined ten-screenshot/~50-card batch upload and processing p50/p95/failure rate.

### Failure and recovery cases

Timeout/corrupt image: retry boundedly, record permanent failure, preserve original and manual path.

### Risks and mitigations

Runtime cost/accuracy; benchmark, confidence/manual review and no Worker-native claim.

### Explicit exit criteria

Corpus, geometry, idempotency, failure and measured-runtime evidence complete.

### Run results

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
