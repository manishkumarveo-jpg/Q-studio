# Risk Register

+## Risks

| Risk | Mitigation |
|---|---|
| Worker incompatible password/OCR/media assumptions | ADR-003/004, benchmark compatible implementations before commitment |
| Private media bypass | policy at API/object/guest/realtime boundaries plus security tests |
| OCR inaccuracy | confidence thresholds, manual review, labeled corpus and source links |
| QC data drift on late notes/version switches | stable IDs, immutable source fields, regression tests |
| Cloud cost surprise | usage indicators, limits and current pricing review in Phase 20 |
| Large-table degraded UX | measured virtualization/pagination with keyboard regression tests |
