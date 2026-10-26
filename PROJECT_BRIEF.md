# PROJECT BRIEF

+## Problem and outcome

Studios lose review context when timecoded notes, screenshots, versions, and correction sheets live in different tools. QC Studio gives owners, producers, reviewers, artists, and clients one controlled workspace where native comments remain structured, version-specific records and external screenshots become reviewed correction records through local OCR.

## First usable release

MVP includes first-party login, project/folder/asset organization, browser-supported review, comments and basic annotations, version history, show/episode correction sheets, demo screenshot import, status/remarks/assignment, CSV/print export, and administrator-managed roles. Production upload, share security, realtime, OCR, streaming, and NLE interoperability are gated in later phases.

## Assumptions

One initial workspace is supported but the schema remains multi-workspace. "A" and "E" are studio department labels; their meaning is configured per show. General Notes sort at 00:00:00, then by batch, screenshot order, vertical position, and record ID. The owner provides bootstrap credentials as deployment secrets.

## Non-goals for MVP

No hosted LLM, public signup, real Camera-to-Cloud pairing, desktop editor integration, adaptive streaming promise, or pixel-difference comparison. [PRD.md](PRD.md) defines the feature boundary.
