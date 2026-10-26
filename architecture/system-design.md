# System Design

+## System design

[Open the validated interactive architecture diagram](../diagrams/qc-studio-architecture.html). The SPA is served as Worker Static Assets and calls a Workers API. The API is the policy enforcement point: it validates cookie sessions, CSRF/origin, role, workspace/project/asset/share scope, payload schema, and audit emission before D1/R2/DO/Queue activity.

D1 is relational metadata/source of truth; private R2 holds originals, previews, screenshots, crops, thumbnails and export binaries. Durable Objects coordinate authorized realtime rooms but durable records remain in D1. Queues carry idempotent processing messages. A local Python service in development and Cloudflare Containers or another documented compatible runtime in production handle FFmpeg/OCR.

The delivered diagram is validated for nine artifact checks and desktop containment; it represents target architecture, not deployed infrastructure.
