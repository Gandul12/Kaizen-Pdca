"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2, ExternalLink, Settings } from "lucide-react";
import { Toast } from "@/components/Toast";
import { GenbaItemRow } from "@/components/genba/GenbaItemRow";
import { GenbaAndonBadge } from "@/components/genba/GenbaAndonBadge";
import { GenbaPasswordGate, useGenbaAuth } from "@/components/genba/GenbaPasswordGate";
import { GenbaEntry, GenbaItem } from "@/types/genba";
import { groupGenbaItemsBySection } from "@/lib/genbaItemGrouping";

const DEFAULT_LEADER_NAME = "Leader Shift";
const AUTO_SAVE_DEBOUNCE_MS = 500;

const DAY_NAMES_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES_ID_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

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

function formatDateIndonesian(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  return `${DAY_NAMES_ID[dateObj.getDay()]}, ${d} ${MONTH_NAMES_ID_SHORT[m - 1]} ${y}`;
}

type SaveToast = { message: string; type: "success" | "warning" } | null;

function GenbaPageContent() {
  const { genbaFetch } = useGenbaAuth();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [entry, setEntry] = useState<GenbaEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<SaveToast>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents the auto-save effect from firing right after a fetch/load
  // (either the initial GET, or the setEntry we do after a successful save).
  const skipNextAutoSaveRef = useRef(false);

  const isToday = selectedDate === getTodayDateString();

  // Load the entry whenever the selected date changes.
  useEffect(() => {
    let cancelled = false;

    const loadEntry = async () => {
      setIsLoading(true);
      try {
        const res = await genbaFetch(`/api/genba?date=${selectedDate}`);
        const json = await res.json();
        if (cancelled) return;

        if (json.success) {
          skipNextAutoSaveRef.current = true;
          setEntry({
            ...json.data,
            leaderName: json.data.leaderName || DEFAULT_LEADER_NAME,
          });
        } else {
          setErrorMessage(json.error || "Gagal memuat checklist genba.");
        }
      } catch (err) {
        console.error("Load genba entry error:", err);
        if (!cancelled) setErrorMessage("Gagal memuat data, periksa koneksi internet Anda.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadEntry();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, genbaFetch]);

  // Debounced auto-save whenever `entry` changes (skipped right after a load).
  useEffect(() => {
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }
    if (!entry) return;

    setSaveToast({ message: "Menyimpan...", type: "warning" });
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        const res = await genbaFetch("/api/genba", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: entry.date,
            leaderName: entry.leaderName || DEFAULT_LEADER_NAME,
            lineName: entry.lineName,
            dailyTarget: entry.dailyTarget,
            items: entry.items,
          }),
        });
        const json = await res.json();

        if (json.success) {
          skipNextAutoSaveRef.current = true;
          setEntry((prev) =>
            prev ? { ...prev, id: json.data.id, updatedAt: json.data.updatedAt } : prev
          );
          setSaveToast({ message: "Tersimpan", type: "success" });
        } else {
          setSaveToast(null);
          setErrorMessage(json.error || "Gagal menyimpan checklist genba.");
        }
      } catch (err) {
        console.error("Save genba entry error:", err);
        setSaveToast(null);
        setErrorMessage("Gagal menyimpan, periksa koneksi internet Anda.");
      }
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, genbaFetch]);

  const updateItem = useCallback((updatedItem: GenbaItem) => {
    setEntry((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it) => (it.id === updatedItem.id ? updatedItem : it)),
      };
    });
  }, []);

  const updateHeaderField = (field: "lineName" | "dailyTarget", value: string) => {
    setEntry((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // FR-9: dipanggil EscalateToProjectModal setelah proyek Kaizen baru
  // berhasil dibuat DAN linkedProjectId sudah tersimpan lewat PATCH —
  // update state lokal saja (DB sudah sinkron duluan di modal), dan skip
  // auto-save berikutnya karena tidak ada perubahan lain yang perlu di-POST.
  const handleEscalated = useCallback((projectId: string) => {
    skipNextAutoSaveRef.current = true;
    setEntry((prev) => (prev ? { ...prev, linkedProjectId: projectId } : prev));
  }, []);

  const goToPrevDay = () => setSelectedDate((d) => shiftDate(d, -1));
  const goToNextDay = () => setSelectedDate((d) => shiftDate(d, 1));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold tracking-tight">Genba Checklist Harian</h1>
          <div className="flex items-center gap-2">
            {entry && !isLoading && <GenbaAndonBadge items={entry.items} isToday={isToday} />}
            <a
              href="/genba/pengaturan"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Pengaturan Checklist"
            >
              <Settings className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {errorMessage && (
          <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
        )}
        {saveToast && (
          <Toast
            message={saveToast.message}
            type={saveToast.type}
            duration={saveToast.type === "success" ? 2500 : 0}
            onClose={() => setSaveToast(null)}
          />
        )}

        {/* Navigasi tanggal */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goToPrevDay}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 border border-slate-200"
            title="Hari sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">{formatDateIndonesian(selectedDate)}</p>
            {isToday && (
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
                Hari Ini
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={goToNextDay}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 border border-slate-200"
            title="Hari berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading || !entry ? (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 flex items-center justify-center text-slate-400 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat checklist...
          </div>
        ) : (
          <>
            {/* Header form: line & target harian */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 space-y-3">
              {entry.linkedProjectId && (
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors w-fit"
                  title="Buka daftar proyek Kaizen"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Entry ini sudah dieskalasi jadi proyek PDCA
                </a>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Line / Area</label>
                  <input
                    type="text"
                    value={entry.lineName || ""}
                    onChange={(e) => updateHeaderField("lineName", e.target.value)}
                    placeholder="Contoh: Line Stamping 2"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Harian</label>
                  <input
                    type="text"
                    value={entry.dailyTarget || ""}
                    onChange={(e) => updateHeaderField("dailyTarget", e.target.value)}
                    placeholder="Contoh: 500 pcs"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section per bagian jadwal genba — dikelompokkan dari
                item.sectionId/sectionTitle yang tersimpan di entry itu
                sendiri (FR-11), bukan dari GENBA_SCHEDULE statis. */}
            {groupGenbaItemsBySection(entry.items).map((section) => (
              <div
                key={section.sectionId}
                className="bg-white rounded-xl shadow-md border border-slate-200 p-4 space-y-3"
              >
                <h2 className="text-sm font-bold text-indigo-700">{section.sectionTitle}</h2>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <GenbaItemRow
                      key={item.id}
                      item={item}
                      onChange={updateItem}
                      entry={entry}
                      onEscalated={handleEscalated}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

export default function GenbaPage() {
  return (
    <GenbaPasswordGate verifyUrl={`/api/genba?date=${getTodayDateString()}`}>
      <GenbaPageContent />
    </GenbaPasswordGate>
  );
}
