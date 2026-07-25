import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

let schemaEnsured = false;
let schemaPromise: Promise<void> | null = null;

/**
 * Idempotently creates tables and adds any missing columns on-the-fly.
 * Guarantees zero schema errors when deploying to new/fresh databases
 * or when updating existing databases without manual migration steps.
 */
export async function ensureSchema(): Promise<void> {
  if (schemaEnsured) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    try {
      const client = await pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS kaizen_projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            department TEXT NOT NULL,
            leader TEXT NOT NULL,
            team_members TEXT,
            start_date VARCHAR(20),
            due_date VARCHAR(20),
            status VARCHAR(30) DEFAULT 'Draft' NOT NULL,
            current_step INTEGER DEFAULT 1 NOT NULL,
            content JSONB NOT NULL,
            project_password TEXT DEFAULT '' NOT NULL,
            is_template INTEGER DEFAULT 0 NOT NULL,
            template_name TEXT,
            share_token TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          ALTER TABLE kaizen_projects ADD COLUMN IF NOT EXISTS project_password TEXT DEFAULT '' NOT NULL;
          ALTER TABLE kaizen_projects ADD COLUMN IF NOT EXISTS is_template INTEGER DEFAULT 0 NOT NULL;
          ALTER TABLE kaizen_projects ADD COLUMN IF NOT EXISTS template_name TEXT;
          ALTER TABLE kaizen_projects ADD COLUMN IF NOT EXISTS share_token TEXT;

          CREATE TABLE IF NOT EXISTS activity_logs (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            action VARCHAR(50) NOT NULL,
            detail TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          CREATE TABLE IF NOT EXISTS kaizen_revisions (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            revision_number INTEGER NOT NULL,
            trigger VARCHAR(50) NOT NULL,
            snapshot_content JSONB NOT NULL,
            snapshot_status VARCHAR(30) NOT NULL,
            snapshot_step INTEGER NOT NULL,
            created_by TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        `);
        schemaEnsured = true;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("ensureSchema execution error:", err);
      schemaPromise = null;
      throw err;
    }
  })();

  return schemaPromise;
}
