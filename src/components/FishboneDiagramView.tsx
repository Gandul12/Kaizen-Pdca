"use client";

import React from "react";
import { Fishbone5ME } from "@/types/kaizen";
import { getAutoFontSizeClass } from "@/lib/textFit";

interface FishboneDiagramViewProps {
  fishbone: Fishbone5ME;
  effectTitle: string;
}

export const FishboneDiagramView: React.FC<FishboneDiagramViewProps> = ({
  fishbone,
  effectTitle,
}) => {
  const parsePoints = (text?: string): string[] => {
    if (!text || !text.trim()) return [];
    return text
      .split("\n")
      .map((s) => s.replace(/^[-*•\s]+/, "").trim())
      .filter((s) => s.length > 0);
  };

  const manPoints = parsePoints(fishbone?.man);
  const machinePoints = parsePoints(fishbone?.machine);
  const methodPoints = parsePoints(fishbone?.method);
  const materialPoints = parsePoints(fishbone?.material);
  const environmentPoints = parsePoints(fishbone?.environment);

  // Auto-shrink font size based on text length to prevent clipping in PDF export
  const subtitleClass = getAutoFontSizeClass(effectTitle, [
    { length: 40, className: "text-xs font-medium" },
    { length: 70, className: "text-[10px] font-medium" },
    { length: 100, className: "text-[9px] font-medium" },
  ]);

  const effectBoxClass = getAutoFontSizeClass(effectTitle, [
    { length: 30, className: "text-xs font-black" },
    { length: 55, className: "text-[10px] font-bold" },
    { length: 80, className: "text-[9px] font-bold" },
  ]);

  const renderCategoryPoints = (points: string[]) => {
    if (points.length === 0) {
      return <p className="text-slate-400 font-normal">Belum diidentifikasi</p>;
    }

    return points.map((pt, i) => {
      const pointClass = getAutoFontSizeClass(pt, [
        { length: 35, className: "text-[11px]" },
        { length: 60, className: "text-[10px]" },
        { length: 90, className: "text-[9px]" },
      ]);
      return (
        <p key={i} className={`${pointClass} leading-tight`}>
          • {pt}
        </p>
      );
    });
  };

  return (
    <div className="w-full bg-[#F5F3F8] border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
      <div className="min-w-[820px] max-w-[960px] mx-auto space-y-4 py-2">
        {/* TOP BANNER */}
        <div className="bg-[#582C83] text-white rounded-2xl py-3 px-6 text-center shadow-sm border border-purple-900/20">
          <h2 className="text-xl font-black tracking-widest uppercase font-mono">
            FISHBONE DIAGRAM
          </h2>
          <p className={`text-purple-200 mt-0.5 whitespace-normal break-words ${subtitleClass}`}>
            {effectTitle || "Analisis Akar Masalah (Ishikawa 5M + 1E)"}
          </p>
        </div>

        {/* FISHBONE GRAPHIC SKELETON */}
        <div className="relative py-8 px-4 flex items-center justify-between">
          {/* ── TOP BONES & CHEVRONS ── */}
          <div className="absolute top-0 left-20 right-40 grid grid-cols-3 gap-8">
            {/* MAN */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-[#B39DDB] text-[#311B92] font-black text-xs py-1.5 px-3 text-center uppercase tracking-wider rounded-md shadow-xs flex items-center justify-center font-mono">
                MAN
              </div>
              <div className="w-full text-slate-700 italic space-y-1 mt-2 text-center">
                {renderCategoryPoints(manPoints)}
              </div>
              {/* Slant line down to spine */}
              <div className="w-0.5 h-10 bg-[#582C83] transform rotate-[25deg] origin-top mt-2" />
            </div>

            {/* MACHINE */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-[#7E57C2] text-white font-black text-xs py-1.5 px-3 text-center uppercase tracking-wider rounded-md shadow-xs flex items-center justify-center font-mono">
                MACHINE
              </div>
              <div className="w-full text-slate-700 italic space-y-1 mt-2 text-center">
                {renderCategoryPoints(machinePoints)}
              </div>
              {/* Slant line down to spine */}
              <div className="w-0.5 h-10 bg-[#582C83] transform rotate-[25deg] origin-top mt-2" />
            </div>

            {/* METHOD */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-[#26A69A] text-white font-black text-xs py-1.5 px-3 text-center uppercase tracking-wider rounded-md shadow-xs flex items-center justify-center font-mono">
                METHOD
              </div>
              <div className="w-full text-slate-700 italic space-y-1 mt-2 text-center">
                {renderCategoryPoints(methodPoints)}
              </div>
              {/* Slant line down to spine */}
              <div className="w-0.5 h-10 bg-[#582C83] transform rotate-[25deg] origin-top mt-2" />
            </div>
          </div>

          {/* ── CENTRAL SPINE LINE WITH TAIL & HEAD ── */}
          <div className="w-full flex items-center my-28">
            {/* FISH TAIL (LEFT) */}
            <div className="relative w-12 h-16 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 40 60" className="w-10 h-14 fill-[#582C83]">
                <path d="M 40,30 C 10,0 0,5 0,0 C 15,25 15,35 0,60 C 0,55 10,60 40,30 Z" />
              </svg>
            </div>

            {/* HORIZONTAL SPINE LINE WITH NODES */}
            <div className="flex-1 h-1 bg-[#582C83] relative flex items-center justify-around px-12">
              <div className="w-3.5 h-3.5 bg-[#582C83] rounded-full ring-4 ring-[#F5F3F8]" />
              <div className="w-3.5 h-3.5 bg-[#582C83] rounded-full ring-4 ring-[#F5F3F8]" />
              <div className="w-3.5 h-3.5 bg-[#582C83] rounded-full ring-4 ring-[#F5F3F8]" />
            </div>

            {/* FISH HEAD (RIGHT) */}
            <div className="relative shrink-0 flex items-center">
              <div className="w-44 min-h-[7rem] bg-[#582C83] text-white rounded-r-3xl rounded-l-md p-3 flex flex-col justify-center items-center text-center shadow-md relative overflow-hidden border-l-4 border-purple-900">
                {/* Fish eye dot */}
                <div className="absolute top-3 right-4 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#582C83] rounded-full" />
                </div>
                <span className="text-[9px] font-bold tracking-widest text-purple-200 uppercase block mb-1">
                  AKIBAT / MASALAH
                </span>
                <p className={`leading-snug text-white whitespace-normal break-words ${effectBoxClass}`}>
                  {effectTitle || "MASALAH UTAMA"}
                </p>
              </div>
            </div>
          </div>

          {/* ── BOTTOM BONES & CHEVRONS ── */}
          <div className="absolute bottom-0 left-20 right-40 grid grid-cols-3 gap-8">
            {/* MATERIAL */}
            <div className="flex flex-col items-center">
              {/* Slant line up to spine */}
              <div className="w-0.5 h-10 bg-[#582C83] transform -rotate-[25deg] origin-bottom mb-2" />
              <div className="w-full text-slate-700 italic space-y-1 mb-2 text-center">
                {renderCategoryPoints(materialPoints)}
              </div>
              <div className="w-full bg-[#B39DDB] text-[#311B92] font-black text-xs py-1.5 px-3 text-center uppercase tracking-wider rounded-md shadow-xs flex items-center justify-center font-mono">
                MATERIAL
              </div>
            </div>

            {/* ENVIRONMENT */}
            <div className="flex flex-col items-center">
              {/* Slant line up to spine */}
              <div className="w-0.5 h-10 bg-[#582C83] transform -rotate-[25deg] origin-bottom mb-2" />
              <div className="w-full text-slate-700 italic space-y-1 mb-2 text-center">
                {renderCategoryPoints(environmentPoints)}
              </div>
              <div className="w-full bg-[#7E57C2] text-white font-black text-xs py-1.5 px-3 text-center uppercase tracking-wider rounded-md shadow-xs flex items-center justify-center font-mono">
                ENVIRONMENT
              </div>
            </div>

            {/* MEASUREMENT */}
            <div className="flex flex-col items-center">
              {/* Slant line up to spine */}
              <div className="w-0.5 h-10 bg-[#582C83] transform -rotate-[25deg] origin-bottom mb-2" />
              <div className="w-full text-slate-700 italic space-y-1 mb-2 text-center">
                <p className="text-slate-400 font-normal">Sesuai standar ukur</p>
              </div>
              <div className="w-full bg-[#26A69A] text-white font-black text-xs py-1.5 px-3 text-center uppercase tracking-wider rounded-md shadow-xs flex items-center justify-center font-mono">
                MEASUREMENT
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
