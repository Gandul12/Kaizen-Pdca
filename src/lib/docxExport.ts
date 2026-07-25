import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  ImageRun,
  ShadingType,
} from "docx";
import { KaizenProject } from "@/types/kaizen";

async function imageUrlToBuffer(url: string): Promise<{ buffer: Uint8Array; extension: string } | null> {
  try {
    if (!url) return null;

    // Handle base64 data URLs (legacy)
    if (url.startsWith("data:")) {
      const parts = url.split(",");
      if (parts.length < 2) return null;
      const header = parts[0];
      const base64Data = parts[1];
      let extension = "png";
      if (header.includes("jpeg") || header.includes("jpg")) extension = "jpg";
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return { buffer: bytes, extension };
    }

    // Handle file URLs (/uploads/xxx.png)
    const fullUrl = url.startsWith("http") ? url : `${typeof window !== "undefined" ? window.location.origin : ""}${url}`;
    const resp = await fetch(fullUrl);
    if (!resp.ok) return null;
    const arrayBuf = await resp.arrayBuffer();
    const ext = url.split(".").pop()?.toLowerCase() || "png";
    const extension = (ext === "jpg" || ext === "jpeg") ? "jpg" : "png";
    return { buffer: new Uint8Array(arrayBuf), extension };
  } catch (e) {
    return null;
  }
}

function createLabelValueRow(label: string, value: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, color: "1E293B" }),
      new TextRun({ text: value || "-", color: "334155" }),
    ],
    spacing: { before: 60, after: 60 },
  });
}

export async function generateKaizenDocx(project: KaizenProject): Promise<Blob> {
  const { content, title, department, leader, teamMembers, startDate, dueDate, status } = project;
  const h = content.header || { title, department, leader, teamMembers, startDate, dueDate, status };
  const s1 = content.step1;
  const s2 = content.step2;
  const s3 = content.step3;
  const s4 = content.step4;
  const s56 = content.step5_6;
  const s7 = content.step7;
  const s8 = content.step8;

  const children: any[] = [];

  // Title Block
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "LEMBAR DOKUMENTASI PROYEK KAIZEN / IMPROVEMENT",
          bold: true,
          size: 28,
          color: "1E3A8A",
        }),
      ],
      spacing: { after: 80 },
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "METODE PDCA 8 LANGKAH (STANDAR MANUFAKTUR)",
          bold: true,
          size: 20,
          color: "475569",
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Header Metadata Table
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Tema Proyek", bold: true })] })],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: h.title || title || "-" })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Departemen / Area", bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ text: h.department || department || "-" })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Ketua Tim (PIC Utama)", bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ text: h.leader || leader || "-" })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Anggota Tim", bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ text: h.teamMembers || teamMembers || "-" })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Jadwal Waktu", bold: true })] })],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: `Mulai: ${h.startDate || "-"}   |   Target Selesai: ${h.dueDate || "-"}   |   Status: ${h.status || status}`,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(headerTable);
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // --- LANGKAH 1 ---
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "LANGKAH 1 — Problem Situation",
          bold: true,
          size: 24,
          color: "1E3A8A",
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  children.push(createLabelValueRow("Standar (Pedoman/Acuan)", s1?.standard || ""));
  children.push(createLabelValueRow("Situasi Terkini (Realita)", s1?.currentSituation || ""));
  children.push(createLabelValueRow("Perbedaan / Gap", s1?.gap || ""));
  children.push(createLabelValueRow("Terjadi Sejak / Frekuensi", s1?.sinceWhen || ""));
  children.push(createLabelValueRow("Dampak (Sebab Perlu Dianalisis)", s1?.impact || ""));

  if (s1?.images && s1.images.length > 0) {
    for (const img of s1.images) {
      const res = await imageUrlToBuffer(img.url);
      if (res) {
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: res.buffer,
                transformation: { width: 350, height: 200 },
                type: res.extension === "jpg" ? "jpg" : "png",
              }),
            ],
            spacing: { before: 100, after: 60 },
          })
        );
        if (img.caption) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `Foto: ${img.caption}`, italics: true, size: 18 })],
              spacing: { after: 100 },
            })
          );
        }
      }
    }
  }

  // --- LANGKAH 2 ---
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "LANGKAH 2 — Break Down the Problem",
          bold: true,
          size: 24,
          color: "1E3A8A",
        }),
      ],
      spacing: { before: 300, after: 100 },
    })
  );

  children.push(new Paragraph({ children: [new TextRun({ text: "Analisis Uraian Masalah (4W 1H):", bold: true })], spacing: { after: 60 } }));

  const w4Table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "WHAT", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "WHEN", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "WHERE", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "WHO", bold: true })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: s2?.fourWOneH?.what || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: s2?.fourWOneH?.when || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: s2?.fourWOneH?.where || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: s2?.fourWOneH?.who || "-" })] }),
        ],
      }),
    ],
  });
  children.push(w4Table);

  children.push(new Paragraph({ children: [new TextRun({ text: "Tabel Data Pendukung Masalah:", bold: true })], spacing: { before: 120, after: 60 } }));

  const suppRows = [
    new TableRow({
      children: [
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Area", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Kategori", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Detail / Model", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Kuantitas", bold: true })] })] }),
      ],
    }),
  ];

  if (s2?.supportingData && s2.supportingData.length > 0) {
    s2.supportingData.forEach((item) => {
      suppRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: item.area || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: item.eventDate || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: item.category || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: item.detailModel || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: item.quantity || "-" })] }),
          ],
        })
      );
    });
  } else {
    suppRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
        ],
      })
    );
  }
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: suppRows }));

  // --- LANGKAH 3 ---
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "LANGKAH 3 — Target Setting",
          bold: true,
          size: 24,
          color: "1E3A8A",
        }),
      ],
      spacing: { before: 300, after: 100 },
    })
  );

  children.push(new Paragraph({ children: [new TextRun({ text: "Prinsip SMART:", bold: true })], spacing: { after: 60 } }));

  const smartTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Specific", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Measurable", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Achievable", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Relevant", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Time-based", bold: true })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: s3?.smart?.specific || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: s3?.smart?.measurable || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: s3?.smart?.achievable || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: s3?.smart?.relevant || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: s3?.smart?.timeBased || "-" })] }),
        ],
      }),
    ],
  });
  children.push(smartTable);

  children.push(createLabelValueRow("Peningkatan (Aktivitas Utama)", s3?.improvement || ""));
  children.push(createLabelValueRow("Ditingkatkan Menjadi (Target Akhir Terukur)", s3?.targetValue || ""));
  children.push(createLabelValueRow("Tanggal Penyelesaian Target", s3?.completionDate || ""));
  children.push(createLabelValueRow("Tema Proyek (Kalimat Gabungan Target + Objek)", s3?.projectTheme || ""));

  // --- LANGKAH 4 ---
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "LANGKAH 4 — Cause Analysis",
          bold: true,
          size: 24,
          color: "1E3A8A",
        }),
      ],
      spacing: { before: 300, after: 100 },
    })
  );

  children.push(new Paragraph({ children: [new TextRun({ text: "4.1 Analisis Diagram Fishbone (5M + 1E):", bold: true })], spacing: { after: 60 } }));

  const fbTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Man", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Machine", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Method", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Material", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Environment", bold: true })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: s4?.fishbone?.man || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: s4?.fishbone?.machine || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: s4?.fishbone?.method || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: s4?.fishbone?.material || "-" })] }),
          new TableCell({ children: [new Paragraph({ text: s4?.fishbone?.environment || "-" })] }),
        ],
      }),
    ],
  });
  children.push(fbTable);

  if (s4?.fishboneImage) {
    const res = await imageUrlToBuffer(s4.fishboneImage);
    if (res) {
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: res.buffer,
              transformation: { width: 450, height: 220 },
              type: res.extension === "jpg" ? "jpg" : "png",
            }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  children.push(new Paragraph({ children: [new TextRun({ text: "4.2 Most Potential Causes (Penyebab Paling Potensial):", bold: true })], spacing: { before: 120, after: 60 } }));

  const potRows = [
    new TableRow({
      children: [
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Penyebab Potensial", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Metode Pengecekan", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Hasil Verifikasi", bold: true })] })] }),
      ],
    }),
  ];

  if (s4?.mostPotentialCauses && s4.mostPotentialCauses.length > 0) {
    s4.mostPotentialCauses.forEach((p) => {
      potRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: p.cause || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: p.checkMethod || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: p.result || "-" })] }),
          ],
        })
      );
    });
  } else {
    potRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
        ],
      })
    );
  }
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: potRows }));

  children.push(new Paragraph({ children: [new TextRun({ text: "4.3 Root Cause Analysis (5 Why):", bold: true })], spacing: { before: 120, after: 60 } }));
  children.push(createLabelValueRow("WHY 1", s4?.fiveWhys?.why1 || ""));
  children.push(createLabelValueRow("WHY 2", s4?.fiveWhys?.why2 || ""));
  children.push(createLabelValueRow("WHY 3", s4?.fiveWhys?.why3 || ""));
  if (s4?.fiveWhys?.why4) children.push(createLabelValueRow("WHY 4", s4.fiveWhys.why4));
  if (s4?.fiveWhys?.why5) children.push(createLabelValueRow("WHY 5", s4.fiveWhys.why5));
  children.push(createLabelValueRow("AKAR PERMASALAHAN (ROOT CAUSE)", s4?.fiveWhys?.rootCause || ""));

  // --- LANGKAH 5 & 6 ---
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "LANGKAH 5 & 6 — Countermeasure & Implementation",
          bold: true,
          size: 24,
          color: "1E3A8A",
        }),
      ],
      spacing: { before: 300, after: 100 },
    })
  );

  children.push(createLabelValueRow("Rencana Jangka Pendek (Short-term Action)", s56?.shortTermPlan || ""));
  children.push(createLabelValueRow("Rencana Jangka Panjang (Long-term Action)", s56?.longTermPlan || ""));

  children.push(new Paragraph({ children: [new TextRun({ text: "Tabel Detail Action Plan & Progress:", bold: true })], spacing: { before: 100, after: 60 } }));

  const actRows = [
    new TableRow({
      children: [
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Action Plan", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Area", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "PIC", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Target (ETC)", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Progress (%)", bold: true })] })] }),
      ],
    }),
  ];

  if (s56?.actionPlans && s56.actionPlans.length > 0) {
    s56.actionPlans.forEach((act) => {
      actRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: act.plan || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: act.area || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: act.pic || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: act.targetDate || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: `${act.progress ?? 0}%` })] }),
          ],
        })
      );
    });
  } else {
    actRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
        ],
      })
    );
  }
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: actRows }));

  // --- LANGKAH 7 ---
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "LANGKAH 7 — Follow Up & Evaluasi Hasil",
          bold: true,
          size: 24,
          color: "1E3A8A",
        }),
      ],
      spacing: { before: 300, after: 100 },
    })
  );

  children.push(createLabelValueRow("Cara Memeriksa", s7?.checkMethod || ""));
  children.push(createLabelValueRow("Kapan Harus Memeriksa", s7?.checkFrequency || ""));
  children.push(createLabelValueRow("Siapa yang Memeriksa", s7?.checkPic || ""));
  children.push(createLabelValueRow("Ringkasan Hasil Pengujian (Before vs After)", s7?.testResultSummary || ""));

  if (s7?.chartData && s7.chartData.length > 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Data Evaluasi Grafik (Poin Numerik):", bold: true })], spacing: { before: 80, after: 60 } }));
    const chartRows = [
      new TableRow({
        children: [
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Periode / Label", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Standar Target", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Sebelum (Before)", bold: true })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Sesudah (After)", bold: true })] })] }),
        ],
      }),
    ];
    s7.chartData.forEach((cd) => {
      chartRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: cd.label || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: String(cd.standard ?? "-") })] }),
            new TableCell({ children: [new Paragraph({ text: String(cd.before ?? "-") })] }),
            new TableCell({ children: [new Paragraph({ text: String(cd.after ?? "-") })] }),
          ],
        })
      );
    });
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: chartRows }));
  }

  if (s7?.chartImage) {
    const res = await imageUrlToBuffer(s7.chartImage);
    if (res) {
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: res.buffer,
              transformation: { width: 400, height: 200 },
              type: res.extension === "jpg" ? "jpg" : "png",
            }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  const decisionMap: Record<string, string> = {
    proliferasi: "1. Proliferasi / Standardisasi ke Area Lain (Horizontal Deployment)",
    monitoring: "2. Monitoring Berkelanjutan Saja",
    pdca_ulang: "3. Ulangi Siklus PDCA (Target Belum Tercapai)",
    eskalasi: "4. Eskalasi ke Management / Inisiasi Proyek Baru",
  };
  children.push(
    createLabelValueRow(
      "Keputusan Tindak Lanjut Standar",
      decisionMap[s7?.followUpDecision] || s7?.followUpDecision || "-"
    )
  );
  if (s7?.followUpNote) {
    children.push(createLabelValueRow("Catatan Tindak Lanjut", s7.followUpNote));
  }

  // --- LANGKAH 8 ---
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "LANGKAH 8 — Standardization",
          bold: true,
          size: 24,
          color: "1E3A8A",
        }),
      ],
      spacing: { before: 300, after: 100 },
    })
  );

  children.push(new Paragraph({ children: [new TextRun({ text: "Dokumen / SOP / Formulir yang Dibuat atau Direvisi:", bold: true })], spacing: { after: 60 } }));

  const docRows = [
    new TableRow({
      children: [
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Nomor Dokumen", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Nama SOP / Form", bold: true })] })] }),
        new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Status Revisi", bold: true })] })] }),
      ],
    }),
  ];

  if (s8?.documentsCreated && s8.documentsCreated.length > 0) {
    s8.documentsCreated.forEach((doc) => {
      docRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: doc.docNumber || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: doc.docName || "-" })] }),
            new TableCell({ children: [new Paragraph({ text: doc.status || "-" })] }),
          ],
        })
      );
    });
  } else {
    docRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
          new TableCell({ children: [new Paragraph({ text: "-" })] }),
        ],
      })
    );
  }
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: docRows }));

  children.push(createLabelValueRow("Kondisi Sebelum Standardisasi", s8?.beforeCondition || ""));
  children.push(createLabelValueRow("Kondisi Sesudah Standardisasi", s8?.afterCondition || ""));

  if (s8?.beforeUrl) {
    const res = await imageUrlToBuffer(s8.beforeUrl);
    if (res) {
      children.push(new Paragraph({ children: [new TextRun({ text: "Foto Sebelum:", bold: true })], spacing: { before: 60 } }));
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: res.buffer,
              transformation: { width: 250, height: 160 },
              type: res.extension === "jpg" ? "jpg" : "png",
            }),
          ],
        })
      );
    }
  }

  if (s8?.afterUrl) {
    const res = await imageUrlToBuffer(s8.afterUrl);
    if (res) {
      children.push(new Paragraph({ children: [new TextRun({ text: "Foto Sesudah:", bold: true })], spacing: { before: 60 } }));
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: res.buffer,
              transformation: { width: 250, height: 160 },
              type: res.extension === "jpg" ? "jpg" : "png",
            }),
          ],
        })
      );
    }
  }

  children.push(createLabelValueRow("PIC Pemeliharaan Standar", s8?.maintenancePic || ""));
  children.push(createLabelValueRow("Tanggal Efektif Standar Baru", s8?.effectiveDate || ""));

  if (s8?.attachments && s8.attachments.length > 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Lampiran Dokumen Pendukung:", bold: true })], spacing: { before: 100, after: 60 } }));
    s8.attachments.forEach((att, idx) => {
      children.push(new Paragraph({ text: `${idx + 1}. ${att.fileName || "Lampiran"}` }));
    });
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
