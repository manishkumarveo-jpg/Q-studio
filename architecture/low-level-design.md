# Low Level Design

+## Boundaries

Routes parse Zod schemas and attach an authenticated principal. Services derive resource scope from server records, never client claims. Repositories accept workspace IDs and use parameterized D1 SQL. Object keys are generated server-side as workspace/{workspaceId}/project/{projectId}/{kind}/{opaqueId} and are never interpreted as permission.

Mutation path: request → rate/origin/CSRF → authenticate → authorize → validate → transactional persistence → audit/outbox → response. Long work returns a job state; clients never infer completion. Remarks use optimistic version numbers and return 409 with current content on conflict.
