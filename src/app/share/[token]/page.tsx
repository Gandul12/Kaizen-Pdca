"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { KaizenProject } from "@/types/kaizen";
import { KaizenReportView } from "@/components/KaizenReportView";
import { Eye, AlertTriangle, RefreshCw, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { getVisitorId } from "@/lib/visitor";

export default function ShareViewPage() {
  const params = useParams();
  const token = params.token as string;
  const [project, setProject] = useState<KaizenProject | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    fetch(`/api/share/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProject(json.data);
        else setError(json.error || "Link tidak valid.");
      })
      .catch(() => setError("Gagal memuat proyek."))
      .finally(() => setIsLoading(false));

    // Track visit for share page
    const today = new Date().toISOString().split("T")[0];
    const key = `visit_logged_share_${token}_${today}`;
    if (!sessionStorage.getItem(key)) {
      fetch("/api/track-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: `/share/${token}`,
          visitorId: getVisitorId(),
        }),
      }).catch(() => {});
      sessionStorage.setItem(key, "1");
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 mx-auto animate-spin mb-3" />
          <p className="text-sm text-slate-600">Memuat dokumen...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Link Tidak Valid</h1>
          <p className="text-xs text-slate-500">{error || "Proyek tidak ditemukan."}</p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg"><Eye className="w-5 h-5 text-white" /></div>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">VIEW-ONLY • HANYA BACA</span>
              <h1 className="text-sm font-bold truncate max-w-[300px]">{project.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Mode Baca Saja</span>
            <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Halaman Utama
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-center gap-2 text-xs text-amber-800">
          <Eye className="w-4 h-4 shrink-0" />
          <span>Anda melihat dokumen ini dalam <strong>mode baca saja (view-only)</strong>. Untuk mengedit, diperlukan password proyek.</span>
        </div>
        <KaizenReportView project={project} />
      </main>
    </div>
  );
}
