-- Phase 05: first-party identity, workspace membership, sessions, login throttle and audit.
-- Times are Unix epoch milliseconds. IDs are opaque prefixed random strings.

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_normalized TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE workspace_members (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'producer', 'editor', 'reviewer', 'client')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX workspace_members_user ON workspace_members(user_id);

-- Only the SHA-256 of the session token is stored.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  revoked_reason TEXT
);
CREATE INDEX sessions_user_active ON sessions(user_id) WHERE revoked_at IS NULL;

-- Sign-in attempts per key ("user:<name>" or "ip:<address>") in a fixed window.
CREATE TABLE login_throttle (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_started_at INTEGER NOT NULL
);

-- Single row: the primary key check makes a second (or concurrent) bootstrap fail its transaction.
CREATE TABLE bootstrap_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  completed_at INTEGER NOT NULL
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id),
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'denied', 'failed')),
  request_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX audit_events_workspace_time ON audit_events(workspace_id, created_at);
