# Api Design

+## API conventions

Prefix APIs with /api/v1; return { data, requestId } or { error: { code, message, requestId } }. Generic denials use 401/403 without resource enumeration. All mutation inputs use Zod on the Worker; pagination is bounded cursor pagination; mutation requests carry an idempotency key where duplicate harm is plausible.

| Group | Representative routes | Authorization |
|---|---|---|
| Auth | POST /bootstrap, /session, DELETE /session | bootstrap only when no owner; self-session |
| Members | GET/POST /members, PATCH /members/:id | Owner/Admin scoped workspace |
| Projects/assets | CRUD /projects, /folders, /assets, /versions | resource role + membership |
| Transfers | POST /uploads/intents, POST /uploads/:id/complete, GET /assets/:id/download | server validates scope/key/content policy |
| Review | CRUD /comments, /replies, /annotations | exact asset version access |
| Shares/approvals | CRUD /shares, POST /shares/:token/actions | hashed scoped guest token |
| QC | CRUD /shows, /episodes, /qc-items, /ingestion-batches | production role in episode workspace |
| Exports/realtime | POST /exports, POST /realtime/authorize | explicit resource permissions |

Every implemented route records actor/action/resource/outcome. Route-level schemas and error tests are added with the relevant implementation phase.
