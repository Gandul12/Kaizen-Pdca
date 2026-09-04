"use client";

import React, { useState, useEffect } from "react";
import { User, Award, ArrowUpRight, Sparkles, Quote } from "lucide-react";

interface AboutData {
  title: string;
  narrative: string;
  authorName: string;
  authorRole: string;
  avatarUrl?: string;
  achievements: Array<{ label: string; value: string }>;
}

export const AboutSection: React.FC<{ onStartClick?: () => void }> = ({ onStartClick }) => {
  const [data, setData] = useState<AboutData>({
    title: "Dari Mana Ide Ini Muncul",
    narrative: "Website ini dibangun dari pengalaman nyata menghadapi tantangan efisiensi dan standarisasi proses manufaktur di lapangan. Berangkat dari kebutuhan akan alat dokumentasi improvement yang terstruktur, fleksibel, dan mudah diakses tim tanpa hambatan birokrasi, sistem PDCA 8 Langkah ini dirancang untuk memastikan setiap perbaikan dapat terukur dan terstandardisasi dengan konsisten.",
    authorName: "Praktisi Lean & Improvement",
    authorRole: "Industrial Engineer & Continuous Improvement Specialist",
    avatarUrl: "",
    achievements: [
      { label: "Peningkatan Kapasitas", value: "158%" },
      { label: "Pengurangan Cycle Time", value: "61%" },
      { label: "Siklus Kaizen PDCA", value: "8 Steps" },
    ],
  });

  useEffect(() => {
    fetch("/api/about")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="w-full bg-[#0d1b30] border-t border-b border-[#8fa3bd]/15 py-16 px-4 sm:px-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#1fb6a8]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#d4a94c]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4a94c]/30 bg-[#16304f]/60 text-[#f0d68a] text-xs font-bold uppercase tracking-widest font-body">
            <Sparkles className="w-3.5 h-3.5 text-[#f0d68a]" />
            CERITA DI BALIK KAIZEN PDCA
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {data.title || "Dari Mana Ide Ini Muncul"}
          </h2>
          <div className="h-0.5 w-16 bg-gradient-to-r from-[#1fb6a8] to-[#d4a94c] mx-auto rounded-full" />
        </div>

        {/* Story & Author Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Narrative Text Box */}
          <div className="lg:col-span-7 bg-[#101f36] border border-[#8fa3bd]/16 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <Quote className="w-8 h-8 text-[#1fb6a8] opacity-60" />
              <p className="text-sm sm:text-base text-[#8fa3bd] leading-relaxed whitespace-pre-line font-body font-normal">
                {data.narrative}
              </p>
            </div>

            {onStartClick && (
              <div className="pt-4 border-t border-[#8fa3bd]/10 flex items-center justify-between">
                <span className="text-xs text-[#8fa3bd]">Mulai dokumentasi kaizen pertama Anda</span>
                <button
                  onClick={onStartClick}
                  className="text-xs font-bold text-[#5fe8d8] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Mulai Sekarang <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Author Profile & Achievements */}
          <div className="lg:col-span-5 bg-[#101f36] border border-[#8fa3bd]/16 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#16304f] border-2 border-[#d4a94c] flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                {data.avatarUrl ? (
                  <img src={data.avatarUrl} alt={data.authorName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-[#f0d68a]" />
                )}
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white tracking-wide">
                  {data.authorName}
                </h3>
                <p className="text-xs text-[#8fa3bd] font-body mt-0.5">
                  {data.authorRole}
                </p>
              </div>
            </div>

            {/* Achievements Stats Badges */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8fa3bd] block">
                Catatan Pencapaian Real
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {data.achievements && data.achievements.length > 0 ? (
                  data.achievements.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#16304f]/70 border border-[#8fa3bd]/20 rounded-xl p-3 flex items-center justify-between"
                    >
                      <span className="text-xs font-medium text-slate-200 flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#1fb6a8] shrink-0" />
                        {item.label}
                      </span>
                      <span className="font-display font-black text-lg text-[#f0d68a] tracking-tight">
                        {item.value}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#8fa3bd] italic">Belum ada badge pencapaian.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
