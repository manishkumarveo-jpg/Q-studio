# High Level Architecture

+## Layers

1. **Presentation**: React/Vite TypeScript SPA, Tailwind/shadcn primitives, TanStack Table, Zustand only for cross-route UI state, Zod client feedback.
2. **Application**: Hono-style Workers routes, shared Zod contracts, service/repository policy boundaries.
3. **Data**: D1 scoped relational data, R2 private binary storage, Durables realtime coordination, Queues async work.
4. **Processing**: adapter interface for metadata/proxy/thumb/OCR/crop jobs; no normal Worker native-binary claim.
5. **Operations**: Wrangler environments, secrets, CI, correlation IDs, health checks, backup/recovery and controlled rollout.

See [system-design.md](system-design.md) and ADR-001–005 in [architecture-decisions.md](architecture-decisions.md).
