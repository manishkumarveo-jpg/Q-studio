# Scalability

+## Scale strategy

Scope every query to workspace/project/episode before pagination; never load an entire library to filter client-side in production. Store binaries only in R2. Use queue jobs per screenshot and idempotency keys to scale processing horizontally. Durable Objects coordinate a narrow room and do not become a database. Benchmark 50/200/larger correction rows, upload intent issuance, filter latency, realtime propagation, and OCR batches before setting targets.
