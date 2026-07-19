"use client";

import React from "react";
import { Step3Data, SmartPrinciples } from "@/types/kaizen";
import { Target, CheckCircle2, Sparkles } from "lucide-react";

interface Step3EditorProps {
  data: Step3Data;
  onChange: (updated: Step3Data) => void;
}

export const Step3Editor: React.FC<Step3EditorProps> = ({ data, onChange }) => {
  const handleSmartChange = (field: keyof SmartPrinciples, value: string) => {
    onChange({
      ...data,
      smart: {
        ...data.smart,
        [field]: value,
      },
    });
  };

  const handleFieldChange = (field: keyof Step3Data, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
          <span className="px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-sm">
            LANGKAH 3
          </span>
          <h2>Target Setting (Penetapan Target Improvement)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Tetapkan target kuantitatif dan kualitatif berdasarkan prinsip SMART serta susun kalimat Tema Proyek resmi.
        </p>
      </div>

      {/* SMART Grid Columns */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          1. Matriks Prinsip SMART (5 Kolom Teks)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Specific */}
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-lg p-3">
            <label className="block text-xs font-bold text-indigo-900 mb-1">
              S — Specific
            </label>
            <span className="text-[10px] text-slate-500 block mb-1">
              Fokus masalah spesifik
            </span>
            <textarea
              rows={3}
              value={data.smart?.specific || ""}
              onChange={(e) => handleSmartChange("specific", e.target.value)}
              placeholder="Menurunkan persentase defect burr pada Line Stamping 2"
              className="w-full border border-indigo-200 rounded p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Measurable */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3">
            <label className="block text-xs font-bold text-emerald-900 mb-1">
              M — Measurable
            </label>
            <span className="text-[10px] text-slate-500 block mb-1">
              Angka target terukur
            </span>
            <textarea
              rows={3}
              value={data.smart?.measurable || ""}
              onChange={(e) => handleSmartChange("measurable", e.target.value)}
              placeholder="Dari 15% (0.25mm) turun menjadi 0% (max 0.05mm)"
              className="w-full border border-emerald-200 rounded p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Achievable */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3">
            <label className="block text-xs font-bold text-amber-900 mb-1">
              A — Achievable
            </label>
            <span className="text-[10px] text-slate-500 block mb-1">
              Kemampuan / Sumberdaya
            </span>
            <textarea
              rows={3}
              value={data.smart?.achievable || ""}
              onChange={(e) => handleSmartChange("achievable", e.target.value)}
              placeholder="Dapat dicapai dengan penggantian die clearance & grinding pisau"
              className="w-full border border-amber-200 rounded p-2 text-xs bg-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Relevant */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
            <label className="block text-xs font-bold text-blue-900 mb-1">
              R — Relevant
            </label>
            <span className="text-[10px] text-slate-500 block mb-1">
              Sesuai KPI Plant / Dept
            </span>
            <textarea
              rows={3}
              value={data.smart?.relevant || ""}
              onChange={(e) => handleSmartChange("relevant", e.target.value)}
              placeholder="Mendukung KPI zero claim customer dan efisiensi biaya"
              className="w-full border border-blue-200 rounded p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time-based */}
          <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-3">
            <label className="block text-xs font-bold text-purple-900 mb-1">
              T — Time-based
            </label>
            <span className="text-[10px] text-slate-500 block mb-1">
              Batas waktu penyelesaian
            </span>
            <textarea
              rows={3}
              value={data.smart?.timeBased || ""}
              onChange={(e) => handleSmartChange("timeBased", e.target.value)}
              placeholder="Selesai tuntas dalam waktu 30 hari (30 November 2025)"
              className="w-full border border-purple-200 rounded p-2 text-xs bg-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Target Key Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-5">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Peningkatan (Apa Tindakan Utama yang Dilakukan)
          </label>
          <input
            type="text"
            value={data.improvement || ""}
            onChange={(e) => handleFieldChange("improvement", e.target.value)}
            placeholder="e.g. Menurunkan defect rate burr Stamping Line 2"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Ditingkatkan Menjadi (Target Akhir Terukur)
          </label>
          <input
            type="text"
            value={data.targetValue || ""}
            onChange={(e) => handleFieldChange("targetValue", e.target.value)}
            placeholder="e.g. 0 PPM (Zero Defect Burr)"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-semibold text-emerald-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Tanggal Penyelesaian Target
          </label>
          <input
            type="date"
            value={data.completionDate || ""}
            onChange={(e) => handleFieldChange("completionDate", e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Final Synthesized Project Theme Statement */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-4 border border-indigo-700">
        <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Kalimat Formulasi Tema Proyek (Gabungan Target + Objek Masalah)
        </label>
        <p className="text-[11px] text-slate-300 mb-2">
          Format standar manufaktur: [Kata Kerja Peningkatan] + [Kuantitas Target] + [Objek Masalah / Area] + [Batas Waktu]
        </p>
        <input
          type="text"
          value={data.projectTheme || ""}
          onChange={(e) => handleFieldChange("projectTheme", e.target.value)}
          placeholder="e.g. Menurunkan Rate Defect Burr dari 15% Menjadi 0% pada Line Stamping 2 dalam Waktu 1 Bulan"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-amber-200 font-medium focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />
      </div>
    </div>
  );
};
