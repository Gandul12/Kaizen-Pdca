import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import crypto from "crypto";

export type ActionType =
  | "project_created"
  | "project_viewed"
  | "project_edited"
  | "project_deleted"
  | "project_duplicated"
  | "project_exported_pdf"
  | "project_exported_docx"
  | "project_exported_pptx"
  | "project_unlocked"
  | "admin_login"
  | "page_visit"
  | "rate_limit_blocked"
  | "genba_saved"
  | "genba_deleted";

// SECURITY: sebelumnya ipAddress disimpan MENTAH (termasuk kalau caller
// meneruskan seluruh isi header x-forwarded-for yang bisa berisi beberapa
// IP dipisah koma). Sekarang di-mask di SATU titik ini — otomatis berlaku
// untuk semua pemanggil (kaizen & genba) tanpa perlu ubah tiap call site.
// IPv4 → oktet terakhir di-nolkan (mis. 203.0.113.45 → 203.0.113.0).
// IPv6 → dipotong ke prefix /64 (4 grup pertama).
// Masih cukup untuk deteksi pola brute-force/abuse, tapi tidak lagi
// menyimpan alamat yang presisi ke satu perangkat.
function maskIp(raw: string): string | null {
  if (!raw) return null;

  // x-forwarded-for bisa berisi beberapa IP dipisah koma — ambil yang pertama.
  const first = raw.split(",")[0]?.trim();
  if (!first) return null;

  // IPv4
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(first)) {
    const parts = first.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  // IPv6 (termasuk bentuk "::ffff:a.b.c.d" — best-effort, cukup untuk masking)
  if (first.includes(":")) {
    const groups = first.split(":").filter((g) => g.length > 0);
    return groups.slice(0, 4).join(":") + "::/64";
  }

  // Format tak dikenal — jangan simpan mentah, cukup tandai sebagai unknown.
  return "unknown";
}

export async function logActivity(opts: {
  action: ActionType;
  projectId?: string | null;
  detail?: string;
  ipAddress?: string;
  userAgent?: string;
  visitorId?: string | null;
}) {
  try {
    const id = "log-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
    await db.insert(activityLogs).values({
      id,
      projectId: opts.projectId || null,
      action: opts.action,
      detail: opts.detail || null,
      ipAddress: opts.ipAddress ? maskIp(opts.ipAddress) : null,
      userAgent: opts.userAgent || null,
      visitorId: opts.visitorId || null,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Activity logging error:", err);
  }
}
