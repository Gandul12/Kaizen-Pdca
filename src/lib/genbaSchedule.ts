import { db, ensureSchema } from "@/db";
import { genbaScheduleItems } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import type { GenbaItem } from "@/types/genba";

// ─────────────────────────────────────────────────────────────────────────
// CATATAN FR-11: GENBA_SCHEDULE di bawah ini TIDAK LAGI dipakai saat runtime
// (bukan sumber data buildEmptyItems() lagi — itu sekarang query DB tabel
// genba_schedule_items, yang bisa diatur lewat UI di /genba/pengaturan).
//
// Konstanta ini sengaja dipertahankan HANYA sebagai dokumentasi/referensi 8
// poin seed asli (FR-1) — nilai yang sama persis di-seed langsung sebagai
// SQL literal di ensureSchema() (src/db/index.ts), BUKAN dengan meng-import
// konstanta ini, supaya tidak terjadi circular import (genbaSchedule.ts ↔
// db/index.ts, karena file ini sekarang perlu import { db, ensureSchema }
// dari situ untuk versi async buildEmptyItems() di bawah).
// ─────────────────────────────────────────────────────────────────────────
export interface GenbaScheduleItemDef {
  id: string;
  point: string;
  standard: string;
  endMinutes: number; // menit sejak 00:00, dipakai untuk indikator andon
}

export interface GenbaScheduleSectionDef {
  sectionId: string;
  sectionTitle: string;
  items: GenbaScheduleItemDef[];
}

/** @deprecated Referensi historis saja — tidak diimpor oleh kode lain. */
export const GENBA_SCHEDULE: GenbaScheduleSectionDef[] = [
  {
    sectionId: "5s",
    sectionTitle: "5S & Kebersihan Area",
    items: [
      {
        id: "g1",
        point: "Area kerja bebas dari barang yang tidak diperlukan (Seiri)",
        standard: "Tidak ada barang non-esensial menumpuk di area kerja",
        endMinutes: 8 * 60,
      },
      {
        id: "g2",
        point: "Lantai dan jalur kerja bersih dari tumpahan atau sampah",
        standard: "Lantai kering, bebas oli/serpihan, jalur evakuasi tidak terhalang",
        endMinutes: 9 * 60,
      },
    ],
  },
  {
    sectionId: "safety",
    sectionTitle: "Safety",
    items: [
      {
        id: "s1",
        point: "APD digunakan dengan benar",
        standard: "Seluruh operator memakai APD lengkap sesuai SOP (helm, sarung tangan, safety shoes, dll)",
        endMinutes: 10 * 60,
      },
      {
        id: "s2",
        point: "Jalur darurat dan APAR tidak terhalang",
        standard: "Akses ke APAR dan pintu darurat bebas dari halangan barang/mesin",
        endMinutes: 11 * 60,
      },
    ],
  },
  {
    sectionId: "quality",
    sectionTitle: "Quality",
    items: [
      {
        id: "q1",
        point: "Spot check kualitas produk sesuai standar",
        standard: "Sample produk sesuai spesifikasi, tidak ditemukan NG visual",
        endMinutes: 13 * 60,
      },
    ],
  },
  {
    sectionId: "mesin",
    sectionTitle: "Kondisi Mesin",
    items: [
      {
        id: "m1",
        point: "Mesin beroperasi tanpa suara atau getaran abnormal",
        standard: "Tidak ada indikasi abnormal pada mesin utama saat berjalan",
        endMinutes: 14 * 60,
      },
      {
        id: "m2",
        point: "Parameter mesin (suhu, tekanan, kecepatan) sesuai standar",
        standard: "Parameter mesin berada dalam rentang normal sesuai SOP",
        endMinutes: 15 * 60,
      },
    ],
  },
  {
    sectionId: "produksi",
    sectionTitle: "Target Produksi",
    items: [
      {
        id: "t1",
        point: "Pencapaian target produksi sesuai rencana harian",
        standard: "Output aktual memenuhi target harian, atau ada rencana recovery bila di bawah target",
        endMinutes: 16 * 60,
      },
    ],
  },
];

/**
 * Bangun daftar GenbaItem kosong untuk entry baru, dari master checklist
 * yang tersimpan di DB (genba_schedule_items, hanya yang isActive) — bisa
 * diatur lewat UI di /genba/pengaturan (FR-11).
 *
 * Tiap item membawa salinan sectionTitle/point/standard/endMinutes sendiri
 * (self-contained), supaya entry yang SUDAH TERSIMPAN tidak berubah kalau
 * master checklist diedit belakangan.
 */
export async function buildEmptyItems(): Promise<GenbaItem[]> {
  await ensureSchema();

  const rows = await db
    .select()
    .from(genbaScheduleItems)
    .where(eq(genbaScheduleItems.isActive, 1))
    .orderBy(asc(genbaScheduleItems.sectionOrder), asc(genbaScheduleItems.itemOrder));

  return rows.map(
    (row): GenbaItem => ({
      id: row.id,
      sectionId: row.sectionId,
      sectionTitle: row.sectionTitle,
      point: row.point,
      standard: row.standard,
      endMinutes: row.endMinutes,
      status: "pending",
      actual: "",
      note: "",
      attachments: [],
    })
  );
}
