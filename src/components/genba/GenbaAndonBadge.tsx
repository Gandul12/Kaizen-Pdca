"use client";

import React from "react";
import { GenbaItem } from "@/types/genba";

interface GenbaAndonBadgeProps {
  items: GenbaItem[];
  isToday: boolean;
}

type AndonLevel = "green" | "yellow" | "red" | "neutral";

const LATE_THRESHOLD_MINUTES = 30;

function getNowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

const LEVEL_STYLES: Record<AndonLevel, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-300",
  yellow: "bg-amber-100 text-amber-800 border-amber-300",
  red: "bg-rose-100 text-rose-800 border-rose-300",
  neutral: "bg-slate-100 text-slate-700 border-slate-300",
};

const LEVEL_DOT_STYLES: Record<AndonLevel, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500",
  neutral: "bg-slate-400",
};

// Reusable so FR-5/FR-6/FR-7 report components can render the same badge.
export const GenbaAndonBadge: React.FC<GenbaAndonBadgeProps> = ({ items, isToday }) => {
  const total = items.length;
  const done = items.filter((it) => it.status !== "na").length;

  let level: AndonLevel = "neutral";
  let label = `${done}/${total} selesai`;

  if (isToday && total > 0) {
    const nowMinutes = getNowMinutes();
    const overdueItems = items.filter((it) => it.status === "na" && nowMinutes > it.endMinutes);

    if (overdueItems.length === 0) {
      level = "green";
      label = done === total ? "Semua selesai" : "Sesuai jadwal";
    } else {
      const worstGapMinutes = Math.max(...overdueItems.map((it) => nowMinutes - it.endMinutes));
      if (worstGapMinutes > LATE_THRESHOLD_MINUTES) {
        level = "red";
        label = `${overdueItems.length} item terlambat`;
      } else {
        level = "yellow";
        label = `${overdueItems.length} item mendekati tenggat`;
      }
    }
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${LEVEL_STYLES[level]}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${LEVEL_DOT_STYLES[level]}`} />
      <span>{label}</span>
      <span className="opacity-70 font-normal">
        ({done}/{total})
      </span>
    </div>
  );
};
