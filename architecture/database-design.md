# Database Design

+## Relational model

Core tables: users, sessions, workspaces, workspace_members, projects, folders, assets, asset_versions, collections, collection_assets, metadata_fields, metadata_values, comments, comment_replies, annotations, review_links, approval_requests, approval_events, shows, episodes, source_screenshots, ingestion_batches, ingestion_jobs, qc_items, activity_events, notifications, upload_intents, transfer_jobs.

All tenant resources carry workspace_id, opaque IDs, created_at, updated_at, actor fields, and nullable deleted_at where recoverability applies. FKs enforce parent relationships; active membership and normalized-name uniqueness prevent ambiguity. Indexes cover scope+updated time, asset/current version, episode/sort tuple, token hashes, job idempotency keys, and session token hashes.

QC items keep original/edited text, original/normalized timecodes, frame-rate, sort tuple, source screenshot/crop references, confidence, verification state, status, fixed, priority, assignee and optimistic version. See [../diagrams/database-erd.md](../diagrams/database-erd.md).
