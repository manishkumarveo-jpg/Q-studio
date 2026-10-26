# README

+## QC Studio

QC Studio is a Cloudflare-native media-review and episode-correction workspace for post-production teams. It pairs version-aware review comments with a structured QC correction sheet, while external screenshots follow a separate deterministic OCR intake path.

## Status

Phases 1–5 are implemented. Sign-in, owner bootstrap, sessions, members and roles are real: a Cloudflare Worker API on D1 (run locally; no deployed environment yet). Phase 5 awaits human review of the ADR-003 password-hashing record. Project, asset, dashboard and search data is still in-memory Demo data and is labelled as such; uploads, media review, OCR and integrations are not implemented.

## Local development

`npm install`, `npm test`, `npm run build`. To run the app with the real API and sign-in, follow [devops/owner-bootstrap.md](devops/owner-bootstrap.md) (`.dev.vars`, `npm run db:migrate:local`, `npm run dev:worker`).

## Product boundaries

- D1 stores relational records and audit metadata; R2 holds originals and derivatives.
- First-party credentials and server-side authorization are mandatory; there is no public signup or hosted identity provider.
- FFmpeg and Python OCR live behind a queue contract and cannot be claimed to run in an ordinary Worker.

Read [PROJECT_BRIEF.md](PROJECT_BRIEF.md), [PRD.md](PRD.md), [architecture/system-design.md](architecture/system-design.md), [implementation/development-strategy.md](implementation/development-strategy.md), and [MASTER_TEST_PLAN.md](MASTER_TEST_PLAN.md) before changing the product.
