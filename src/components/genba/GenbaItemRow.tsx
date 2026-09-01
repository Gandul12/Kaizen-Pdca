"use client";

import React, { useState } from "react";
import { Check, ChevronDown, ChevronUp, Trash2, Image as ImageIcon, Plus, AlertTriangle, Loader2, Rocket, ExternalLink } from "lucide-react";
import { Toast } from "@/components/Toast";
import { PhotoLightbox } from "@/components/genba/PhotoLightbox";
import { EscalateToProjectModal } from "@/components/genba/EscalateToProjectModal";
import { GenbaEntry, GenbaItem, CorrectiveAction } from "@/types/genba";

interface GenbaItemRowProps {
  item: GenbaItem;
  onChange: (updated: GenbaItem) => void;
  // FR-9 (eskalasi ke PDCA): `linkedProjectId` DIPUTUSKAN tetap di level
  // GenbaEntry (bukan dipindah ke GenbaItem) supaya tidak mengubah skema
  // FR-1 — konsekuensinya satu entry (satu hari) hanya bisa terhubung ke
  // SATU proyek eskalasi, dibagi oleh semua item di hari itu (bukan
  // per-item). Ini sesuai spesifikasi FR-9 ("satu entry genba cuma boleh
  // terhubung ke satu proyek eskalasi"). Makanya komponen ini butuh
  // `entry` penuh, bukan cuma `item`.
  entry: GenbaEntry;
  onEscalated: (projectId: string) => void;
}

export const GenbaItemRow: React.FC<GenbaItemRowProps> = ({ item, onChange, entry, onEscalated }) => {
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxAttachmentId, setLightboxAttachmentId] = useState<string | null>(null);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [isCorrectiveOpen, setIsCorrectiveOpen] = useState(!!item.correctiveAction);

  const isChecked = item.status === "ok" || item.status === "ng";
  const isNg = item.status === "ng";

  const toggleChecked = () => {
    onChange({ ...item, status: isChecked ? "na" : "ok" });
  };

  const toggleNg = () => {
    onChange({ ...item, status: isNg ? "ok" : "ng" });
  };

  const handleNoteChange = (value: string) => {
    onChange({ ...item, note: value });
  };

  const handleActualChange = (value: string) => {
    onChange({ ...item, actual: value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        const newAttachments = [
          ...(item.attachments || []),
          {
            id: "att-" + Date.now(),
            fileUrl: json.fileUrl,
            fileName: file.name,
          },
        ];
        onChange({ ...item, attachments: newAttachments });
      } else {
        setUploadError(json.error || "Gagal mengunggah foto. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Upload genba photo error:", err);
      setUploadError("Gagal upload, periksa koneksi internet Anda.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    onChange({
      ...item,
      attachments: (item.attachments || []).filter((att) => att.id !== id),
    });
    if (lightboxAttachmentId === id) setLightboxAttachmentId(null);
  };

  const lightboxAttachment = (item.attachments || []).find((att) => att.id === lightboxAttachmentId) || null;

  const currentCA: CorrectiveAction = item.correctiveAction ?? { rootCause: "", action: "", status: "belum" };

  const updateCorrectiveAction = (patch: Partial<CorrectiveAction>) => {
    onChange({ ...item, correctiveAction: { ...currentCA, ...patch } });
  };

  const correctiveStatusBadgeStyle: Record<CorrectiveAction["status"], string> = {
    belum: "bg-slate-100 text-slate-600 border-slate-300",
    proses: "bg-amber-100 text-amber-800 border-amber-300",
    selesai: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };

  const rowStyle = isNg
    ? "bg-rose-50 border-rose-200"
    : isChecked
    ? "bg-emerald-50 border-emerald-200"
    : "bg-white border-slate-200";

  return (
    <div className={`rounded-xl border p-3 sm:p-4 transition-colors ${rowStyle}`}>
      {uploadError && (
        <div className="mb-2">
          <Toast message={uploadError} type="error" onClose={() => setUploadError(null)} />
        </div>
      )}

      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggleChecked}
          className={`shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
            isChecked ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-300"
          }`}
          title={isChecked ? "Tandai belum dicek" : "Tandai sudah dicek"}
        >
          {isChecked && <Check className="w-5 h-5 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{item.point}</p>
          <p className="text-xs text-slate-500 mt-0.5">Standar: {item.standard}</p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <button
              type="button"
              onClick={toggleNg}
              className={`text-xs font-semibold px-2 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                isNg
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-white text-rose-600 border-rose-300 hover:bg-rose-50"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {isNg ? "Ditandai NG" : "Tandai NG"}
            </button>

            <button
              type="button"
              onClick={() => setIsNoteOpen((v) => !v)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {isNoteOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Catatan{(item.note || item.attachments?.length) ? " •" : ""}
            </button>
          </div>

          {isNoteOpen && (
            <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kondisi Aktual</label>
                <textarea
                  rows={2}
                  value={item.actual || ""}
                  onChange={(e) => handleActualChange(e.target.value)}
                  placeholder="Kondisi yang ditemukan di lapangan..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <textarea
                rows={2}
                value={item.note || ""}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Catatan tambahan (opsional)..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  Foto Bukti
                </span>
                <label
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                    isUploading
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  {isUploading ? "Mengupload..." : "Tambah Foto"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {item.attachments && item.attachments.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {item.attachments.map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => setLightboxAttachmentId(att.id)}
                      className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in group"
                      title="Lihat foto ukuran penuh"
                    >
                      <img src={att.fileUrl} alt={att.fileName || "Foto genba"} className="w-full h-full object-cover" />
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(att.id);
                        }}
                        role="button"
                        title="Hapus Foto"
                        className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow opacity-90 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* FR-10: corrective-action opsional (akar masalah → tindakan → status) */}
              <div className="border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCorrectiveOpen((v) => !v)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {isCorrectiveOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  Tindak Lanjut{item.correctiveAction ? " •" : ""}
                </button>

                {isCorrectiveOpen && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Akar Masalah</label>
                      <textarea
                        rows={2}
                        value={currentCA.rootCause}
                        onChange={(e) => updateCorrectiveAction({ rootCause: e.target.value })}
                        placeholder="Akar masalah..."
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tindakan</label>
                      <textarea
                        rows={2}
                        value={currentCA.action}
                        onChange={(e) => updateCorrectiveAction({ action: e.target.value })}
                        placeholder="Tindakan yang diambil..."
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                      <select
                        value={currentCA.status}
                        onChange={(e) =>
                          updateCorrectiveAction({ status: e.target.value as CorrectiveAction["status"] })
                        }
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none ${correctiveStatusBadgeStyle[currentCA.status]}`}
                      >
                        <option value="belum">Belum</option>
                        <option value="proses">Proses</option>
                        <option value="selesai">Selesai</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* FR-9: eskalasi ke proyek PDCA — status per entry, bukan per item */}
              <div className="border-t border-slate-200 pt-3">
                {entry.linkedProjectId ? (
                  <a
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                    title="Buka daftar proyek Kaizen"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Sudah jadi proyek PDCA
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEscalateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    Jadikan Proyek PDCA
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {lightboxAttachment && (
        <PhotoLightbox
          imageUrl={lightboxAttachment.fileUrl}
          caption={lightboxAttachment.fileName}
          onClose={() => setLightboxAttachmentId(null)}
        />
      )}

      {isEscalateModalOpen && (
        <EscalateToProjectModal
          entry={entry}
          item={item}
          onClose={() => setIsEscalateModalOpen(false)}
          onEscalated={onEscalated}
        />
      )}
    </div>
  );
};
