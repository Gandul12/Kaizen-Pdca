"use client";

import React, { useState } from "react";
import { X, ArrowUpRight, Loader2 } from "lucide-react";
import { PasswordModal } from "@/components/PasswordModal";
import { Toast } from "@/components/Toast";
import { EMPTY_KAIZEN_CONTENT, KaizenContent } from "@/types/kaizen";
import type { GenbaItem } from "@/types/genba";
import { getVisitorId } from "@/lib/visitor";

// Info entry minimal yang dibutuhkan modal ini — bukan seluruh GenbaEntry,
// supaya tidak terikat pada tipe lokal genba/page.tsx (id-nya opsional
// karena entry yang belum pernah disimpan belum punya id).
export interface EscalationEntryInfo {
  id?: string;
  date: string;
  leaderName: string;
  lineName?: string | null;
}

interface EscalateToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GenbaItem;
  entry: EscalationEntryInfo;
  genbaPassword: string;
  onSuccess: (projectId: string, shareToken: string) => void;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? trimmed.slice(0, max).trim() : trimmed;
}

export const EscalateToProjectModal: React.FC<EscalateToProjectModalProps> = ({
  isOpen,
  onClose,
  item,
  entry,
  genbaPassword,
  onSuccess,
}) => {
  const [title, setTitle] = useState(() => truncate(item.point, 60));
  const [department, setDepartment] = useState(entry.lineName || "");
  const [leader, setLeader] = useState(entry.leaderName || "");
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  if (!isOpen) return null;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setToast({ message: "Judul proyek tidak boleh kosong.", type: "error" });
      return;
    }
    if (!entry.id) {
      setToast({ message: "Simpan checklist hari ini dulu sebelum melakukan eskalasi.", type: "error" });
      return;
    }
    setShowPasswordStep(true);
  };

  const handleCreateProject = async (projectPassword: string) => {
    setPasswordError("");
    setIsSubmitting(true);

    try {
      const content: KaizenContent = {
        ...EMPTY_KAIZEN_CONTENT,
        header: {
          ...EMPTY_KAIZEN_CONTENT.header,
          title: title.trim(),
          department: department.trim() || "Produksi",
          leader: leader.trim() || entry.leaderName,
          startDate: entry.date,
          status: "Draft",
        },
        step1: {
          ...EMPTY_KAIZEN_CONTENT.step1,
          currentSituation: [item.point, item.actual, item.note].filter(Boolean).join(" — "),
        },
        step2: {
          ...EMPTY_KAIZEN_CONTENT.step2,
          fourWOneH: {
            what: item.point,
            when: entry.date,
            where: entry.lineName || "",
            who: entry.leaderName,
          },
        },
      };

      const res = await fetch("/api/kaizen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          department: department.trim() || "Produksi",
          leader: leader.trim() || entry.leaderName,
          teamMembers: "",
          startDate: entry.date,
          dueDate: "",
          status: "Draft",
          projectPassword,
          content,
          visitorId: getVisitorId(),
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setPasswordError(json.error || "Gagal membuat proyek Kaizen.");
        setIsSubmitting(false);
        return;
      }

      const newProjectId: string = json.data.id;
      const newShareToken: string = json.data.shareToken || "";

      // Tautkan balik ke entry genba — kalau ini gagal, proyek TETAP dianggap
      // belum ter-eskalasi dari sisi genba (linkedProjectId tidak diset).
      try {
        const patchRes = await fetch(`/api/genba/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-genba-password": genbaPassword },
          body: JSON.stringify({
            linkedProjectId: newProjectId,
            linkedProjectShareToken: newShareToken,
          }),
        });
        const patchJson = await patchRes.json();

        if (!patchJson.success) {
          setToast({
            message: `Proyek berhasil dibuat, tapi gagal menautkan ke checklist genba ini. Simpan ID proyek: ${newProjectId}`,
            type: "error",
          });
          setIsSubmitting(false);
          return;
        }
      } catch (patchErr) {
        console.error("Link genba entry to project error:", patchErr);
        setToast({
          message: `Proyek berhasil dibuat, tapi gagal menautkan ke checklist genba ini. Simpan ID proyek: ${newProjectId}`,
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onSuccess(newProjectId, newShareToken);
    } catch (error) {
      console.error("Escalate to project error:", error);
      setPasswordError("Gagal terhubung ke server, periksa koneksi internet Anda.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {!showPasswordStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5 z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Jadikan Proyek PDCA</h2>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 -mt-3">
              Temuan ini akan dibuat sebagai proyek Kaizen baru berstatus Draft. Periksa dan sesuaikan data di bawah sebelum lanjut.
            </p>

            <form onSubmit={handleContinue} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Judul Proyek
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Department / Line
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Produksi"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Leader / PIC
                  </label>
                  <input
                    type="text"
                    value={leader}
                    onChange={(e) => setLeader(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                <p><span className="font-bold text-slate-500">Situasi Saat Ini:</span> {[item.point, item.actual, item.note].filter(Boolean).join(" — ") || "-"}</p>
                <p><span className="font-bold text-slate-500">Tanggal:</span> {entry.date}</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-2.5 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 rounded-lg transition-colors"
                >
                  Lanjutkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PasswordModal
        isOpen={showPasswordStep}
        onClose={() => setShowPasswordStep(false)}
        onSubmit={handleCreateProject}
        title="Kunci Proyek Baru"
        description="Buat password untuk mengamankan proyek Kaizen hasil eskalasi ini."
        error={passwordError}
        isLoading={isSubmitting}
        mode="create"
      />
    </>
  );
};
