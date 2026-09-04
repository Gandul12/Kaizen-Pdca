"use client";

import React, { useState } from "react";
import { Check, X, Clock3, ChevronDown, ChevronUp, Camera, Trash2, Loader2, ArrowUpRight, ExternalLink, CheckCircle2, Wrench } from "lucide-react";
import { Toast } from "@/components/Toast";
import { PhotoLightbox } from "@/components/genba/PhotoLightbox";
import { EscalateToProjectModal, type EscalationEntryInfo } from "@/components/genba/EscalateToProjectModal";
import type { CorrectiveAction, CorrectiveActionStatus, GenbaAttachment, GenbaItem, GenbaItemStatus } from "@/types/genba";

const CORRECTIVE_STATUS_META: Record<CorrectiveActionStatus, { label: string; badgeClass: string; dotClass: string }> = {
  belum: { label: "Belum", badgeClass: "bg-slate-100 text-slate-600 border-slate-300", dotClass: "bg-slate-400" },
  proses: { label: "Proses", badgeClass: "bg-amber-50 text-amber-700 border-amber-300", dotClass: "bg-amber-500" },
  selesai: { label: "Selesai", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300", dotClass: "bg-emerald-500" },
};

interface GenbaItemRowProps {
  item: GenbaItem;
  onChange: (updated: GenbaItem) => void;
  entry: EscalationEntryInfo & { linkedProjectId?: string | null; linkedProjectShareToken?: string | null };
  genbaPassword: string;
  onEscalated: (projectId: string, shareToken: string) => void;
}

function formatEndTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const GenbaItemRow: React.FC<GenbaItemRowProps> = ({ item, onChange, entry, genbaPassword, onEscalated }) => {
  const [noteOpen, setNoteOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxAttachment, setLightboxAttachment] = useState<GenbaAttachment | null>(null);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState<boolean>(
    !!(item.correctiveAction && (item.correctiveAction.rootCause || item.correctiveAction.action))
  );

  const setStatus = (status: GenbaItemStatus) => {
    onChange({ ...item, status: item.status === status ? "pending" : status });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setIsUploading(true);
    setUploadError(null);

    // Upload berurutan supaya tidak membanjiri /api/upload; tiap file yang
    // berhasil ditambahkan ke daftar, satu file gagal tidak menghentikan
    // yang lain.
    const uploaded: GenbaAttachment[] = [];
    let firstError: string | null = null;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();

        if (json.success) {
          uploaded.push({
            id: `att-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
            fileUrl: json.fileUrl,
            fileName: file.name,
          });
        } else if (!firstError) {
          firstError = json.error || "Gagal mengunggah salah satu foto. Silakan coba lagi.";
        }
      } catch (err) {
        console.error("Upload genba photo error:", err);
        if (!firstError) firstError = "Gagal upload, periksa koneksi internet Anda.";
      }
    }

    // Append ke attachments yang sudah ada, JANGAN overwrite.
    if (uploaded.length > 0) {
      onChange({ ...item, attachments: [...item.attachments, ...uploaded] });
    }
    if (firstError) setUploadError(firstError);

    setIsUploading(false);
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    onChange({ ...item, attachments: item.attachments.filter((a) => a.id !== id) });
  };

  const updateCorrectiveAction = (patch: Partial<CorrectiveAction>) => {
    const current: CorrectiveAction = item.correctiveAction || { rootCause: "", action: "", status: "belum" };
    onChange({ ...item, correctiveAction: { ...current, ...patch } });
  };

  const hasNote = !!item.note || !!item.actual;
  const isDone = item.status !== "pending";

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${
        item.status === "ok"
          ? "border-emerald-200"
          : item.status === "ng"
          ? "border-rose-300"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Status besar, tap-friendly */}
        <div className="flex flex-col gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setStatus("ok")}
            title="Tandai OK"
            className={`w-11 h-11 rounded-lg flex items-center justify-center border-2 transition-colors ${
              item.status === "ok"
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "bg-white border-slate-300 text-slate-300 hover:border-emerald-400 hover:text-emerald-500"
            }`}
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setStatus("ng")}
            title="Tandai NG"
            className={`w-11 h-11 rounded-lg flex items-center justify-center border-2 transition-colors ${
              item.status === "ng"
                ? "bg-rose-500 border-rose-500 text-white"
                : "bg-white border-slate-300 text-slate-300 hover:border-rose-400 hover:text-rose-500"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-mono font-semibold text-slate-400 mb-0.5 flex items-center gap-1">
            <Clock3 className="w-3 h-3" /> s.d. {formatEndTime(item.endMinutes)}
          </div>
          <div className={`text-sm leading-snug ${isDone ? "text-slate-500" : "text-slate-900 font-medium"}`}>
            {item.point}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Standar: {item.standard}</div>

          <button
            type="button"
            onClick={() => setNoteOpen((v) => !v)}
            className={`mt-2 inline-flex items-center gap-1 text-[11px] font-mono font-semibold ${
              hasNote ? "text-amber-600" : "text-slate-400"
            }`}
          >
            {noteOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {hasNote ? "Catatan diisi — tap untuk lihat" : "Tambah catatan / foto"}
          </button>
        </div>
      </div>

      {noteOpen && (
        <div className="px-3 pb-3 pl-[4.25rem] space-y-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
              Kondisi Aktual
            </label>
            <input
              type="text"
              value={item.actual}
              onChange={(e) => onChange({ ...item, actual: e.target.value })}
              placeholder="Apa yang ditemukan di lapangan..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
              Catatan
            </label>
            <textarea
              rows={2}
              value={item.note}
              onChange={(e) => onChange({ ...item, note: e.target.value })}
              placeholder="Temuan / catatan tambahan..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-vertical"
            />
          </div>

          {uploadError && (
            <Toast message={uploadError} type="error" onClose={() => setUploadError(null)} />
          )}

          <div className="flex items-center justify-between">
            <label
              className={`text-xs font-semibold px-3 py-2 rounded-lg border flex items-center gap-1.5 transition-colors ${
                isUploading
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {isUploading ? "Mengunggah..." : "Tambah Foto"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          {item.attachments.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {item.attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden group"
                >
                  <img
                    src={att.fileUrl}
                    alt={att.fileName}
                    onClick={() => setLightboxAttachment(att)}
                    className="w-full h-full object-cover cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(att.id);
                    }}
                    className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tindak Lanjut (corrective action) — opsional, sebelum blok eskalasi */}
          <div>
            <button
              type="button"
              onClick={() => setFollowUpOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                item.status === "ng"
                  ? "bg-rose-50 text-rose-700 border-rose-300 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Tindak Lanjut
              {item.correctiveAction && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${CORRECTIVE_STATUS_META[item.correctiveAction.status].badgeClass}`}
                >
                  {CORRECTIVE_STATUS_META[item.correctiveAction.status].label}
                </span>
              )}
              {followUpOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {followUpOpen && (
              <div className="mt-2 space-y-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Akar Masalah
                  </label>
                  <textarea
                    rows={2}
                    value={item.correctiveAction?.rootCause || ""}
                    onChange={(e) => updateCorrectiveAction({ rootCause: e.target.value })}
                    placeholder="Kenapa temuan ini bisa terjadi..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-vertical"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Tindakan
                  </label>
                  <textarea
                    rows={2}
                    value={item.correctiveAction?.action || ""}
                    onChange={(e) => updateCorrectiveAction({ action: e.target.value })}
                    placeholder="Tindakan yang akan/sudah dilakukan..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-vertical"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Status
                  </label>
                  <select
                    value={item.correctiveAction?.status || "belum"}
                    onChange={(e) => updateCorrectiveAction({ status: e.target.value as CorrectiveActionStatus })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="belum">Belum</option>
                    <option value="proses">Proses</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Eskalasi ke proyek PDCA — manual, per temuan, tapi tautan disimpan
              di level entry (satu entry cuma bisa terhubung ke satu proyek). */}
          <div className="pt-1">
            {entry.linkedProjectId ? (
              entry.linkedProjectShareToken ? (
                <a
                  href={`/share/${entry.linkedProjectShareToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sudah jadi proyek PDCA <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sudah jadi proyek PDCA
                </span>
              )
            ) : (
              <button
                type="button"
                onClick={() => setShowEscalateModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Jadikan Proyek PDCA
              </button>
            )}
          </div>
        </div>
      )}

      <EscalateToProjectModal
        isOpen={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        item={item}
        entry={entry}
        genbaPassword={genbaPassword}
        onSuccess={(projectId, shareToken) => {
          setShowEscalateModal(false);
          onEscalated(projectId, shareToken);
        }}
      />

      {lightboxAttachment && (
        <PhotoLightbox
          fileUrl={lightboxAttachment.fileUrl}
          fileName={lightboxAttachment.fileName}
          onClose={() => setLightboxAttachment(null)}
        />
      )}
    </div>
  );
};
