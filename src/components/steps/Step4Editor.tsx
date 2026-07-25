"use client";

import React, { useState } from "react";
import {
  Step4Data,
  Fishbone5ME,
  PotentialCauseRow,
  FiveWhys,
} from "@/types/kaizen";
import {
  GitCommit,
  Plus,
  Trash2,
  HelpCircle,
  Upload,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from "lucide-react";

interface Step4EditorProps {
  data: Step4Data;
  onChange: (updated: Step4Data) => void;
}

export const Step4Editor: React.FC<Step4EditorProps> = ({ data, onChange }) => {
  const [showOptionalWhys, setShowOptionalWhys] = useState(
    !!(data.fiveWhys?.why4 || data.fiveWhys?.why5)
  );
  const [isUploading, setIsUploading] = useState(false);

  const handleFishboneChange = (field: keyof Fishbone5ME, value: string) => {
    onChange({
      ...data,
      fishbone: {
        ...data.fishbone,
        [field]: value,
      },
    });
  };

  const handleFiveWhysChange = (field: keyof FiveWhys, value: string) => {
    onChange({
      ...data,
      fiveWhys: {
        ...data.fiveWhys,
        [field]: value,
      },
    });
  };

  const addPotentialCause = () => {
    const newRow: PotentialCauseRow = {
      id: "pot-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      cause: "",
      checkMethod: "",
      result: "",
    };
    onChange({
      ...data,
      mostPotentialCauses: [...(data.mostPotentialCauses || []), newRow],
    });
  };

  const removePotentialCause = (id: string) => {
    onChange({
      ...data,
      mostPotentialCauses: (data.mostPotentialCauses || []).filter(
        (row) => row.id !== id
      ),
    });
  };

  const updatePotentialCause = (
    id: string,
    field: keyof PotentialCauseRow,
    value: string
  ) => {
    onChange({
      ...data,
      mostPotentialCauses: (data.mostPotentialCauses || []).map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      ),
    });
  };

  const handleFishboneUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          fishboneImage: json.fileUrl,
        });
      }
    } catch (err) {
      console.error("Fishbone image upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
          <span className="px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-sm">
            LANGKAH 4
          </span>
          <h2>Cause Analysis (Analisis Penyebab & Akar Masalah)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Lakukan analisis terstruktur menggunakan Fishbone Diagram (5M+1E), identifikasi Most Potential Causes, dan temukan Root Cause lewat 5 Why Analysis.
        </p>
      </div>

      {/* 4.1 Fishbone Diagram 5M+1E */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-indigo-600" />
            4.1 Analisis Diagram Fishbone (Ishikawa 5M + 1E)
          </h3>

          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            {isUploading ? "Mengunggah..." : "Upload Diagram Fishbone"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFishboneUpload}
              disabled={isUploading}
            />
          </label>
        </div>

        {/* 5 Columns for 5M+E */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Man */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <label className="block text-xs font-bold text-indigo-900 mb-1">
              MAN (Manusia / SDM)
            </label>
            <span className="text-[10px] text-slate-500 block mb-1">
              Skill, kepatuhan, fatigue, pelatihan
            </span>
            <textarea
              rows={4}
              value={data.fishbone?.man || ""}
              onChange={(e) => handleFishboneChange("man", e.target.value)}
              placeholder="- Operator belum terlatih setting clearance&#10;- Kurang ketelitian cek visual"
              className="w-full border border-slate-300 rounded p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Machine */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <label className="block text-xs font-bold text-indigo-900 mb-1">
              MACHINE (Mesin / Tooling)
            </label>
            <span className="text-[10px] text-slate-500 block mb-1">
              Kondisi die, aus, vibrasi, pressure
            </span>
            <textarea
              rows={4}
              value={data.fishbone?.machine || ""}
              onChange={(e) => handleFishboneChange("machine", e.target.value)}
              placeholder="- Pisau punch aus berlebihan&#10;- Clearance die longgar 0.1mm"
              className="w-full border border-slate-300 rounded p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Method */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <label className="block text-xs font-bold text-indigo-900 mb-1">
              METHOD (Metode Kerja)
            </label>
            <span className="text-[10px] text-slate-500 block mb-1">
              WI/SOP, urutan proses, frekuensi cek
            </span>
            <textarea
              rows={4}
              value={data.fishbone?.method || ""}
              onChange={(e) => handleFishboneChange("method", e.target.value)}
              placeholder="- Belum ada jadwal asah pisau berkala&#10;- Standar pengecekan burr belum jelas"
              className="w-full border border-slate-300 rounded p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Material */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <label className="block text-xs font-bold text-indigo-900 mb-1">
              MATERIAL (Bahan Baku)
            </label>
            <span className="text-[10px] text-slate-500 block mb-1">
              Kekerasan, ketebalan, variasi lot
            </span>
            <textarea
              rows={4}
              value={data.fishbone?.material || ""}
              onChange={(e) => handleFishboneChange("material", e.target.value)}
              placeholder="- Ketebalan plat fluktuatif ±0.1mm&#10;- Kekerasan material agak tinggi"
              className="w-full border border-slate-300 rounded p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Environment */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <label className="block text-xs font-bold text-indigo-900 mb-1">
              ENVIRONMENT (Lingkungan)
            </label>
            <span className="text-[10px] text-slate-500 block mb-1">
              Pencahayaan, temperatur, kebersihan
            </span>
            <textarea
              rows={4}
              value={data.fishbone?.environment || ""}
              onChange={(e) => handleFishboneChange("environment", e.target.value)}
              placeholder="- Penerangan area inspeksi redup (< 300 Lux)"
              className="w-full border border-slate-300 rounded p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Display Uploaded Fishbone Graphic */}
        {data.fishboneImage && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Gambar Diagram Fishbone Terunggah:
              </span>
              <button
                type="button"
                onClick={() => onChange({ ...data, fishboneImage: "" })}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Gambar
              </button>
            </div>
            <img
              src={data.fishboneImage}
              alt="Fishbone Diagram"
              className="max-h-64 object-contain mx-auto rounded border"
            />
          </div>
        )}
      </div>

      {/* 4.2 Most Potential Causes */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              4.2 Most Potential Causes (Penentuan Penyebab Paling Potensial)
            </h3>
            <p className="text-xs text-slate-500">
              Verifikasi faktor-faktor dari Fishbone dengan metode pengecekan dan bukti aktual.
            </p>
          </div>

          <button
            type="button"
            onClick={addPotentialCause}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Baris
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3 min-w-[200px]">Penyebab Potensial</th>
                <th className="p-3 min-w-[200px]">Metode Pengecekan / Verifikasi</th>
                <th className="p-3 min-w-[180px]">Hasil Verifikasi (OK / NG / Valid)</th>
                <th className="p-3 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.mostPotentialCauses && data.mostPotentialCauses.length > 0 ? (
                data.mostPotentialCauses.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center font-semibold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.cause || ""}
                        onChange={(e) => updatePotentialCause(row.id, "cause", e.target.value)}
                        placeholder="e.g. Clearance pisau punch tidak presisi"
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.checkMethod || ""}
                        onChange={(e) => updatePotentialCause(row.id, "checkMethod", e.target.value)}
                        placeholder="e.g. Pengukuran feeler gauge clearance die"
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.result || ""}
                        onChange={(e) => updatePotentialCause(row.id, "result", e.target.value)}
                        placeholder="e.g. NG (Clearance terukur 0.15mm vs Standar 0.05mm)"
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removePotentialCause(row.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors"
                        title="Hapus Baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    Belum ada penyebab potensial. Klik &quot;Tambah Baris&quot; untuk menambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4.3 Root Causes (5 Why) */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              4.3 Root Cause Analysis (5 Why Analysis)
            </h3>
            <p className="text-xs text-slate-500">
              Telusuri penyebab terverifikasi secara mendalam sampai menemukan akar permasalahan sesungguhnya.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowOptionalWhys(!showOptionalWhys)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            {showOptionalWhys ? (
              <>
                Sembunyikan WHY 4 & 5 <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Tampilkan WHY 4 & 5 (Opsional) <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              WHY 1: Mengapa masalah utama terjadi?
            </label>
            <input
              type="text"
              value={data.fiveWhys?.why1 || ""}
              onChange={(e) => handleFiveWhysChange("why1", e.target.value)}
              placeholder="e.g. Mengapa timbul defect burr? -> Karena clearance pisau punch melebar."
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              WHY 2: Mengapa hal pada WHY 1 bisa terjadi?
            </label>
            <input
              type="text"
              value={data.fiveWhys?.why2 || ""}
              onChange={(e) => handleFiveWhysChange("why2", e.target.value)}
              placeholder="e.g. Mengapa clearance melebar? -> Karena pisau punch aus dan tidak presisi."
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              WHY 3: Mengapa hal pada WHY 2 terjadi?
            </label>
            <input
              type="text"
              value={data.fiveWhys?.why3 || ""}
              onChange={(e) => handleFiveWhysChange("why3", e.target.value)}
              placeholder="e.g. Mengapa pisau aus berlebihan? -> Karena melebihi batas siklus pemakaian (50,000 stroke)."
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {showOptionalWhys && (
            <>
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WHY 4 (Opsional): Mengapa hal pada WHY 3 terjadi?
                </label>
                <input
                  type="text"
                  value={data.fiveWhys?.why4 || ""}
                  onChange={(e) => handleFiveWhysChange("why4", e.target.value)}
                  placeholder="e.g. Mengapa tidak diasah sebelum 50,000 stroke? -> Tidak ada alarm indikator / jadwal perawatan."
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WHY 5 (Opsional): Mengapa hal pada WHY 4 terjadi?
                </label>
                <input
                  type="text"
                  value={data.fiveWhys?.why5 || ""}
                  onChange={(e) => handleFiveWhysChange("why5", e.target.value)}
                  placeholder="e.g. Mengapa belum ada jadwal? -> Sistem Preventive Maintenance tool belum mencakup hitungan stroke."
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {/* Root Cause Conclusion */}
          <div className="pt-3 border-t-2 border-indigo-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
              Akar Permasalahan Keseluruhan (Root Cause Final Conclusion)
            </label>
            <textarea
              rows={2}
              value={data.fiveWhys?.rootCause || ""}
              onChange={(e) => handleFiveWhysChange("rootCause", e.target.value)}
              placeholder="Kesimpulan akhir akar masalah: Belum tersedianya standar sistem Preventive Maintenance berdasarkan counter stroke pisau stamping."
              className="w-full border-2 border-rose-300 rounded-lg p-2.5 text-xs bg-rose-50/40 text-slate-900 font-semibold focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
