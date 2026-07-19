"use client";

import React, { useState } from "react";
import { Step8Data, DocumentRow, AttachmentItem } from "@/types/kaizen";
import {
  ShieldCheck,
  Plus,
  Trash2,
  FileText,
  Upload,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";

interface Step8EditorProps {
  data: Step8Data;
  onChange: (updated: Step8Data) => void;
}

export const Step8Editor: React.FC<Step8EditorProps> = ({ data, onChange }) => {
  const [isUploadingBefore, setIsUploadingBefore] = useState(false);
  const [isUploadingAfter, setIsUploadingAfter] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const handleTextChange = (field: keyof Step8Data, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const addDocumentRow = () => {
    const newRow: DocumentRow = {
      id: "doc-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      docNumber: "",
      docName: "",
      status: "Baru",
    };
    onChange({
      ...data,
      documentsCreated: [...(data.documentsCreated || []), newRow],
    });
  };

  const removeDocumentRow = (id: string) => {
    onChange({
      ...data,
      documentsCreated: (data.documentsCreated || []).filter((row) => row.id !== id),
    });
  };

  const updateDocumentRow = (
    id: string,
    field: keyof DocumentRow,
    value: string
  ) => {
    onChange({
      ...data,
      documentsCreated: (data.documentsCreated || []).map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      ),
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === "before") setIsUploadingBefore(true);
    else setIsUploadingAfter(true);

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
        if (type === "before") {
          onChange({ ...data, beforeUrl: json.dataUrl });
        } else {
          onChange({ ...data, afterUrl: json.dataUrl });
        }
      }
    } catch (err) {
      console.error(`Upload ${type} image error:`, err);
    } finally {
      if (type === "before") setIsUploadingBefore(false);
      else setIsUploadingAfter(false);
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingAttachment(true);
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
        const newItem: AttachmentItem = {
          id: "att-" + Date.now(),
          fileName: file.name,
          fileUrl: json.dataUrl,
          fileType: file.type,
        };
        onChange({
          ...data,
          attachments: [...(data.attachments || []), newItem],
        });
      }
    } catch (err) {
      console.error("Attachment upload error:", err);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const removeAttachment = (id: string) => {
    onChange({
      ...data,
      attachments: (data.attachments || []).filter((att) => att.id !== id),
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
          <span className="px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-sm">
            LANGKAH 8
          </span>
          <h2>Standardization (Standardisasi & Dokumentasi)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Standardisasikan perbaikan ke dalam Standar Operasional Prosedur (SOP/WI/Form), buat perbandingan kondisi sebelum vs sesudah, dan tetapkan PIC pemeliharaan.
        </p>
      </div>

      {/* 1. Dokumen / SOP / Form Dibuat atau Direvisi */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              1. Tabel Dokumen / SOP / Work Instruction / Form yang Dibuat / Direvisi
            </h3>
            <p className="text-xs text-slate-500">
              Registrasikan dokumen kontrol kualitas resmi hasil perbaikan ini.
            </p>
          </div>

          <button
            type="button"
            onClick={addDocumentRow}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Dokumen
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3 min-w-[180px]">Nomor Dokumen / Kode SOP</th>
                <th className="p-3 min-w-[240px]">Nama Dokumen / Form</th>
                <th className="p-3 min-w-[140px]">Status (Baru / Revisi / Dihentikan)</th>
                <th className="p-3 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.documentsCreated && data.documentsCreated.length > 0 ? (
                data.documentsCreated.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center font-semibold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.docNumber || ""}
                        onChange={(e) => updateDocumentRow(row.id, "docNumber", e.target.value)}
                        placeholder="e.g. SOP-PRD-405-R2"
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.docName || ""}
                        onChange={(e) => updateDocumentRow(row.id, "docName", e.target.value)}
                        placeholder="e.g. Instruksi Kerja Perawatan Counter Stroke Pisau Punch"
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.status || "Baru"}
                        onChange={(e) => updateDocumentRow(row.id, "status", e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 bg-white"
                      >
                        <option value="Dibuat Baru">Dibuat Baru</option>
                        <option value="Revisi">Revisi</option>
                        <option value="Dihentikan / Non-aktif">Dihentikan</option>
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeDocumentRow(row.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    Belum ada dokumen yang didaftarkan. Klik &quot;Tambah Dokumen&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Before vs After Conditions Comparison */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          2. Kondisi Sebelum vs Sesudah (Before vs After Comparison)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kondisi Sebelum */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 block">
              KONDISI SEBELUM (BEFORE)
            </span>
            <textarea
              rows={3}
              value={data.beforeCondition || ""}
              onChange={(e) => handleTextChange("beforeCondition", e.target.value)}
              placeholder="Penjelasan deskriptif kondisi lama sebelum perbaikan..."
              className="w-full border border-rose-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-rose-500"
            />

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                Foto Kondisi Sebelum:
              </label>
              {data.beforeUrl ? (
                <div className="relative aspect-video bg-slate-200 rounded-lg overflow-hidden border">
                  <img
                    src={data.beforeUrl}
                    alt="Kondisi Sebelum"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleTextChange("beforeUrl", "")}
                    className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-full shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer border-2 border-dashed border-rose-300 rounded-lg p-4 block text-center hover:bg-rose-100/50 transition-colors">
                  <Upload className="w-5 h-5 mx-auto text-rose-600 mb-1" />
                  <span className="text-xs text-rose-800 font-medium">
                    {isUploadingBefore ? "Mengunggah..." : "Upload Foto Sebelum"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "before")}
                    disabled={isUploadingBefore}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Kondisi Sesudah */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
              KONDISI SESUDAH (AFTER)
            </span>
            <textarea
              rows={3}
              value={data.afterCondition || ""}
              onChange={(e) => handleTextChange("afterCondition", e.target.value)}
              placeholder="Penjelasan deskriptif kondisi baru setelah perbaikan standar..."
              className="w-full border border-emerald-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
            />

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                Foto Kondisi Sesudah:
              </label>
              {data.afterUrl ? (
                <div className="relative aspect-video bg-slate-200 rounded-lg overflow-hidden border">
                  <img
                    src={data.afterUrl}
                    alt="Kondisi Sesudah"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleTextChange("afterUrl", "")}
                    className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-full shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer border-2 border-dashed border-emerald-300 rounded-lg p-4 block text-center hover:bg-emerald-100/50 transition-colors">
                  <Upload className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <span className="text-xs text-emerald-800 font-medium">
                    {isUploadingAfter ? "Mengunggah..." : "Upload Foto Sesudah"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "after")}
                    disabled={isUploadingAfter}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. PIC Pemeliharaan Standar & Tanggal Efektif */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-6">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            PIC Pemeliharaan Standar (Standard Maintenance Leader)
          </label>
          <input
            type="text"
            value={data.maintenancePic || ""}
            onChange={(e) => handleTextChange("maintenancePic", e.target.value)}
            placeholder="e.g. Supervisor Maintenance (Rudi) & Leader QC"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Tanggal Efektif Standar Baru Berlaku
          </label>
          <input
            type="date"
            value={data.effectiveDate || ""}
            onChange={(e) => handleTextChange("effectiveDate", e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 4. Document Attachments */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-600" />
              4. Lampiran Dokumen Pendukung Tambahan
            </h3>
            <p className="text-xs text-slate-500">
              Unggah file SOP pdf, foto pendukung, atau data tambahan.
            </p>
          </div>

          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-indigo-600" />
            {isUploadingAttachment ? "Mengunggah..." : "Upload Lampiran"}
            <input
              type="file"
              className="hidden"
              onChange={handleAttachmentUpload}
              disabled={isUploadingAttachment}
            />
          </label>
        </div>

        {data.attachments && data.attachments.length > 0 ? (
          <div className="space-y-2 mt-2">
            {data.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">
                    {att.fileName}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded"
                  title="Hapus Lampiran"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-lg border border-slate-200">
            Belum ada lampiran pendukung.
          </p>
        )}
      </div>
    </div>
  );
};
