"use client";

import React, { useState, useMemo } from "react";
import { Step7Data, FollowUpChartPoint, FollowUpDecision } from "@/types/kaizen";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";
import { Toast } from "@/components/Toast";
import { generateChartInsight } from "@/lib/chartInsight";

interface Step7EditorProps {
  data: Step7Data;
  onChange: (updated: Step7Data) => void;
}

export const Step7Editor: React.FC<Step7EditorProps> = ({ data, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Temporary raw string values while user is typing in standard/before/after input fields
  const [tempInputs, setTempInputs] = useState<Record<string, string>>({});

  const activeChartType = data.chartType || "line";

  const handleTextChange = (field: keyof Step7Data, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const toggleChartType = () => {
    const nextType = activeChartType === "line" ? "bar" : "line";
    onChange({
      ...data,
      chartType: nextType,
    });
  };

  const addChartPoint = () => {
    const newPoint: FollowUpChartPoint = {
      label: `Minggu ${(data.chartData?.length || 0) + 1}`,
      standard: 0,
      before: 0,
      after: 0,
    };
    onChange({
      ...data,
      chartData: [...(data.chartData || []), newPoint],
    });
  };

  const removeChartPoint = (index: number) => {
    const updated = [...(data.chartData || [])];
    updated.splice(index, 1);
    onChange({
      ...data,
      chartData: updated,
    });
  };

  const updateChartPointLabel = (index: number, labelVal: string) => {
    const updated = [...(data.chartData || [])];
    updated[index] = { ...updated[index], label: labelVal };
    onChange({ ...data, chartData: updated });
  };

  const handlePointNumberChange = (
    index: number,
    field: "standard" | "before" | "after",
    strVal: string
  ) => {
    const key = `${index}_${field}`;
    setTempInputs((prev) => ({ ...prev, [key]: strVal }));

    const num = strVal.trim() === "" ? 0 : parseFloat(strVal);
    const updated = [...(data.chartData || [])];
    updated[index] = {
      ...updated[index],
      [field]: isNaN(num) ? 0 : num,
    };
    onChange({ ...data, chartData: updated });
  };

  const handlePointNumberFocus = (
    index: number,
    field: "standard" | "before" | "after",
    actualVal: number
  ) => {
    const key = `${index}_${field}`;
    if (!(key in tempInputs)) {
      setTempInputs((prev) => ({
        ...prev,
        [key]: actualVal === 0 ? "" : String(actualVal),
      }));
    }
  };

  const handlePointNumberBlur = (
    index: number,
    field: "standard" | "before" | "after"
  ) => {
    const key = `${index}_${field}`;
    setTempInputs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const getDisplayNumberValue = (
    index: number,
    field: "standard" | "before" | "after",
    actualVal: number
  ) => {
    const key = `${index}_${field}`;
    if (key in tempInputs) {
      return tempInputs[key];
    }
    return actualVal === 0 ? "" : String(actualVal);
  };

  const chartInsight = useMemo(
    () => generateChartInsight(data.chartData || []),
    [data.chartData]
  );

  const handleChartImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        onChange({
          ...data,
          chartImage: json.fileUrl,
        });
      } else {
        setUploadError(json.error || "Gagal mengunggah gambar. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Chart image upload error:", err);
      setUploadError("Gagal upload, periksa koneksi internet Anda.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const decisionOptions: { id: FollowUpDecision; title: string; desc: string }[] = [
    {
      id: "proliferasi",
      title: "1. Proliferasi / Standardisasi ke Area Lain",
      desc: "Hasil terbukti sukses. Terapkan secara horizontal (Horizontal Deployment) ke mesin, lini, atau departemen lain.",
    },
    {
      id: "monitoring",
      title: "2. Continuous Monitoring Saja",
      desc: "Target telah tercapai di area ini. Lanjutkan pemantauan rutin tanpa ekspansi ke area lain saat ini.",
    },
    {
      id: "pdca_ulang",
      title: "3. PDCA Ulang (Iterasi Baru)",
      desc: "Target perbaikan belum sepenuhnya tercapai. Perlu dibuat siklus PDCA baru untuk mencari akar masalah lainnya.",
    },
    {
      id: "eskalasi",
      title: "4. Eskalasi ke Management / Proyek Baru",
      desc: "Perlu perubahan besar pada investasi mesin/struktur/desain yang membutuhkan persetujuan Direksi.",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-8">
      {uploadError && (
        <Toast
          message={uploadError}
          type="error"
          onClose={() => setUploadError(null)}
        />
      )}

      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
          <span className="px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-sm">
            LANGKAH 7
          </span>
          <h2>Follow Up & Evaluasi Hasil (Pemeriksaan / Testing)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Lakukan pengujian dan pemantauan hasil perbaikan, buat perbandingan statistik Before vs After, dan tetapkan opsi keputusan tindak lanjut.
        </p>
      </div>

      {/* Check method / schedule / inspector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Cara Memeriksa / Pengukuran
          </label>
          <input
            type="text"
            value={data.checkMethod || ""}
            onChange={(e) => handleTextChange("checkMethod", e.target.value)}
            placeholder="e.g. Sampling 50 pcs per shift dengan micrometer burr"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Kapan Harus Memeriksa (Jadwal/Frekuensi)
          </label>
          <input
            type="text"
            value={data.checkFrequency || ""}
            onChange={(e) => handleTextChange("checkFrequency", e.target.value)}
            placeholder="e.g. Setiap hari jam 09.00 & 15.00 selama 4 minggu"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Siapa yang Memeriksa (PIC Inspector)
          </label>
          <input
            type="text"
            value={data.checkPic || ""}
            onChange={(e) => handleTextChange("checkPic", e.target.value)}
            placeholder="e.g. QC Inspector (Siti) & Leader Stamping"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Ringkasan Hasil Pengujian */}
      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">
          Ringkasan Hasil Pengujian (Summary Before vs After)
        </label>
        <textarea
          rows={3}
          value={data.testResultSummary || ""}
          onChange={(e) => handleTextChange("testResultSummary", e.target.value)}
          placeholder="e.g. Setelah implementasi preventive maintenance & grinding gauge, angka defect burr turun dari 15% menjadi 0% konsisten selama 4 minggu berturut-turut."
          className="w-full border border-slate-300 rounded-lg p-3 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Interactive Numerical Input to Render Chart */}
      <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Grafik Evaluasi Before vs After dengan Line Standar
            </h3>
            <p className="text-xs text-slate-500">
              Isi poin data numerik di bawah ini untuk merender grafik secara otomatis, atau unggah gambar grafik manual.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleChartType}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
            >
              Mode: {activeChartType === "line" ? "Line Chart" : "Bar Chart"}
            </button>

            <label className="cursor-pointer bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors shadow-sm">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              {isUploading ? "Mengunggah..." : "Upload Gambar Grafik"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChartImageUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {/* Chart Rendering Preview */}
        {data.chartData && data.chartData.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeChartType === "line" ? (
                  <LineChart data={data.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Line type="monotone" dataKey="standard" name="Standar Target" stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="before" name="Sebelum (Before)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="after" name="Sesudah (After)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 5 }} />
                  </LineChart>
                ) : (
                  <BarChart data={data.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Bar dataKey="before" name="Sebelum (Before)" fill="#f59e0b" />
                    <Bar dataKey="after" name="Sesudah (After)" fill="#10b981" />
                    <Bar dataKey="standard" name="Standar Target" fill="#dc2626" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* AUTOMATIC INSIGHT CONCLUSION BOX */}
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-950 flex items-start gap-2 shadow-xs">
              <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[11px] uppercase tracking-wider text-indigo-900 mb-0.5">
                  Kesimpulan Otomatis Evaluasi Grafik:
                </span>
                <p className="leading-relaxed font-medium">{chartInsight}</p>
              </div>
            </div>
          </div>
        )}

        {/* Display Uploaded Chart Image if available */}
        {data.chartImage && (
          <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Gambar Grafik Terunggah:
              </span>
              <button
                type="button"
                onClick={() => onChange({ ...data, chartImage: "" })}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Gambar
              </button>
            </div>
            <img
              src={data.chartImage}
              alt="Chart Graphic"
              className="max-h-64 object-contain mx-auto rounded border"
            />
          </div>
        )}

        {/* Data points table editor with fixed touch/replacement & inputMode */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Input Tabel Data Poin Grafik:
            </span>
            <button
              type="button"
              onClick={addChartPoint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Poin Periode
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {data.chartData && data.chartData.length > 0 ? (
              data.chartData.map((pt, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-xs"
                >
                  <input
                    type="text"
                    value={pt.label || ""}
                    onChange={(e) => updateChartPointLabel(idx, e.target.value)}
                    placeholder="Nama Periode (e.g. W1)"
                    className="w-full sm:w-1/4 border border-slate-300 rounded p-1.5 text-xs text-slate-900 bg-white"
                  />
                  <div className="flex items-center gap-1 w-[30%] sm:w-1/4">
                    <span className="text-[10px] text-rose-600 font-bold shrink-0">Standar:</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={getDisplayNumberValue(idx, "standard", pt.standard)}
                      onFocus={() => handlePointNumberFocus(idx, "standard", pt.standard)}
                      onChange={(e) => handlePointNumberChange(idx, "standard", e.target.value)}
                      onBlur={() => handlePointNumberBlur(idx, "standard")}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-900 bg-white font-medium min-w-[55px]"
                    />
                  </div>
                  <div className="flex items-center gap-1 w-[30%] sm:w-1/4">
                    <span className="text-[10px] text-amber-600 font-bold shrink-0">Before:</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={getDisplayNumberValue(idx, "before", pt.before)}
                      onFocus={() => handlePointNumberFocus(idx, "before", pt.before)}
                      onChange={(e) => handlePointNumberChange(idx, "before", e.target.value)}
                      onBlur={() => handlePointNumberBlur(idx, "before")}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-900 bg-white font-medium min-w-[55px]"
                    />
                  </div>
                  <div className="flex items-center gap-1 w-[30%] sm:w-1/4">
                    <span className="text-[10px] text-emerald-600 font-bold shrink-0">After:</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={getDisplayNumberValue(idx, "after", pt.after)}
                      onFocus={() => handlePointNumberFocus(idx, "after", pt.after)}
                      onChange={(e) => handlePointNumberChange(idx, "after", e.target.value)}
                      onBlur={() => handlePointNumberBlur(idx, "after")}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-900 bg-white font-medium min-w-[55px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChartPoint(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">
                Belum ada poin grafik. Klik &quot;Tambah Poin Periode&quot;.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Standard 4 Manufacturing Follow-up Decision Options */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-indigo-600" />
          Pilihan Keputusan Tindak Lanjut Standar (4 Opsi Standar Manufaktur)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {decisionOptions.map((opt) => {
            const isSelected = data.followUpDecision === opt.id;
            return (
              <label
                key={opt.id}
                onClick={() => handleTextChange("followUpDecision", opt.id)}
                className={`p-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/80 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="followUpDecision"
                  value={opt.id}
                  checked={isSelected}
                  onChange={() => {}}
                  className="mt-0.5 accent-indigo-600 cursor-pointer"
                />
                <div>
                  <h4 className={`text-xs font-bold ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>
                    {opt.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Catatan Tambahan Keputusan Tindak Lanjut
          </label>
          <input
            type="text"
            value={data.followUpNote || ""}
            onChange={(e) => handleTextChange("followUpNote", e.target.value)}
            placeholder="e.g. Proliferasi disetujui untuk diterapkan ke Line Stamping 1 & Line Stamping 3 pada bulan depan."
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
