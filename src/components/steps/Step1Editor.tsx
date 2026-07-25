"use client";

import React, { useState } from "react";
import { Step1Data } from "@/types/kaizen";
import { Upload, Trash2, Image as ImageIcon, Info, Plus } from "lucide-react";

interface Step1EditorProps {
  data: Step1Data;
  onChange: (updated: Step1Data) => void;
}

export const Step1Editor: React.FC<Step1EditorProps> = ({ data, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleTextChange = (field: keyof Step1Data, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const newImages = [
          ...(data.images || []),
          {
            id: "img-" + Date.now(),
            url: json.fileUrl,
            caption: file.name,
          },
        ];
        onChange({
          ...data,
          images: newImages,
        });
      }
    } catch (err) {
      console.error("Upload image error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (id: string) => {
    onChange({
      ...data,
      images: (data.images || []).filter((img) => img.id !== id),
    });
  };

  const updateCaption = (id: string, caption: string) => {
    onChange({
      ...data,
      images: (data.images || []).map((img) =>
        img.id === id ? { ...img, caption } : img
      ),
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
          <span className="px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-sm">
            LANGKAH 1
          </span>
          <h2>Problem Situation (Situasi Masalah)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Identifikasi gambaran umum situasi masalah di lapangan, standar acuan, gap yang timbul, serta dampaknya.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Standar */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            1. Standar (Pedoman / Acuan) <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-slate-500 block mb-2">
            Apa spesifikasi, aturan, WI/SOP, atau target acuan resmi yang seharusnya berlaku?
          </span>
          <textarea
            rows={3}
            value={data.standard || ""}
            onChange={(e) => handleTextChange("standard", e.target.value)}
            placeholder="Contoh: Standar toleransi cacat permukaan burr maksimal 0.05 mm sesuai SOP-PRD-102."
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Situasi Terkini */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            2. Situasi Terkini (Realita Lapangan) <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-slate-500 block mb-2">
            Apa kenyataan aktual yang terjadi saat ini di lokasi kerja?
          </span>
          <textarea
            rows={3}
            value={data.currentSituation || ""}
            onChange={(e) => handleTextChange("currentSituation", e.target.value)}
            placeholder="Contoh: Ditemukan burr setinggi 0.25 mm pada 15% hasil produksi Line Stamping 2."
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Gap */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            3. Perbedaan / Gap <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-slate-500 block mb-2">
            Berapa selisih/penyimpangan antara Standar vs Realita Terkini?
          </span>
          <textarea
            rows={3}
            value={data.gap || ""}
            onChange={(e) => handleTextChange("gap", e.target.value)}
            placeholder="Contoh: Terdapat gap ketebalan burr sebesar 0.20 mm berlebih dari batas standar."
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Terjadi Sejak */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            4. Terjadi Sejak (Frekuensi / Periode Waktu)
          </label>
          <span className="text-xs text-slate-500 block mb-2">
            Kapan masalah ini mulai disadari atau berapa frekuensi kemunculannya?
          </span>
          <textarea
            rows={3}
            value={data.sinceWhen || ""}
            onChange={(e) => handleTextChange("sinceWhen", e.target.value)}
            placeholder="Contoh: Terjadi sejak penggantian pisau punching tanggal 12 Oktober (frekuensi 3x per shift)."
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Dampak */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            5. Dampak Masalah (Alasan Perlu Dianalisis Segera)
          </label>
          <span className="text-xs text-slate-500 block mb-2">
            Mengapa masalah ini penting untuk diselesaikan? (Efek ke Biaya, Kualitas, Delivery, Safety, Morale).
          </span>
          <textarea
            rows={2}
            value={data.impact || ""}
            onChange={(e) => handleTextChange("impact", e.target.value)}
            placeholder="Contoh: Mengakibatkan claim konsumen, biaya deburring manual sebesar Rp 12 Juta/bulan, serta penundaan pengiriman 2 hari."
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Foto / Lampiran Visual Situasi Terkini */}
      <div className="border-t border-slate-200 pt-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              Dokumentasi Foto Situasi Terkini (Problem Images)
            </h3>
            <p className="text-xs text-slate-500">
              Unggah foto kondisi awal / bukti fisik masalah untuk melengkapi dokumen.
            </p>
          </div>

          <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg border border-indigo-200 flex items-center gap-1.5 transition-colors">
            <Plus className="w-4 h-4" />
            {isUploading ? "Mengunggah..." : "Tambah Foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>

        {data.images && data.images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {data.images.map((img) => (
              <div
                key={img.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between"
              >
                <div className="relative aspect-video bg-slate-200 rounded overflow-hidden mb-2">
                  <img
                    src={img.url}
                    alt={img.caption || "Problem Situation"}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow transition-colors"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={img.caption || ""}
                  onChange={(e) => updateCaption(img.id, e.target.value)}
                  placeholder="Keterangan Foto..."
                  className="text-xs border border-slate-300 rounded p-1.5 bg-white w-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 text-xs">
            Belum ada foto kondisi terkini yang diunggah. Klik &quot;Tambah Foto&quot; di atas.
          </div>
        )}
      </div>
    </div>
  );
};
