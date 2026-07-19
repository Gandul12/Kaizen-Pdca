"use client";

import React, { useState } from "react";
import { KaizenProject } from "@/types/kaizen";
import { generateKaizenDocx } from "@/lib/docxExport";
import { exportElementToPdf } from "@/lib/pdfExport";
import {
  FileText,
  Download,
  Building2,
  Calendar,
  User,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Edit3,
} from "lucide-react";
import {
  LineChart,
  Line,
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

  const { content, title, department, leader, teamMembers, startDate, dueDate, status } = project;
  const h = content.header || { title, department, leader, teamMembers, startDate, dueDate, status };
  const s1 = content.step1;
  const s2 = content.step2;
  const s3 = content.step3;
  const s4 = content.step4;
  const s56 = content.step5_6;
  const s7 = content.step7;
  const s8 = content.step8;

  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      const blob = await generateKaizenDocx(project);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Kaizen-${(h.title || "Proyek").replace(/[^a-zA-Z0-9]/g, "_")}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Word (.docx) error:", error);
      alert("Gagal melakukan export Word (.docx). Silakan coba lagi.");
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf("kaizen-printable-report", `Kaizen-${(h.title || "Proyek").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (error) {
      console.error("Export PDF error:", error);
      alert("Gagal melakukan export PDF. Silakan coba lagi.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const decisionLabels: Record<string, string> = {
    proliferasi: "1. Proliferasi / Standardisasi ke Area Lain (Horizontal Deployment)",
    monitoring: "2. Monitoring Berkelanjutan Saja",
    pdca_ulang: "3. Ulangi Siklus PDCA (Target Belum Tercapai)",
    eskalasi: "4. Eskalasi ke Management / Inisiasi Proyek Baru",
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-800 text-base">
            Pratinjau Lembar Kerja A3 / Standard Kaizen Report
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onEditClick && (
            <button
              onClick={onEditClick}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3.5 py-2 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-slate-600" /> Mode Edit Form
            </button>
          )}

          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isExportingDocx ? "Memproses Word..." : "Export Word (.docx)"}
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExportingPdf ? "Memproses PDF..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Printable Report Document Body */}
      <div
        id="kaizen-printable-report"
        className="bg-white border-2 border-slate-300 rounded-xl p-8 shadow-lg max-w-5xl mx-auto space-y-8 text-slate-800 print:shadow-none print:border-none"
      >
        {/* Document Header */}
        <div className="border-b-4 border-slate-800 pb-5 text-center">
          <div className="inline-block px-3 py-1 bg-indigo-900 text-white text-xs font-bold uppercase tracking-wider rounded mb-2">
            STANDAR TEMPLATE MANUFAKTUR KAIZEN 8 LANGKAH (PDCA)
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            LEMBAR DOKUMENTASI PROYEK IMPROVEMENT
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Standard Operating Kaizen Sheet • ISO 9001 / IATF 16949 Continuous Improvement
          </p>
        </div>

        {/* Header Metadata Grid */}
        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="p-3 space-y-1">
              <span className="font-bold text-slate-500 block uppercase">Tema Proyek</span>
              <p className="font-bold text-slate-900 text-sm">{h.title || "-"}</p>
            </div>
            <div className="p-3 space-y-1">
              <span className="font-bold text-slate-500 block uppercase">Departemen / Area</span>
              <p className="font-semibold text-slate-800">{h.department || "-"}</p>
            </div>
            <div className="p-3 space-y-1">
              <span className="font-bold text-slate-500 block uppercase">PIC Utama & Tim</span>
              <p className="font-semibold text-slate-800">
                Ketua: {h.leader || "-"} | Tim: {h.teamMembers || "-"}
              </p>
            </div>
          </div>
          <div className="border-t border-slate-300 px-3 py-2 bg-slate-100 flex justify-between font-medium text-slate-600">
            <span>Tanggal Mulai: {h.startDate || "-"}</span>
            <span>Target Selesai: {h.dueDate || "-"}</span>
            <span className="font-bold text-indigo-700">Status: {h.status || "-"}</span>
          </div>
        </div>

        {/* LANGKAH 1 */}
        <section className="space-y-3">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 1 — Problem Situation</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 1 of 8</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-1">
              <span className="font-bold text-slate-700">1. Standar (Pedoman / Acuan):</span>
              <p className="text-slate-900 leading-relaxed">{s1?.standard || "-"}</p>
            </div>

            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-1">
              <span className="font-bold text-slate-700">2. Situasi Terkini (Realita):</span>
              <p className="text-slate-900 leading-relaxed">{s1?.currentSituation || "-"}</p>
            </div>

            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-1">
              <span className="font-bold text-slate-700">3. Perbedaan / Gap:</span>
              <p className="text-slate-900 leading-relaxed">{s1?.gap || "-"}</p>
            </div>

            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-1">
              <span className="font-bold text-slate-700">4. Terjadi Sejak / Frekuensi:</span>
              <p className="text-slate-900 leading-relaxed">{s1?.sinceWhen || "-"}</p>
            </div>

            <div className="md:col-span-2 border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-1">
              <span className="font-bold text-slate-700">5. Dampak Masalah:</span>
              <p className="text-slate-900 leading-relaxed">{s1?.impact || "-"}</p>
            </div>
          </div>

          {s1?.images && s1.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {s1.images.map((img) => (
                <div key={img.id} className="border rounded overflow-hidden bg-slate-50">
                  <img src={img.url} alt="Foto Problem" className="h-28 w-full object-cover" />
                  {img.caption && <p className="p-1 text-[10px] text-slate-600 italic text-center">{img.caption}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* LANGKAH 2 */}
        <section className="space-y-3">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 2 — Break Down the Problem</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 2 of 8</span>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">
              Analisis Uraian Masalah 4W1H:
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-300 bg-white">
              <div className="p-2.5">
                <span className="font-bold text-indigo-900 block text-[10px]">WHAT</span>
                <p className="mt-0.5">{s2?.fourWOneH?.what || "-"}</p>
              </div>
              <div className="p-2.5">
                <span className="font-bold text-indigo-900 block text-[10px]">WHEN</span>
                <p className="mt-0.5">{s2?.fourWOneH?.when || "-"}</p>
              </div>
              <div className="p-2.5">
                <span className="font-bold text-indigo-900 block text-[10px]">WHERE</span>
                <p className="mt-0.5">{s2?.fourWOneH?.where || "-"}</p>
              </div>
              <div className="p-2.5">
                <span className="font-bold text-indigo-900 block text-[10px]">WHO</span>
                <p className="mt-0.5">{s2?.fourWOneH?.who || "-"}</p>
              </div>
            </div>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">
              Tabel Data Pendukung Masalah:
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r">Area</th>
                  <th className="p-2 border-r">Tanggal</th>
                  <th className="p-2 border-r">Kategori Cacat</th>
                  <th className="p-2 border-r">Detail / Model</th>
                  <th className="p-2">Kuantitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {s2?.supportingData && s2.supportingData.length > 0 ? (
                  s2.supportingData.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2 border-r">{row.area || "-"}</td>
                      <td className="p-2 border-r">{row.eventDate || "-"}</td>
                      <td className="p-2 border-r">{row.category || "-"}</td>
                      <td className="p-2 border-r">{row.detailModel || "-"}</td>
                      <td className="p-2 font-medium">{row.quantity || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-slate-400">
                      Tidak ada data pendukung
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* LANGKAH 3 */}
        <section className="space-y-3">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 3 — Target Setting</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 3 of 8</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <div className="border border-indigo-200 bg-indigo-50/40 p-2 rounded">
              <span className="font-bold text-indigo-900 block text-[10px]">Specific</span>
              <p>{s3?.smart?.specific || "-"}</p>
            </div>
            <div className="border border-emerald-200 bg-emerald-50/40 p-2 rounded">
              <span className="font-bold text-emerald-900 block text-[10px]">Measurable</span>
              <p>{s3?.smart?.measurable || "-"}</p>
            </div>
            <div className="border border-amber-200 bg-amber-50/40 p-2 rounded">
              <span className="font-bold text-amber-900 block text-[10px]">Achievable</span>
              <p>{s3?.smart?.achievable || "-"}</p>
            </div>
            <div className="border border-blue-200 bg-blue-50/40 p-2 rounded">
              <span className="font-bold text-blue-900 block text-[10px]">Relevant</span>
              <p>{s3?.smart?.relevant || "-"}</p>
            </div>
            <div className="border border-purple-200 bg-purple-50/40 p-2 rounded">
              <span className="font-bold text-purple-900 block text-[10px]">Time-based</span>
              <p>{s3?.smart?.timeBased || "-"}</p>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-3.5 rounded-lg text-xs space-y-1">
            <span className="text-amber-300 font-bold uppercase text-[10px] block">
              Formulasi Tema Proyek (Kalimat Gabungan)
            </span>
            <p className="text-sm font-bold">{s3?.projectTheme || "-"}</p>
            <div className="flex justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-700">
              <span>Peningkatan: {s3?.improvement || "-"}</span>
              <span>Target Akhir: {s3?.targetValue || "-"}</span>
              <span>Target Waktu: {s3?.completionDate || "-"}</span>
            </div>
          </div>
        </section>

        {/* LANGKAH 4 */}
        <section className="space-y-3">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 4 — Cause Analysis</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 4 of 8</span>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">
              4.1 Cause Analysis (Fishbone 5M + 1E):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 bg-white">
              <div className="p-2">
                <span className="font-bold text-slate-700 block text-[10px]">MAN</span>
                <p className="whitespace-pre-line mt-0.5">{s4?.fishbone?.man || "-"}</p>
              </div>
              <div className="p-2">
                <span className="font-bold text-slate-700 block text-[10px]">MACHINE</span>
                <p className="whitespace-pre-line mt-0.5">{s4?.fishbone?.machine || "-"}</p>
              </div>
              <div className="p-2">
                <span className="font-bold text-slate-700 block text-[10px]">METHOD</span>
                <p className="whitespace-pre-line mt-0.5">{s4?.fishbone?.method || "-"}</p>
              </div>
              <div className="p-2">
                <span className="font-bold text-slate-700 block text-[10px]">MATERIAL</span>
                <p className="whitespace-pre-line mt-0.5">{s4?.fishbone?.material || "-"}</p>
              </div>
              <div className="p-2">
                <span className="font-bold text-slate-700 block text-[10px]">ENVIRONMENT</span>
                <p className="whitespace-pre-line mt-0.5">{s4?.fishbone?.environment || "-"}</p>
              </div>
            </div>
          </div>

          {s4?.fishboneImage && (
            <div className="border rounded p-2 text-center bg-slate-50">
              <img src={s4.fishboneImage} alt="Fishbone" className="max-h-52 mx-auto" />
            </div>
          )}

          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">
              4.2 Most Potential Causes:
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r">Penyebab Potensial</th>
                  <th className="p-2 border-r">Metode Pengecekan</th>
                  <th className="p-2">Hasil Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {s4?.mostPotentialCauses && s4.mostPotentialCauses.length > 0 ? (
                  s4.mostPotentialCauses.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2 border-r">{row.cause || "-"}</td>
                      <td className="p-2 border-r">{row.checkMethod || "-"}</td>
                      <td className="p-2 font-medium">{row.result || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-3 text-center text-slate-400">
                      Tidak ada penyebab potensial
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border border-rose-200 bg-rose-50/30 rounded-lg p-3 text-xs space-y-1.5">
            <span className="font-bold text-rose-900 block uppercase text-[10px]">
              4.3 Root Cause Analysis (5 Why):
            </span>
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

        {/* LANGKAH 5 & 6 */}
        <section className="space-y-3">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 5 & 6 — Countermeasure & Implementation</span>
            <span className="text-indigo-300 font-mono text-[10px]">Steps 5 & 6 of 8</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="font-bold text-amber-900 block text-[10px]">Action Jangka Pendek:</span>
              <p className="mt-0.5">{s56?.shortTermPlan || "-"}</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="font-bold text-emerald-900 block text-[10px]">Action Jangka Panjang:</span>
              <p className="mt-0.5">{s56?.longTermPlan || "-"}</p>
            </div>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">
              Detail Implementation Action Plan:
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r">Action Plan</th>
                  <th className="p-2 border-r">Area</th>
                  <th className="p-2 border-r">PIC</th>
                  <th className="p-2 border-r">Target (ETC)</th>
                  <th className="p-2">Status Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {s56?.actionPlans && s56.actionPlans.length > 0 ? (
                  s56.actionPlans.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2 border-r">{row.plan || "-"}</td>
                      <td className="p-2 border-r">{row.area || "-"}</td>
                      <td className="p-2 border-r">{row.pic || "-"}</td>
                      <td className="p-2 border-r">{row.targetDate || "-"}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full"
                              style={{ width: `${row.progress || 0}%` }}
                            />
                          </div>
                          <span className="font-bold">{row.progress || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-slate-400">
                      Tidak ada action plan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* LANGKAH 7 */}
        <section className="space-y-3">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 7 — Follow Up & Evaluasi Hasil</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 7 of 8</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border">
            <div><span className="font-bold text-slate-600">Cara Memeriksa:</span> <p>{s7?.checkMethod || "-"}</p></div>
            <div><span className="font-bold text-slate-600">Kapan Memeriksa:</span> <p>{s7?.checkFrequency || "-"}</p></div>
            <div><span className="font-bold text-slate-600">Siapa Memeriksa:</span> <p>{s7?.checkPic || "-"}</p></div>
          </div>

          <div className="border p-3 rounded-lg bg-slate-50 text-xs">
            <span className="font-bold text-slate-800">Ringkasan Hasil Pengujian Before vs After:</span>
            <p className="mt-1 leading-relaxed">{s7?.testResultSummary || "-"}</p>
          </div>

          {s7?.chartData && s7.chartData.length > 0 && (
            <div className="border rounded-lg p-3 bg-white space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Grafik Evaluasi Tren
              </span>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
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
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-xs space-y-1">
            <span className="font-bold text-indigo-900 block uppercase text-[10px]">
              Keputusan Tindak Lanjut:
            </span>
            <p className="font-bold text-indigo-950">
              {decisionLabels[s7?.followUpDecision] || s7?.followUpDecision || "-"}
            </p>
            {s7?.followUpNote && <p className="text-slate-700 italic">Catatan: {s7.followUpNote}</p>}
          </div>
        </section>

        {/* LANGKAH 8 */}
        <section className="space-y-3">
          <div className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>LANGKAH 8 — Standardization</span>
            <span className="text-indigo-300 font-mono text-[10px]">Step 8 of 8</span>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">
              Dokumen / SOP / Form Dibuat atau Direvisi:
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r">Nomor Dokumen</th>
                  <th className="p-2 border-r">Nama Dokumen</th>
                  <th className="p-2">Status Revisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {s8?.documentsCreated && s8.documentsCreated.length > 0 ? (
                  s8.documentsCreated.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2 border-r font-mono">{row.docNumber || "-"}</td>
                      <td className="p-2 border-r">{row.docName || "-"}</td>
                      <td className="p-2 font-medium">{row.status || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-3 text-center text-slate-400">
                      Tidak ada dokumen terdaftar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-rose-200 bg-rose-50/30 p-3 rounded-lg space-y-2">
              <span className="font-bold text-rose-900 block text-[10px] uppercase">BEFORE:</span>
              <p>{s8?.beforeCondition || "-"}</p>
              {s8?.beforeUrl && (
                <img src={s8.beforeUrl} alt="Before" className="h-32 object-cover rounded border mx-auto" />
              )}
            </div>

            <div className="border border-emerald-200 bg-emerald-50/30 p-3 rounded-lg space-y-2">
              <span className="font-bold text-emerald-900 block text-[10px] uppercase">AFTER:</span>
              <p>{s8?.afterCondition || "-"}</p>
              {s8?.afterUrl && (
                <img src={s8.afterUrl} alt="After" className="h-32 object-cover rounded border mx-auto" />
              )}
            </div>
          </div>

          <div className="flex justify-between text-xs p-3 bg-slate-100 rounded-lg font-medium">
            <span>PIC Pemeliharaan Standar: {s8?.maintenancePic || "-"}</span>
            <span>Tanggal Efektif: {s8?.effectiveDate || "-"}</span>
          </div>
        </section>
      </div>
    </div>
  );
};
