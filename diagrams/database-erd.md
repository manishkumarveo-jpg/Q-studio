# Database Erd

+## ERD outline

workspace 1—* members/projects/shows/metadata/activity; project 1—* folders/assets; asset 1—* asset_versions/comments; show 1—* episodes; episode 1—* ingestion_batches/source_screenshots/qc_items; source screenshot 1—* QC items; collection *—* assets; review links/approvals scope to selected asset/version resources. FKs plus workspace scope prevent relational drift.
