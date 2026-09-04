export type GenbaItemStatus = "pending" | "ok" | "ng";

export type CorrectiveActionStatus = "belum" | "proses" | "selesai";

export interface CorrectiveAction {
  rootCause: string;
  action: string;
  status: CorrectiveActionStatus;
}

export interface GenbaAttachment {
  id: string;
  fileUrl: string;
  fileName: string;
}

export interface GenbaItem {
  id: string; // sama dengan id di GENBA_SCHEDULE (mis. "p1", "g1", "s1")
  sectionId: string;
  sectionTitle?: string; // opsional untuk kompatibilitas entry lama (fallback ke sectionId)
  point: string;
  standard: string;
  endMinutes: number;
  status: GenbaItemStatus;
  actual: string;
  note: string;
  attachments: GenbaAttachment[];
  correctiveAction?: CorrectiveAction; // opsional — tindak lanjut akar masalah (FR-10)
}

export interface GenbaEntry {
  id: string;
  date: string; // format YYYY-MM-DD
  leaderName: string;
  lineName?: string | null;
  dailyTarget?: string | null;
  items: GenbaItem[];
  linkedProjectId?: string | null;
  linkedProjectShareToken?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
