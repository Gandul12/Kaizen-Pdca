"use client";

import React from "react";
import { Check, AlertCircle } from "lucide-react";
import { StepValidation } from "@/types/kaizen";

interface WizardStepsNavProps {
  activeStep: number;
  onSelectStep: (stepNumber: number) => void;
  validations?: StepValidation[];
}

const STEP_LABELS = [
  { number: 1, title: "1. Problem", subtitle: "Situasi Masalah" },
  { number: 2, title: "2. Breakdown", subtitle: "4W1H & Data" },
  { number: 3, title: "3. Target", subtitle: "Prinsip SMART" },
  { number: 4, title: "4. Cause", subtitle: "5M+E, 5-Why" },
  { number: 5, title: "5&6. Action", subtitle: "Rencana & Eksekusi" },
  { number: 6, title: "7. Follow Up", subtitle: "Evaluasi Hasil" },
  { number: 7, title: "8. Standar", subtitle: "SOP & Dokumentasi" },
];

export const WizardStepsNav: React.FC<WizardStepsNavProps> = ({
  activeStep, onSelectStep, validations,
}) => {
  return (
    <div className="bg-[#101f36] rounded-2xl shadow-xl border border-[#8fa3bd]/16 p-3 mb-6 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[760px] gap-2">
        {STEP_LABELS.map((st) => {
          const isActive = activeStep === st.number;
          const v = validations?.find((vv) => vv.step === st.number);
          const isComplete = v?.isComplete ?? false;
          const hasErrors = v ? v.errors.length > 0 : false;

          return (
            <button
              key={st.number}
              onClick={() => onSelectStep(st.number)}
              className={`flex-1 flex flex-col items-center text-center py-2.5 px-2 rounded-xl transition-all duration-200 cursor-pointer relative group ${
                isActive
                  ? "bg-[#16304f] border-2 border-[#1fb6a8] shadow-md"
                  : isComplete
                  ? "bg-[#1fb6a8]/10 border border-[#1fb6a8]/30 hover:bg-[#1fb6a8]/20"
                  : "bg-[#0d1b30]/60 border border-[#8fa3bd]/15 hover:bg-[#16304f]/40 text-[#8fa3bd]"
              }`}
              title={v?.errors?.join(", ") || ""}
            >
              <div className="flex items-center justify-center mb-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-[#1fb6a8] text-[#050b16] shadow-md ring-2 ring-[#5fe8d8]/40"
                      : isComplete
                      ? "bg-[#1fb6a8] text-[#050b16]"
                      : hasErrors && !isActive
                      ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                      : "bg-[#16304f] text-[#8fa3bd] group-hover:bg-[#16304f]/80"
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : hasErrors && !isActive ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    st.number
                  )}
                </div>
              </div>

              <span className={`text-xs font-bold leading-tight line-clamp-1 ${
                isActive ? "text-[#5fe8d8]" : isComplete ? "text-emerald-300" : "text-slate-200"
              }`}>
                {st.title}
              </span>

              <span className="text-[10px] text-[#8fa3bd] line-clamp-1 mt-0.5 font-medium">
                {st.subtitle}
              </span>

              {isComplete && (
                <span className="text-[9px] text-[#5fe8d8] font-bold mt-0.5">✓ Lengkap</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
