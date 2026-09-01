import { GenbaItem } from "@/types/genba";

export interface GenbaSectionGroup {
  sectionId: string;
  sectionTitle: string;
  items: GenbaItem[];
}

/**
 * Kelompokkan item genba berdasarkan `sectionId` yang menempel di tiap item
 * (FR-11) — BUKAN lookup ke GENBA_SCHEDULE statis atau tabel master
 * genba_schedule_items. Ini satu-satunya sumber kebenaran untuk render
 * section di UI/DOCX/PDF, supaya entry genba self-contained dan tidak bisa
 * divergen dari master data kalau master-nya diedit belakangan.
 *
 * Urutan section = urutan kemunculan pertama tiap sectionId di array
 * `items` (array items sendiri sudah terurut sesuai sectionOrder/itemOrder
 * saat entry dibuat, lihat buildEmptyItems() di genbaSchedule.ts).
 *
 * Fallback kompatibilitas mundur: entry lama (dibuat sebelum FR-11) belum
 * menyimpan `sectionTitle` per item — kalau kosong, judul section jatuh
 * balik ke `sectionId` apa adanya (bukan di-backfill ke database).
 *
 * File ini SENGAJA tidak mengimpor apa pun dari "@/db" (server-only, pakai
 * koneksi `pg`) supaya aman diimpor oleh komponen client sekalipun
 * (src/app/genba/page.tsx, src/components/genba/GenbaReportView.tsx) tanpa
 * merusak bundling.
 */
export function groupGenbaItemsBySection(items: GenbaItem[]): GenbaSectionGroup[] {
  const sectionOrder: string[] = [];
  const sectionsById = new Map<string, GenbaSectionGroup>();

  for (const item of items) {
    const sectionId = item.sectionId;
    if (!sectionsById.has(sectionId)) {
      sectionOrder.push(sectionId);
      sectionsById.set(sectionId, {
        sectionId,
        sectionTitle: item.sectionTitle || sectionId,
        items: [],
      });
    }
    sectionsById.get(sectionId)!.items.push(item);
  }

  return sectionOrder.map((id) => sectionsById.get(id)!);
}
