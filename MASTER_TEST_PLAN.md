# MASTER TEST PLAN

+## Release test plan

| Area | Representative tests | Gate |
|---|---|---|
| Foundation | TC-FE-001 theme persistence; TC-A11Y-001 keyboard focus | 1 |
| Auth/security | TC-SEC-001 bootstrap replay; TC-SEC-004 IDOR; TC-SEC-007 CSRF | 5, 19 |
| Data/API | TC-API-001 migrations; TC-API-004 workspace scope; TC-API-008 idempotency | 6 |
| Storage | TC-INT-011 unauthorized object; TC-INT-014 interrupted upload | 7 |
| Media/comments | TC-UNIT-021 timecode; TC-E2E-010 version-bound comment | 8–10 |
| QC/OCR | TC-E2E-021 status invariants; TC-MEDIA-006 crop bounds; TC-INT-025 late notes | 12–14 |
| Operations | TC-PERF-001 50/200-row render; TC-OPS-003 backup/restore smoke | 18–20 |

The traceability matrix is [implementation/phase-test-matrix.md](implementation/phase-test-matrix.md).
