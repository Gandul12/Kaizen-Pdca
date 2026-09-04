"use client";

import React, { useState, useMemo } from "react";
import { KaizenProject, KaizenContent } from "@/types/kaizen";
import { generateKaizenPptx } from "@/lib/pptxExport";
import { PPTX_COLOR_PRESETS, PptxColorPreset, DEFAULT_PRESET } from "@/lib/pptxColorPresets";
import { X, Download, AlertTriangle } from "lucide-react";

interface PptxExportModalProps {
  project: KaizenProject;
  isOpen: boolean;
  onClose: () => void;
}

export const PptxExportModal: React.FC<PptxExportModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PptxColorPreset>(DEFAULT_PRESET);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Hitung jumlah step yang terisi
  const filledStepsCount = useMemo(() => {
    const content = project.content;
    let count = 0;

    // Step 1
    if (content.step1?.standard || content.step1?.currentSituation || content.step1?.gap) count++;
    // Step 2
    if (content.step2?.fourWOneH?.what || content.step2?.fourWOneH?.when || 
        content.step2?.fourWOneH?.where || content.step2?.fourWOneH?.who) count++;
    // Step 3
    if (content.step3?.projectTheme || content.step3?.smart?.specific || 
        content.step3?.smart?.measurable || content.step3?.smart?.achievable || 
        content.step3?.smart?.relevant || content.step3?.smart?.timeBased) count++;
    // Step 4
    if (content.step4?.fishbone?.man || content.step4?.fishbone?.machine || 
        content.step4?.fishbone?.method || content.step4?.fishbone?.material || 
        content.step4?.fishbone?.environment || content.step4?.fiveWhys?.why1) count++;
    // Step 5&6
    if (content.step5_6?.actionPlans?.some(ap => ap.plan)) count++;
    // Step 7
    if (content.step7?.testResultSummary || 
        (content.step7?.chartData && content.step7.chartData.some(cd => cd.before || cd.after))) count++;
    // Step 8
    if (content.step8?.beforeCondition || content.step8?.afterCondition || 
        (content.step8?.documentsCreated && content.step8.documentsCreated.some(d => d.docName))) count++;

    return count;
  }, [project.content]);

  const handleDownload = async () => {
    // Cek threshold
    if (filledStepsCount < 4) {
      setShowWarning(true);
      return;
    }

    setIsGenerating(true);
    try {
      await generateKaizenPptx(project, selectedPreset);
      // Log export activity
      fetch(`/api/kaizen/${project.id}/log-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportType: "pptx" }),
      }).catch(() => {});
    } catch (error) {
      console.error("PPTX export error:", error);
      alert("Gagal export PPTX. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  const handleConfirmDownload = async () => {
    setShowWarning(false);
    setIsGenerating(true);
    try {
      await generateKaizenPptx(project, selectedPreset);
      // Log export activity
      fetch(`/api/kaizen/${project.id}/log-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportType: "pptx" }),
      }).catch(() => {});
    } catch (error) {
      console.error("PPTX export error:", error);
      alert("Gagal export PPTX. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-[#0D1B30] rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Export ke PowerPoint</h2>
        <p className="text-xs text-slate-400 mb-6">
          Pilih tema warna dan download presentasi PPTX yang adaptif sesuai data proyek Anda.
        </p>

        {/* Warning Dialog */}
        {showWarning && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-200 font-semibold mb-2">
                Baru {filledStepsCount} dari 8 langkah terisi
              </p>
              <p className="text-xs text-amber-100/80 mb-3">
                PPTX yang dihasilkan akan pendek dan mungkin tidak lengkap. 
                Apakah Anda ingin melanjutkan atau melengkapi data terlebih dahulu?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmDownload}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  Lanjutkan Download
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  Batal, Lengkapi Dulu
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Preview Slide */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-3">Preview Slide Cover</h3>
            <div
              className="aspect-video rounded-lg border-2 border-slate-700 overflow-hidden relative"
              style={{ backgroundColor: `#${selectedPreset.bgPrimary}` }}
            >
              {/* Label kecil */}
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 text-xs font-bold"
                style={{ color: `#${selectedPreset.accent}` }}
              >
                PROYEK KAIZEN MELALUI PENDEKATAN PDCA
              </div>

              {/* Judul */}
              <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-2xl font-bold px-4"
                style={{ color: `#${selectedPreset.textLight}` }}
              >
                {project.title || "Judul Proyek"}
              </div>

              {/* Info */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 text-xs"
                style={{ color: `#${selectedPreset.textLight}` }}
              >
                <span>{project.department || "Departemen"}</span>
                <span>•</span>
                <span>{project.leader || "PIC"}</span>
              </div>

              {/* Badge status */}
              <div
                className="absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-bold"
                style={{ backgroundColor: `#${selectedPreset.accent}`, color: `#${selectedPreset.bgPrimary}` }}
              >
                {project.status || "Draft"}
              </div>
            </div>
          </div>

          {/* Right: Color Presets */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-3">Pilih Tema Warna</h3>
            <div className="grid grid-cols-2 gap-3">
              {PPTX_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedPreset.id === preset.id
                      ? "border-white bg-slate-800"
                      : "border-slate-700 bg-slate-900 hover:border-slate-500"
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: `#${preset.bgPrimary}` }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: `#${preset.bgSecondary}` }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: `#${preset.accent}` }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: `#${preset.textLight}` }} />
                  </div>
                  <p className="text-xs font-bold text-white">{preset.name}</p>
                  <p className="text-[10px] text-slate-400">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Download button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white text-sm font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? "Memproses..." : "Download PPTX"}
          </button>
        </div>
      </div>
    </div>
  );
};
