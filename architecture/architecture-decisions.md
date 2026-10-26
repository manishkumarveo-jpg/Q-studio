# Architecture Decisions

+## Architecture decision records

### ADR-001 — Cloudflare-native control plane
**Decision:** Workers Static Assets + Workers APIs, D1, R2, Queues, and Durable Objects. **Why:** satisfies hosting/data constraints while retaining server-side policy points. **Date verified:** 2026-10-26. [Static Assets billing/limits](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [R2 API surfaces](https://developers.cloudflare.com/r2/api/).

### ADR-002 — Private R2 and short-lived scoped object access
**Decision:** bind R2 privately; issue short-lived single-object capabilities only after authorization, including locked content type and CORS. **Why:** object-key obscurity is not access control. [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) supports GET/HEAD/PUT/DELETE, 1 second–7 day expiry, and treats URLs as bearer tokens.

### ADR-003 — Password hashing fallback
**Decision:** use a maintained Workers-compatible password-hashing implementation selected and benchmarked during Phase 5; do not assume Node Argon2. **Why:** Workers docs state node:crypto argon2/argon2Sync are unsupported. [Workers crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/). The implementation record must capture algorithm, version, cost, memory, salt and upgrade plan.

### ADR-004 — OCR/media processor outside ordinary Workers
**Decision:** local Python/FFmpeg adapter in development; evaluate paid Containers or compatible runtime in production. **Why:** Python/native binaries do not execute in standard Workers. Cloudflare Containers is Workers Paid and bills active CPU/memory/disk. [Containers overview](https://developers.cloudflare.com/containers/), [pricing](https://developers.cloudflare.com/containers/platform/pricing/).

### ADR-005 — No hosted LLM
**Decision:** structured native comments need no extraction; screenshot parsing uses local OCR plus deterministic rules. **Consequence:** uncertainty is shown for manual verification and benchmarked, never hidden.
