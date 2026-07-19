"use client";

import React from "react";
import { Step2Data, SupportingDataRow } from "@/types/kaizen";
import { Plus, Trash2, Table, LayoutList } from "lucide-react";

interface Step2EditorProps {
  data: Step2Data;
  onChange: (updated: Step2Data) => void;
}

export const Step2Editor: React.FC<Step2EditorProps> = ({ data, onChange }) => {
  const handle4WChange = (field: keyof Step2Data["fourWOneH"], value: string) => {
    onChange({
      ...data,
      fourWOneH: {
        ...data.fourWOneH,
        [field]: value,
      },
    });
  };

  const addSupportingRow = () => {
    const newRow: SupportingDataRow = {
      id: "sup-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      area: "",
      eventDate: "",
      category: "",
      detailModel: "",
      quantity: "",
    };
    onChange({
      ...data,
      supportingData: [...(data.supportingData || []), newRow],
    });
  };

  const removeSupportingRow = (id: string) => {
    onChange({
      ...data,
      supportingData: (data.supportingData || []).filter((row) => row.id !== id),
    });
  };

  const updateSupportingRow = (
    id: string,
    field: keyof SupportingDataRow,
    value: string
  ) => {
    onChange({
      ...data,
      supportingData: (data.supportingData || []).map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      ),
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
          <span className="px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-sm">
            LANGKAH 2
          </span>
          <h2>Break Down the Problem (Memilah/Uraian Masalah)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Uraikan detail masalah secara terstruktur dengan analisis 4W1H serta tabel data pendukung kuantitatif.
        </p>
      </div>

      {/* 1. Matrix What-When-Where-Who */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <LayoutList className="w-4 h-4 text-indigo-600" />
          1. Tabel Uraian Masalah (What, When, Where, Who)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              WHAT (Apa objek masalah & jenis cacat yang terjadi?)
            </label>
            <textarea
              rows={2}
              value={data.fourWOneH?.what || ""}
              onChange={(e) => handle4WChange("what", e.target.value)}
              placeholder="e.g. Cacat tajam (burr) berlebihan pada lubang mounting bracket."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              WHEN (Kapan waktu spesifik masalah sering muncul?)
            </label>
            <textarea
              rows={2}
              value={data.fourWOneH?.when || ""}
              onChange={(e) => handle4WChange("when", e.target.value)}
              placeholder="e.g. Saat pergantian shift malam dan setelah produksi 5.000 stroke."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              WHERE (Di mana lokasi/stasiun/mesin spesifik kejadian?)
            </label>
            <textarea
              rows={2}
              value={data.fourWOneH?.where || ""}
              onChange={(e) => handle4WChange("where", e.target.value)}
              placeholder="e.g. Mesin Stamping 200 Ton, Die Set B-12, Station Piercing."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              WHO (Siapa operator/pihak yang mengalami/menemukan?)
            </label>
            <textarea
              rows={2}
              value={data.fourWOneH?.who || ""}
              onChange={(e) => handle4WChange("who", e.target.value)}
              placeholder="e.g. Operator Stamping Shift 2 dan QC Inspector Line Assembly."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Dynamic Table for Supporting Data */}
      <div className="border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-600" />
              2. Tabel Data Pendukung (Dynamic Multi-Row)
            </h3>
            <p className="text-xs text-slate-500">
              Rincikan log kejadian, frekuensi, atau distribusi data numerik pendukung.
            </p>
          </div>

          <button
            type="button"
            onClick={addSupportingRow}
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
                <th className="p-3 min-w-[120px]">Area / Sub-line</th>
                <th className="p-3 min-w-[120px]">Tanggal Kejadian</th>
                <th className="p-3 min-w-[140px]">Tipe / Kategori Cacat</th>
                <th className="p-3 min-w-[160px]">Detail / Part Model</th>
                <th className="p-3 min-w-[100px]">Kuantitas (Qty)</th>
                <th className="p-3 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.supportingData && data.supportingData.length > 0 ? (
                data.supportingData.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center font-semibold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.area || ""}
                        onChange={(e) => updateSupportingRow(row.id, "area", e.target.value)}
                        placeholder="Area/Station"
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={row.eventDate || ""}
                        onChange={(e) => updateSupportingRow(row.id, "eventDate", e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.category || ""}
                        onChange={(e) => updateSupportingRow(row.id, "category", e.target.value)}
                        placeholder="e.g. Burr, Dent, Scratch"
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.detailModel || ""}
                        onChange={(e) => updateSupportingRow(row.id, "detailModel", e.target.value)}
                        placeholder="Model / Part No."
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.quantity || ""}
                        onChange={(e) => updateSupportingRow(row.id, "quantity", e.target.value)}
                        placeholder="e.g. 150 pcs"
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeSupportingRow(row.id)}
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
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Belum ada data pendukung. Klik &quot;Tambah Baris&quot; untuk menambahkan data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
