# Deployment

+## Deployment topology

Local emulates bindings and starts a local media adapter. Preview/staging use isolated Cloudflare bindings. Production serves SPA/API from Workers, metadata in D1, private media in R2, jobs in Queues, realtime coordination in Durable Objects, and native processing in paid Containers or another documented compatible runtime. Secret/operator controls and recovery are Phase 20.
