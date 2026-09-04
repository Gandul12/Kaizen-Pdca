"use client";

import React from "react";

/**
 * Ilustrasi flat-design: orang sedang berpikir/menganalisis masalah.
 * Ditempatkan di sisi KIRI hero, mengapit ring PDCA.
 * Palet: mengikuti brand (navy/teal/gold/fog), garis ikon pakai warna fog/gold tipis.
 */
export const PersonThinking: React.FC = () => {
  return (
    <div className="relative w-full aspect-[4/5] flex items-end justify-center">
      <svg viewBox="0 0 260 320" className="w-full h-full overflow-visible">
        {/* ===== Floating problem icons ===== */}

        {/* Thought bubble */}
        <g opacity="0.95">
          <circle cx="150" cy="70" r="5" fill="none" stroke="#8fa3bd" strokeWidth="2" />
          <circle cx="162" cy="58" r="7" fill="none" stroke="#8fa3bd" strokeWidth="2" />
          <ellipse cx="188" cy="40" rx="26" ry="20" fill="#0d1b30" stroke="#8fa3bd" strokeWidth="2" />
          <text x="188" y="47" textAnchor="middle" fontFamily="Big Shoulders Display, sans-serif" fontWeight="900" fontSize="22" fill="#f0d68a">?</text>
        </g>

        {/* Floating question mark (top left) */}
        <text x="40" y="55" fontFamily="Big Shoulders Display, sans-serif" fontWeight="900" fontSize="30" fill="#d4a94c" opacity="0.85">?</text>

        {/* Sparkle dots */}
        <circle cx="95" cy="30" r="2" fill="#5fe8d8" opacity="0.6" />
        <circle cx="230" cy="90" r="2.2" fill="#f0d68a" opacity="0.6" />
        <circle cx="20" cy="120" r="1.8" fill="#5fe8d8" opacity="0.5" />

        {/* Maze icon */}
        <g transform="translate(18, 95)" opacity="0.85">
          <rect x="0" y="0" width="46" height="46" rx="4" fill="none" stroke="#8fa3bd" strokeWidth="2" />
          <rect x="10" y="10" width="26" height="26" rx="2" fill="none" stroke="#8fa3bd" strokeWidth="1.5" />
          <rect x="19" y="19" width="8" height="8" fill="#d4a94c" />
          <path d="M4 23 h6 M40 23 h4" stroke="#8fa3bd" strokeWidth="1.5" strokeDasharray="2,2" />
        </g>

        {/* Small chart icon (muted, unresolved) */}
        <g transform="translate(190, 120)" opacity="0.6">
          <rect x="0" y="20" width="8" height="14" rx="1.5" fill="#8fa3bd" />
          <rect x="12" y="10" width="8" height="24" rx="1.5" fill="#8fa3bd" />
          <rect x="24" y="16" width="8" height="18" rx="1.5" fill="#8fa3bd" />
        </g>

        {/* Puzzle piece (unsolved) */}
        <g transform="translate(45, 55)" opacity="0.7">
          <path d="M0 8 h10 a4 4 0 0 1 0 -8 a4 4 0 0 1 0 8 h10 v18 a4 4 0 0 0 0 8 a4 4 0 0 0 0 -8 v18 h-20 v-18 a4 4 0 0 0 0 -8 a4 4 0 0 0 0 8 v-18 z"
            fill="none" stroke="#8fa3bd" strokeWidth="1.6" transform="scale(0.9)" />
        </g>

        {/* ===== Person sitting, hand on chin ===== */}
        <g transform="translate(60, 150)">
          {/* chair/desk edge shadow */}
          <ellipse cx="70" cy="168" rx="95" ry="8" fill="#000" opacity="0.25" />

          {/* Body / sweater */}
          <path d="M15 168 C10 120 25 95 70 95 C115 95 128 122 122 168 Z" fill="#16645c" />
          <path d="M15 168 C10 120 25 95 70 95 C115 95 128 122 122 168 Z" fill="#1fb6a8" opacity="0.85" />

          {/* Neck */}
          <rect x="58" y="70" width="24" height="26" rx="8" fill="#e3ac7a" />

          {/* Head */}
          <circle cx="70" cy="52" r="26" fill="#f2c99a" />
          {/* Hair */}
          <path d="M44 48 C40 22 56 8 70 8 C88 8 100 22 97 46 C93 38 84 34 70 34 C56 34 47 40 44 48 Z" fill="#241b14" />

          {/* Arm bent to chin (thinking pose) */}
          <path d="M100 100 C118 104 124 118 116 132 C110 142 96 140 90 130" fill="#1fb6a8" stroke="#124f47" strokeWidth="1" />
          {/* Hand near chin */}
          <circle cx="88" cy="70" r="10" fill="#f2c99a" />

          {/* Other arm resting on desk */}
          <path d="M25 120 C15 130 12 150 20 165" fill="none" stroke="#1fb6a8" strokeWidth="18" strokeLinecap="round" />

          {/* Eyebrow (furrowed / confused) */}
          <path d="M58 46 q6 -5 12 0" stroke="#241b14" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M76 46 q6 -5 12 0" stroke="#241b14" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {/* Eyes */}
          <circle cx="62" cy="53" r="2" fill="#241b14" />
          <circle cx="80" cy="53" r="2" fill="#241b14" />
          {/* Mouth (slight frown/thinking) */}
          <path d="M62 64 q8 -3 16 0" stroke="#8a5a35" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        {/* Desk line */}
        <rect x="0" y="300" width="260" height="4" rx="2" fill="#8fa3bd" opacity="0.2" />

        {/* Mug */}
        <g transform="translate(150, 275)">
          <rect x="0" y="0" width="26" height="22" rx="4" fill="#101f36" stroke="#5fe8d8" strokeWidth="1.5" />
          <path d="M26 5 h6 a6 6 0 0 1 0 12 h-6" fill="none" stroke="#5fe8d8" strokeWidth="1.5" />
        </g>

        {/* Potted plant */}
        <g transform="translate(190, 245)">
          <path d="M6 30 h20 l-3 20 h-14 z" fill="#16304f" />
          <path d="M16 30 C6 10 2 0 -4 -10 M16 30 C10 6 20 -4 26 -14 M16 30 C20 8 14 -2 8 -16"
            fill="none" stroke="#1fb6a8" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};
