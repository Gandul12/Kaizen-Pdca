"use client";

import React from "react";
import { Step5And6Data, ActionPlanRow } from "@/types/kaizen";
import { Wrench, Plus, Trash2, Clock, CheckSquare } from "lucide-react";

interface Step5And6EditorProps {
  data: Step5And6Data;
  onChange: (updated: Step5And6Data) => void;
}

export const Step5And6Editor: React.FC<Step5And6EditorProps> = ({
  data,
  onChange,
}) => {
  const handleTextChange = (field: keyof Step5And6Data, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const addActionPlanRow = () => {
    const newRow: ActionPlanRow = {
      id: "act-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      plan: "",
      area: "",
      pic: "",
      targetDate: "",
      progress: 0,
    };
    onChange({
      ...data,
      actionPlans: [...(data.actionPlans || []), newRow],
    });
  };

  const removeActionPlanRow = (id: string) => {
    onChange({
      ...data,
      actionPlans: (data.actionPlans || []).filter((row) => row.id !== id),
    });
  };

  const updateActionPlanRow = (
    id: string,
    field: keyof ActionPlanRow,
    value: any
  ) => {
    onChange({
      ...data,
      actionPlans: (data.actionPlans || []).map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      ),
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
          <span className="px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-sm">
            LANGKAH 5 & 6
          </span>
          <h2>Countermeasure & Implementation (Rencana Perbaikan & Eksekusi)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Rencanakan tindakan penanggulangan jangka pendek dan jangka panjang, serta kelola detail Action Plan beserta progres implementasinya.
        </p>
      </div>

      {/* Summaries: Short Term & Long Term */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Short Term */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
          <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-700" />
            1. Perbaikan Jangka Pendek (Short-Term Action / Temporary)
          </label>
          <span className="text-[11px] text-amber-800/80 block mb-2">
            Tindakan cepat darurat untuk menghentikan / mengisolasi masalah saat ini.
          </span>
          <textarea
            rows={3}
            value={data.shortTermPlan || ""}
            onChange={(e) => handleTextChange("shortTermPlan", e.target.value)}
            placeholder="e.g. Melakukan regrinding pisau punch secara manual & 100% sorting visual pada lot berjalan."
            className="w-full border border-amber-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Long Term */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
          <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-emerald-700" />
            2. Perbaikan Jangka Panjang (Long-Term Action / Permanent)
          </label>
          <span className="text-[11px] text-emerald-800/80 block mb-2">
            Tindakan pencegahan permanen agar masalah yang sama tidak berulang.
          </span>
          <textarea
            rows={3}
            value={data.longTermPlan || ""}
            onChange={(e) => handleTextChange("longTermPlan", e.target.value)}
            placeholder="e.g. Memasang counter digital stroke otomatis & membuat sistem Preventive Maintenance asah pisau tiap 40,000 stroke."
            className="w-full border border-emerald-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Dynamic Action Plan Detail Table */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-600" />
              3. Tabel Detail Action Plan & Status Implementasi Progress
            </h3>
            <p className="text-xs text-slate-500">
              Daftar rinci langkah eksekusi, penanggung jawab, tanggal target (ETC), dan persentase progress.
            </p>
          </div>

          <button
            type="button"
            onClick={addActionPlanRow}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Action Plan
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3 min-w-[220px]">Rincian Action Plan</th>
                <th className="p-3 min-w-[120px]">Area / Lini</th>
                <th className="p-3 min-w-[120px]">PIC</th>
                <th className="p-3 min-w-[120px]">Target (ETC)</th>
                <th className="p-3 min-w-[180px]">Status Progress (%)</th>
                <th className="p-3 w-10 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.actionPlans && data.actionPlans.length > 0 ? (
                data.actionPlans.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center font-semibold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.plan || ""}
                        onChange={(e) => updateActionPlanRow(row.id, "plan", e.target.value)}
                        placeholder="Detail tindakan..."
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.area || ""}
                        onChange={(e) => updateActionPlanRow(row.id, "area", e.target.value)}
                        placeholder="Area"
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.pic || ""}
                        onChange={(e) => updateActionPlanRow(row.id, "pic", e.target.value)}
                        placeholder="Nama PIC"
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={row.targetDate || ""}
                        onChange={(e) => updateActionPlanRow(row.id, "targetDate", e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={row.progress ?? 0}
                            onChange={(e) =>
                              updateActionPlanRow(row.id, "progress", Number(e.target.value))
                            }
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                          <span className="font-bold text-slate-800 w-12 text-right">
                            {row.progress ?? 0}%
                          </span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              (row.progress ?? 0) === 100
                                ? "bg-emerald-500"
                                : (row.progress ?? 0) >= 50
                                ? "bg-indigo-600"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${row.progress ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeActionPlanRow(row.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors"
                        title="Hapus Action Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Belum ada Action Plan. Klik &quot;Tambah Action Plan&quot; untuk menambahkan.
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
