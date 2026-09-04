"use client";

import React, { useState, useCallback } from "react";
import { KaizenProject } from "@/types/kaizen";
import { generateKaizenDocx } from "@/lib/docxExport";
import { exportElementToPdf, estimateTotalImagesSize } from "@/lib/pdfExport";
import { Toast } from "@/components/Toast";
import { FishboneDiagramView } from "@/components/FishboneDiagramView";
import { PptxExportModal } from "@/components/PptxExportModal";
import { generateChartInsight } from "@/lib/chartInsight";
import {
  FileText,
  Download,
  FileSpreadsheet,
  Edit3,
  Eye,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Presentation,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface KaizenReportViewProps {
  project: KaizenProject;
  onEditClick?: () => void;
}

export const KaizenReportView: React.FC<KaizenReportViewProps> = ({
  project,
  onEditClick,
}) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showPptxModal, setShowPptxModal] = useState(false);

  const imgInfo = estimateTotalImagesSize(project);

  const { content, title, department, leader, teamMembers, startDate, dueDate, status } = project;
  const h = content.header || { title, department, leader, teamMembers, startDate, dueDate, status };
  const s1 = content.step1;
  const s2 = content.step2;
  const s3 = content.step3;
  const s4 = content.step4;
  const s56 = content.step5_6;
  const s7 = content.step7;
  const s8 = content.step8;

  const safeFileName = (h.title || title || "Proyek").replace(/[^a-zA-Z0-9_\-\s]/g, "_").substring(0, 60);

  const handleExportDocx = useCallback(async () => {
    setExportError(null);
    setIsExportingDocx(true);
    // Yield execution so UI updates loading state before running docx compilation
    await new Promise((r) => setTimeout(r, 60));

    try {
      const blob = await generateKaizenDocx(project);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Kaizen-${safeFileName}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      fetch(`/api/kaizen/${project.id}/log-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportType: "docx" }),
      }).catch(() => {});
    } catch (error) {
      console.error("Export Word (.docx) error:", error);
      setExportError("Gagal export Word (.docx). Silakan coba lagi.");
    } finally {
      setIsExportingDocx(false);
    }
  }, [project, safeFileName]);

  const handleExportPdf = useCallback(async () => {
    setExportError(null);

    // Pre-check for heavy images
    const imgData = estimateTotalImagesSize(project);
    if (imgData.exceedsLimit) {
      const confirmProceed = confirm(
        `Peringatan: Proyek ini memiliki ${imgData.imageCount} gambar (estimasi ~${imgData.totalMB} MB).\n` +
        `Proses export PDF mungkin membutuhkan waktu atau memori besar pada perangkat dengan memori terbatas.\n\n` +
        `Apakah Anda ingin melanjutkan export PDF?`
      );
      if (!confirmProceed) return;
    }

    setIsExportingPdf(true);
    // Yield execution so UI updates loading state before running PDF capture
    await new Promise((r) => setTimeout(r, 120));

    try {
      await exportElementToPdf("kaizen-printable-report", `Kaizen-${safeFileName}.pdf`);

      fetch(`/api/kaizen/${project.id}/log-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportType: "pdf" }),
      }).catch(() => {});
    } catch (error) {
      console.error("Export PDF error:", error);
      setExportError("Gagal export PDF. Silakan coba lagi.");
    } finally {
      setIsExportingPdf(false);
    }
  }, [safeFileName, project]);

  const decisionLabels: Record<string, string> = {
    proliferasi: "1. Proliferasi / Standardisasi ke Area Lain (Horizontal Deployment)",
    monitoring: "2. Monitoring Berkelanjutan Saja",
    pdca_ulang: "3. Ulangi Siklus PDCA (Target Belum Tercapai)",
    eskalasi: "4. Eskalasi ke Management / Inisiasi Proyek Baru",
  };

  return (
    <div className="space-y-6">
      {exportError && (
        <Toast
          message={exportError}
          type="error"
          onClose={() => setExportError(null)}
        />
      )}

      {imgInfo.exceedsLimit && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-amber-900 print:hidden shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Peringatan Ukuran Media:</strong> Proyek ini memiliki {imgInfo.imageCount} gambar (estimasi ~{imgInfo.totalMB} MB).
            Proses export PDF pada perangkat seluler mungkin memerlukan waktu lebih lama.
          </span>
        </div>
      )}

      {/* ═══ Top Action Bar (NOT captured in PDF) ═══ */}
      <div className="bg-[#101f36] p-4 rounded-2xl shadow-xl border border-[#8fa3bd]/16 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#1fb6a8]" />
          <h2 className="font-display font-extrabold text-white text-lg tracking-wide">
            Pratinjau Laporan Kaizen A3
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onEditClick && (
            <button
              onClick={onEditClick}
              className="bg-[#16304f] hover:bg-[#16304f]/80 text-[#8fa3bd] hover:text-white font-semibold text-xs px-3.5 py-2 rounded-xl border border-[#8fa3bd]/25 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-[#1fb6a8]" /> Kembali ke Edit
            </button>
          )}

          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            {isExportingDocx ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            {isExportingDocx ? "Memproses..." : "Export Word (.docx)"}
          </button>

          <button
            onClick={() => setShowPptxModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <Presentation className="w-4 h-4" />
            Download PPTX
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="btn-gold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExportingPdf ? "Memproses..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* ═══ Printable Report Body — each <section> is captured separately for PDF ═══ */}
      <div
        id="kaizen-printable-report"
        className="bg-white border-2 border-slate-300 rounded-xl p-8 shadow-lg max-w-5xl mx-auto text-slate-800 print:shadow-none print:border-none"
      >
        {/* ── Document Title Header ── */}
        <section className="border-b-4 border-slate-800 pb-5 text-center">
          <div className="inline-block px-3 py-1 bg-indigo-900 text-white text-xs font-bold uppercase tracking-wider rounded mb-2">
            STANDAR TEMPLATE MANUFAKTUR KAIZEN 8 LANGKAH (PDCA)
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            LEMBAR DOKUMENTASI PROYEK IMPROVEMENT
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Standard Operating Kaizen Sheet • ISO 9001 / IATF 16949 Continuous Improvement
          </p>
        </section>

        {/* ── Header Metadata ── */}
        <section className="mt-6 border border-slate-300 rounded-lg overflow-hidden text-xs bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="p-3 space-y-1">
              <span className="font-bold text-slate-500 block uppercase text-[10px]">Tema Proyek</span>
              <p className="font-bold text-slate-900 text-sm">{h.title || "-"}</p>
            </div>
            <div className="p-3 space-y-1">
              <span className="font-bold text-slate-500 block uppercase text-[10px]">Departemen / Area</span>
              <p className="font-semibold text-slate-800">{h.department || "-"}</p>
            </div>
            <div className="p-3 space-y-1">
              <span className="font-bold text-slate-500 block uppercase text-[10px]">PIC Utama & Tim</span>
              <p className="font-semibold text-slate-800">
                Ketua: {h.leader || "-"} | Tim: {h.teamMembers || "-"}
              </p>
            </div>
          </div>
          <div className="border-t border-slate-300 px-3 py-2 bg-slate-100 flex flex-wrap justify-between gap-2 font-medium text-slate-600">
            <span>Mulai: {h.startDate || "-"}</span>
            <span>Target Selesai: {h.dueDate || "-"}</span>
            <span className="font-bold text-indigo-700">Status: {h.status || "-"}</span>
          </div>
        </section>

        {/* ════════ LANGKAH 1 ════════ */}
        <section className="mt-8">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 1 — Problem Situation</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 1 of 8</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-3">
            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-1">
              <span className="font-bold text-slate-700">1. Standar (Pedoman / Acuan):</span>
              <p className="text-slate-900 leading-relaxed whitespace-pre-line">{s1?.standard || "-"}</p>
            </div>
            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-1">
              <span className="font-bold text-slate-700">2. Situasi Terkini (Realita):</span>
              <p className="text-slate-900 leading-relaxed whitespace-pre-line">{s1?.currentSituation || "-"}</p>
            </div>
            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-1">
              <span className="font-bold text-slate-700">3. Perbedaan / Gap:</span>
              <p className="text-slate-900 leading-relaxed whitespace-pre-line">{s1?.gap || "-"}</p>
            </div>
            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-1">
              <span className="font-bold text-slate-700">4. Terjadi Sejak / Frekuensi:</span>
              <p className="text-slate-900 leading-relaxed whitespace-pre-line">{s1?.sinceWhen || "-"}</p>
            </div>
            <div className="md:col-span-2 border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-1">
              <span className="font-bold text-slate-700">5. Dampak Masalah:</span>
              <p className="text-slate-900 leading-relaxed whitespace-pre-line">{s1?.impact || "-"}</p>
            </div>
          </div>

          {s1?.images && s1.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
              {s1.images.map((img) => (
                <div key={img.id} className="border rounded overflow-hidden bg-slate-50">
                  <img src={img.url} alt="Foto Problem" className="h-28 w-full object-cover" />
                  {img.caption && <p className="p-1 text-[10px] text-slate-600 italic text-center">{img.caption}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ════════ LANGKAH 2 ════════ */}
        <section className="mt-8">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 2 — Break Down the Problem</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 2 of 8</span>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs mt-3">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">
              Analisis Uraian Masalah 4W1H:
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-300 bg-white">
              <div className="p-2.5">
                <span className="font-bold text-indigo-900 block text-[10px]">WHAT</span>
                <p className="mt-0.5 whitespace-pre-line">{s2?.fourWOneH?.what || "-"}</p>
              </div>
              <div className="p-2.5">
                <span className="font-bold text-indigo-900 block text-[10px]">WHEN</span>
                <p className="mt-0.5 whitespace-pre-line">{s2?.fourWOneH?.when || "-"}</p>
              </div>
              <div className="p-2.5">
                <span className="font-bold text-indigo-900 block text-[10px]">WHERE</span>
                <p className="mt-0.5 whitespace-pre-line">{s2?.fourWOneH?.where || "-"}</p>
              </div>
              <div className="p-2.5">
                <span className="font-bold text-indigo-900 block text-[10px]">WHO</span>
                <p className="mt-0.5 whitespace-pre-line">{s2?.fourWOneH?.who || "-"}</p>
              </div>
            </div>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs mt-3">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">
              Tabel Data Pendukung Masalah:
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-200">Area</th>
                  <th className="p-2 border-r border-slate-200">Tanggal</th>
                  <th className="p-2 border-r border-slate-200">Kategori</th>
                  <th className="p-2 border-r border-slate-200">Detail / Model</th>
                  <th className="p-2">Kuantitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {s2?.supportingData && s2.supportingData.length > 0 ? (
                  s2.supportingData.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2 border-r border-slate-100">{row.area || "-"}</td>
                      <td className="p-2 border-r border-slate-100">{row.eventDate || "-"}</td>
                      <td className="p-2 border-r border-slate-100">{row.category || "-"}</td>
                      <td className="p-2 border-r border-slate-100">{row.detailModel || "-"}</td>
                      <td className="p-2 font-medium">{row.quantity || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-3 text-center text-slate-400">Tidak ada data pendukung</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ════════ LANGKAH 3 ════════ */}
        <section className="mt-8">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 3 — Target Setting</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 3 of 8</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs mt-3">
            <div className="border border-indigo-200 bg-indigo-50/40 p-2 rounded"><span className="font-bold text-indigo-900 block text-[10px]">Specific</span><p className="whitespace-pre-line">{s3?.smart?.specific || "-"}</p></div>
            <div className="border border-emerald-200 bg-emerald-50/40 p-2 rounded"><span className="font-bold text-emerald-900 block text-[10px]">Measurable</span><p className="whitespace-pre-line">{s3?.smart?.measurable || "-"}</p></div>
            <div className="border border-amber-200 bg-amber-50/40 p-2 rounded"><span className="font-bold text-amber-900 block text-[10px]">Achievable</span><p className="whitespace-pre-line">{s3?.smart?.achievable || "-"}</p></div>
            <div className="border border-blue-200 bg-blue-50/40 p-2 rounded"><span className="font-bold text-blue-900 block text-[10px]">Relevant</span><p className="whitespace-pre-line">{s3?.smart?.relevant || "-"}</p></div>
            <div className="border border-purple-200 bg-purple-50/40 p-2 rounded"><span className="font-bold text-purple-900 block text-[10px]">Time-based</span><p className="whitespace-pre-line">{s3?.smart?.timeBased || "-"}</p></div>
          </div>

          <div className="bg-slate-900 text-white p-3.5 rounded-lg text-xs space-y-1 mt-3">
            <span className="text-amber-300 font-bold uppercase text-[10px] block">Formulasi Tema Proyek</span>
            <p className="text-sm font-bold">{s3?.projectTheme || "-"}</p>
            <div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-700">
              <span>Peningkatan: {s3?.improvement || "-"}</span>
              <span>Target Akhir: {s3?.targetValue || "-"}</span>
              <span>Deadline: {s3?.completionDate || "-"}</span>
            </div>
          </div>
        </section>

        {/* ════════ LANGKAH 4 ════════ */}
        <section className="mt-8">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 4 — Cause Analysis</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 4 of 8</span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="text-xs font-bold text-slate-800 px-1">4.1 Diagram Fishbone (Ishikawa 5M + 1E):</div>
            <FishboneDiagramView
              fishbone={s4?.fishbone || { man: "", machine: "", method: "", material: "", environment: "" }}
              effectTitle={s3?.projectTheme || h.title || "MASALAH UTAMA"}
            />
          </div>

          {s4?.fishboneImage && (
            <div className="border rounded p-2 text-center bg-slate-50 mt-2">
              <img src={s4.fishboneImage} alt="Fishbone" className="max-h-52 mx-auto" />
            </div>
          )}
        </section>

        {/* 4.2 & 4.3 in own section so PDF page-breaks nicely */}
        <section className="mt-4">
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">4.2 Most Potential Causes:</div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-200">Penyebab Potensial</th>
                  <th className="p-2 border-r border-slate-200">Metode Pengecekan</th>
                  <th className="p-2">Hasil Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {s4?.mostPotentialCauses && s4.mostPotentialCauses.length > 0 ? (
                  s4.mostPotentialCauses.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2 border-r border-slate-100">{row.cause || "-"}</td>
                      <td className="p-2 border-r border-slate-100">{row.checkMethod || "-"}</td>
                      <td className="p-2 font-medium">{row.result || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="p-3 text-center text-slate-400">-</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border border-rose-200 bg-rose-50/30 rounded-lg p-3 text-xs space-y-1.5 mt-3">
            <span className="font-bold text-rose-900 block uppercase text-[10px]">4.3 Root Cause Analysis (5 Why):</span>
            <div className="space-y-1 pl-2 border-l-2 border-rose-300">
              <p><span className="font-bold text-slate-700">WHY 1:</span> {s4?.fiveWhys?.why1 || "-"}</p>
              <p><span className="font-bold text-slate-700">WHY 2:</span> {s4?.fiveWhys?.why2 || "-"}</p>
              <p><span className="font-bold text-slate-700">WHY 3:</span> {s4?.fiveWhys?.why3 || "-"}</p>
              {s4?.fiveWhys?.why4 && <p><span className="font-bold text-slate-700">WHY 4:</span> {s4.fiveWhys.why4}</p>}
              {s4?.fiveWhys?.why5 && <p><span className="font-bold text-slate-700">WHY 5:</span> {s4.fiveWhys.why5}</p>}
            </div>
            <div className="pt-2 border-t border-rose-200 font-bold text-rose-950 text-xs">
              AKAR PERMASALAHAN: {s4?.fiveWhys?.rootCause || "-"}
            </div>
          </div>
        </section>

        {/* ════════ LANGKAH 5 & 6 ════════ */}
        <section className="mt-8">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 5 & 6 — Countermeasure & Implementation</span>
            <span className="text-indigo-300 font-mono text-[10px]">Steps 5 & 6 of 8</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="font-bold text-amber-900 block text-[10px]">Jangka Pendek:</span>
              <p className="mt-0.5 whitespace-pre-line">{s56?.shortTermPlan || "-"}</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="font-bold text-emerald-900 block text-[10px]">Jangka Panjang:</span>
              <p className="mt-0.5 whitespace-pre-line">{s56?.longTermPlan || "-"}</p>
            </div>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs mt-3">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">Detail Action Plan:</div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-200">Action Plan</th>
                  <th className="p-2 border-r border-slate-200">Area</th>
                  <th className="p-2 border-r border-slate-200">PIC</th>
                  <th className="p-2 border-r border-slate-200">Target (ETC)</th>
                  <th className="p-2">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {s56?.actionPlans && s56.actionPlans.length > 0 ? (
                  s56.actionPlans.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2 border-r border-slate-100">{row.plan || "-"}</td>
                      <td className="p-2 border-r border-slate-100">{row.area || "-"}</td>
                      <td className="p-2 border-r border-slate-100">{row.pic || "-"}</td>
                      <td className="p-2 border-r border-slate-100">{row.targetDate || "-"}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div className={`h-full ${(row.progress || 0) >= 100 ? "bg-emerald-600" : "bg-indigo-600"}`} style={{ width: `${row.progress || 0}%` }} />
                          </div>
                          <span className="font-bold text-[11px]">{row.progress || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-3 text-center text-slate-400">-</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ════════ LANGKAH 7 ════════ */}
        <section className="mt-8">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 7 — Follow Up & Evaluasi Hasil</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 7 of 8</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border mt-3">
            <div><span className="font-bold text-slate-600 block">Cara Memeriksa:</span><p>{s7?.checkMethod || "-"}</p></div>
            <div><span className="font-bold text-slate-600 block">Kapan Memeriksa:</span><p>{s7?.checkFrequency || "-"}</p></div>
            <div><span className="font-bold text-slate-600 block">Siapa Memeriksa:</span><p>{s7?.checkPic || "-"}</p></div>
          </div>

          <div className="border p-3 rounded-lg bg-slate-50 text-xs mt-3">
            <span className="font-bold text-slate-800">Ringkasan Hasil Pengujian Before vs After:</span>
            <p className="mt-1 leading-relaxed whitespace-pre-line">{s7?.testResultSummary || "-"}</p>
          </div>
        </section>

        {/* Chart in own section for better PDF split */}
        {s7?.chartData && s7.chartData.length > 0 && (
          <section className="mt-4">
            <div className="border rounded-lg p-3 bg-white space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Grafik Evaluasi Before vs After:</span>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {(s7?.chartType || "line") === "line" ? (
                    <LineChart data={s7.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="standard" name="Standar Target" stroke="#dc2626" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="before" name="Before" stroke="#f59e0b" />
                      <Line type="monotone" dataKey="after" name="After" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <BarChart data={s7.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="before" name="Before" fill="#f59e0b" />
                      <Bar dataKey="after" name="After" fill="#10b981" />
                      <Bar dataKey="standard" name="Standar Target" fill="#dc2626" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Data Table for chart (always visible in PDF unlike interactive chart) */}
              <table className="w-full text-[10px] border border-slate-200 rounded mt-2">
                <thead className="bg-slate-100 font-bold text-slate-800">
                  <tr>
                    <th className="p-1.5 border-r border-slate-200">Periode</th>
                    <th className="p-1.5 border-r border-slate-200 text-rose-700">Standar</th>
                    <th className="p-1.5 border-r border-slate-200 text-amber-700">Before</th>
                    <th className="p-1.5 text-emerald-700">After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-900 font-medium">
                  {s7.chartData.map((cd, i) => (
                    <tr key={i}>
                      <td className="p-1.5 border-r border-slate-100">{cd.label}</td>
                      <td className="p-1.5 border-r border-slate-100">{cd.standard}</td>
                      <td className="p-1.5 border-r border-slate-100">{cd.before}</td>
                      <td className="p-1.5">{cd.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* AUTOMATIC INSIGHT CONCLUSION BOX FOR REPORT & PDF EXPORT */}
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-2.5 text-xs text-indigo-950 flex items-start gap-2 shadow-xs mt-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-indigo-900 mb-0.5">
                    Kesimpulan Otomatis Evaluasi Grafik:
                  </span>
                  <p className="leading-relaxed font-medium text-slate-900">{generateChartInsight(s7.chartData)}</p>
                </div>
              </div>
            </div>

            {s7?.chartImage && (
              <div className="border rounded p-2 text-center bg-slate-50 mt-2">
                <img src={s7.chartImage} alt="Chart" className="max-h-52 mx-auto" />
              </div>
            )}

            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-xs space-y-1 mt-3">
              <span className="font-bold text-indigo-900 block uppercase text-[10px]">Keputusan Tindak Lanjut:</span>
              <p className="font-bold text-indigo-950">
                {decisionLabels[s7?.followUpDecision] || s7?.followUpDecision || "-"}
              </p>
              {s7?.followUpNote && <p className="text-slate-700 italic">Catatan: {s7.followUpNote}</p>}
            </div>
          </section>
        )}

        {/* Fallback if no chart data */}
        {(!s7?.chartData || s7.chartData.length === 0) && (
          <section className="mt-4">
            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-xs space-y-1">
              <span className="font-bold text-indigo-900 block uppercase text-[10px]">Keputusan Tindak Lanjut:</span>
              <p className="font-bold text-indigo-950">
                {decisionLabels[s7?.followUpDecision] || s7?.followUpDecision || "-"}
              </p>
              {s7?.followUpNote && <p className="text-slate-700 italic">Catatan: {s7.followUpNote}</p>}
            </div>
          </section>
        )}

        {/* ════════ LANGKAH 8 ════════ */}
        <section className="mt-8">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 8 — Standardization</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 8 of 8</span>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs mt-3">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">Dokumen / SOP / Form:</div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-200">Nomor Dokumen</th>
                  <th className="p-2 border-r border-slate-200">Nama Dokumen</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {s8?.documentsCreated && s8.documentsCreated.length > 0 ? (
                  s8.documentsCreated.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2 border-r border-slate-100 font-mono">{row.docNumber || "-"}</td>
                      <td className="p-2 border-r border-slate-100">{row.docName || "-"}</td>
                      <td className="p-2 font-medium">{row.status || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="p-3 text-center text-slate-400">-</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Before/After in own section */}
        <section className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-rose-200 bg-rose-50/30 p-3 rounded-lg space-y-2">
              <span className="font-bold text-rose-900 block text-[10px] uppercase">BEFORE:</span>
              <p className="whitespace-pre-line">{s8?.beforeCondition || "-"}</p>
              {s8?.beforeUrl && <img src={s8.beforeUrl} alt="Before" className="h-36 object-cover rounded border mx-auto" />}
            </div>
            <div className="border border-emerald-200 bg-emerald-50/30 p-3 rounded-lg space-y-2">
              <span className="font-bold text-emerald-900 block text-[10px] uppercase">AFTER:</span>
              <p className="whitespace-pre-line">{s8?.afterCondition || "-"}</p>
              {s8?.afterUrl && <img src={s8.afterUrl} alt="After" className="h-36 object-cover rounded border mx-auto" />}
            </div>
          </div>

          <div className="flex flex-wrap justify-between text-xs p-3 bg-slate-100 rounded-lg font-medium mt-3 gap-2">
            <span>PIC Pemeliharaan Standar: {s8?.maintenancePic || "-"}</span>
            <span>Tanggal Efektif: {s8?.effectiveDate || "-"}</span>
          </div>

          {s8?.attachments && s8.attachments.length > 0 && (
            <div className="text-xs mt-3 p-3 bg-slate-50 rounded-lg border space-y-1">
              <span className="font-bold text-slate-800 block">Lampiran Dokumen:</span>
              {s8.attachments.map((att, i) => (
                <p key={att.id} className="text-slate-600">{i + 1}. {att.fileName}</p>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* PPTX Export Modal */}
      <PptxExportModal
        project={project}
        isOpen={showPptxModal}
        onClose={() => setShowPptxModal(false)}
      />
    </div>
  );
};
