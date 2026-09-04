"use client";

import React from "react";

/**
 * Ilustrasi flat-design: orang menemukan solusi/ide, bekerja dengan laptop.
 * Ditempatkan di sisi KANAN hero, mengapit ring PDCA.
 * Palet: mengikuti brand (navy/teal/gold/fog).
 */
export const PersonSolution: React.FC = () => {
  return (
    <div className="relative w-full aspect-[4/5] flex items-end justify-center">
      <svg viewBox="0 0 260 320" className="w-full h-full overflow-visible">
        {/* ===== Floating solution icons ===== */}

        {/* Lightbulb */}
        <g transform="translate(150, 20)">
          <circle cx="0" cy="0" r="16" fill="#f0d68a" />
          <rect x="-6" y="14" width="12" height="8" rx="2" fill="#d4a94c" />
          <line x1="0" y1="-26" x2="0" y2="-19" stroke="#f0d68a" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="18" y1="-18" x2="13" y2="-13" stroke="#f0d68a" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="-18" y1="-18" x2="-13" y2="-13" stroke="#f0d68a" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="24" y1="0" x2="17" y2="0" stroke="#f0d68a" strokeWidth="2.4" strokeLinecap="round" />
        </g>

        {/* "SOLUSI!!" bubble */}
        <g transform="translate(178, 55)">
          <rect x="0" y="0" width="70" height="28" rx="8" fill="#0d1b30" stroke="#1fb6a8" strokeWidth="2" />
          <path d="M14 28 l-8 10 l14 -6 z" fill="#0d1b30" stroke="#1fb6a8" strokeWidth="2" />
          <text x="35" y="19" textAnchor="middle" fontFamily="Big Shoulders Display, sans-serif" fontWeight="900" fontSize="13" fill="#5fe8d8">SOLUSI!!</text>
        </g>

        {/* Checkmark badge */}
        <g transform="translate(232, 95)">
          <circle cx="0" cy="0" r="12" fill="none" stroke="#f0d68a" strokeWidth="2" />
          <path d="M-5 0 l4 4 l7 -8" fill="none" stroke="#f0d68a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Sparkle dots */}
        <circle cx="120" cy="20" r="2" fill="#5fe8d8" opacity="0.6" />
        <circle cx="30" cy="60" r="2.2" fill="#f0d68a" opacity="0.6" />
        <circle cx="240" cy="140" r="1.8" fill="#5fe8d8" opacity="0.5" />

        {/* Growing bar chart */}
        <g transform="translate(196, 140)">
          <rect x="0" y="24" width="9" height="16" rx="1.5" fill="#8fa3bd" opacity="0.7" />
          <rect x="13" y="14" width="9" height="26" rx="1.5" fill="#1fb6a8" />
          <rect x="26" y="0" width="9" height="40" rx="1.5" fill="#d4a94c" />
          <path d="M0 2 L14 -8 L28 -4 L40 -18" fill="none" stroke="#5fe8d8" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Puzzle piece (solved / connected) */}
        <g transform="translate(35, 55)" opacity="0.75">
          <path d="M0 8 h10 a4 4 0 0 1 0 -8 a4 4 0 0 1 0 8 h10 v18 a4 4 0 0 0 0 8 a4 4 0 0 0 0 -8 v18 h-20 v-18 a4 4 0 0 0 0 -8 a4 4 0 0 0 0 8 v-18 z"
            fill="#1fb6a8" opacity="0.3" stroke="#1fb6a8" strokeWidth="1.6" transform="scale(0.9)" />
        </g>

        {/* Checklist */}
        <g transform="translate(15, 130)" opacity="0.9">
          <rect x="0" y="0" width="34" height="42" rx="3" fill="#101f36" stroke="#8fa3bd" strokeWidth="1.5" />
          <path d="M7 10 l3 3 l6 -6" stroke="#5fe8d8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="19" y1="12" x2="28" y2="12" stroke="#8fa3bd" strokeWidth="1.6" />
          <path d="M7 22 l3 3 l6 -6" stroke="#5fe8d8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="19" y1="24" x2="28" y2="24" stroke="#8fa3bd" strokeWidth="1.6" />
          <path d="M7 34 l3 3 l6 -6" stroke="#d4a94c" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="19" y1="36" x2="28" y2="36" stroke="#8fa3bd" strokeWidth="1.6" />
        </g>

        {/* ===== Person with laptop, pointing up (idea) ===== */}
        <g transform="translate(55, 150)">
          <ellipse cx="70" cy="168" rx="95" ry="8" fill="#000" opacity="0.25" />

          {/* Body / sweater (gold) */}
          <path d="M15 168 C10 120 25 95 70 95 C115 95 128 122 122 168 Z" fill="#d4a94c" />

          {/* Neck */}
          <rect x="58" y="70" width="24" height="26" rx="8" fill="#e3ac7a" />

          {/* Head */}
          <circle cx="70" cy="52" r="26" fill="#f2c99a" />
          {/* Hair */}
          <path d="M44 50 C42 24 56 8 70 8 C86 8 100 22 96 44 C90 32 82 30 70 30 C58 30 48 36 44 50 Z" fill="#3a2b1c" />

          {/* Arm raised, pointing/finger up (idea gesture) */}
          <path d="M100 100 C118 92 128 70 122 50 C119 40 108 40 106 50 C110 66 104 82 92 92" fill="#d4a94c" stroke="#a5792f" strokeWidth="1" />
          <circle cx="122" cy="48" r="7" fill="#f2c99a" />

          {/* Other arm resting on laptop */}
          <path d="M25 120 C15 132 14 150 24 162" fill="none" stroke="#d4a94c" strokeWidth="18" strokeLinecap="round" />

          {/* Smiling face */}
          <path d="M58 45 q6 -4 12 0" stroke="#3a2b1c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="62" cy="53" r="2" fill="#241b14" />
          <circle cx="80" cy="53" r="2" fill="#241b14" />
          <path d="M60 62 q10 8 20 0" stroke="#8a5a35" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        {/* Laptop */}
        <g transform="translate(70, 275)">
          <path d="M0 0 h70 l6 20 h-82 z" fill="#101f36" stroke="#5fe8d8" strokeWidth="1.5" />
          <rect x="8" y="-38" width="54" height="38" rx="3" fill="#0d1b30" stroke="#5fe8d8" strokeWidth="1.5" />
          <circle cx="35" cy="-19" r="3" fill="#1fb6a8" />
        </g>

        {/* Books stack */}
        <g transform="translate(180, 288)">
          <rect x="0" y="6" width="40" height="8" rx="1.5" fill="#1fb6a8" />
          <rect x="2" y="-2" width="36" height="8" rx="1.5" fill="#d4a94c" />
          <rect x="0" y="-10" width="40" height="8" rx="1.5" fill="#5fe8d8" opacity="0.85" />
        </g>

        {/* Potted plant */}
        <g transform="translate(15, 250)">
          <path d="M6 30 h20 l-3 20 h-14 z" fill="#16304f" />
          <path d="M16 30 C6 10 2 0 -4 -10 M16 30 C10 6 20 -4 26 -14 M16 30 C20 8 14 -2 8 -16"
            fill="none" stroke="#1fb6a8" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Desk line */}
        <rect x="0" y="300" width="260" height="4" rx="2" fill="#8fa3bd" opacity="0.2" />
      </svg>
    </div>
  );
};
