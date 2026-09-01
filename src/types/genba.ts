export type GenbaItemStatus = "ok" | "ng" | "na";

export interface GenbaAttachment {
  id: string;
  fileUrl: string;
  fileName?: string;
}

export type CorrectiveActionStatus = "belum" | "proses" | "selesai";

export interface CorrectiveAction {
  rootCause: string;
  action: string;
  status: CorrectiveActionStatus;
}

export interface GenbaItem {
  id: string;
  sectionId: string;
  // FR-11: judul section menempel di tiap item (bukan lookup terpisah ke
  // tabel master/GENBA_SCHEDULE statis) — supaya entry genba self-contained
  // untuk keperluan render section di UI/DOCX/PDF, dan tidak divergen dari
  // master data kalau section title diedit belakangan. Opsional karena
  // entry lama (dibuat sebelum FR-11) belum menyimpan field ini — konsumen
  // WAJIB fallback ke `sectionId` sebagai judul kalau field ini kosong.
  sectionTitle?: string;
  point: string; // checklist point / pertanyaan
  standard: string; // kondisi standar yang diharapkan
  endMinutes: number; // menit sejak tengah malam, batas waktu item ini seharusnya sudah dicek (untuk andon)
  actual: string; // kondisi aktual yang ditemukan saat genba walk
  status: GenbaItemStatus;
  note: string;
  attachments: GenbaAttachment[];
  // FR-10: opsional — undefined kalau temuan ini tidak butuh tindak lanjut
  // formal (bukan setiap temuan serius/berulang perlu corrective-action,
  // dan checklist harian tidak boleh jadi wajib mengisi ini).
  correctiveAction?: CorrectiveAction;
}

export interface GenbaScheduleItem {
  id: string;
  point: string;
  standard: string;
  endMinutes: number;
}

export interface GenbaScheduleSection {
  id: string;
  title: string;
  items: GenbaScheduleItem[];
}

export interface GenbaEntry {
  id: string;
  date: string; // format YYYY-MM-DD
  leaderName: string;
  lineName: string | null;
  dailyTarget: string | null;
  items: GenbaItem[];
  linkedProjectId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
