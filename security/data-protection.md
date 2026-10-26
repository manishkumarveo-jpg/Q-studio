# Data Protection

+## Data protection

Encrypt in transit via HTTPS; rely on platform storage encryption at rest and restrict binding/API-token access. Use private R2 buckets, object-key partitioning, safe content disposition, conservative private caching and short capabilities. Keep originals separate from derivatives. Soft-delete relational records where restore is promised; schedule permanent purge/derived cleanup by retention policy. Secrets and tokens never enter client storage, logs or analytics.
