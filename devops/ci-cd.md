# Ci Cd

+## CI/CD

CI stages: format/lint/typecheck → unit/component → Worker integration → E2E/security/accessibility smoke → build → preview deploy → smoke → approval → production. Secrets are platform-managed; CI logs redact them. Migration and deployment jobs are separate, ordered, and reversible by documented procedure.
