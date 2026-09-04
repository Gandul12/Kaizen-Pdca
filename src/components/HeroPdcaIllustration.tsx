"use client";

import React from "react";

export const HeroPdcaIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[880px] mx-auto flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Static Hero Composition matching Gambar 3 without CSS keyframe animations */}
      <div className="relative w-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
        {/* LEFT SIDE: Thinking Character & Problem Icons */}
        <div className="w-full md:w-[32%] flex items-center justify-center relative">
          <img
            src="/images/hero-left.png"
            alt="Ilustrasi orang menganalisis masalah"
            className="w-full max-w-[280px] md:max-w-none h-auto object-contain rounded-2xl drop-shadow-xl"
          />
        </div>

        {/* CENTER: Static PDCA Ring */}
        <div className="w-full md:w-[36%] flex items-center justify-center relative shrink-0">
          <svg
            viewBox="0 0 400 400"
            className="w-full max-w-[280px] sm:max-w-[320px] h-auto drop-shadow-2xl"
          >
            {/* Outer subtle guide ring */}
            <circle
              cx="200"
              cy="200"
              r="140"
              fill="none"
              stroke="rgba(143, 163, 189, 0.18)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* --- 4 PDCA QUARTER ARCS (Static, no animation) --- */}
            {/* 1. PLAN (Top-Left) - Fog #8fa3bd */}
            <path
              d="M 70 200 A 130 130 0 0 1 200 70"
              fill="none"
              stroke="#8fa3bd"
              strokeWidth="24"
              strokeLinecap="round"
            />

            {/* 2. DO (Top-Right) - Teal #1fb6a8 */}
            <path
              d="M 200 70 A 130 130 0 0 1 330 200"
              fill="none"
              stroke="#1fb6a8"
              strokeWidth="24"
              strokeLinecap="round"
            />

            {/* 3. CHECK (Bottom-Right) - Gold #d4a94c */}
            <path
              d="M 330 200 A 130 130 0 0 1 200 330"
              fill="none"
              stroke="#d4a94c"
              strokeWidth="24"
              strokeLinecap="round"
            />

            {/* 4. ACT (Bottom-Left) - Teal-Glow #5fe8d8 */}
            <path
              d="M 200 330 A 130 130 0 0 1 70 200"
              fill="none"
              stroke="#5fe8d8"
              strokeWidth="24"
              strokeLinecap="round"
            />

            {/* Flow arrows at arc ends */}
            <polygon points="196,52 208,70 196,88" fill="#1fb6a8" />
            <polygon points="348,196 330,208 312,196" fill="#d4a94c" />
            <polygon points="204,348 192,330 204,312" fill="#5fe8d8" />
            <polygon points="52,204 70,192 88,204" fill="#8fa3bd" />

            {/* --- LABELS FOR PLAN, DO, CHECK, ACT --- */}
            <text
              x="110"
              y="110"
              fill="#FFFFFF"
              fontSize="26"
              fontFamily="'Big Shoulders Display', sans-serif"
              fontWeight="900"
              letterSpacing="2"
              stroke="#050b16"
              strokeWidth="3"
              paintOrder="stroke"
            >
              PLAN
            </text>

            <text
              x="260"
              y="110"
              fill="#FFFFFF"
              fontSize="26"
              fontFamily="'Big Shoulders Display', sans-serif"
              fontWeight="900"
              letterSpacing="2"
              stroke="#050b16"
              strokeWidth="3"
              paintOrder="stroke"
            >
              DO
            </text>

            <text
              x="250"
              y="300"
              fill="#FFFFFF"
              fontSize="26"
              fontFamily="'Big Shoulders Display', sans-serif"
              fontWeight="900"
              letterSpacing="2"
              stroke="#050b16"
              strokeWidth="3"
              paintOrder="stroke"
            >
              CHECK
            </text>

            <text
              x="110"
              y="300"
              fill="#FFFFFF"
              fontSize="26"
              fontFamily="'Big Shoulders Display', sans-serif"
              fontWeight="900"
              letterSpacing="2"
              stroke="#050b16"
              strokeWidth="3"
              paintOrder="stroke"
            >
              ACT
            </text>

            {/* --- CENTER HUB --- */}
            <circle
              cx="200"
              cy="200"
              r="82"
              fill="#16304f"
              stroke="#d4a94c"
              strokeWidth="2.5"
            />
            <circle
              cx="200"
              cy="200"
              r="75"
              fill="none"
              stroke="rgba(95, 232, 216, 0.25)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            <text
              x="200"
              y="194"
              textAnchor="middle"
              fill="#f0d68a"
              fontSize="24"
              fontFamily="'Big Shoulders Display', sans-serif"
              fontWeight="900"
              letterSpacing="3"
            >
              KAIZEN
            </text>

            <text
              x="200"
              y="214"
              textAnchor="middle"
              fill="#8fa3bd"
              fontSize="8.5"
              fontFamily="'DM Sans', sans-serif"
              fontWeight="800"
              letterSpacing="1.5"
            >
              CONTINUOUS IMPROVEMENT
            </text>
          </svg>
        </div>

        {/* RIGHT SIDE: Solution / Discovery Character */}
        <div className="w-full md:w-[32%] flex items-center justify-center relative">
          <img
            src="/images/hero-right.png"
            alt="Ilustrasi orang menemukan solusi"
            className="w-full max-w-[280px] md:max-w-none h-auto object-contain rounded-2xl drop-shadow-xl"
          />
        </div>
      </div>
    </div>
  );
};
