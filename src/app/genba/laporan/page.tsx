"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarRange, Loader2 } from "lucide-react";
import { GenbaReportView } from "@/components/genba/GenbaReportView";
import { GenbaPasswordGate, useGenbaPassword } from "@/components/genba/GenbaPasswordGate";
import { Toast } from "@/components/Toast";
import type { GenbaEntry } from "@/types/genba";

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function GenbaLaporanPage() {
  return (
    <GenbaPasswordGate>
      <GenbaLaporanContent />
    </GenbaPasswordGate>
  );
}

function GenbaLaporanContent() {
  const genbaPassword = useGenbaPassword();
  const today = toDateStr(new Date());
  const weekAgo = toDateStr(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

  const [start, setStart] = useState(weekAgo);
  const [end, setEnd] = useState(today);
  const [entries, setEntries] = useState<GenbaEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const handleLoadReport = async () => {
    if (!start || !end) {
      setToast({ message: "Pilih tanggal mulai dan tanggal akhir terlebih dahulu.", type: "error" });
      return;
    }
    if (start > end) {
      setToast({ message: "Tanggal mulai harus sebelum atau sama dengan tanggal akhir.", type: "error" });
      return;
    }

    setIsLoading(true);
    setEntries(null); // reset supaya laporan lama tidak sempat ter-export kosong/basi
    try {
      const res = await fetch(`/api/genba/range?start=${start}&end=${end}`, {
        headers: { "x-genba-password": genbaPassword },
      });
      const json = await res.json();
      if (json.success) {
        setEntries(json.data);
      } else {
        setToast({ message: json.error || "Gagal memuat laporan.", type: "error" });
      }
    } catch (err) {
      console.error("Load genba range error:", err);
      setToast({ message: "Gagal memuat laporan, periksa koneksi internet Anda.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        {toast && (
          <div className="mb-2">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </div>
        )}

        <Link
          href="/genba"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Checklist Harian
        </Link>

        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarRange className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-black text-slate-900">Laporan Mingguan Genba</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={start}
                max={end || undefined}
                onChange={(e) => setStart(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={end}
                min={start || undefined}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleLoadReport}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-bold text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarRange className="w-4 h-4" />}
              {isLoading ? "Memuat..." : "Muat Laporan"}
            </button>
          </div>
        </div>

        {/* Belum pernah dimuat sama sekali → jangan render GenbaReportView dulu,
            supaya tidak ada kondisi "export kosong" sebelum user menekan tombol. */}
        {entries !== null && <GenbaReportView entries={entries} />}
      </div>
    </div>
  );
}
