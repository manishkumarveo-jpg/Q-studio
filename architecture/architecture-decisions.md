# Architecture Decisions

+## Architecture decision records

### ADR-001 — Cloudflare-native control plane
**Decision:** Workers Static Assets + Workers APIs, D1, R2, Queues, and Durable Objects. **Why:** satisfies hosting/data constraints while retaining server-side policy points. **Date verified:** 2026-10-26. [Static Assets billing/limits](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [R2 API surfaces](https://developers.cloudflare.com/r2/api/).

### ADR-002 — Private R2 and short-lived scoped object access
**Decision:** bind R2 privately; issue short-lived single-object capabilities only after authorization, including locked content type and CORS. **Why:** object-key obscurity is not access control. [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) supports GET/HEAD/PUT/DELETE, 1 second–7 day expiry, and treats URLs as bearer tokens.

### ADR-003 — Password hashing fallback
**Decision:** use a maintained Workers-compatible password-hashing implementation selected and benchmarked during Phase 5; do not assume Node Argon2. **Why:** Workers docs state node:crypto argon2/argon2Sync are unsupported. [Workers crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/). The implementation record must capture algorithm, version, cost, memory, salt and upgrade plan.
**Implementation record (Phase 5, 2026-10-26):**
- Algorithm and library: Argon2id (v=19) from `@noble/hashes` 2.4.0, which is audited, pure JS and has no WASM or native code. Cost m=19456 KiB, t=2, p=1, dkLen 32 (OWASP minimum profile), with a 16-byte random salt per hash. Hashes are stored as PHC strings, so verification reads the cost from the stored hash.
- Benchmark (Node 26, pure JS, 3 warm runs): Argon2id at that profile took ~420 ms. scrypt N=2^14 r=8 p=5 took 460–600 ms and scrypt N=2^17 r=8 p=1 took 0.9–2.1 s. WebCrypto PBKDF2-SHA256 at 100k iterations took ~86 ms, but 100k is the Workers maximum, below OWASP's 600k, so it was rejected. Under local workerd (`wrangler dev`), sign-in takes 0.36–0.48 s end to end.
- Consequence: about 0.4 s of CPU per sign-in, password change or member reset, so the Workers Free 10 ms CPU limit cannot run it. Production needs Workers Paid; the default 30 s CPU limit is ample. Sign-in throttling (5 attempts per username, 30 per IP, per 15 minutes) is counted before any hashing, which bounds CPU abuse.
- Upgrade plan: raise `ARGON2_PARAMS` and regenerate the fixed unknown-user hash (a test enforces matching parameters). Old hashes keep verifying because their PHC string carries their own cost. Add rehash-on-login when the parameters first change.

### ADR-004 — OCR/media processor outside ordinary Workers
**Decision:** local Python/FFmpeg adapter in development; evaluate paid Containers or compatible runtime in production. **Why:** Python/native binaries do not execute in standard Workers. Cloudflare Containers is Workers Paid and bills active CPU/memory/disk. [Containers overview](https://developers.cloudflare.com/containers/), [pricing](https://developers.cloudflare.com/containers/platform/pricing/).

### ADR-005 — No hosted LLM
**Decision:** structured native comments need no extraction; screenshot parsing uses local OCR plus deterministic rules. **Consequence:** uncertainty is shown for manual verification and benchmarked, never hidden.
