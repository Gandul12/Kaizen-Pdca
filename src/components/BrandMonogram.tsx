"use client";

import React from "react";

interface BrandMonogramProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  onClick?: () => void;
}

export const BrandMonogram: React.FC<BrandMonogramProps> = ({
  size = "md",
  showSubtitle = true,
  onClick,
}) => {
  const badgeSizeClass = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-14 h-14 rounded-2xl",
  }[size];

  const titleSizeClass = {
    sm: "text-base tracking-tight",
    md: "text-lg tracking-tight",
    lg: "text-2xl tracking-tight",
  }[size];

  const subSizeClass = {
    sm: "text-[9px] tracking-wider",
    md: "text-[10.5px] tracking-wider",
    lg: "text-xs tracking-widest",
  }[size];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 transition-opacity ${onClick ? "cursor-pointer hover:opacity-90" : ""}`}
    >
      {/* Monogram Badge */}
      <div
        className={`${badgeSizeClass} bg-[#16304f] border border-[#d4a94c]/30 shadow-md flex items-center justify-center shrink-0 p-1.5 relative overflow-hidden`}
      >
        <svg viewBox="0 0 40 40" className="w-full h-full">
          {/* Plan: Top-Left Arc (Fog #8fa3bd) */}
          <path
            d="M 17 6 A 14 14 0 0 0 6 17"
            fill="none"
            stroke="#8fa3bd"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Do: Top-Right Arc (Teal #1fb6a8) */}
          <path
            d="M 23 6 A 14 14 0 0 1 34 17"
            fill="none"
            stroke="#1fb6a8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Check: Bottom-Right Arc (Gold #d4a94c) */}
          <path
            d="M 34 23 A 14 14 0 0 1 23 34"
            fill="none"
            stroke="#d4a94c"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Act: Bottom-Left Arc (Teal-Glow #5fe8d8) */}
          <path
            d="M 17 34 A 14 14 0 0 1 6 23"
            fill="none"
            stroke="#5fe8d8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Center Center Dot (Gold-Soft #f0d68a) */}
          <circle cx="20" cy="20" r="3" fill="#f0d68a" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className={`font-display font-extrabold text-white leading-none ${titleSizeClass}`}>
          KAIZEN PDCA
        </span>

        {/* Divider accent line */}
        <div className="h-[2px] w-9 bg-gradient-to-r from-[#1fb6a8] to-[#d4a94c] my-1 rounded-full" />

        {showSubtitle && (
          <span className={`font-body font-bold text-[#8fa3bd] uppercase ${subSizeClass}`}>
            DOKUMENTASI IMPROVEMENT · 8 LANGKAH
          </span>
        )}
      </div>
    </div>
  );
};
