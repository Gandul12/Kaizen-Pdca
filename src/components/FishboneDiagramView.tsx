"use client";

import React from "react";
import { Fishbone5ME } from "@/types/kaizen";
import { User, Settings, Wrench, Box, Cloud, Compass } from "lucide-react";

interface FishboneDiagramViewProps {
  fishbone: Fishbone5ME;
  effectTitle: string;
}

export const FishboneDiagramView: React.FC<FishboneDiagramViewProps> = ({
  fishbone,
  effectTitle,
}) => {
  const topCategories = [
    {
      key: "man",
      title: "MAN",
      sub: "Manusia / SDM",
      icon: User,
      content: fishbone?.man || "",
      bg: "bg-white",
      border: "border-slate-200",
      iconBg: "bg-slate-100 text-slate-700",
    },
    {
      key: "method",
      title: "METHOD",
      sub: "Metode Kerja",
      icon: Settings,
      content: fishbone?.method || "",
      bg: "bg-white",
      border: "border-slate-200",
      iconBg: "bg-slate-100 text-slate-700",
    },
  ];

  const bottomCategories = [
    {
      key: "machine",
      title: "MACHINE",
      sub: "Mesin / Tooling",
      icon: Wrench,
      content: fishbone?.machine || "",
      bg: "bg-teal-50/40",
      border: "border-teal-600/60",
      iconBg: "bg-teal-700 text-white",
    },
    {
      key: "material",
      title: "MATERIAL",
      sub: "Bahan Baku",
      icon: Box,
      content: fishbone?.material || "",
      bg: "bg-white",
      border: "border-slate-200",
      iconBg: "bg-slate-100 text-slate-700",
    },
    {
      key: "environment",
      title: "ENVIRONMENT",
      sub: "Lingkungan",
      icon: Cloud,
      content: fishbone?.environment || "",
      bg: "bg-white",
      border: "border-slate-200",
      iconBg: "bg-slate-100 text-slate-700",
    },
  ];

  const formatText = (txt: string) => {
    if (!txt || !txt.trim()) return <span className="text-slate-400 italic">Belum diidentifikasi</span>;
    return txt;
  };

  return (
    <div className="w-full bg-[#FBFBFA] border border-slate-200 rounded-2xl p-6 shadow-xs space-y-2 overflow-x-auto">
      <div className="min-w-[760px] relative py-4 px-2">
        {/* TOP ROW CARDS */}
        <div className="grid grid-cols-3 gap-6 mb-2">
          {topCategories.map((cat) => {
            const IconComp = cat.icon;
            return (
              <div key={cat.key} className="flex flex-col items-center">
                <div
                  className={`w-full ${cat.bg} border-2 ${cat.border} rounded-2xl p-4 shadow-sm text-center flex flex-col items-center justify-between min-h-[120px] transition-all hover:shadow-md`}
                >
                  <div className={`w-9 h-9 ${cat.iconBg} rounded-full flex items-center justify-center mb-2 shadow-xs`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
                    {cat.title}
                  </h4>
                  <div className="text-[11px] text-slate-600 italic leading-snug whitespace-pre-line mt-1.5 w-full">
                    {formatText(cat.content)}
                  </div>
                </div>
                {/* Vertical bone down to spine */}
                <div className="w-0.5 h-8 bg-slate-400 my-1 relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500 absolute bottom-0 -left-[2px]" />
                </div>
              </div>
            );
          })}
          {/* Spacer if 2 items in top row to align with 3 items in bottom */}
          <div className="flex flex-col items-center">
            <div className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm text-center flex flex-col items-center justify-between min-h-[120px]">
              <div className="w-9 h-9 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-2 shadow-xs">
                <Compass className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
                MEASUREMENT
              </h4>
              <div className="text-[11px] text-slate-400 italic leading-snug mt-1.5">
                Pengukuran & Toleransi
              </div>
            </div>
            <div className="w-0.5 h-8 bg-slate-400 my-1 relative">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 absolute bottom-0 -left-[2px]" />
            </div>
          </div>
        </div>

        {/* CENTRAL SPINE LINE & EFFECT ARROW */}
        <div className="relative flex items-center my-2">
          {/* Horizontal Line */}
          <div className="flex-1 h-1 bg-slate-600 rounded-full" />

          {/* Pointer Triangle */}
          <div className="w-0 h-0 border-y-[16px] border-y-transparent border-l-[28px] border-l-slate-700 shrink-0" />

          {/* RIGHT BOX: EFFECT / DEFECT TITLE */}
          <div className="w-48 min-h-[90px] bg-[#BE4B38] text-white rounded-2xl p-4 shadow-md flex items-center justify-center text-center shrink-0 ml-1 border-2 border-rose-900/30">
            <div>
              <span className="text-[9px] font-bold tracking-widest text-rose-200 uppercase block mb-1">
                AKIBAT / DEFECT
              </span>
              <h3 className="text-xs font-extrabold leading-snug line-clamp-3 text-white">
                {effectTitle || "MASALAH UTAMA"}
              </h3>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW CARDS */}
        <div className="grid grid-cols-3 gap-6 mt-2">
          {bottomCategories.map((cat) => {
            const IconComp = cat.icon;
            return (
              <div key={cat.key} className="flex flex-col items-center">
                {/* Vertical bone up to spine */}
                <div className="w-0.5 h-8 bg-slate-400 my-1 relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500 absolute top-0 -left-[2px]" />
                </div>
                <div
                  className={`w-full ${cat.bg} border-2 ${cat.border} rounded-2xl p-4 shadow-sm text-center flex flex-col items-center justify-between min-h-[120px] transition-all hover:shadow-md`}
                >
                  <div className={`w-9 h-9 ${cat.iconBg} rounded-full flex items-center justify-center mb-2 shadow-xs`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
                    {cat.title}
                  </h4>
                  <div className="text-[11px] text-slate-600 italic leading-snug whitespace-pre-line mt-1.5 w-full">
                    {formatText(cat.content)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
