# Deployment Architecture

+## Environments

Local uses Wrangler state and a separately started local media adapter. Preview/staging uses separate D1/R2/Queue/DO bindings and synthetic fixtures. Production uses private buckets, deployment secrets, migration review, monitored queues and tested backup/restore. No production credential belongs in Wrangler config, browser bundles, docs, fixtures, or logs. Deployment remains a Phase 20 deliverable; this document is a design, not a deployed claim.
