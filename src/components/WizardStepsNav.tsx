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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-6 overflow-x-auto">
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
              className={`flex-1 flex flex-col items-center text-center py-2 px-2 rounded-lg transition-all duration-200 cursor-pointer relative group ${
                isActive
                  ? "bg-indigo-50 border-2 border-indigo-600 shadow-sm"
                  : isComplete
                  ? "bg-emerald-50/50 border border-emerald-300 hover:bg-emerald-50"
                  : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-500"
              }`}
              title={v?.errors?.join(", ") || ""}
            >
              <div className="flex items-center justify-center mb-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200"
                      : isComplete
                      ? "bg-emerald-600 text-white"
                      : hasErrors && !isActive
                      ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                      : "bg-slate-200 text-slate-600 group-hover:bg-slate-300"
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
                isActive ? "text-indigo-900" : isComplete ? "text-emerald-900" : "text-slate-700"
              }`}>
                {st.title}
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                {st.subtitle}
              </span>
              {isComplete && (
                <span className="text-[9px] text-emerald-600 font-bold mt-0.5">✓ Lengkap</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
