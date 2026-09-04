"use client";

import React from "react";
import type { GenbaItem } from "@/types/genba";

interface GenbaAndonBadgeProps {
  items: GenbaItem[];
  isToday: boolean;
}

function nowMinutes(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

export const GenbaAndonBadge: React.FC<GenbaAndonBadgeProps> = ({ items, isToday }) => {
  const total = items.length;
  const doneCount = items.filter((it) => it.status !== "pending").length;

  let color: "green" | "amber" | "red" | "neutral" = "neutral";
  let label = "";

  if (!isToday) {
    color = "neutral";
    label = total > 0 && doneCount === total ? "Lengkap" : `${doneCount}/${total} tercatat`;
  } else {
    const nm = nowMinutes();
    const expected = items.filter((it) => it.endMinutes <= nm);
    const expectedDone = expected.filter((it) => it.status !== "pending").length;
    const gap = expected.length - expectedDone;

    if (expected.length === 0) {
      color = "green";
      label = "Belum mulai";
    } else if (gap >= 2) {
      color = "red";
      label = `Tertinggal ${gap} langkah`;
    } else if (gap === 1) {
      color = "amber";
      label = "Sedikit tertinggal";
    } else {
      color = "green";
      label = "Sesuai jadwal";
    }
  }

  const styles = {
    green: { bg: "bg-emerald-50", dot: "bg-emerald-500", text: "text-emerald-700" },
    amber: { bg: "bg-amber-50", dot: "bg-amber-500", text: "text-amber-700" },
    red: { bg: "bg-rose-50", dot: "bg-rose-500", text: "text-rose-700" },
    neutral: { bg: "bg-slate-100", dot: "bg-slate-400", text: "text-slate-600" },
  }[color];

  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 ${styles.bg}`}>
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dot}`} />
      <span className={`text-xs font-mono font-semibold ${styles.text}`}>{label}</span>
      <span className={`ml-auto text-xs font-mono ${styles.text} opacity-80`}>
        {doneCount}/{total}
      </span>
    </div>
  );
};
