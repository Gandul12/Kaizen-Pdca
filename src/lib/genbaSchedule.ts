import { GenbaItem, GenbaItemStatus, GenbaScheduleSection } from "@/types/genba";
import { db } from "@/db";
import { genbaScheduleItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// Jadwal checklist genba harian, dikelompokkan per section. `endMinutes`
// dipakai untuk logika andon (menit sejak tengah malam batas waktu item
// tsb seharusnya sudah dicek). Urutan & isi bisa disesuaikan kemudian
// tanpa mengubah bentuk data — id item dibuat stabil supaya PATCH
// per-item (toggle satu checklist) tetap aman.
// FR-11: master data checklist genba SEKARANG hidup di tabel
// genba_schedule_items (lihat src/db/schema.ts) — bisa diatur lewat
// /api/genba/schedule/*. Array statis di bawah ini DIPERTAHANKAN apa
// adanya untuk sementara karena masih dipakai langsung (synchronous) oleh:
//   - src/app/genba/page.tsx
//   - src/components/genba/GenbaReportView.tsx
//   - src/lib/genbaDocxExport.ts
// Ketiganya BELUM dimigrasi ke sumber DB pada task ini (di luar scope
// 3 poin yang diminta) — kalau schedule diedit lewat API baru, ketiga
// file itu TIDAK akan ikut berubah sampai dimigrasi di task selanjutnya.
// `buildEmptyItems()` di bawah SUDAH pindah ke DB dan tidak lagi
// membaca array ini.
export const GENBA_SCHEDULE: GenbaScheduleSection[] = [
  {
    id: "5s",
    title: "5S & Kebersihan Area",
    items: [
      { id: "5s-1", point: "Area kerja bersih dan rapi", standard: "Tidak ada sampah/barang tidak perlu di area kerja", endMinutes: 7 * 60 + 30 },
      { id: "5s-2", point: "Barang & tools pada tempatnya", standard: "Sesuai label/shadow board", endMinutes: 7 * 60 + 30 },
    ],
  },
  {
    id: "safety",
    title: "Safety",
    items: [
      { id: "safety-1", point: "APD digunakan dengan benar", standard: "Helm, sepatu safety, sarung tangan sesuai SOP", endMinutes: 8 * 60 },
      { id: "safety-2", point: "Jalur evakuasi tidak terhalang", standard: "Bebas dari barang/obstacle", endMinutes: 8 * 60 },
    ],
  },
  {
    id: "quality",
    title: "Quality",
    items: [
      { id: "quality-1", point: "Produk sesuai standar kualitas", standard: "Tidak ada defect visual", endMinutes: 9 * 60 + 30 },
    ],
  },
  {
    id: "machine",
    title: "Kondisi Mesin",
    items: [
      { id: "machine-1", point: "Kondisi mesin normal", standard: "Tidak ada suara/getaran abnormal", endMinutes: 10 * 60 },
      { id: "machine-2", point: "Parameter mesin sesuai setting", standard: "Sesuai SOP parameter produksi", endMinutes: 10 * 60 },
    ],
  },
  {
    id: "target",
    title: "Target Produksi",
    items: [
      { id: "target-1", point: "Progress terhadap target harian", standard: "Sesuai rencana produksi", endMinutes: 14 * 60 },
    ],
  },
];

/**
 * Membangun array item checklist genba kosong (belum dicek) untuk satu
 * entry baru — SEKARANG dari tabel genba_schedule_items (FR-11), bukan
 * dari GENBA_SCHEDULE statis di atas. Dipakai saat GET /api/genba tidak
 * menemukan row untuk tanggal yang diminta, dan sebagai fallback default
 * saat POST tanpa items. Pemanggil WAJIB memastikan `ensureSchema()` sudah
 * dipanggil lebih dulu di request yang sama (sudah begitu di kedua
 * pemanggil saat ini: GET & POST /api/genba).
 */
export async function buildEmptyItems(): Promise<GenbaItem[]> {
  const scheduleItems = await db
    .select()
    .from(genbaScheduleItems)
    .where(eq(genbaScheduleItems.isActive, true))
    .orderBy(asc(genbaScheduleItems.sectionOrder), asc(genbaScheduleItems.itemOrder));

  return scheduleItems.map((tpl) => ({
    id: tpl.id,
    sectionId: tpl.sectionId,
    sectionTitle: tpl.sectionTitle,
    point: tpl.point,
    standard: tpl.standard,
    endMinutes: tpl.endMinutes,
    actual: "",
    status: "na" as GenbaItemStatus,
    note: "",
    attachments: [],
  }));
}
