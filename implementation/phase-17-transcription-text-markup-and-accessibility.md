# Phase 17 Transcription Text Markup And Accessibility

+## Phase 17 plan

### Objectives and scope

Implement deterministic transcript/caption UI, text markup surfaces, SRT/VTT export interface, integrations/C2C setting surfaces and accessibility hardening.

### Dependencies and preconditions

Phase 16 passed; transcript is sample/deterministic unless local engine exists.

### Concrete implementation tasks and deliverables

Build transcript seek/search/speaker UI, caption exporter, markup actions and Not Connected/Demo Only integration cards/config forms.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given transcript segment selected, when clicked, then player seeks. Given integration card without adapter, then it never reports connected/success.

### Test strategy and executable test cases

Transcript/caption format tests; TC-UX-006; accessibility cases.

### Regression tests

Media/comment/a11y regression suite.

### Security checks

Do not submit integration credentials to unavailable adapters; sanitize text markup.

### Performance checks

Measure transcript search/seek on representative segments.

### Failure and recovery cases

Unsupported integration/export error: clear explanation and safe retry/download.

### Risks and mitigations

Misleading future integrations; explicit labels and no fake pairing.

### Explicit exit criteria

Caption/time navigation, labels and demo-only truthfulness tests pass.

### Run results

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
