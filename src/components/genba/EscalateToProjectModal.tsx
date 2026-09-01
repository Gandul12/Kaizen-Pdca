"use client";

import React, { useState } from "react";
import { X, Rocket, Loader2 } from "lucide-react";
import { GenbaEntry, GenbaItem } from "@/types/genba";
import { EMPTY_KAIZEN_CONTENT, KaizenContent } from "@/types/kaizen";
import { useGenbaAuth } from "@/components/genba/GenbaPasswordGate";

interface EscalateToProjectModalProps {
  entry: GenbaEntry;
  item: GenbaItem;
  onClose: () => void;
  /** Dipanggil setelah proyek Kaizen baru berhasil dibuat DAN linkedProjectId
   * berhasil tersimpan di entry genba — parent update state lokal di sini. */
  onEscalated: (projectId: string) => void;
}

function truncate(text: string, maxLen: number): string {
  const trimmed = (text || "").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen).trim();
}

// Modal ini SATU-SATUNYA jalur eskalasi genba → PDCA: dipanggil hanya kalau
// user eksplisit klik tombol "Jadikan Proyek PDCA" lalu konfirmasi di sini.
// Tidak ada temuan yang otomatis jadi proyek tanpa aksi ini.
export const EscalateToProjectModal: React.FC<EscalateToProjectModalProps> = ({
  entry,
  item,
  onClose,
  onEscalated,
}) => {
  const { genbaFetch } = useGenbaAuth();

  const [title, setTitle] = useState(truncate(item.point, 60));
  const [department, setDepartment] = useState(entry.lineName || "");
  const [leader, setLeader] = useState(entry.leaderName || "");
  const [projectPassword, setProjectPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Judul proyek tidak boleh kosong.");
      return;
    }
    if (!leader.trim()) {
      setError("Leader tidak boleh kosong.");
      return;
    }
    if (!projectPassword.trim()) {
      setError("Password proyek wajib diisi (dipakai untuk mengamankan proyek Kaizen ini nantinya).");
      return;
    }

    setIsSubmitting(true);

    try {
      // "item.text" pada spesifikasi FR-9 dipetakan ke `item.point` — field
      // aktual pada GenbaItem (lihat src/types/genba.ts).
      const combinedSituation = item.note ? `${item.point} — ${item.note}` : item.point;

      const content: KaizenContent = {
        ...EMPTY_KAIZEN_CONTENT,
        header: {
          ...EMPTY_KAIZEN_CONTENT.header,
          title: title.trim(),
          department: department.trim(),
          leader: leader.trim(),
          startDate: entry.date,
          status: "Draft",
        },
        step1: {
          ...EMPTY_KAIZEN_CONTENT.step1,
          currentSituation: combinedSituation,
        },
        step2: {
          ...EMPTY_KAIZEN_CONTENT.step2,
          fourWOneH: {
            what: item.point,
            when: entry.date,
            where: entry.lineName ?? "",
            who: entry.leaderName,
          },
        },
      };

      // Sertakan field top-level yang sama dengan `content.header` (bukan
      // hanya di dalam `content`) — kolom tabel kaizenProjects (title,
      // department, leader, startDate) dibaca terpisah dari `content` oleh
      // daftar proyek di halaman utama, jadi keduanya harus konsisten.
      const createRes = await fetch("/api/kaizen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          department: department.trim(),
          leader: leader.trim(),
          teamMembers: "",
          startDate: entry.date,
          dueDate: "",
          status: "Draft",
          projectPassword: projectPassword.trim(),
          content,
          isTemplate: 0,
          templateName: null,
        }),
      });
      const createJson = await createRes.json();

      if (!createJson.success) {
        setError(createJson.error || "Gagal membuat proyek Kaizen.");
        setIsSubmitting(false);
        return;
      }

      const newProjectId: string = createJson.data.id;

      // Simpan relasi balik di entry genba. Kalau langkah ini gagal, proyek
      // Kaizen-nya sudah terlanjur dibuat — tampilkan errornya, jangan
      // pura-pura sukses, supaya user tahu perlu menghubungkan manual.
      const linkRes = await genbaFetch(`/api/genba/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedProjectId: newProjectId }),
      });
      const linkJson = await linkRes.json();

      if (!linkJson.success) {
        setError(
          `Proyek Kaizen berhasil dibuat, tapi gagal menautkan ke entry genba: ${
            linkJson.error || "kesalahan tidak diketahui"
          }. Proyek tetap tersimpan di daftar Kaizen.`
        );
        setIsSubmitting(false);
        return;
      }

      onEscalated(newProjectId);
      onClose();
    } catch (err) {
      console.error("Escalate to Kaizen project error:", err);
      setError("Gagal menghubungi server. Periksa koneksi internet Anda.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Rocket className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-sm font-black text-slate-900">Jadikan Proyek PDCA</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" title="Tutup">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-500">
            Temuan ini akan dibuat sebagai draft proyek Kaizen baru dengan Step 1 & Step 2 sudah
            ter-prefill. Cek/ubah dulu detailnya di bawah sebelum dikonfirmasi.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Proyek</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department / Line</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Leader</label>
              <input
                type="text"
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
            <p>
              <span className="font-semibold text-slate-700">Step 1 (Situasi Terkini):</span>{" "}
              {item.note ? `${item.point} — ${item.note}` : item.point}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Step 2 (4W1H):</span> What: {item.point} · When:{" "}
              {entry.date} · Where: {entry.lineName || "-"} · Who: {entry.leaderName}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password Proyek</label>
            <input
              type="password"
              value={projectPassword}
              onChange={(e) => setProjectPassword(e.target.value)}
              placeholder="Dipakai untuk mengamankan proyek ini nantinya"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-semibold px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
              {isSubmitting ? "Memproses..." : "Konfirmasi & Buat Proyek"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
