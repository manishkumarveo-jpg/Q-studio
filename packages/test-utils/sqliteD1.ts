import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

type Value = string | number | null;

/** An in-memory D1 stand-in over node:sqlite with the real migrations applied. `batch` is one transaction, as in D1. */
export function createTestD1(migrationsDir = join(import.meta.dirname, "../../database/migrations")) {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
    db.exec(readFileSync(join(migrationsDir, file), "utf8"));
  }
  const statement = (sql: string, values: Value[] = []) => ({
    bind: (...next: Value[]) => statement(sql, next),
    first: async <T>() => (db.prepare(sql).get(...values) ?? null) as T | null,
    all: async <T>() => ({ results: db.prepare(sql).all(...values) as T[] }),
    run: async () => db.prepare(sql).run(...values),
    exec: () => db.prepare(sql).all(...values),
  });
  return {
    raw: db,
    prepare: (sql: string) => statement(sql),
    batch: async (statements: ReturnType<typeof statement>[]) => {
      db.exec("BEGIN");
      try {
        const results = statements.map((s) => s.exec());
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
