# README

+## QC Studio

QC Studio is a Cloudflare-native media-review and episode-correction workspace for post-production teams. It pairs version-aware review comments with a structured QC correction sheet, while external screenshots follow a separate deterministic OCR intake path.

## Status

Documentation gate is complete enough to begin only Phase 1 once its checks pass. The UI currently planned for local demo mode must label simulated uploads, shares, activity, OCR, and integrations as simulated until their backend phase is complete.

## Product boundaries

- D1 stores relational records and audit metadata; R2 holds originals and derivatives.
- First-party credentials and server-side authorization are mandatory; there is no public signup or hosted identity provider.
- FFmpeg and Python OCR live behind a queue contract and cannot be claimed to run in an ordinary Worker.

Read [PROJECT_BRIEF.md](PROJECT_BRIEF.md), [PRD.md](PRD.md), [architecture/system-design.md](architecture/system-design.md), [implementation/development-strategy.md](implementation/development-strategy.md), and [MASTER_TEST_PLAN.md](MASTER_TEST_PLAN.md) before changing the product.
