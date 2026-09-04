import type { NextConfig } from "next";

// SECURITY: sebelumnya file ini kosong — nol security header sama sekali.
// CSP di bawah sengaja tidak "strict" penuh (masih ada 'unsafe-inline' untuk
// script/style) karena app ini belum pakai infrastruktur nonce Next.js;
// mengetatkan lebih jauh butuh middleware nonce terpisah. Ini baseline yang
// realistis tanpa merusak fungsi yang ada (Google Fonts, upload foto Vercel
// Blob, html2canvas/jsPDF untuk export).
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "frame-src 'none'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Hanya berpengaruh di koneksi HTTPS (Vercel selalu HTTPS) — aman dikirim
  // tanpa syarat, browser mengabaikannya di HTTP biasa.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
