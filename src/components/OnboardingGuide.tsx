"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, X, ChevronRight, Lightbulb } from "lucide-react";

const GUIDE_DISMISSED_KEY = "kaizen_guide_dismissed";

const STEPS_INFO = [
  { step: "Langkah 1", title: "Problem Situation", desc: "Definisikan masalah: apa standar yang berlaku, apa realita di lapangan, berapa besar gap-nya, dan apa dampaknya." },
  { step: "Langkah 2", title: "Break Down Problem", desc: "Uraikan masalah dengan metode 4W1H (What, When, Where, Who) dan kumpulkan data pendukung kuantitatif." },
  { step: "Langkah 3", title: "Target Setting (SMART)", desc: "Tetapkan target terukur: Specific, Measurable, Achievable, Relevant, Time-based. Rumuskan tema proyek resmi." },
  { step: "Langkah 4", title: "Cause Analysis", desc: "Analisis akar masalah: Fishbone 5M+1E (Man, Machine, Method, Material, Environment), validasi Most Potential Cause, dan telusuri dengan 5 Why Analysis." },
  { step: "Langkah 5 & 6", title: "Countermeasure & Implementasi", desc: "Rencanakan perbaikan jangka pendek (darurat) dan jangka panjang (permanen), lalu kelola Action Plan dengan progress tracking." },
  { step: "Langkah 7", title: "Follow Up & Evaluasi", desc: "Periksa hasil: bandingkan data Before vs After, buat grafik tren, dan pilih keputusan tindak lanjut (proliferasi/monitoring/PDCA ulang/eskalasi)." },
  { step: "Langkah 8", title: "Standardization", desc: "Standardisasikan perbaikan ke SOP/WI resmi, dokumentasikan before-after, dan tetapkan PIC pemeliharaan standar." },
];

export const OnboardingGuide: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(true); // default hidden to avoid flash
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(GUIDE_DISMISSED_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  const dismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(GUIDE_DISMISSED_KEY, "true");
  };

  const showAgain = () => {
    setIsDismissed(false);
    localStorage.removeItem(GUIDE_DISMISSED_KEY);
  };

  if (isDismissed) {
    return (
      <button
        onClick={showAgain}
        className="fixed bottom-4 right-4 z-20 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110"
        title="Panduan PDCA 8 Langkah"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-20 w-80 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          <span className="text-sm font-bold">Panduan PDCA 8 Langkah</span>
        </div>
        <button onClick={dismiss} className="text-indigo-200 hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-4 space-y-3">
        <p className="text-xs text-slate-600 leading-relaxed">
          Metode <strong>PDCA 8 Langkah</strong> adalah standar manufaktur untuk mendokumentasikan proyek perbaikan berkelanjutan (Kaizen/Improvement).
          Ikuti langkah 1–8 secara berurutan:
        </p>

        {STEPS_INFO.map((s, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">{s.step}</span>
              <span className="text-xs font-bold text-slate-800">{s.title}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">{s.desc}</p>
          </div>
        ))}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
          <strong>💡 Tips:</strong> Setiap langkah otomatis tersimpan (autosave). Anda bisa navigasi maju-mundur kapan saja. Gunakan tombol &quot;Pratinjau &amp; Export&quot; untuk melihat laporan final dan mengunduh PDF/Word.
        </div>
      </div>
    </div>
  );
};

// Tooltip for inline help
export const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-slate-400 hover:text-indigo-600 cursor-pointer"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {show && (
        <span className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-lg leading-relaxed pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
};
