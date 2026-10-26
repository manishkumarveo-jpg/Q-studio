# Auth Strategy

+## First-party authentication

Owner supplies initial username/password through Wrangler secret or equivalent operator-only configuration. A bootstrap transaction succeeds only when no owner exists; it records audit outcome and permanently makes the endpoint unavailable afterward. No public signup.

Login uses a maintained Workers-compatible password-hash library selected/benchmarked in Phase 5; passwords/hashes are never logged. Generate random opaque session tokens, store only hashes with expiry/revocation/session metadata, and send Secure, HttpOnly, SameSite cookies. Rotate on login and privilege change; revoke on logout, disablement and reset. Admin-managed resets require a safe out-of-band temporary-password procedure.
