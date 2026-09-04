"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Plus, Save, X, Loader2, Settings } from "lucide-react";
import { GenbaPasswordGate, useGenbaPassword } from "@/components/genba/GenbaPasswordGate";
import { Toast } from "@/components/Toast";

interface ScheduleItemRow {
  id: string;
  sectionId: string;
  sectionTitle: string;
  sectionOrder: number;
  itemOrder: number;
  point: string;
  standard: string;
  endMinutes: number;
  isActive: number;
}

interface SectionGroup {
  sectionId: string;
  sectionTitle: string;
  items: ScheduleItemRow[];
}

function groupBySection(rows: ScheduleItemRow[]): SectionGroup[] {
  const order: string[] = [];
  const map = new Map<string, SectionGroup>();
  for (const row of rows) {
    if (!map.has(row.sectionId)) {
      map.set(row.sectionId, { sectionId: row.sectionId, sectionTitle: row.sectionTitle, items: [] });
      order.push(row.sectionId);
    }
    map.get(row.sectionId)!.items.push(row);
  }
  return order.map((id) => map.get(id)!);
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((v) => Number(v) || 0);
  return h * 60 + m;
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "section-" + Date.now();
}

const NEW_SECTION_VALUE = "__new__";

export default function GenbaPengaturanPage() {
  return (
    <GenbaPasswordGate>
      <GenbaPengaturanContent />
    </GenbaPasswordGate>
  );
}

function GenbaPengaturanContent() {
  const genbaPassword = useGenbaPassword();

  const [rows, setRows] = useState<ScheduleItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPoint, setEditPoint] = useState("");
  const [editStandard, setEditStandard] = useState("");
  const [editTime, setEditTime] = useState("08:00");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSectionChoice, setNewSectionChoice] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newPoint, setNewPoint] = useState("");
  const [newStandard, setNewStandard] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const [isAdding, setIsAdding] = useState(false);

  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/genba/schedule", {
        headers: { "x-genba-password": genbaPassword },
      });
      const json = await res.json();
      if (json.success) {
        setRows(json.data);
      } else {
        setToast({ message: json.error || "Gagal memuat master checklist.", type: "error" });
      }
    } catch (err) {
      console.error("Load genba schedule error:", err);
      setToast({ message: "Gagal memuat, periksa koneksi internet Anda.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [genbaPassword]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const sections = groupBySection(rows);

  const startEdit = (row: ScheduleItemRow) => {
    setConfirmDeleteId(null);
    setEditingId(row.id);
    setEditPoint(row.point);
    setEditStandard(row.standard);
    setEditTime(minutesToHHMM(row.endMinutes));
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    if (!editPoint.trim() || !editStandard.trim()) {
      setToast({ message: "Point dan standar tidak boleh kosong.", type: "error" });
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/genba/schedule/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-genba-password": genbaPassword },
        body: JSON.stringify({
          point: editPoint.trim(),
          standard: editStandard.trim(),
          endMinutes: hhmmToMinutes(editTime),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRows((prev) => prev.map((r) => (r.id === id ? json.data : r)));
        setEditingId(null);
      } else {
        setToast({ message: json.error || "Gagal menyimpan perubahan.", type: "error" });
      }
    } catch (err) {
      console.error("Save schedule item error:", err);
      setToast({ message: "Gagal menyimpan, periksa koneksi internet Anda.", type: "error" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const runDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/genba/schedule/${id}`, {
        method: "DELETE",
        headers: { "x-genba-password": genbaPassword },
      });
      const json = await res.json();
      if (json.success) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        setConfirmDeleteId(null);
        setToast({ message: "Item checklist dinonaktifkan.", type: "success" });
      } else {
        setToast({ message: json.error || "Gagal menonaktifkan item.", type: "error" });
      }
    } catch (err) {
      console.error("Delete schedule item error:", err);
      setToast({ message: "Gagal menghapus, periksa koneksi internet Anda.", type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddItem = async () => {
    const isNewSection = newSectionChoice === NEW_SECTION_VALUE;
    const sectionTitle = isNewSection
      ? newSectionTitle.trim()
      : sections.find((s) => s.sectionId === newSectionChoice)?.sectionTitle || "";
    const sectionId = isNewSection ? slugify(newSectionTitle) : newSectionChoice;

    if (!newSectionChoice || !sectionTitle || !newPoint.trim() || !newStandard.trim()) {
      setToast({ message: "Section, point, dan standar wajib diisi.", type: "error" });
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch("/api/genba/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-genba-password": genbaPassword },
        body: JSON.stringify({
          sectionId,
          sectionTitle,
          point: newPoint.trim(),
          standard: newStandard.trim(),
          endMinutes: hhmmToMinutes(newTime),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRows((prev) => [...prev, json.data]);
        setShowAddForm(false);
        setNewSectionChoice("");
        setNewSectionTitle("");
        setNewPoint("");
        setNewStandard("");
        setNewTime("08:00");
        setToast({ message: "Item checklist baru berhasil ditambahkan.", type: "success" });
      } else {
        setToast({ message: json.error || "Gagal menambah item.", type: "error" });
      }
    } catch (err) {
      console.error("Add schedule item error:", err);
      setToast({ message: "Gagal menambah, periksa koneksi internet Anda.", type: "error" });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
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
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-black text-slate-900">Pengaturan Master Checklist</h1>
          </div>
          <p className="text-xs text-slate-500">
            Perubahan di sini hanya berlaku untuk entry baru yang dibuat setelahnya. Checklist yang sudah
            tersimpan tidak ikut berubah.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center text-sm text-slate-400 py-10">Memuat master checklist...</div>
        ) : (
          <>
            {sections.map((section) => (
              <div
                key={section.sectionId}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                  {section.sectionTitle}
                </div>
                <div className="divide-y divide-slate-100">
                  {section.items.map((row) => (
                    <div key={row.id} className="p-3">
                      {editingId === row.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editPoint}
                            onChange={(e) => setEditPoint(e.target.value)}
                            placeholder="Point checklist"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                          />
                          <textarea
                            rows={2}
                            value={editStandard}
                            onChange={(e) => setEditStandard(e.target.value)}
                            placeholder="Standar"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-vertical focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                              Jam Tenggat
                            </label>
                            <input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => saveEdit(row.id)}
                              disabled={isSavingEdit}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                            >
                              {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              Simpan
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Batal
                            </button>
                          </div>
                        </div>
                      ) : confirmDeleteId === row.id ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 space-y-2">
                          <p className="text-xs text-rose-700 font-semibold">
                            Nonaktifkan &quot;{row.point}&quot;? Checklist yang sudah memakai item ini tidak akan berubah.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => runDelete(row.id)}
                              disabled={isDeleting}
                              className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                            >
                              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              Ya, Nonaktifkan
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2 rounded-lg transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{row.point}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Standar: {row.standard}</p>
                            <p className="text-[11px] font-mono text-slate-400 mt-1">s.d. {minutesToHHMM(row.endMinutes)}</p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => startEdit(row)}
                              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setConfirmDeleteId(row.id);
                              }}
                              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
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

            {/* Form tambah item */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-sm font-bold text-indigo-700 py-2"
                >
                  <Plus className="w-4 h-4" /> Tambah Item Checklist
                </button>
              ) : (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Section
                    </label>
                    <select
                      value={newSectionChoice}
                      onChange={(e) => setNewSectionChoice(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">Pilih section...</option>
                      {sections.map((s) => (
                        <option key={s.sectionId} value={s.sectionId}>
                          {s.sectionTitle}
                        </option>
                      ))}
                      <option value={NEW_SECTION_VALUE}>+ Section baru</option>
                    </select>
                  </div>

                  {newSectionChoice === NEW_SECTION_VALUE && (
                    <input
                      type="text"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="Nama section baru"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    />
                  )}

                  <input
                    type="text"
                    value={newPoint}
                    onChange={(e) => setNewPoint(e.target.value)}
                    placeholder="Point checklist"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    value={newStandard}
                    onChange={(e) => setNewStandard(e.target.value)}
                    placeholder="Standar"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-vertical focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Jam Tenggat</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleAddItem}
                      disabled={isAdding}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Tambah
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold py-2.5 rounded-lg transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
