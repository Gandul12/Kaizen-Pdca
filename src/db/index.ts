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

          CREATE TABLE IF NOT EXISTS genba_entries (
            id TEXT PRIMARY KEY,
            date VARCHAR(10) NOT NULL,
            leader_name TEXT NOT NULL,
            line_name TEXT,
            daily_target TEXT,
            items JSONB NOT NULL,
            linked_project_id TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          CREATE TABLE IF NOT EXISTS genba_schedule_items (
            id TEXT PRIMARY KEY,
            section_id TEXT NOT NULL,
            section_title TEXT NOT NULL,
            section_order INTEGER DEFAULT 0 NOT NULL,
            item_order INTEGER DEFAULT 0 NOT NULL,
            point TEXT NOT NULL,
            standard TEXT NOT NULL,
            end_minutes INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        `);

        // FR-11 seed: isi 8 poin checklist yang sudah dikonfirmasi relevan
        // (sebelumnya GENBA_SCHEDULE statis di genbaSchedule.ts) — HANYA
        // kalau tabel masih kosong, supaya tidak menimpa perubahan yang
        // sudah dibuat lewat UI pengaturan checklist nantinya.
        const scheduleCount = await client.query(
          `SELECT COUNT(*)::int AS count FROM genba_schedule_items`
        );
        if ((scheduleCount.rows[0]?.count ?? 0) === 0) {
          await client.query(`
            INSERT INTO genba_schedule_items
              (id, section_id, section_title, section_order, item_order, point, standard, end_minutes, is_active)
            VALUES
              ('5s-1', '5s', '5S & Kebersihan Area', 0, 0, 'Area kerja bersih dan rapi', 'Tidak ada sampah/barang tidak perlu di area kerja', 450, TRUE),
              ('5s-2', '5s', '5S & Kebersihan Area', 0, 1, 'Barang & tools pada tempatnya', 'Sesuai label/shadow board', 450, TRUE),
              ('safety-1', 'safety', 'Safety', 1, 0, 'APD digunakan dengan benar', 'Helm, sepatu safety, sarung tangan sesuai SOP', 480, TRUE),
              ('safety-2', 'safety', 'Safety', 1, 1, 'Jalur evakuasi tidak terhalang', 'Bebas dari barang/obstacle', 480, TRUE),
              ('quality-1', 'quality', 'Quality', 2, 0, 'Produk sesuai standar kualitas', 'Tidak ada defect visual', 570, TRUE),
              ('machine-1', 'machine', 'Kondisi Mesin', 3, 0, 'Kondisi mesin normal', 'Tidak ada suara/getaran abnormal', 600, TRUE),
              ('machine-2', 'machine', 'Kondisi Mesin', 3, 1, 'Parameter mesin sesuai setting', 'Sesuai SOP parameter produksi', 600, TRUE),
              ('target-1', 'target', 'Target Produksi', 4, 0, 'Progress terhadap target harian', 'Sesuai rencana produksi', 840, TRUE)
            ON CONFLICT (id) DO NOTHING;
          `);
        }
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
