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
import type { GenbaEntry } from "@/types/genba";
import { imageUrlToBuffer } from "@/lib/docxImageHelper";
import { groupGenbaItemsBySection } from "@/lib/genbaItemGrouping";

// Batasi jumlah foto yang di-embed langsung ke dokumen supaya ukuran file
// tidak membengkak kalau temuan hari itu punya banyak foto.
const MAX_EMBEDDED_PHOTOS = 20;

const STATUS_LABEL: Record<string, string> = {
  pending: "Belum Dicek",
  ok: "OK",
  ng: "NG",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "94A3B8",
  ok: "059669",
  ng: "E11D48",
};

// Warna status Tindak Lanjut (corrective action) — konsisten dengan UI (abu-abu/amber/emerald)
const CORRECTIVE_STATUS_LABEL: Record<string, string> = {
  belum: "Belum",
  proses: "Proses",
  selesai: "Selesai",
};

const CORRECTIVE_STATUS_COLOR: Record<string, string> = {
  belum: "94A3B8",
  proses: "D97706",
  selesai: "059669",
};

// Baris tambahan "Akar Masalah / Tindakan / Status" di bawah baris item —
// di luar cell tabel utama (colSpan penuh), hanya muncul kalau item punya
// correctiveAction. Dipakai di export harian maupun mingguan.
function buildCorrectiveActionRow(item: { correctiveAction?: { rootCause: string; action: string; status: string } }): TableRow | null {
  const ca = item.correctiveAction;
  if (!ca) return null;

  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 4,
        shading: { fill: "FEF3C7", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Tindak Lanjut  ", bold: true, size: 17, color: "92400E" }),
              new TextRun({
                text: CORRECTIVE_STATUS_LABEL[ca.status] || ca.status,
                bold: true,
                size: 17,
                color: CORRECTIVE_STATUS_COLOR[ca.status] || "334155",
              }),
            ],
            spacing: { after: 30 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Akar Masalah: ", bold: true, size: 17, color: "78350F" }),
              new TextRun({ text: ca.rootCause || "-", size: 17, color: "78350F" }),
            ],
            spacing: { after: 20 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tindakan: ", bold: true, size: 17, color: "78350F" }),
              new TextRun({ text: ca.action || "-", size: 17, color: "78350F" }),
            ],
          }),
        ],
      }),
    ],
  });
}

function formatEndTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fmtDateHuman(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export async function generateGenbaDocx(entry: GenbaEntry): Promise<Blob> {
  const children: any[] = [];

  // --- Judul + tanggal ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "CHECKLIST GENBA HARIAN", bold: true, size: 28, color: "1E3A8A" })],
      spacing: { after: 80 },
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: fmtDateHuman(entry.date), bold: true, size: 20, color: "475569" })],
      spacing: { after: 200 },
    })
  );

  // --- Info Leader/Line/Target ---
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Line Leader", bold: true })] })],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: entry.leaderName || "-" })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Nama Line", bold: true })] })],
          }),
          new TableCell({ children: [new Paragraph({ text: entry.lineName || "-" })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Target Harian", bold: true })] })],
          }),
          new TableCell({ children: [new Paragraph({ text: entry.dailyTarget || "-" })] }),
        ],
      }),
    ],
  });
  children.push(headerTable);
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // --- Tabel Jadwal (Jam / Status / Point+Standar+Aktual / Catatan) ---
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "JADWAL & TEMUAN", bold: true, size: 24, color: "1E3A8A" })],
      spacing: { before: 100, after: 100 },
    })
  );

  const scheduleRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Jam", bold: true })] })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })],
        }),
        new TableCell({
          width: { size: 48, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Point / Standar / Aktual", bold: true })] })],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Catatan", bold: true })] })],
        }),
      ],
    }),
  ];

  const sections = groupGenbaItemsBySection(entry.items);
  for (const section of sections) {
    scheduleRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            shading: { fill: "CBD5E1", type: ShadingType.CLEAR },
            children: [
              new Paragraph({ children: [new TextRun({ text: section.sectionTitle.toUpperCase(), bold: true, size: 18 })] }),
            ],
          }),
        ],
      })
    );

    for (const item of section.items) {
      scheduleRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: formatEndTime(item.endMinutes) })] }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: STATUS_LABEL[item.status] || item.status,
                      bold: true,
                      color: STATUS_COLOR[item.status] || "334155",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: item.point, bold: true })] }),
                new Paragraph({
                  children: [new TextRun({ text: `Standar: ${item.standard}`, size: 18, color: "64748B" })],
                }),
                ...(item.actual
                  ? [new Paragraph({ children: [new TextRun({ text: `Aktual: ${item.actual}`, size: 18 })] })]
                  : []),
              ],
            }),
            new TableCell({ children: [new Paragraph({ text: item.note || "-" })] }),
          ],
        })
      );

      const correctiveRow = buildCorrectiveActionRow(item);
      if (correctiveRow) scheduleRows.push(correctiveRow);
    }
  }

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: scheduleRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // --- Dokumentasi foto — DI LUAR cell tabel supaya layout tidak pecah ---
  const itemsWithPhotos = entry.items.filter((it) => it.attachments && it.attachments.length > 0);
  const totalPhotos = itemsWithPhotos.reduce((sum, it) => sum + it.attachments.length, 0);

  if (itemsWithPhotos.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "DOKUMENTASI FOTO", bold: true, size: 24, color: "1E3A8A" })],
        spacing: { before: 100, after: 100 },
      })
    );

    if (totalPhotos > MAX_EMBEDDED_PHOTOS) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Dokumen ini memiliki ${totalPhotos} foto. Untuk menjaga ukuran file, hanya ${MAX_EMBEDDED_PHOTOS} foto pertama yang disertakan.`,
              italics: true,
              size: 18,
              color: "94A3B8",
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    let embeddedCount = 0;
    for (const item of itemsWithPhotos) {
      if (embeddedCount >= MAX_EMBEDDED_PHOTOS) break;

      children.push(
        new Paragraph({
          children: [new TextRun({ text: item.point, bold: true, size: 20 })],
          spacing: { before: 120, after: 60 },
        })
      );

      for (const att of item.attachments) {
        if (embeddedCount >= MAX_EMBEDDED_PHOTOS) break;
        const res = await imageUrlToBuffer(att.fileUrl);
        if (res) {
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: res.buffer,
                  transformation: { width: 400, height: 260 },
                  type: res.extension === "jpg" ? "jpg" : "png",
                }),
              ],
              spacing: { after: 100 },
            })
          );
          embeddedCount++;
        }
      }
    }
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

// ═══════════════════════════════════════════════════════════════════════
// Export mingguan (FR-7) — perluasan, TIDAK memanggil/mengubah
// generateGenbaDocx di atas. Sengaja sedikit duplikasi struktur tabel per
// hari supaya export harian yang sudah ada nol risiko regresi.
// ═══════════════════════════════════════════════════════════════════════

// Ambang jumlah foto se-rentang laporan: di atas ini, hanya foto pada item
// yang punya catatan yang di-embed; sisanya jadi daftar link teks.
const WEEKLY_PHOTO_THRESHOLD = 15;

function createSummaryLine(label: string, value: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, color: "1E293B" }),
      new TextRun({ text: value, color: "334155" }),
    ],
    spacing: { before: 60, after: 60 },
  });
}

// Bangun children docx untuk SATU hari (dipakai berulang di dalam laporan
// mingguan). embedAllPhotos=false berarti hanya foto pada item yang punya
// catatan yang di-embed; sisanya ditulis sebagai daftar link teks.
async function buildWeeklyDaySectionChildren(
  entry: GenbaEntry,
  embedAllPhotos: boolean,
  embedCounter: { count: number }
): Promise<any[]> {
  const children: any[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: fmtDateHuman(entry.date), bold: true, size: 24, color: "1E3A8A" })],
      spacing: { after: 150 },
    })
  );

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Line Leader", bold: true })] })],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: entry.leaderName || "-" })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Nama Line", bold: true })] })],
          }),
          new TableCell({ children: [new Paragraph({ text: entry.lineName || "-" })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Target Harian", bold: true })] })],
          }),
          new TableCell({ children: [new Paragraph({ text: entry.dailyTarget || "-" })] }),
        ],
      }),
    ],
  });
  children.push(headerTable);
  children.push(new Paragraph({ text: "", spacing: { after: 150 } }));

  const scheduleRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Jam", bold: true })] })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })],
        }),
        new TableCell({
          width: { size: 48, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Point / Standar / Aktual", bold: true })] })],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Catatan", bold: true })] })],
        }),
      ],
    }),
  ];

  const sections = groupGenbaItemsBySection(entry.items);
  for (const section of sections) {
    scheduleRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            shading: { fill: "CBD5E1", type: ShadingType.CLEAR },
            children: [
              new Paragraph({ children: [new TextRun({ text: section.sectionTitle.toUpperCase(), bold: true, size: 18 })] }),
            ],
          }),
        ],
      })
    );

    for (const item of section.items) {
      scheduleRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: formatEndTime(item.endMinutes) })] }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: STATUS_LABEL[item.status] || item.status,
                      bold: true,
                      color: STATUS_COLOR[item.status] || "334155",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: item.point, bold: true })] }),
                new Paragraph({
                  children: [new TextRun({ text: `Standar: ${item.standard}`, size: 18, color: "64748B" })],
                }),
                ...(item.actual
                  ? [new Paragraph({ children: [new TextRun({ text: `Aktual: ${item.actual}`, size: 18 })] })]
                  : []),
              ],
            }),
            new TableCell({ children: [new Paragraph({ text: item.note || "-" })] }),
          ],
        })
      );

      const correctiveRow = buildCorrectiveActionRow(item);
      if (correctiveRow) scheduleRows.push(correctiveRow);
    }
  }

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: scheduleRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 150 } }));

  // --- Foto hari ini: embed penuh, atau hanya item yang punya catatan ---
  const itemsWithPhotos = entry.items.filter((it) => it.attachments && it.attachments.length > 0);
  if (itemsWithPhotos.length > 0) {
    const linkOnlyLines: string[] = [];
    const itemsToEmbed = itemsWithPhotos.filter((it) => embedAllPhotos || !!it.note?.trim());
    const itemsLinkOnly = itemsWithPhotos.filter((it) => !embedAllPhotos && !it.note?.trim());

    if (itemsToEmbed.length > 0 || itemsLinkOnly.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "DOKUMENTASI FOTO", bold: true, size: 24, color: "1E3A8A" })],
          spacing: { before: 100, after: 100 },
        })
      );
    }

    for (const item of itemsToEmbed) {
      if (embedCounter.count >= MAX_EMBEDDED_PHOTOS) {
        // Kuota embed global sudah habis — sisanya jadi link juga.
        item.attachments.forEach((att) => linkOnlyLines.push(`${item.point}: ${att.fileUrl}`));
        continue;
      }

      children.push(
        new Paragraph({
          children: [new TextRun({ text: item.point, bold: true, size: 20 })],
          spacing: { before: 120, after: 60 },
        })
      );

      for (const att of item.attachments) {
        if (embedCounter.count >= MAX_EMBEDDED_PHOTOS) {
          linkOnlyLines.push(`${item.point}: ${att.fileUrl}`);
          continue;
        }
        const res = await imageUrlToBuffer(att.fileUrl);
        if (res) {
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: res.buffer,
                  transformation: { width: 400, height: 260 },
                  type: res.extension === "jpg" ? "jpg" : "png",
                }),
              ],
              spacing: { after: 100 },
            })
          );
          embedCounter.count++;
        }
      }
    }

    for (const item of itemsLinkOnly) {
      item.attachments.forEach((att) => linkOnlyLines.push(`${item.point}: ${att.fileUrl}`));
    }

    if (linkOnlyLines.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Foto lain (tidak di-embed untuk menjaga ukuran file) — link berikut:",
              italics: true,
              size: 18,
              color: "94A3B8",
            }),
          ],
          spacing: { before: 60, after: 40 },
        })
      );
      linkOnlyLines.forEach((line) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${line}`, size: 18, color: "475569" })],
            spacing: { after: 20 },
          })
        );
      });
    }
  }

  return children;
}

export async function generateGenbaWeeklyDocx(entries: GenbaEntry[]): Promise<Blob> {
  if (!entries || entries.length === 0) {
    throw new Error("Tidak ada data genba pada rentang tanggal yang dipilih.");
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const startDate = sorted[0].date;
  const endDate = sorted[sorted.length - 1].date;

  const dayStats = sorted.map((entry) => {
    const total = entry.items.length;
    const done = entry.items.filter((it) => it.status !== "pending").length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { date: entry.date, total, done, percent };
  });
  const avgPercent =
    dayStats.length > 0
      ? Math.round(dayStats.reduce((sum, d) => sum + d.percent, 0) / dayStats.length)
      : 0;

  const totalPhotos = sorted.reduce(
    (sum, entry) => sum + entry.items.reduce((s, it) => s + (it.attachments?.length || 0), 0),
    0
  );
  const embedAllPhotos = totalPhotos <= WEEKLY_PHOTO_THRESHOLD;

  // Hitungan item dengan corrective action, dipecah per status.
  const correctiveCounts = { belum: 0, proses: 0, selesai: 0 };
  let correctiveTotal = 0;
  sorted.forEach((e) => {
    e.items.forEach((it) => {
      if (it.correctiveAction) {
        correctiveTotal++;
        const st = it.correctiveAction.status as keyof typeof correctiveCounts;
        if (correctiveCounts[st] !== undefined) correctiveCounts[st]++;
      }
    });
  });

  const children: any[] = [];

  // --- Halaman ringkasan ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "LAPORAN MINGGUAN GENBA HARIAN", bold: true, size: 28, color: "1E3A8A" })],
      spacing: { after: 80 },
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${fmtDateHuman(startDate)} — ${fmtDateHuman(endDate)}`,
          bold: true,
          size: 20,
          color: "475569",
        }),
      ],
      spacing: { after: 200 },
    })
  );

  children.push(createSummaryLine("Total Hari Tercatat", `${sorted.length} hari`));
  children.push(createSummaryLine("Rata-rata Checklist Selesai", `${avgPercent}%`));
  if (correctiveTotal > 0) {
    children.push(
      createSummaryLine(
        "Item dengan Tindak Lanjut",
        `${correctiveTotal} item (Belum: ${correctiveCounts.belum}, Proses: ${correctiveCounts.proses}, Selesai: ${correctiveCounts.selesai})`
      )
    );
  }
  children.push(new Paragraph({ text: "", spacing: { after: 100 } }));

  const summaryRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", bold: true })] })],
        }),
        new TableCell({
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Selesai", bold: true })] })],
        }),
        new TableCell({
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Persentase", bold: true })] })],
        }),
      ],
    }),
  ];
  dayStats.forEach((d) => {
    summaryRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: fmtDateHuman(d.date) })] }),
          new TableCell({ children: [new Paragraph({ text: `${d.done}/${d.total}` })] }),
          new TableCell({ children: [new Paragraph({ text: `${d.percent}%` })] }),
        ],
      })
    );
  });
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: summaryRows }));

  // --- Tiap hari sebagai section terpisah, dipisah PageBreak ---
  const embedCounter = { count: 0 };
  for (const entry of sorted) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    const dayChildren = await buildWeeklyDaySectionChildren(entry, embedAllPhotos, embedCounter);
    children.push(...dayChildren);
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
