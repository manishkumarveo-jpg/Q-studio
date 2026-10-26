# Phase 15 Realtime Activity And Notifications

+## Phase 15 plan

### Objectives and scope

Implement authenticated Durable Object sessions, presence, realtime comment/QC updates, activity/notifications, optimistic state and conflict/offline recovery.

### Dependencies and preconditions

Phase 14 passed; authorization handshake and D1 persistence design approved.

### Concrete implementation tasks and deliverables

Add room authorization, connection lifecycle, event/outbox ordering, notifications/activity queries and optimistic save/error state.

### Architecture and UX decisions

Follow the current ADRs, feature boundaries, accessible design-system rules, explicit error/loading/offline states and the no-fake-success rule. Update API/data documentation only when this phase introduces a real boundary.

### Acceptance criteria

Given two authorized clients edit, when an update races, then ordering/conflict outcome is visible and durable state wins. Given stale session, when socket reconnects, then it is rejected.

### Test strategy and executable test cases

TC-INT-007; realtime multi-client/offline E2E; TC-PERF-006.

### Regression tests

All persisted comment/QC/job and auth revocation suites.

### Security checks

Test unauthorized room, expired/revoked session, event payload scope and no durable state only in memory.

### Performance checks

Measure update propagation under fixture clients.

### Failure and recovery cases

Reconnect/offline: resync authoritative record and preserve unsaved draft.

### Risks and mitigations

Room leakage/update ordering; per-room policy and versioned events.

### Explicit exit criteria

Realtime persistence, recovery and access controls pass multi-client cases.

### Run results

**Status: Not Run.** This phase has no implementation or test evidence yet; no test may be reported Passed until its documented commands execute.
