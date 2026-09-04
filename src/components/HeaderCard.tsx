"use client";

import React from "react";
import { HeaderData, ProjectStatus } from "@/types/kaizen";
import { Building2, Calendar, User, Users, FileText, Activity } from "lucide-react";

interface HeaderCardProps {
  header: HeaderData;
  onChange: (updated: HeaderData) => void;
  isReadOnly?: boolean;
}

export const HeaderCard: React.FC<HeaderCardProps> = ({
  header,
  onChange,
  isReadOnly = false,
}) => {
  const handleChange = (field: keyof HeaderData, value: string) => {
    onChange({
      ...header,
      [field]: value,
    });
  };

  const statusOptions: ProjectStatus[] = ["Draft", "On Progress", "Under Review", "Completed", "Rejected"];

  const getStatusBadgeClass = (s: ProjectStatus) => {
    switch (s) {
      case "Completed":
        return "bg-[#d4a94c]/15 text-[#f0d68a] border-[#d4a94c]/40";
      case "On Progress":
        return "bg-[#1fb6a8]/15 text-[#5fe8d8] border-[#1fb6a8]/40";
      case "Under Review":
        return "bg-[#d4a94c]/15 text-[#d4a94c] border-[#d4a94c]/40";
      case "Rejected":
        return "bg-rose-500/15 text-rose-300 border-rose-500/40";
      default:
        return "bg-[#16304f] text-[#8fa3bd] border-[#8fa3bd]/30";
    }
  };

  return (
    <div className="bg-[#101f36] text-white rounded-2xl shadow-2xl p-5 border border-[#8fa3bd]/16 mb-6 relative overflow-hidden">
      {/* Top gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1fb6a8] via-[#5fe8d8] to-[#d4a94c]" />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-[#8fa3bd]/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#16304f] border border-[#d4a94c]/30 rounded-xl text-[#f0d68a] shadow-inner">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8fa3bd] block">
              HEADER PROYEK IMPROVEMENT / KAIZEN
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-black text-white tracking-wide">
              {header.title || "Formulir Dokumentasi Kaizen 8 Langkah"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-[#8fa3bd] font-medium flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-[#1fb6a8]" /> Status:
          </label>
          {isReadOnly ? (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(header.status)}`}>
              {header.status}
            </span>
          ) : (
            <select
              value={header.status}
              onChange={(e) => handleChange("status", e.target.value as ProjectStatus)}
              className="bg-[#16304f] border border-[#8fa3bd]/30 text-white text-xs rounded-xl focus:ring-2 focus:ring-[#1fb6a8] px-3 py-1.5 font-bold cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#0d1b30] text-white">
                  {opt}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tema Proyek */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-bold text-[#8fa3bd] uppercase tracking-wider mb-1">
            Tema Proyek Kaizen <span className="text-[#1fb6a8]">*</span>
          </label>
          {isReadOnly ? (
            <p className="text-sm font-semibold text-white bg-[#16304f] p-2.5 rounded-xl border border-[#8fa3bd]/20">
              {header.title || "-"}
            </p>
          ) : (
            <input
              type="text"
              value={header.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Contoh: Menurunkan Reject Burr pada Process Stamping Line 2 Sebesar 50%"
              className="w-full bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl px-3.5 py-2 text-sm text-white placeholder-[#8fa3bd]/50 focus:outline-none focus:ring-2 focus:ring-[#1fb6a8]"
            />
          )}
        </div>

        {/* Departemen / Area */}
        <div>
          <label className="block text-xs font-bold text-[#8fa3bd] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#1fb6a8]" />
            Departemen / Area
          </label>
          {isReadOnly ? (
            <p className="text-sm text-slate-200 bg-[#16304f] p-2 rounded-xl border border-[#8fa3bd]/20">
              {header.department || "-"}
            </p>
          ) : (
            <input
              type="text"
              value={header.department}
              onChange={(e) => handleChange("department", e.target.value)}
              placeholder="Produksi, QC, Maintenance"
              className="w-full bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#8fa3bd]/50 focus:outline-none focus:ring-2 focus:ring-[#1fb6a8]"
            />
          )}
        </div>

        {/* Ketua Tim (PIC) */}
        <div>
          <label className="block text-xs font-bold text-[#8fa3bd] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#1fb6a8]" />
            Ketua Tim (PIC Utama)
          </label>
          {isReadOnly ? (
            <p className="text-sm text-slate-200 bg-[#16304f] p-2 rounded-xl border border-[#8fa3bd]/20">
              {header.leader || "-"}
            </p>
          ) : (
            <input
              type="text"
              value={header.leader}
              onChange={(e) => handleChange("leader", e.target.value)}
              placeholder="Nama Leader / Supervisor"
              className="w-full bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#8fa3bd]/50 focus:outline-none focus:ring-2 focus:ring-[#1fb6a8]"
            />
          )}
        </div>

        {/* Anggota Tim */}
        <div>
          <label className="block text-xs font-bold text-[#8fa3bd] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#1fb6a8]" />
            Anggota Tim
          </label>
          {isReadOnly ? (
            <p className="text-sm text-slate-200 bg-[#16304f] p-2 rounded-xl border border-[#8fa3bd]/20">
              {header.teamMembers || "-"}
            </p>
          ) : (
            <input
              type="text"
              value={header.teamMembers}
              onChange={(e) => handleChange("teamMembers", e.target.value)}
              placeholder="Budi, Agus, Siti, Joko"
              className="w-full bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#8fa3bd]/50 focus:outline-none focus:ring-2 focus:ring-[#1fb6a8]"
            />
          )}
        </div>

        {/* Tanggal Mulai */}
        <div>
          <label className="block text-xs font-bold text-[#8fa3bd] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#1fb6a8]" />
            Tanggal Mulai
          </label>
          {isReadOnly ? (
            <p className="text-sm text-slate-200 bg-[#16304f] p-2 rounded-xl border border-[#8fa3bd]/20">
              {header.startDate || "-"}
            </p>
          ) : (
            <input
              type="date"
              value={header.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="w-full bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1fb6a8]"
            />
          )}
        </div>

        {/* Target Selesai */}
        <div>
          <label className="block text-xs font-bold text-[#8fa3bd] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#1fb6a8]" />
            Target Selesai (Due Date)
          </label>
          {isReadOnly ? (
            <p className="text-sm text-slate-200 bg-[#16304f] p-2 rounded-xl border border-[#8fa3bd]/20">
              {header.dueDate || "-"}
            </p>
          ) : (
            <input
              type="date"
              value={header.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className="w-full bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1fb6a8]"
            />
          )}
        </div>
      </div>
    </div>
  );
};
