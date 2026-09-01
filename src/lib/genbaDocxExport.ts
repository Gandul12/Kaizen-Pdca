import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  ImageRun,
  ShadingType,
  PageBreak,
} from "docx";
import { GenbaEntry, GenbaItem } from "@/types/genba";
import { groupGenbaItemsBySection } from "@/lib/genbaItemGrouping";
import { imageUrlToBuffer } from "@/lib/docxImageHelper";

const DAY_NAMES_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES_ID_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// Batas embed foto per item — sama untuk export harian & mingguan.
const MAX_PHOTOS_PER_ITEM = 3;
// Budget total foto yang diembed untuk export harian tunggal (1 hari).
const MAX_TOTAL_EMBEDDED_IMAGES_DAILY = 20;
// Budget total foto untuk export mingguan (lebih banyak hari, tapi tetap dibatasi).
const MAX_TOTAL_EMBEDDED_IMAGES_WEEKLY = 30;
// Kalau total foto di seluruh rentang mingguan melebihi ini, hanya foto dari
// item yang punya catatan (temuan) yang diembed — sisanya jadi daftar link.
const WEEKLY_PHOTO_RESTRICT_THRESHOLD = 15;

export function formatDateIndonesian(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  return `${DAY_NAMES_ID[dateObj.getDay()]}, ${d} ${MONTH_NAMES_ID_SHORT[m - 1]} ${y}`;
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function statusLabel(status: GenbaItem["status"]): string {
  if (status === "ok") return "✓ Selesai";
  if (status === "ng") return "✗ NG";
  return "Belum Dicek";
}

// "Selesai dicek" untuk keperluan hitung rata-rata mingguan = status bukan
// "na" (baik hasilnya ok maupun ng, keduanya berarti item sudah diperiksa).
// Diekspor supaya UI (GenbaReportView) bisa memakai definisi yang sama
// persis dengan yang dipakai di dalam dokumen, jadi angkanya selalu match.
export function computeDayCompletionPercent(entry: GenbaEntry): number {
  const total = entry.items.length;
  if (total === 0) return 0;
  const checked = entry.items.filter((it) => it.status !== "na").length;
  return Math.round((checked / total) * 100);
}

// Versi genba dari createLabelValueRow di docxExport.ts — field beda
// (Leader/Line/Target, bukan field Kaizen), tapi gaya warna dipertahankan
// sama (1E293B untuk label, 334155 untuk value) demi konsistensi visual.
function createLabelValueRow(label: string, value: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, color: "1E293B" }),
      new TextRun({ text: value || "-", color: "334155" }),
    ],
    spacing: { before: 60, after: 60 },
  });
}

function buildScheduleTable(sectionItems: GenbaItem[]): Table {
  const rows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Jam", bold: true })] })],
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })],
        }),
        new TableCell({
          width: { size: 36, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Aktivitas", bold: true })] })],
        }),
        new TableCell({
          width: { size: 36, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Catatan", bold: true })] })],
        }),
      ],
    }),
  ];

  sectionItems.forEach((item) => {
    rows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: minutesToHHMM(item.endMinutes) })] }),
          new TableCell({ children: [new Paragraph({ text: statusLabel(item.status) })] }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: item.point, bold: true })] }),
              new Paragraph({
                children: [new TextRun({ text: `Standar: ${item.standard}`, size: 18, color: "64748B" })],
              }),
              ...(item.actual
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Aktual: ${item.actual}`,
                          size: 18,
                          color: item.status === "ng" ? "B91C1C" : "334155",
                        }),
                      ],
                    }),
                  ]
                : []),
              ...(item.correctiveAction
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Akar Masalah: ${item.correctiveAction.rootCause}`,
                          size: 18,
                          color: "334155",
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Tindakan: ${item.correctiveAction.action}`,
                          size: 18,
                          color: "334155",
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Status: ${item.correctiveAction.status}`,
                          bold: true,
                          size: 18,
                          color:
                            item.correctiveAction.status === "selesai"
                              ? "15803D"
                              : item.correctiveAction.status === "proses"
                              ? "B45309"
                              : "64748B",
                        }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
          new TableCell({ children: [new Paragraph({ text: item.note || "-" })] }),
        ],
      })
    );
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

interface EmbedBudget {
  count: number;
  max: number;
  // Kalau true, foto hanya diembed untuk item yang punya catatan (dipakai
  // saat rentang mingguan punya terlalu banyak foto) — sisanya jadi daftar link.
  onlyEmbedForItemsWithNote: boolean;
}

/**
 * Membangun body satu entry genba: baris info Leader/Line/Target + tabel
 * jadwal per section + foto (di luar tabel). Dipakai ulang oleh export
 * harian (`generateGenbaDocx`) maupun tiap hari di export mingguan
 * (`generateGenbaWeeklyDocx`) supaya tidak ada duplikasi logika.
 */
async function buildGenbaEntryBody(entry: GenbaEntry, budget: EmbedBudget): Promise<any[]> {
  const children: any[] = [];

  children.push(createLabelValueRow("Leader", entry.leaderName));
  children.push(createLabelValueRow("Line / Area", entry.lineName || ""));
  children.push(createLabelValueRow("Target Harian", entry.dailyTarget || ""));
  children.push(new Paragraph({ text: "", spacing: { after: 120 } }));

  for (const section of groupGenbaItemsBySection(entry.items)) {
    const sectionItems = section.items;

    children.push(
      new Paragraph({
        children: [new TextRun({ text: section.sectionTitle, bold: true, size: 22, color: "1E3A8A" })],
        spacing: { before: 200, after: 100 },
      })
    );

    children.push(buildScheduleTable(sectionItems));
    children.push(new Paragraph({ text: "", spacing: { after: 100 } }));

    // Foto per item — dirender di luar tabel (bukan di dalam cell) supaya
    // layout tidak pecah, mengikuti pola gambar di docxExport.ts.
    for (const item of sectionItems) {
      const attachments = item.attachments || [];
      if (attachments.length === 0) continue;

      const hasNote = !!(item.note && item.note.trim());
      const allowEmbedForThisItem = !budget.onlyEmbedForItemsWithNote || hasNote;

      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Foto — ${item.point}:`, bold: true, size: 20 })],
          spacing: { before: 80, after: 60 },
        })
      );

      let embeddedForItem = 0;
      if (allowEmbedForThisItem) {
        for (const att of attachments) {
          if (embeddedForItem >= MAX_PHOTOS_PER_ITEM) break;
          if (budget.count >= budget.max) break;

          const res = await imageUrlToBuffer(att.fileUrl);
          if (res) {
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: res.buffer,
                    transformation: { width: 250, height: 180 },
                    type: res.extension === "jpg" ? "jpg" : "png",
                  }),
                ],
                spacing: { after: 60 },
              })
            );
            embeddedForItem++;
            budget.count++;
          }
        }
      }

      const remaining = attachments.length - embeddedForItem;
      if (remaining > 0) {
        if (!allowEmbedForThisItem) {
          // Rentang mingguan terlalu banyak foto & item ini tidak punya
          // catatan — jangan diembed, cukup daftar link ke fotonya.
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${remaining} foto (tidak diembed, lihat link di bawah):`,
                  italics: true,
                  size: 18,
                  color: "64748B",
                }),
              ],
              spacing: { after: 40 },
            })
          );
          attachments.slice(embeddedForItem).forEach((att) => {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: att.fileUrl, size: 16, color: "2563EB" })],
                spacing: { after: 20 },
              })
            );
          });
        } else {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `+${remaining} foto lainnya, lihat di web.`,
                  italics: true,
                  size: 18,
                  color: "64748B",
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }
      }
    }
  }

  return children;
}

export async function generateGenbaDocx(entry: GenbaEntry): Promise<Blob> {
  const children: any[] = [];

  // Title Block
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "CHECKLIST GENBA HARIAN", bold: true, size: 28, color: "1E3A8A" }),
      ],
      spacing: { after: 80 },
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: formatDateIndonesian(entry.date), bold: true, size: 20, color: "475569" }),
      ],
      spacing: { after: 200 },
    })
  );

  // Budget gambar identik dengan versi sebelum refactor (max 20, tanpa
  // pembatasan "hanya item bercatatan") — supaya hasil export harian
  // TIDAK berubah sama sekali dibanding sebelum FR-7.
  const budget: EmbedBudget = {
    count: 0,
    max: MAX_TOTAL_EMBEDDED_IMAGES_DAILY,
    onlyEmbedForItemsWithNote: false,
  };
  children.push(...(await buildGenbaEntryBody(entry, budget)));

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Export mingguan: halaman ringkasan (rentang tanggal, total hari, rata-rata
 * % checklist selesai) diikuti satu section per hari, dipisah `PageBreak`.
 */
export async function generateGenbaWeeklyDocx(entries: GenbaEntry[]): Promise<Blob> {
  const children: any[] = [];

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const startDate = sortedEntries[0]?.date;
  const endDate = sortedEntries[sortedEntries.length - 1]?.date;

  // --- Halaman ringkasan ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "LAPORAN MINGGUAN CHECKLIST GENBA", bold: true, size: 28, color: "1E3A8A" }),
      ],
      spacing: { after: 80 },
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: startDate && endDate ? `${formatDateIndonesian(startDate)} — ${formatDateIndonesian(endDate)}` : "-",
          bold: true,
          size: 20,
          color: "475569",
        }),
      ],
      spacing: { after: 200 },
    })
  );

  const totalDays = sortedEntries.length;
  const avgPercent =
    totalDays > 0
      ? Math.round(sortedEntries.reduce((sum, e) => sum + computeDayCompletionPercent(e), 0) / totalDays)
      : 0;

  children.push(createLabelValueRow("Total Hari Tercatat", String(totalDays)));
  children.push(createLabelValueRow("Rata-rata Checklist Selesai per Hari", `${avgPercent}%`));
  children.push(new Paragraph({ text: "", spacing: { after: 120 } }));

  // Tabel ringkasan per hari
  const summaryRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", bold: true })] })],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Leader", bold: true })] })],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Checklist Selesai", bold: true })] })],
        }),
      ],
    }),
  ];
  sortedEntries.forEach((entry) => {
    summaryRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: formatDateIndonesian(entry.date) })] }),
          new TableCell({ children: [new Paragraph({ text: entry.leaderName || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: `${computeDayCompletionPercent(entry)}%` })] }),
        ],
      })
    );
  });
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: summaryRows }));

  // Hitung total foto di seluruh rentang untuk tentukan strategi embed.
  let totalAttachments = 0;
  sortedEntries.forEach((entry) => {
    entry.items.forEach((item) => {
      totalAttachments += (item.attachments || []).length;
    });
  });
  const onlyEmbedForItemsWithNote = totalAttachments > WEEKLY_PHOTO_RESTRICT_THRESHOLD;

  const budget: EmbedBudget = {
    count: 0,
    max: MAX_TOTAL_EMBEDDED_IMAGES_WEEKLY,
    onlyEmbedForItemsWithNote,
  };

  // --- Satu section per hari, dipisah PageBreak ---
  // Gotcha docx: PageBreak harus ada di dalam Paragraph.
  for (const entry of sortedEntries) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: formatDateIndonesian(entry.date), bold: true, size: 24, color: "1E3A8A" })],
        spacing: { after: 120 },
      })
    );
    children.push(...(await buildGenbaEntryBody(entry, budget)));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
