# User Flows

+## Canonical flows

**Native comment**: authorized asset version → player timestamp/range → validated Worker mutation → D1/audit → authorized update → optional QC link.

**Screenshot intake**: producer selects episode + files → private R2 original → batch/job records → queued OCR/crop adapter → needs-review or QC item → correction sheet.

**Correction review**: visible sorted rows → keyboard/mouse status action → optimistic saving state → server validation/version check → persisted audit or conflict recovery.

See [../diagrams/user-flow.md](../diagrams/user-flow.md).
