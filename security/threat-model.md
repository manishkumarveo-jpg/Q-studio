# Threat Model

+## Threat model

| Asset/boundary | Threat | Mitigation/test |
|---|---|---|
| Bootstrap secret | repeated or public bootstrap | one-time owner check, secret-only operator input, TC-SEC-001 |
| Password/session | brute force, theft, fixation | maintained hash, rate limits, generic errors, rotation/revocation, TC-SEC-002/003 |
| Workspace resource | IDOR/cross-project access | server scope policy for every API/R2/DO route, TC-SEC-004 |
| R2 object | public/broad capability | private bucket, short scoped capability, key validation, TC-SEC-005 |
| Comments/metadata/OCR | stored/reflected XSS | schema limits, escaped rendering, CSP, TC-SEC-006 |
| Cookie mutation | CSRF/CORS abuse | SameSite, CSRF token/origin checks, narrow CORS, TC-SEC-007 |
| Ingestion/upload | oversized/malicious data, DOS | type/size sniffing, quotas, queue limits, retries, TC-SEC-008 |
| Share/realtime | expired/revoked/room bypass | hash token + per-action scope; authorize socket, TC-SEC-009 |
| Audit/logging | data leakage | redaction/minimal actor data, TC-SEC-010 |
