"use client";

import React from "react";
import { Check } from "lucide-react";

export interface StepInfo {
  step: number;
  label: string;
  sublabel: string;
}

export const STEP_DEFINITIONS: StepInfo[] = [
  { step: 1, label: "Langkah 1", sublabel: "Problem Situation" },
  { step: 2, label: "Langkah 2", sublabel: "Break Down Problem" },
  { step: 3, label: "Langkah 3", sublabel: "Target Setting" },
  { step: 4, label: "Langkah 4", sublabel: "Cause Analysis" },
  { step: 5, label: "Langkah 5 & 6", sublabel: "Countermeasure & Implementation" },
  { step: 6, label: "Langkah 7", sublabel: "Follow Up" },
  { step: 7, label: "Langkah 8", sublabel: "Standardization" },
];

interface WizardStepsNavProps {
  activeStep: number;
  onSelectStep: (stepNumber: number) => void;
}

export const WizardStepsNav: React.FC<WizardStepsNavProps> = ({
  activeStep,
  onSelectStep,
}) => {
  const stepsList = [
    { number: 1, title: "1. Problem Situation", subtitle: "Definisikan Masalah" },
    { number: 2, title: "2. Break Down Problem", subtitle: "4W1H & Data Pendukung" },
    { number: 3, title: "3. Target Setting", subtitle: "Prinsip SMART" },
    { number: 4, title: "4. Cause Analysis", subtitle: "5M+1E, 5-Why, Root Cause" },
    { number: 5, title: "5 & 6. Countermeasure", subtitle: "Rencana & Eksekusi Action Plan" },
    { number: 6, title: "7. Follow Up", subtitle: "Evaluasi, Chart, Opsi 4 Pilih" },
    { number: 7, title: "8. Standardization", subtitle: "SOP, Dokumentasi Before-After" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-6 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[760px] gap-2">
        {stepsList.map((st) => {
          const isActive = activeStep === st.number;
          const isCompleted = activeStep > st.number;

          return (
            <button
              key={st.number}
              onClick={() => onSelectStep(st.number)}
              className={`flex-1 flex flex-col items-center text-center py-2 px-2 rounded-lg transition-all duration-200 cursor-pointer relative group ${
                isActive
                  ? "bg-indigo-50 border-2 border-indigo-600 shadow-sm"
                  : isCompleted
                  ? "bg-slate-50 border border-emerald-300 hover:bg-emerald-50/50"
                  : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-500"
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600 group-hover:bg-slate-300"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : st.number}
                </div>
              </div>
              <span
                className={`text-xs font-bold leading-tight line-clamp-1 ${
                  isActive
                    ? "text-indigo-900"
                    : isCompleted
                    ? "text-emerald-900"
                    : "text-slate-700"
                }`}
              >
                {st.title}
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                {st.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
