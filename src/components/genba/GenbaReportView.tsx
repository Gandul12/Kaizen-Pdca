"use client";

import React, { useState, useCallback } from "react";
import { GenbaEntry } from "@/types/genba";
import { generateGenbaDocx, generateGenbaWeeklyDocx, computeDayCompletionPercent } from "@/lib/genbaDocxExport";
import { exportElementToPdf, estimateGenbaImagesSize } from "@/lib/pdfExport";
import { groupGenbaItemsBySection } from "@/lib/genbaItemGrouping";
import { Toast } from "@/components/Toast";
import { FileSpreadsheet, Download, Loader2, AlertTriangle } from "lucide-react";

// Mode harian (perilaku lama, FR-5/FR-6): berikan `entry`.
// Mode mingguan (FR-7): berikan `entries` (+ opsional rangeStart/rangeEnd
// untuk penamaan file kalau rentang tanggal yang dipilih user tidak persis
// sama dengan tanggal entry pertama/terakhir yang punya data).
interface GenbaReportViewProps {
  entry?: GenbaEntry;
  entries?: GenbaEntry[];
  rangeStart?: string;
  rangeEnd?: string;
}

const DAY_NAMES_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES_ID_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatDateIndonesian(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  return `${DAY_NAMES_ID[dateObj.getDay()]}, ${d} ${MONTH_NAMES_ID_SHORT[m - 1]} ${y}`;
}

function statusIcon(status: string): string {
  if (status === "ok") return "✅";
  if (status === "ng") return "❌";
  return "⬜";
}

// Isi satu hari (header Leader/Line/Target + section jadwal + foto statis).
// Dipakai ulang baik untuk mode harian (satu instance) maupun tiap hari di
// mode mingguan (banyak instance, satu per direct-child <div>).
const GenbaDayContent: React.FC<{ entry: GenbaEntry; showBigTitle: boolean }> = ({ entry, showBigTitle }) => {
  return (
    <>
      <section className="border-b-4 border-slate-800 pb-4 text-center">
        {showBigTitle && (
          <div className="inline-block px-3 py-1 bg-indigo-900 text-white text-xs font-bold uppercase tracking-wider rounded mb-2">
            CHECKLIST GENBA HARIAN
          </div>
        )}
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          {formatDateIndonesian(entry.date)}
        </h1>
      </section>

      <section className="mt-4 border border-slate-300 rounded-lg overflow-hidden text-xs bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
          <div className="p-3 space-y-1">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">Leader</span>
            <p className="font-bold text-slate-900 text-sm">{entry.leaderName || "-"}</p>
          </div>
          <div className="p-3 space-y-1">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">Line / Area</span>
            <p className="font-semibold text-slate-800">{entry.lineName || "-"}</p>
          </div>
          <div className="p-3 space-y-1">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">Target Harian</span>
            <p className="font-semibold text-slate-800">{entry.dailyTarget || "-"}</p>
          </div>
        </div>
      </section>

      {groupGenbaItemsBySection(entry.items).map((section) => (
        <section key={section.sectionId} className="mt-6">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider">
            {section.sectionTitle}
          </div>

          <div className="mt-3 space-y-2 text-xs">
            {section.items.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none shrink-0">{statusIcon(item.status)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800">{item.point}</p>
                      <p className="text-slate-500">Standar: {item.standard}</p>
                      {item.actual && (
                        <p className={item.status === "ng" ? "text-rose-700 font-semibold mt-0.5" : "text-slate-700 mt-0.5"}>
                          Aktual: {item.actual}
                        </p>
                      )}
                      {item.note && (
                        <p className="text-slate-700 mt-1 italic">Catatan: {item.note}</p>
                      )}
                    </div>
                  </div>

                  {item.attachments && item.attachments.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                      {item.attachments.map((att) => (
                        <div key={att.id} className="border border-slate-200 rounded overflow-hidden bg-white">
                          <img
                            src={att.fileUrl}
                            alt={att.fileName || "Foto genba"}
                            className="h-20 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {item.correctiveAction && (
                    <div className="mt-1 bg-slate-100 rounded p-1.5">
                      <p className="text-slate-700">Akar Masalah: {item.correctiveAction.rootCause}</p>
                      <p className="text-slate-700">Tindakan: {item.correctiveAction.action}</p>
                      <p
                        className={
                          item.correctiveAction.status === "selesai"
                            ? "text-emerald-700 font-semibold"
                            : item.correctiveAction.status === "proses"
                            ? "text-amber-700 font-semibold"
                            : "text-slate-500 font-semibold"
                        }
                      >
                        Status: {item.correctiveAction.status}
                      </p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}
    </>
  );
};

export const GenbaReportView: React.FC<GenbaReportViewProps> = ({ entry, entries, rangeStart, rangeEnd }) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const isWeekly = Array.isArray(entries) && entries.length > 0;
  const sortedEntries = isWeekly ? [...(entries as GenbaEntry[])].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const weeklyStart = rangeStart || sortedEntries[0]?.date || "";
  const weeklyEnd = rangeEnd || sortedEntries[sortedEntries.length - 1]?.date || "";

  // Agregat estimasi ukuran foto — reuse estimateGenbaImagesSize per entry
  // (tanpa mengubah pdfExport.ts), dijumlah untuk mode mingguan.
  const imgInfo = isWeekly
    ? sortedEntries.reduce(
        (acc, e) => {
          const r = estimateGenbaImagesSize(e);
          return {
            totalBytes: acc.totalBytes + r.totalBytes,
            imageCount: acc.imageCount + r.imageCount,
          };
        },
        { totalBytes: 0, imageCount: 0 }
      )
    : null;
  const weeklyTotalMB = imgInfo ? Math.round((imgInfo.totalBytes / (1024 * 1024)) * 10) / 10 : 0;
  const weeklyExceedsLimit = imgInfo ? weeklyTotalMB > 15 || imgInfo.imageCount >= 10 : false;

  const singleImgInfo = !isWeekly && entry ? estimateGenbaImagesSize(entry) : null;

  const handleExportDocx = useCallback(async () => {
    setExportError(null);
    setIsExportingDocx(true);
    // Yield execution so UI updates loading state before running docx compilation
    await new Promise((r) => setTimeout(r, 60));

    try {
      let blob: Blob;
      let fileName: string;

      if (isWeekly) {
        blob = await generateGenbaWeeklyDocx(sortedEntries);
        fileName = `Genba-Mingguan-${weeklyStart}-${weeklyEnd}.docx`;
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
      console.error("Export Genba Word (.docx) error:", error);
      setExportError("Gagal export Word (.docx). Silakan coba lagi.");
    } finally {
      setIsExportingDocx(false);
    }
  }, [isWeekly, sortedEntries, weeklyStart, weeklyEnd, entry]);

  const handleExportPdf = useCallback(async () => {
    setExportError(null);

    // Pre-check for heavy images
    const exceedsLimit = isWeekly ? weeklyExceedsLimit : singleImgInfo?.exceedsLimit || false;
    const imageCount = isWeekly ? imgInfo?.imageCount || 0 : singleImgInfo?.imageCount || 0;
    const totalMB = isWeekly ? weeklyTotalMB : singleImgInfo?.totalMB || 0;

    if (exceedsLimit) {
      const confirmProceed = confirm(
        `Peringatan: Laporan ini memiliki ${imageCount} foto (estimasi ~${totalMB} MB).\n` +
        `Proses export PDF mungkin membutuhkan waktu atau memori besar pada perangkat dengan memori terbatas.\n\n` +
        `Apakah Anda ingin melanjutkan export PDF?`
      );
      if (!confirmProceed) return;
    }

    setIsExportingPdf(true);
    // Yield execution so UI updates loading state before running PDF capture
    await new Promise((r) => setTimeout(r, 120));

    try {
      if (isWeekly) {
        await exportElementToPdf("genba-weekly-printable-report", `Genba-Mingguan-${weeklyStart}-${weeklyEnd}.pdf`);
      } else if (entry) {
        await exportElementToPdf("genba-printable-report", `Genba-${entry.date}.pdf`);
      }
    } catch (error) {
      console.error("Export Genba PDF error:", error);
      setExportError("Gagal export PDF. Silakan coba lagi.");
    } finally {
      setIsExportingPdf(false);
    }
  }, [isWeekly, weeklyExceedsLimit, weeklyTotalMB, imgInfo, singleImgInfo, weeklyStart, weeklyEnd, entry]);

  if (!isWeekly && !entry) return null;

  const totalDays = sortedEntries.length;
  const avgPercent =
    totalDays > 0
      ? Math.round(sortedEntries.reduce((sum, e) => sum + computeDayCompletionPercent(e), 0) / totalDays)
      : 0;

  return (
    <div className="space-y-4">
      {exportError && (
        <Toast message={exportError} type="error" onClose={() => setExportError(null)} />
      )}

      {((isWeekly && weeklyExceedsLimit) || (!isWeekly && singleImgInfo?.exceedsLimit)) && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-amber-900 print:hidden shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Peringatan Ukuran Media:</strong> Laporan ini memiliki{" "}
            {isWeekly ? imgInfo?.imageCount : singleImgInfo?.imageCount} foto (estimasi ~
            {isWeekly ? weeklyTotalMB : singleImgInfo?.totalMB} MB). Proses export PDF pada perangkat
            seluler mungkin memerlukan waktu lebih lama.
          </span>
        </div>
      )}

      {/* ═══ Action bar (NOT captured in PDF) ═══ */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex flex-wrap items-center justify-end gap-2 print:hidden">
        <button
          onClick={handleExportDocx}
          disabled={isExportingDocx}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          {isExportingDocx ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          {isExportingDocx ? "Memproses..." : "Unduh DOCX"}
        </button>

        <button
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          {isExportingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExportingPdf ? "Memproses..." : "Unduh PDF"}
        </button>
      </div>

      {isWeekly ? (
        // ═══ Printable Weekly Report — tiap <div> direct child = satu hari,
        // supaya exportElementToPdf otomatis memisah tiap hari (dan
        // menyisipkan halaman baru kalau perlu) tanpa perlu diubah. ═══
        <div
          id="genba-weekly-printable-report"
          className="bg-white border-2 border-slate-300 rounded-xl p-8 shadow-lg max-w-4xl mx-auto text-slate-800 print:shadow-none print:border-none space-y-6"
        >
          <div className="border-b-4 border-slate-800 pb-4 text-center">
            <div className="inline-block px-3 py-1 bg-indigo-900 text-white text-xs font-bold uppercase tracking-wider rounded mb-2">
              LAPORAN MINGGUAN CHECKLIST GENBA
            </div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {weeklyStart && weeklyEnd
                ? `${formatDateIndonesian(weeklyStart)} — ${formatDateIndonesian(weeklyEnd)}`
                : "-"}
            </h1>
            <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-slate-600">
              <span>
                Total Hari Tercatat: <strong className="text-slate-900">{totalDays}</strong>
              </span>
              <span>
                Rata-rata Checklist Selesai: <strong className="text-slate-900">{avgPercent}%</strong>
              </span>
            </div>
          </div>

          {sortedEntries.map((dayEntry) => (
            <div key={dayEntry.id || dayEntry.date} className="pt-2">
              <GenbaDayContent entry={dayEntry} showBigTitle={false} />
            </div>
          ))}
        </div>
      ) : (
        entry && (
          // ═══ Printable Daily Report (perilaku lama, tidak berubah) ═══
          <div
            id="genba-printable-report"
            className="bg-white border-2 border-slate-300 rounded-xl p-8 shadow-lg max-w-4xl mx-auto text-slate-800 print:shadow-none print:border-none"
          >
            <GenbaDayContent entry={entry} showBigTitle={true} />
          </div>
        )
      )}
    </div>
  );
};
