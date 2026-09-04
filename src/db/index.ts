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
            industry VARCHAR(50) DEFAULT 'Manufaktur' NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          ALTER TABLE kaizen_projects ADD COLUMN IF NOT EXISTS project_password TEXT DEFAULT '' NOT NULL;
          ALTER TABLE kaizen_projects ADD COLUMN IF NOT EXISTS is_template INTEGER DEFAULT 0 NOT NULL;
          ALTER TABLE kaizen_projects ADD COLUMN IF NOT EXISTS template_name TEXT;
          ALTER TABLE kaizen_projects ADD COLUMN IF NOT EXISTS share_token TEXT;
          ALTER TABLE kaizen_projects ADD COLUMN IF NOT EXISTS industry VARCHAR(50) DEFAULT 'Manufaktur' NOT NULL;

          CREATE TABLE IF NOT EXISTS activity_logs (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            action VARCHAR(50) NOT NULL,
            detail TEXT,
            ip_address TEXT,
            user_agent TEXT,
            visitor_id TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS visitor_id TEXT;

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

          CREATE TABLE IF NOT EXISTS about_content (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            narrative TEXT NOT NULL,
            author_name TEXT NOT NULL,
            author_role TEXT NOT NULL,
            avatar_url TEXT,
            achievements JSONB NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          CREATE TABLE IF NOT EXISTS genba_entries (
            id TEXT PRIMARY KEY,
            date VARCHAR(10) NOT NULL,
            leader_name TEXT NOT NULL,
            line_name TEXT,
            daily_target TEXT,
            items JSONB NOT NULL,
            linked_project_id TEXT,
            linked_project_share_token TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          ALTER TABLE genba_entries ADD COLUMN IF NOT EXISTS linked_project_share_token TEXT;

          CREATE UNIQUE INDEX IF NOT EXISTS genba_entries_date_idx ON genba_entries(date);

          CREATE TABLE IF NOT EXISTS genba_schedule_items (
            id TEXT PRIMARY KEY,
            section_id TEXT NOT NULL,
            section_title TEXT NOT NULL,
            section_order INTEGER NOT NULL,
            item_order INTEGER NOT NULL,
            point TEXT NOT NULL,
            standard TEXT NOT NULL,
            end_minutes INTEGER NOT NULL,
            is_active INTEGER DEFAULT 1 NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          -- PERF: index untuk kolom yang sering dipakai filter/sort di GET /api/kaizen.
          CREATE INDEX IF NOT EXISTS kaizen_projects_status_idx ON kaizen_projects(status);
          CREATE INDEX IF NOT EXISTS kaizen_projects_department_idx ON kaizen_projects(department);
          CREATE INDEX IF NOT EXISTS kaizen_projects_updated_at_idx ON kaizen_projects(updated_at);
        `);

        // Seed default about_content row if empty
        const countRes = await client.query(`SELECT COUNT(*) FROM about_content WHERE id = 'main';`);
        if (parseInt(countRes.rows[0].count) === 0) {
          const defaultAchievements = JSON.stringify([
            { label: "Peningkatan Kapasitas", value: "158%" },
            { label: "Pengurangan Cycle Time", value: "61%" },
            { label: "Siklus Kaizen PDCA", value: "8 Steps" }
          ]);
          await client.query(`
            INSERT INTO about_content (id, title, narrative, author_name, author_role, avatar_url, achievements, updated_at)
            VALUES (
              'main',
              'Dari Mana Ide Ini Muncul',
              'Website ini dibangun dari pengalaman nyata menghadapi tantangan efisiensi dan standarisasi proses manufaktur di lapangan. Berangkat dari kebutuhan akan alat dokumentasi improvement yang terstruktur, fleksibel, dan mudah diakses tim tanpa hambatan birokrasi, sistem PDCA 8 Langkah ini dirancang untuk memastikan setiap perbaikan dapat terukur dan terstandardisasi dengan konsisten.',
              'Praktisi Lean & Improvement',
              'Industrial Engineer & Continuous Improvement Specialist',
              '',
              $1::jsonb,
              NOW()
            );
          `, [defaultAchievements]);
        }

        // Seed master checklist genba (FR-11) — hanya kalau tabel masih kosong.
        // Nilai persis sama dengan GENBA_SCHEDULE statis (FR-1) supaya perilaku
        // entry baru tidak berubah pasca migrasi ke DB.
        const scheduleCountRes = await client.query(`SELECT COUNT(*) FROM genba_schedule_items;`);
        if (parseInt(scheduleCountRes.rows[0].count) === 0) {
          await client.query(`
            INSERT INTO genba_schedule_items
              (id, section_id, section_title, section_order, item_order, point, standard, end_minutes, is_active, created_at, updated_at)
            VALUES
              ('g1', '5s', '5S & Kebersihan Area', 1, 1,
                'Area kerja bebas dari barang yang tidak diperlukan (Seiri)',
                'Tidak ada barang non-esensial menumpuk di area kerja',
                480, 1, NOW(), NOW()),
              ('g2', '5s', '5S & Kebersihan Area', 1, 2,
                'Lantai dan jalur kerja bersih dari tumpahan atau sampah',
                'Lantai kering, bebas oli/serpihan, jalur evakuasi tidak terhalang',
                540, 1, NOW(), NOW()),
              ('s1', 'safety', 'Safety', 2, 1,
                'APD digunakan dengan benar',
                'Seluruh operator memakai APD lengkap sesuai SOP (helm, sarung tangan, safety shoes, dll)',
                600, 1, NOW(), NOW()),
              ('s2', 'safety', 'Safety', 2, 2,
                'Jalur darurat dan APAR tidak terhalang',
                'Akses ke APAR dan pintu darurat bebas dari halangan barang/mesin',
                660, 1, NOW(), NOW()),
              ('q1', 'quality', 'Quality', 3, 1,
                'Spot check kualitas produk sesuai standar',
                'Sample produk sesuai spesifikasi, tidak ditemukan NG visual',
                780, 1, NOW(), NOW()),
              ('m1', 'mesin', 'Kondisi Mesin', 4, 1,
                'Mesin beroperasi tanpa suara atau getaran abnormal',
                'Tidak ada indikasi abnormal pada mesin utama saat berjalan',
                840, 1, NOW(), NOW()),
              ('m2', 'mesin', 'Kondisi Mesin', 4, 2,
                'Parameter mesin (suhu, tekanan, kecepatan) sesuai standar',
                'Parameter mesin berada dalam rentang normal sesuai SOP',
                900, 1, NOW(), NOW()),
              ('t1', 'produksi', 'Target Produksi', 5, 1,
                'Pencapaian target produksi sesuai rencana harian',
                'Output aktual memenuhi target harian, atau ada rencana recovery bila di bawah target',
                960, 1, NOW(), NOW());
          `);
        }

        // SECURITY: share_token sebelumnya tanpa constraint unik sama sekali.
        // Ini langkah TERPISAH (bukan bagian dari DDL utama di atas) supaya
        // kalau kebetulan sudah ada data lama dengan token duplikat, error-nya
        // tidak menjatuhkan seluruh ensureSchema() — yang berarti seluruh app,
        // karena fungsi ini dipanggil di awal tiap request API.
        try {
          await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS kaizen_projects_share_token_idx
              ON kaizen_projects(share_token);
          `);
        } catch (idxErr) {
          console.error(
            "Gagal membuat unique index share_token (kemungkinan ada data lama yang duplikat — cek manual):",
            idxErr
          );
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
