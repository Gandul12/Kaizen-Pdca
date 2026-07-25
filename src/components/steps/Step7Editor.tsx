"use client";

import React, { useState } from "react";
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
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  Image as ImageIcon,
  HelpCircle,
} from "lucide-react";

interface Step7EditorProps {
  data: Step7Data;
  onChange: (updated: Step7Data) => void;
}

export const Step7Editor: React.FC<Step7EditorProps> = ({ data, onChange }) => {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [isUploading, setIsUploading] = useState(false);

  const handleTextChange = (field: keyof Step7Data, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const addChartPoint = () => {
    const newPoint: FollowUpChartPoint = {
      label: `Minggu ${ (data.chartData?.length || 0) + 1}`,
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

  const updateChartPoint = (
    index: number,
    field: keyof FollowUpChartPoint,
    value: any
  ) => {
    const updated = [...(data.chartData || [])];
    updated[index] = {
      ...updated[index],
      [field]: field === "label" ? value : Number(value) || 0,
    };
    onChange({
      ...data,
      chartData: updated,
    });
  };

  const handleChartImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
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
      }
    } catch (err) {
      console.error("Chart image upload error:", err);
    } finally {
      setIsUploading(false);
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
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500"
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
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500"
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
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500"
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
          className="w-full border border-slate-300 rounded-lg p-3 text-xs focus:ring-2 focus:ring-indigo-500"
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
              onClick={() => setChartType(chartType === "line" ? "bar" : "line")}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
            >
              Mode: {chartType === "line" ? "Line Chart" : "Bar Chart"}
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
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
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

        {/* Data points table editor */}
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
                  className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-xs"
                >
                  <input
                    type="text"
                    value={pt.label || ""}
                    onChange={(e) => updateChartPoint(idx, "label", e.target.value)}
                    placeholder="Nama Periode (e.g. W1)"
                    className="w-1/4 border border-slate-300 rounded p-1 text-xs"
                  />
                  <div className="flex items-center gap-1 w-1/4">
                    <span className="text-[10px] text-rose-600 font-bold">Standar:</span>
                    <input
                      type="number"
                      value={pt.standard}
                      onChange={(e) => updateChartPoint(idx, "standard", e.target.value)}
                      className="w-full border border-slate-300 rounded p-1 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1 w-1/4">
                    <span className="text-[10px] text-amber-600 font-bold">Before:</span>
                    <input
                      type="number"
                      value={pt.before}
                      onChange={(e) => updateChartPoint(idx, "before", e.target.value)}
                      className="w-full border border-slate-300 rounded p-1 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1 w-1/4">
                    <span className="text-[10px] text-emerald-600 font-bold">After:</span>
                    <input
                      type="number"
                      value={pt.after}
                      onChange={(e) => updateChartPoint(idx, "after", e.target.value)}
                      className="w-full border border-slate-300 rounded p-1 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChartPoint(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded"
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
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
