"use client";

import React, { useState, useCallback } from "react";
import type { GenbaEntry, GenbaItem } from "@/types/genba";
import { generateGenbaDocx, generateGenbaWeeklyDocx } from "@/lib/genbaDocxExport";
import { exportElementToPdf, estimateGenbaImagesSize } from "@/lib/pdfExport";
import { groupGenbaItemsBySection } from "@/lib/genbaItemGrouping";
import { Toast } from "@/components/Toast";
import { Eye, FileSpreadsheet, Download, Loader2, AlertTriangle, CheckSquare, XSquare, Square } from "lucide-react";

interface GenbaReportViewProps {
  entry?: GenbaEntry;
  entries?: GenbaEntry[];
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

function formatEndTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Ikon status STATIS (tanpa tombol interaktif) — dipakai di elemen printable.
function StaticStatusIcon({ status }: { status: GenbaItem["status"] }) {
  if (status === "ok") return <CheckSquare className="w-4 h-4 text-emerald-600" />;
  if (status === "ng") return <XSquare className="w-4 h-4 text-rose-600" />;
  return <Square className="w-4 h-4 text-slate-300" />;
}

// Warna status Tindak Lanjut (corrective action) — konsisten dengan UI GenbaItemRow & DOCX.
const CORRECTIVE_STATUS_META: Record<string, { label: string; textClass: string }> = {
  belum: { label: "Belum", textClass: "text-slate-500" },
  proses: { label: "Proses", textClass: "text-amber-600" },
  selesai: { label: "Selesai", textClass: "text-emerald-600" },
};

// Estimasi ukuran foto — daftar entries (mingguan) atau satu entry (harian).
function estimateImages(entry?: GenbaEntry, entries?: GenbaEntry[]) {
  if (entries && entries.length > 0) {
    let totalBytes = 0;
    let imageCount = 0;
    entries.forEach((e) => {
      const r = estimateGenbaImagesSize(e);
      totalBytes += r.totalBytes;
      imageCount += r.imageCount;
    });
    const totalMB = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
    return { totalBytes, totalMB, exceedsLimit: totalMB > 15 || imageCount >= 10, imageCount };
  }
  if (entry) return estimateGenbaImagesSize(entry);
  return { totalBytes: 0, totalMB: 0, exceedsLimit: false, imageCount: 0 };
}

// Blok statis satu hari (judul, info, tabel jadwal, foto) — dipakai untuk
// mode harian (langsung di dalam #genba-printable-report) maupun diulang
// per hari di dalam mode mingguan (#genba-weekly-printable-report).
function DayPrintableBlock({ entry }: { entry: GenbaEntry }) {
  const doneCount = entry.items.filter((it) => it.status !== "pending").length;
  const sections = groupGenbaItemsBySection(entry.items);
  const itemsWithPhotos = entry.items.filter((it) => it.attachments && it.attachments.length > 0);

  return (
    <>
      <section className="border-b-4 border-slate-800 pb-5 text-center">
        <div className="inline-block px-3 py-1 bg-indigo-900 text-white text-xs font-bold uppercase tracking-wider rounded mb-2">
          CHECKLIST GENBA HARIAN
        </div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{fmtDateHuman(entry.date)}</h1>
      </section>

      <section className="mt-6 border border-slate-300 rounded-lg overflow-hidden text-xs bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
          <div className="p-3 space-y-1">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">Line Leader</span>
            <p className="font-bold text-slate-900 text-sm">{entry.leaderName || "-"}</p>
          </div>
          <div className="p-3 space-y-1">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">Nama Line</span>
            <p className="font-semibold text-slate-800">{entry.lineName || "-"}</p>
          </div>
          <div className="p-3 space-y-1">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">Target Harian</span>
            <p className="font-semibold text-slate-800">{entry.dailyTarget || "-"}</p>
          </div>
        </div>
        <div className="border-t border-slate-300 px-3 py-2 bg-slate-100 font-medium text-slate-600">
          {doneCount}/{entry.items.length} poin checklist sudah dicek
        </div>
      </section>

      <section className="mt-8">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider">
          Jadwal &amp; Temuan
        </div>
        <table className="w-full text-xs mt-3 border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase text-[10px]">
              <th className="border border-slate-200 p-2 text-left w-16">Jam</th>
              <th className="border border-slate-200 p-2 text-left w-14">Status</th>
              <th className="border border-slate-200 p-2 text-left">Point / Standar / Aktual</th>
              <th className="border border-slate-200 p-2 text-left">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <React.Fragment key={section.sectionId}>
                <tr>
                  <td colSpan={4} className="border border-slate-200 bg-slate-300 font-bold text-slate-800 p-1.5 text-[10px] uppercase">
                    {section.sectionTitle}
                  </td>
                </tr>
                {section.items.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="align-top">
                      <td className="border border-slate-200 p-2 font-mono">{formatEndTime(item.endMinutes)}</td>
                      <td className="border border-slate-200 p-2">
                        <StaticStatusIcon status={item.status} />
                      </td>
                      <td className="border border-slate-200 p-2">
                        <p className="font-semibold text-slate-900">{item.point}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Standar: {item.standard}</p>
                        {item.actual && <p className="text-slate-700 text-[11px] mt-0.5">Aktual: {item.actual}</p>}
                      </td>
                      <td className="border border-slate-200 p-2 text-slate-700">{item.note || "-"}</td>
                    </tr>
                    {item.correctiveAction && (
                      <tr>
                        <td colSpan={4} className="border border-slate-200 bg-amber-50 p-2">
                          <p className="text-[11px] font-bold text-amber-800">
                            Tindak Lanjut —{" "}
                            <span className={CORRECTIVE_STATUS_META[item.correctiveAction.status]?.textClass || "text-slate-600"}>
                              {CORRECTIVE_STATUS_META[item.correctiveAction.status]?.label || item.correctiveAction.status}
                            </span>
                          </p>
                          <p className="text-[11px] text-amber-900 mt-0.5">
                            <span className="font-semibold">Akar Masalah:</span> {item.correctiveAction.rootCause || "-"}
                          </p>
                          <p className="text-[11px] text-amber-900 mt-0.5">
                            <span className="font-semibold">Tindakan:</span> {item.correctiveAction.action || "-"}
                          </p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </section>

      {itemsWithPhotos.length > 0 && (
        <section className="mt-8">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider">
            Dokumentasi Foto
          </div>
          <div className="mt-3 space-y-4">
            {itemsWithPhotos.map((item) => (
              <div key={item.id}>
                <p className="text-xs font-bold text-slate-700 mb-1.5">{item.point}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {item.attachments.map((att) => (
                    <img
                      key={att.id}
                      src={att.fileUrl}
                      alt={att.fileName}
                      className="w-full aspect-square object-cover rounded-lg border border-slate-200"
                      crossOrigin="anonymous"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export const GenbaReportView: React.FC<GenbaReportViewProps> = ({ entry, entries }) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const isWeeklyRequested = entries !== undefined;
  const hasWeeklyData = !!entries && entries.length > 0;
  const isWeekly = isWeeklyRequested && hasWeeklyData;

  const imgInfo = estimateImages(entry, entries);

  const handleExportDocx = useCallback(async () => {
    setExportError(null);

    if (isWeeklyRequested && !hasWeeklyData) {
      setExportError("Tidak ada data genba pada rentang tanggal yang dipilih.");
      return;
    }

    setIsExportingDocx(true);
    // Yield execution supaya UI sempat update loading state sebelum compile docx
    await new Promise((r) => setTimeout(r, 60));

    try {
      let blob: Blob;
      let fileName: string;

      if (isWeekly && entries) {
        const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
        blob = await generateGenbaWeeklyDocx(entries);
        fileName = `Genba-Mingguan-${sorted[0].date}_${sorted[sorted.length - 1].date}.docx`;
      } else if (entry) {
        blob = await generateGenbaDocx(entry);
        fileName = `Genba-${entry.date}.docx`;
      } else {
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Export Word (.docx) genba error:", error);
      setExportError("Gagal export Word (.docx). Silakan coba lagi.");
    } finally {
      setIsExportingDocx(false);
    }
  }, [entry, entries, isWeekly, isWeeklyRequested, hasWeeklyData]);

  const handleExportPdf = useCallback(async () => {
    setExportError(null);

    if (isWeeklyRequested && !hasWeeklyData) {
      setExportError("Tidak ada data genba pada rentang tanggal yang dipilih.");
      return;
    }

    // Pre-check foto berat
    const imgData = estimateImages(entry, entries);
    if (imgData.exceedsLimit) {
      const confirmProceed = confirm(
        `Peringatan: Laporan ini memiliki ${imgData.imageCount} foto (estimasi ~${imgData.totalMB} MB).\n` +
        `Proses export PDF mungkin membutuhkan waktu atau memori besar pada perangkat dengan memori terbatas.\n\n` +
        `Apakah Anda ingin melanjutkan export PDF?`
      );
      if (!confirmProceed) return;
    }

    setIsExportingPdf(true);
    // Yield execution supaya UI sempat update loading state sebelum capture PDF
    await new Promise((r) => setTimeout(r, 120));

    try {
      if (isWeekly && entries) {
        const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
        await exportElementToPdf(
          "genba-weekly-printable-report",
          `Genba-Mingguan-${sorted[0].date}_${sorted[sorted.length - 1].date}.pdf`
        );
      } else if (entry) {
        await exportElementToPdf("genba-printable-report", `Genba-${entry.date}.pdf`);
      }
    } catch (error) {
      console.error("Export PDF genba error:", error);
      setExportError("Gagal export PDF. Silakan coba lagi.");
    } finally {
      setIsExportingPdf(false);
    }
  }, [entry, entries, isWeekly, isWeeklyRequested, hasWeeklyData]);

  // Rentang mingguan dipilih tapi tidak ada data — pesan jelas, bukan export kosong.
  if (isWeeklyRequested && !hasWeeklyData) {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-center text-sm text-amber-900">
        Tidak ada data genba pada rentang tanggal yang dipilih. Coba pilih rentang tanggal lain.
      </div>
    );
  }

  if (!isWeekly && !entry) {
    return null;
  }

  const sortedEntries = entries ? [...entries].sort((a, b) => a.date.localeCompare(b.date)) : [];

  return (
    <div className="space-y-4">
      {exportError && <Toast message={exportError} type="error" onClose={() => setExportError(null)} />}

      {imgInfo.exceedsLimit && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-amber-900 print:hidden shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Peringatan Ukuran Media:</strong> Laporan ini memiliki {imgInfo.imageCount} foto (estimasi ~{imgInfo.totalMB} MB).
            Proses export PDF pada perangkat seluler mungkin memerlukan waktu lebih lama.
          </span>
        </div>
      )}

      {/* Action bar — tidak ikut ter-capture PDF */}
      <div className="bg-[#101f36] p-4 rounded-2xl shadow-xl border border-[#8fa3bd]/16 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#1fb6a8]" />
          <h2 className="font-display font-extrabold text-white text-lg tracking-wide">
            {isWeekly ? "Pratinjau Laporan Genba Mingguan" : "Pratinjau Laporan Genba Harian"}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            {isExportingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            {isExportingDocx ? "Memproses..." : "Export Word (.docx)"}
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExportingPdf ? "Memproses..." : "Unduh PDF"}
          </button>
        </div>
      </div>

      {isWeekly ? (
        /* ═══ Elemen Printable Mingguan — ringkasan + satu <div> per hari sebagai direct child ═══ */
        <div
          id="genba-weekly-printable-report"
          className="bg-white border-2 border-slate-300 rounded-xl p-8 shadow-lg max-w-4xl mx-auto text-slate-800 print:shadow-none print:border-none"
        >
          <div>
            <section className="border-b-4 border-slate-800 pb-5 text-center">
              <div className="inline-block px-3 py-1 bg-indigo-900 text-white text-xs font-bold uppercase tracking-wider rounded mb-2">
                LAPORAN MINGGUAN GENBA HARIAN
              </div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {fmtDateHuman(sortedEntries[0].date)} — {fmtDateHuman(sortedEntries[sortedEntries.length - 1].date)}
              </h1>
            </section>

            <section className="mt-6">
              {(() => {
                const dayStats = sortedEntries.map((e) => {
                  const total = e.items.length;
                  const done = e.items.filter((it) => it.status !== "pending").length;
                  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                  return { date: e.date, total, done, percent };
                });
                const avgPercent =
                  dayStats.length > 0
                    ? Math.round(dayStats.reduce((sum, d) => sum + d.percent, 0) / dayStats.length)
                    : 0;

                const correctiveCounts = { belum: 0, proses: 0, selesai: 0 };
                let correctiveTotal = 0;
                sortedEntries.forEach((e) => {
                  e.items.forEach((it) => {
                    if (it.correctiveAction) {
                      correctiveTotal++;
                      const st = it.correctiveAction.status as keyof typeof correctiveCounts;
                      if (correctiveCounts[st] !== undefined) correctiveCounts[st]++;
                    }
                  });
                });

                return (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                        <span className="font-bold text-slate-500 block uppercase text-[10px]">Total Hari Tercatat</span>
                        <p className="font-black text-slate-900 text-lg">{sortedEntries.length} hari</p>
                      </div>
                      <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                        <span className="font-bold text-slate-500 block uppercase text-[10px]">Rata-rata Selesai</span>
                        <p className="font-black text-slate-900 text-lg">{avgPercent}%</p>
                      </div>
                    </div>
                    {correctiveTotal > 0 && (
                      <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-xs mb-3">
                        <span className="font-bold text-amber-700 block uppercase text-[10px] mb-1">
                          Item dengan Tindak Lanjut ({correctiveTotal})
                        </span>
                        <div className="flex gap-4 text-amber-900">
                          <span><span className="font-bold">{correctiveCounts.belum}</span> Belum</span>
                          <span><span className="font-bold">{correctiveCounts.proses}</span> Proses</span>
                          <span><span className="font-bold">{correctiveCounts.selesai}</span> Selesai</span>
                        </div>
                      </div>
                    )}
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                          <th className="border border-slate-200 p-2 text-left">Tanggal</th>
                          <th className="border border-slate-200 p-2 text-left">Selesai</th>
                          <th className="border border-slate-200 p-2 text-left">Persentase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayStats.map((d) => (
                          <tr key={d.date}>
                            <td className="border border-slate-200 p-2">{fmtDateHuman(d.date)}</td>
                            <td className="border border-slate-200 p-2">{d.done}/{d.total}</td>
                            <td className="border border-slate-200 p-2">{d.percent}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                );
              })()}
            </section>
          </div>

          {sortedEntries.map((e) => (
            <div key={e.id || e.date} className="mt-10 pt-10 border-t-2 border-dashed border-slate-300">
              <DayPrintableBlock entry={e} />
            </div>
          ))}
        </div>
      ) : (
        entry && (
          /* ═══ Elemen Printable Harian ═══ */
          <div
            id="genba-printable-report"
            className="bg-white border-2 border-slate-300 rounded-xl p-8 shadow-lg max-w-4xl mx-auto text-slate-800 print:shadow-none print:border-none"
          >
            <DayPrintableBlock entry={entry} />
          </div>
        )
      )}
    </div>
  );
};
