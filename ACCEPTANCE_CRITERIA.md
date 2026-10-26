# ACCEPTANCE CRITERIA

+## Product acceptance criteria

- AC-UI-001: Given a narrow viewport, when navigation opens, then it is a focus-trapped drawer and main content remains reachable after close.
- AC-AUTH-001: Given an owner exists, when any caller invokes bootstrap, then no account is created and no credential detail is disclosed.
- AC-AUTH-002: Given a disabled user, when they present a prior session, then every protected route denies access.
- AC-PROJ-001: Given two workspaces, when a member guesses an asset ID from another workspace, then the API returns a non-enumerating denial.
- AC-CMT-001: Given a version-bound comment, when the logical asset switches version, then the comment retains its original asset_version_id.
- AC-QC-001: Given Possible is checked, when Not Possible is checked, then Possible clears and Fixed remains unchanged.
- AC-QC-002: Given filtered/sorted corrections, when order changes, then display row number recomputes but correction ID does not.
- AC-ING-001: Given a late-note batch, when intake completes, then prior correction statuses, remarks, assignments and audit events remain unchanged.
- AC-R2-001: Given a private object, when an unauthorized caller requests it, then no object body or usable capability is returned.
- AC-EXPORT-001: Given text containing commas/newlines/Unicode, when CSV exports, then columns remain parseable and values are escaped.

Tests use the linked IDs in [MASTER_TEST_PLAN.md](MASTER_TEST_PLAN.md).
