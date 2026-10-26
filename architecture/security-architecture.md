# Security Architecture

+## Security architecture

The Worker is the only authorization authority. Session cookies are Secure, HttpOnly, SameSite and token hashes are stored in D1. State-changing cookie requests require CSRF/origin validation. R2 buckets are private; requested objects are authorized per resource before a narrowly scoped short-lived capability or Worker-mediated response. External share tokens and passphrases are hash-backed and evaluated per request. Inputs are schema-validated and rendered as text; activity logs omit secrets. See [../security/threat-model.md](../security/threat-model.md).
