"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Trash2, Pencil, Check as CheckIcon, ArrowLeft } from "lucide-react";
import { Toast } from "@/components/Toast";
import { GenbaPasswordGate, useGenbaAuth } from "@/components/genba/GenbaPasswordGate";

interface GenbaScheduleItemRow {
  id: string;
  sectionId: string;
  sectionTitle: string;
  sectionOrder: number;
  itemOrder: number;
  point: string;
  standard: string;
  endMinutes: number;
  isActive: boolean;
}

interface ScheduleSectionGroup {
  sectionId: string;
  sectionTitle: string;
  items: GenbaScheduleItemRow[];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function minutesToHHMM(minutes: number): string {
  return `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
}

function hhmmToMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function slugify(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "section-" + Date.now();
}

// Grouping lokal untuk data mentah dari /api/genba/schedule (GenbaScheduleItemRow,
// bukan GenbaItem) — beda tipe dari groupGenbaItemsBySection di genbaItemGrouping.ts,
// jadi tidak reuse fungsi itu. Urutan sudah dari API (sectionOrder → itemOrder).
function groupBySection(items: GenbaScheduleItemRow[]): ScheduleSectionGroup[] {
  const order: string[] = [];
  const map = new Map<string, ScheduleSectionGroup>();
  items.forEach((item) => {
    if (!map.has(item.sectionId)) {
      order.push(item.sectionId);
      map.set(item.sectionId, { sectionId: item.sectionId, sectionTitle: item.sectionTitle, items: [] });
    }
    map.get(item.sectionId)!.items.push(item);
  });
  return order.map((id) => map.get(id)!);
}

function GenbaPengaturanContent() {
  const { genbaFetch } = useGenbaAuth();
  const [items, setItems] = useState<GenbaScheduleItemRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form tambah item
  const [sectionMode, setSectionMode] = useState<"existing" | "new">("existing");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [point, setPoint] = useState("");
  const [standard, setStandard] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("08:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPoint, setEditPoint] = useState("");
  const [editStandard, setEditStandard] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await genbaFetch("/api/genba/schedule");
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      } else {
        setErrorMessage(json.error || "Gagal memuat data checklist.");
      }
    } catch (err) {
      console.error("Load genba schedule error:", err);
      setErrorMessage("Gagal menghubungi server.");
    } finally {
      setIsLoading(false);
    }
  }, [genbaFetch]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const sections = items ? groupBySection(items) : [];

  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId && sectionMode === "existing") {
      setSelectedSectionId(sections[0].sectionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.length]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const endMinutes = hhmmToMinutes(deadlineTime);
    if (endMinutes === null) {
      setErrorMessage("Format jam tenggat tidak valid.");
      return;
    }
    if (!point.trim() || !standard.trim()) {
      setErrorMessage("Point dan standar wajib diisi.");
      return;
    }

    let sectionId: string;
    let sectionTitle: string;

    if (sectionMode === "new") {
      if (!newSectionTitle.trim()) {
        setErrorMessage("Nama section baru wajib diisi.");
        return;
      }
      sectionTitle = newSectionTitle.trim();
      sectionId = slugify(sectionTitle);
    } else {
      const found = sections.find((s) => s.sectionId === selectedSectionId);
      if (!found) {
        setErrorMessage("Pilih section terlebih dahulu.");
        return;
      }
      sectionId = found.sectionId;
      sectionTitle = found.sectionTitle;
    }

    setIsSubmitting(true);
    try {
      const res = await genbaFetch("/api/genba/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          sectionTitle,
          point: point.trim(),
          standard: standard.trim(),
          endMinutes,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setSuccessMessage("Item checklist berhasil ditambahkan.");
        setPoint("");
        setStandard("");
        setDeadlineTime("08:00");
        setNewSectionTitle("");
        setSectionMode("existing");
        setSelectedSectionId(sectionId);
        await loadItems();
      } else {
        setErrorMessage(json.error || "Gagal menambah item checklist.");
      }
    } catch (err) {
      console.error("Add genba schedule item error:", err);
      setErrorMessage("Gagal menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: GenbaScheduleItemRow) => {
    setEditingId(item.id);
    setEditPoint(item.point);
    setEditStandard(item.standard);
    setEditDeadline(minutesToHHMM(item.endMinutes));
  };

  const cancelEdit = () => setEditingId(null);

  const handleSaveEdit = async (id: string) => {
    setErrorMessage(null);
    const endMinutes = hhmmToMinutes(editDeadline);
    if (endMinutes === null) {
      setErrorMessage("Format jam tenggat tidak valid.");
      return;
    }
    if (!editPoint.trim() || !editStandard.trim()) {
      setErrorMessage("Point dan standar wajib diisi.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await genbaFetch(`/api/genba/schedule/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ point: editPoint.trim(), standard: editStandard.trim(), endMinutes }),
      });
      const json = await res.json();

      if (json.success) {
        setEditingId(null);
        await loadItems();
      } else {
        setErrorMessage(json.error || "Gagal menyimpan perubahan.");
      }
    } catch (err) {
      console.error("Save genba schedule item error:", err);
      setErrorMessage("Gagal menghubungi server.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, pointLabel: string) => {
    const confirmed = confirm(
      `Nonaktifkan item "${pointLabel}"?\n\nItem ini tidak akan muncul lagi di checklist entry BARU, tapi entry lama yang sudah memakainya tidak berubah sama sekali.`
    );
    if (!confirmed) return;

    setErrorMessage(null);
    try {
      const res = await genbaFetch(`/api/genba/schedule/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await loadItems();
      } else {
        setErrorMessage(json.error || "Gagal menonaktifkan item.");
      }
    } catch (err) {
      console.error("Delete genba schedule item error:", err);
      setErrorMessage("Gagal menghubungi server.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <a
            href="/genba"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Kembali ke Genba Harian"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <h1 className="text-lg font-bold tracking-tight">Pengaturan Checklist Genba</h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {errorMessage && (
          <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
        )}
        {successMessage && (
          <Toast message={successMessage} type="success" duration={2500} onClose={() => setSuccessMessage(null)} />
        )}

        {/* Form tambah item */}
        <form onSubmit={handleAddItem} className="bg-white rounded-xl shadow-md border border-slate-200 p-4 space-y-3">
          <h2 className="text-sm font-bold text-slate-800">Tambah Item Checklist</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Section</label>
              <select
                value={sectionMode === "new" ? "__new__" : selectedSectionId}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setSectionMode("new");
                  } else {
                    setSectionMode("existing");
                    setSelectedSectionId(e.target.value);
                  }
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              >
                {sections.map((s) => (
                  <option key={s.sectionId} value={s.sectionId}>
                    {s.sectionTitle}
                  </option>
                ))}
                <option value="__new__">+ Section baru...</option>
              </select>
            </div>

            {sectionMode === "new" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Section Baru</label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Contoh: Kebersihan Toilet"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Tenggat</label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Point / Pertanyaan Checklist</label>
            <input
              type="text"
              value={point}
              onChange={(e) => setPoint(e.target.value)}
              placeholder="Contoh: Area kerja bersih dan rapi"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Standar</label>
            <input
              type="text"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              placeholder="Contoh: Tidak ada sampah/barang tidak perlu di area kerja"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {isSubmitting ? "Menyimpan..." : "Tambah Item"}
          </button>
        </form>

        {/* List item per section */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 flex items-center justify-center text-slate-400 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat checklist...
          </div>
        ) : (
          <>
            {sections.map((section) => (
              <div key={section.sectionId} className="bg-white rounded-xl shadow-md border border-slate-200 p-4 space-y-2">
                <h2 className="text-sm font-bold text-indigo-700">{section.sectionTitle}</h2>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-lg p-3">
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editPoint}
                            onChange={(e) => setEditPoint(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={editStandard}
                            onChange={(e) => setEditStandard(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                          <input
                            type="time"
                            value={editDeadline}
                            onChange={(e) => setEditDeadline(e.target.value)}
                            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.id)}
                              disabled={isSavingEdit}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <CheckIcon className="w-3.5 h-3.5" />
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{item.point}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Standar: {item.standard}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Tenggat: {minutesToHHMM(item.endMinutes)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.point)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100"
                              title="Nonaktifkan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {sections.length === 0 && (
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center text-sm text-slate-500">
                Belum ada item checklist aktif.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function GenbaPengaturanPage() {
  return (
    <GenbaPasswordGate verifyUrl="/api/genba/schedule">
      <GenbaPengaturanContent />
    </GenbaPasswordGate>
  );
}
