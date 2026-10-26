# Phase 16 Image Audio Document Review

+## Phase 16 plan

### Objectives and scope

Implement image zoom/pan/fit annotations, audio timecoded review and supported PDF/document preview with honest unsupported fallback.

### Dependencies and preconditions

Phase 15 passed; supported MIME/viewer library and authorization policy defined.

### Concrete implementation tasks and deliverables

Build media-type dispatcher, image and audio controls, document page/zoom/anchor surfaces, access-checked attachment delivery and unavailable states.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given an unsupported file, when opened, then preview unavailable appears rather than decorative fake content. Given audio seek, then associated comment navigation remains correct.

### Test strategy and executable test cases

TC-MEDIA-001/007; image/audio/PDF component E2E.

### Regression tests

Player/comments/R2 authorization tests.

### Security checks

Validate MIME server-side and authorize every attachment/page source.

### Performance checks

Measure large image zoom and document page transition.

### Failure and recovery cases

Renderer failure: preserve download/action options subject to permission.

### Risks and mitigations

Library security/performance; pin/review viewer dependency and fallback.

### Explicit exit criteria

Supported type workflows and unavailable behavior verified.

### Run results

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
