import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import VisitTracker from "@/components/VisitTracker";

export const metadata: Metadata = {
  title: "KAIZEN PDCA • Dokumentasi Improvement 8 Langkah",
  description: "Aplikasi web standar manufaktur untuk mendokumentasikan proyek Kaizen / Improvement menggunakan metode PDCA 8 Langkah.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-[#050b16] text-slate-100 font-body antialiased selection:bg-[#1fb6a8] selection:text-[#050b16]">
        <VisitTracker />
        {children}
      </body>
    </html>
  );
}
