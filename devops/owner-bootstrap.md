# Owner Bootstrap Runbook

+## Owner bootstrap and member recovery

Operator-only procedure. Owner credentials never go in `wrangler.jsonc`, source, fixtures, docs or chat.

### Local

1. `cp .dev.vars.example .dev.vars`, then set `OWNER_USERNAME` (3–64 letters, digits, `.`, `_` or `-`), `OWNER_PASSWORD` (12–256 characters) and optionally `OWNER_DISPLAY_NAME`. `.dev.vars` is git-ignored.
2. `npm run db:migrate:local`, `npm run build`, then `npm run dev:worker`. It serves the app and API on http://localhost:8787.
3. Open `/login` and choose **Create owner account**, or run `curl -X POST -H "Origin: http://localhost:8787" http://localhost:8787/api/v1/bootstrap`. Then sign in with the configured credentials.
4. For Vite hot reload, keep `dev:worker` running and run `npm run dev` (http://localhost:5173). Its `/api` proxy targets port 8787, and `ALLOWED_ORIGINS` must include http://localhost:5173.

### Deployed environment (Phase 20 provisions the bindings)

1. `wrangler secret put OWNER_USERNAME` and `wrangler secret put OWNER_PASSWORD` (optionally `OWNER_DISPLAY_NAME` and `WORKSPACE_NAME`) for that environment only.
2. Apply migrations to that environment's D1, then deploy.
3. Call `POST /api/v1/bootstrap` once with a same-origin `Origin` header, or use the button on `/login`. Expect `201`. Every later call returns `403 forbidden` "Setup is not available." and is audited as `denied`.
4. Sign in and confirm the session works. Then `wrangler secret delete OWNER_PASSWORD`; the stored Argon2id hash is all the app needs. Change the password from **Settings → Your account** if the secret was ever shared.

Bootstrap ignores any request body. It creates the workspace, the owner user and the owner membership in one D1 transaction, guarded by the single-row `bootstrap_state` table, so a concurrent or repeated bootstrap cannot create a second owner. Missing or too-weak secrets return `503 dependency_failed` and create nothing.

### Member onboarding and password reset

An Owner or Admin adds a member, or chooses **Reset password**, in **Settings → Members**. QC Studio shows a random 24-character temporary password once. Pass it to the member outside QC Studio (in person, or through a password manager share), never by email or chat in plain text. The member must replace it before they can use anything else. A reset or any role or status change revokes all of that member's sessions.

### Owner lockout recovery

There is no self-service recovery. If the only owner loses access, an operator with D1 access must act deliberately. Generate a hash offline with `hashPassword` in `apps/worker/src/lib/crypto.ts`. The Argon2id PHC hash contains `$`, which a shell expands inside double quotes, so never paste it into `--command "..."`. Write the SQL to a temporary file with a quoted heredoc (no expansion), check it, run it, then delete it:

```sh
cat > recovery.sql <<'SQL'
UPDATE users SET password_hash = '<new argon2id PHC hash>', must_change_password = 1 WHERE username_normalized = '<owner>';
SQL
grep -c '\$argon2id\$' recovery.sql   # expect 1: the full hash reached the file
wrangler d1 execute <db> --file recovery.sql
rm recovery.sql
```

Then revoke sessions: `UPDATE sessions SET revoked_at = <now ms>, revoked_reason = 'operator_recovery' WHERE user_id = '<id>' AND revoked_at IS NULL` (no `$`, so `--command` is safe here). Record the action in the operations log.
