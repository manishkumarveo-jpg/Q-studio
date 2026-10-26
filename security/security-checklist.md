# Security Checklist

+## Release security checklist

Verify no hardcoded credentials; test one-time bootstrap; review hashes/session flags/CSRF/rate limits; run role and IDOR matrix; test R2 and share revocation; scan XSS/SQL injection/MIME/key paths; inspect CSP/headers/CORS/cache; exercise queue abuse/idempotency; inspect logs/bundles/backups for secrets. Critical/high defects block release.
