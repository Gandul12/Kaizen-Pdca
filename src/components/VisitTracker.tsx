"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getVisitorId } from "@/lib/visitor";

/**
 * Mengirim catatan kunjungan ke /api/track-visit setiap kali path halaman berubah.
 * Tanpa komponen ini, endpoint track-visit tidak pernah terpanggil sama sekali,
 * sehingga statistik "Total Kunjungan" di Admin tidak pernah bertambah.
 */
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return; // jangan hitung aktivitas admin sendiri sebagai kunjungan visitor
    const visitorId = getVisitorId();
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, page: pathname || "/" }),
      keepalive: true,
    }).catch(() => {
      // Diamkan — tracking tidak boleh mengganggu pengalaman user kalau gagal.
    });
  }, [pathname]);

  return null;
}
