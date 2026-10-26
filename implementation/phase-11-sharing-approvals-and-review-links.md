# Phase 11 Sharing Approvals And Review Links

+## Phase 11 plan

### Objectives and scope

Implement scoped revocable share links, configurable guest actions, approval transitions/history and reviewer UI.

### Dependencies and preconditions

Phase 10 passed; token storage/hash/passphrase and scope model approved.

### Concrete implementation tasks and deliverables

Build share wizard/management/preview, token validation/revocation/expiry, guest route isolation, approval request/actions/history and demo labels only where not production-backed.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given revoked/expired token, when guest opens route, then access is denied. Given comment-only guest, when download attempted, then it is denied.

### Test strategy and executable test cases

TC-API-007; TC-E2E-005; share permission tests.

### Regression tests

Asset/version/comment security regressions.

### Security checks

Test token hash, expiry, passphrase, scope and action policy; never expose workspace navigation.

### Performance checks

Measure share authorization response.

### Failure and recovery cases

Revoked/stale token: fail closed; network errors avoid hinting resource existence.

### Risks and mitigations

Guest escalation and approval/QC conflation; distinct policies/status tables.

### Explicit exit criteria

Scoped/revoked/share actions and approval separation tests pass.

### Run results

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
