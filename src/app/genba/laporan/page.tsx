"use client";

import React, { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Toast } from "@/components/Toast";
import { GenbaReportView } from "@/components/genba/GenbaReportView";
import { GenbaPasswordGate, useGenbaAuth } from "@/components/genba/GenbaPasswordGate";
import { GenbaEntry } from "@/types/genba";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function shiftDate(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  dateObj.setDate(dateObj.getDate() + deltaDays);
  return `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`;
}

function GenbaLaporanContent() {
  const { genbaFetch } = useGenbaAuth();
  const todayStr = getTodayDateString();
  const [startDate, setStartDate] = useState<string>(shiftDate(todayStr, -6));
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [entries, setEntries] = useState<GenbaEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLoadReport = async () => {
    setErrorMessage(null);

    if (!startDate || !endDate) {
      setErrorMessage("Pilih tanggal mulai dan tanggal akhir terlebih dahulu.");
      return;
    }
    if (startDate > endDate) {
      setErrorMessage("Tanggal mulai tidak boleh setelah tanggal akhir.");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setEntries(null);

    try {
      const res = await genbaFetch(`/api/genba/range?start=${startDate}&end=${endDate}`);
      const json = await res.json();

      if (json.success) {
        setEntries(json.data);
      } else {
        setErrorMessage(json.error || "Gagal memuat laporan mingguan.");
      }
    } catch (err) {
      console.error("Load genba weekly report error:", err);
      setErrorMessage("Gagal memuat data, periksa koneksi internet Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <h1 className="text-lg font-bold tracking-tight">Laporan Mingguan Genba</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {errorMessage && (
          <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
        )}

        {/* Filter rentang tanggal */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 flex flex-wrap items-end gap-3 print:hidden">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleLoadReport}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isLoading ? "Memuat..." : "Muat Laporan Mingguan"}
          </button>
        </div>

        {isLoading && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 flex items-center justify-center text-slate-400 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat data checklist...
          </div>
        )}

        {!isLoading && hasSearched && entries && entries.length === 0 && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center text-sm text-slate-500">
            Tidak ada data checklist genba pada rentang{" "}
            <strong className="text-slate-700">{startDate}</strong> sampai{" "}
            <strong className="text-slate-700">{endDate}</strong>. Coba pilih rentang tanggal lain.
          </div>
        )}

        {!isLoading && entries && entries.length > 0 && (
          <GenbaReportView entries={entries} rangeStart={startDate} rangeEnd={endDate} />
        )}
      </main>
    </div>
  );
}

export default function GenbaLaporanPage() {
  const todayStr = getTodayDateString();
  return (
    <GenbaPasswordGate verifyUrl={`/api/genba/range?start=${todayStr}&end=${todayStr}`}>
      <GenbaLaporanContent />
    </GenbaPasswordGate>
  );
}
