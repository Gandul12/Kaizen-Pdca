import type { GenbaItem } from "@/types/genba";

export interface GenbaSectionGroup {
  sectionId: string;
  sectionTitle: string;
  items: GenbaItem[];
}

/**
 * Kelompokkan items berdasarkan sectionId. Judul diambil dari
 * item.sectionTitle (fallback ke sectionId kalau kosong, untuk kompatibilitas
 * entry lama). Urutan section = urutan kemunculan PERTAMA di array items —
 * BUKAN lookup ke tabel master genba_schedule_items, karena entry genba
 * self-contained (lihat FR-1/FR-11).
 *
 * Ini SATU-SATUNYA sumber kebenaran untuk render section di UI/DOCX/PDF.
 * GENBA_SCHEDULE statis tidak boleh dipakai lagi untuk ini.
 */
export function groupGenbaItemsBySection(items: GenbaItem[]): GenbaSectionGroup[] {
  const order: string[] = [];
  const map = new Map<string, GenbaSectionGroup>();

  for (const item of items) {
    if (!map.has(item.sectionId)) {
      map.set(item.sectionId, {
        sectionId: item.sectionId,
        sectionTitle: item.sectionTitle || item.sectionId,
        items: [],
      });
      order.push(item.sectionId);
    }
    map.get(item.sectionId)!.items.push(item);
  }

  return order.map((id) => map.get(id)!);
}
