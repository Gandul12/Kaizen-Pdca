"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, Save, FileBarChart, CheckCircle2, ExternalLink, Settings } from "lucide-react";
import { GenbaItemRow } from "@/components/genba/GenbaItemRow";
import { GenbaAndonBadge } from "@/components/genba/GenbaAndonBadge";
import { GenbaPasswordGate, useGenbaPassword } from "@/components/genba/GenbaPasswordGate";
import { Toast } from "@/components/Toast";
import { groupGenbaItemsBySection } from "@/lib/genbaItemGrouping";
import type { GenbaEntry, GenbaItem } from "@/types/genba";

const LEADER_NAME_STORAGE_KEY = "genba-leader-name";

// Entry yang sedang diedit di client belum tentu punya id (kalau belum
// pernah disimpan ke DB) — GenbaEntry mewajibkan id, jadi longgarkan di sini.
type EditableGenbaEntry = Omit<GenbaEntry, "id"> & { id?: string };

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtHuman(d: Date): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function readStoredLeaderName(): string {
  try {
    return window.localStorage.getItem(LEADER_NAME_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function persistLeaderName(name: string) {
  try {
    window.localStorage.setItem(LEADER_NAME_STORAGE_KEY, name);
  } catch {
    // localStorage tidak tersedia (mis. private browsing) — abaikan
  }
}

export default function GenbaPage() {
  return (
    <GenbaPasswordGate>
      <GenbaPageContent />
    </GenbaPasswordGate>
  );
}

function GenbaPageContent() {
  const genbaPassword = useGenbaPassword();
  const [currentDate, setCurrentDate] = useState<string>(() => toDateStr(new Date()));
  const [entry, setEntry] = useState<EditableGenbaEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const entryRef = useRef<EditableGenbaEntry | null>(null);
  entryRef.current = entry;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTokenRef = useRef(0);

  const today = toDateStr(new Date());
  const isToday = currentDate === today;

  const loadEntry = useCallback(async (date: string) => {
    const token = ++loadTokenRef.current;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/genba?date=${date}`, {
        headers: { "x-genba-password": genbaPassword },
      });
      const json = await res.json();
      if (token !== loadTokenRef.current) return; // ada navigasi tanggal lain, abaikan hasil basi ini

      if (json.success) {
        let loaded: EditableGenbaEntry = json.data;
        if (json.isNew && !loaded.leaderName) {
          loaded = { ...loaded, leaderName: readStoredLeaderName() };
        }
        setEntry(loaded);
      } else {
        setToast({ message: json.error || "Gagal memuat data genba.", type: "error" });
      }
    } catch (err) {
      console.error("Load genba entry error:", err);
      if (token === loadTokenRef.current) {
        setToast({ message: "Gagal memuat data, periksa koneksi internet Anda.", type: "error" });
      }
    } finally {
      if (token === loadTokenRef.current) setIsLoading(false);
    }
  }, [genbaPassword]);

  useEffect(() => {
    loadEntry(currentDate);
  }, [currentDate, loadEntry]);

  const saveEntry = useCallback(async (data: EditableGenbaEntry) => {
    if (!data.leaderName?.trim()) return; // nama leader wajib diisi dulu di server

    setSaveState("saving");
    try {
      const res = await fetch("/api/genba", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-genba-password": genbaPassword },
        body: JSON.stringify({
          date: data.date,
          leaderName: data.leaderName,
          lineName: data.lineName,
          dailyTarget: data.dailyTarget,
          items: data.items,
          linkedProjectId: data.linkedProjectId,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setEntry((prev) =>
          prev && prev.date === data.date
            ? { ...prev, id: json.data.id, createdAt: json.data.createdAt, updatedAt: json.data.updatedAt }
            : prev
        );
        setSaveState("saved");
        setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
      } else {
        setSaveState("idle");
        setToast({ message: json.error || "Gagal menyimpan checklist genba.", type: "error" });
      }
    } catch (err) {
      console.error("Save genba entry error:", err);
      setSaveState("idle");
      setToast({ message: "Gagal menyimpan, periksa koneksi internet Anda.", type: "error" });
    }
  }, [genbaPassword]);

  const queueSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      if (entryRef.current) saveEntry(entryRef.current);
    }, 500);
  }, [saveEntry]);

  const flushPendingSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      if (entryRef.current) saveEntry(entryRef.current);
    }
  };

  const updateEntry = (updater: (prev: EditableGenbaEntry) => EditableGenbaEntry) => {
    setEntry((prev) => (prev ? updater(prev) : prev));
    queueSave();
  };

  const handleItemChange = (updatedItem: GenbaItem) => {
    updateEntry((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === updatedItem.id ? updatedItem : it)),
    }));
  };

  // Eskalasi (FR-9) sudah menautkan entry lewat PATCH di dalam modal —
  // di sini kita cukup mencerminkan hasilnya ke state lokal, TANPA memicu
  // auto-save lagi (supaya tidak ada race dengan POST upsert yang lain).
  const handleEscalated = (projectId: string, shareToken: string) => {
    setEntry((prev) =>
      prev ? { ...prev, linkedProjectId: projectId, linkedProjectShareToken: shareToken } : prev
    );
    setToast({ message: "Proyek Kaizen berhasil dibuat dan ditautkan ke checklist ini.", type: "success" });
  };

  const handleLeaderNameChange = (value: string) => {
    persistLeaderName(value);
    updateEntry((prev) => ({ ...prev, leaderName: value }));
  };

  const handleLineNameChange = (value: string) => {
    updateEntry((prev) => ({ ...prev, lineName: value }));
  };

  const handleDailyTargetChange = (value: string) => {
    updateEntry((prev) => ({ ...prev, dailyTarget: value }));
  };

  const changeDate = (nextDate: string) => {
    flushPendingSave();
    setCurrentDate(nextDate);
  };

  const goPrevDay = () => {
    const d = fromDateStr(currentDate);
    d.setDate(d.getDate() - 1);
    changeDate(toDateStr(d));
  };

  const goNextDay = () => {
    const d = fromDateStr(currentDate);
    d.setDate(d.getDate() + 1);
    changeDate(toDateStr(d));
  };

  const goToday = () => changeDate(today);

  const sections = entry ? groupGenbaItemsBySection(entry.items) : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {toast && (
          <div className="mb-4">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              Genba Checklist Harian
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/genba/laporan"
                className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <FileBarChart className="w-3.5 h-3.5" /> Laporan Mingguan
              </Link>
              {saveState === "saving" && (
                <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                  <Save className="w-3 h-3 animate-pulse" /> Menyimpan...
                </span>
              )}
              {saveState === "saved" && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Save className="w-3 h-3" /> Tersimpan
                </span>
              )}
            </div>
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-4">Genba Harian</h1>

          {/* Navigasi tanggal */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={goPrevDay}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Hari sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center text-sm font-semibold text-slate-800 flex items-center justify-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              {fmtHuman(fromDateStr(currentDate))}
            </div>
            <button
              onClick={goNextDay}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Hari berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isToday && (
              <button
                onClick={goToday}
                className="text-[11px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                Hari Ini
              </button>
            )}
          </div>

          {entry && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <GenbaAndonBadge items={entry.items} isToday={isToday} />
              </div>
              <Link
                href="/genba/pengaturan"
                title="Pengaturan Master Checklist"
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          )}

          {entry?.linkedProjectId && (
            <div className="mt-2">
              {entry.linkedProjectShareToken ? (
                <a
                  href={`/share/${entry.linkedProjectShareToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Checklist ini sudah terhubung ke proyek PDCA <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Checklist ini sudah terhubung ke proyek PDCA
                </span>
              )}
            </div>
          )}

          {/* Header form Line/Target */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Line Leader
              </label>
              <input
                type="text"
                value={entry?.leaderName || ""}
                onChange={(e) => handleLeaderNameChange(e.target.value)}
                placeholder="Nama Line Leader"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Nama Line
              </label>
              <input
                type="text"
                value={entry?.lineName || ""}
                onChange={(e) => handleLineNameChange(e.target.value)}
                placeholder="Contoh: Line Stamping 2"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Target Harian
              </label>
              <input
                type="text"
                value={entry?.dailyTarget || ""}
                onChange={(e) => handleDailyTargetChange(e.target.value)}
                placeholder="Contoh: 1.200 pcs"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {isLoading && !entry && (
          <div className="text-center text-sm text-slate-400 py-10">Memuat checklist...</div>
        )}

        {entry &&
          sections.map((section) => (
            <div key={section.sectionId} className="mb-5">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  {section.sectionTitle}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <GenbaItemRow
                    key={item.id}
                    item={item}
                    onChange={handleItemChange}
                    entry={entry!}
                    genbaPassword={genbaPassword}
                    onEscalated={handleEscalated}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
