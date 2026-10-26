// The subset of the D1 binding this Worker uses (keeps tests runnable against node:sqlite).
export interface D1PreparedStatement {
  bind(...values: (string | number | null)[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  /** Runs all statements in one transaction; any failure rolls back the whole batch. */
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

export type Env = {
  DB: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
  // Operator-only secrets used once by bootstrap (see devops/owner-bootstrap.md).
  OWNER_USERNAME?: string;
  OWNER_PASSWORD?: string;
  OWNER_DISPLAY_NAME?: string;
  WORKSPACE_NAME?: string;
  /** Comma-separated extra origins allowed to send mutations (e.g. the Vite dev server). */
  ALLOWED_ORIGINS?: string;
};
