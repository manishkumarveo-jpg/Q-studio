# Phase 05 First Party Auth And Roles

+## Phase 05 plan

### Objectives and scope

Implement first-party owner bootstrap, login/logout, secure sessions, admin member actions and role UI without hosted identity.

### Dependencies and preconditions

Phase 04 passed; password-library ADR benchmark/review approved; secret operator runbook ready.

### Concrete implementation tasks and deliverables

Implement one-time bootstrap, maintained password hashing, token-hash sessions, secure cookie policy, throttle, CSRF/origin checks, revocation/disable/reset flows and permission matrix UI.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given an owner exists, when bootstrap repeats, then it is denied. Given a disabled user, when using old session, then protected routes deny. Given a role change, then sessions rotate/revoke.

### Test strategy and executable test cases

TC-SEC-001–004/007; TC-E2E-001; API login cases.

### Regression tests

All prior UI routes plus anonymous/protected transitions.

### Security checks

Attack login/CSRF/rate/role paths; no phase exit on auth bypass.

### Performance checks

Measure login/throttle response without weakening controls.

### Failure and recovery cases

D1/session dependency failure: fail closed, generic error, audit safe outcome.

### Risks and mitigations

Crypto/runtime mismatch and privilege escalation; benchmark maintained library and complete role matrix.

### Explicit exit criteria

Auth/security suite passes; no bypass, plaintext, hardcoded secret or unrevoked privilege.

### Run results

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
