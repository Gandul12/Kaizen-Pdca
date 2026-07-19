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

  const statusOptions: ProjectStatus[] = ["Draft", "On Progress", "Under Review", "Completed"];

  const getStatusBadgeClass = (s: ProjectStatus) => {
    switch (s) {
      case "Completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "On Progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Under Review":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl shadow-xl p-5 border border-slate-700/50 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/80 rounded-lg shadow-inner text-white">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              HEADER PROYEK IMPROVEMENT / KAIZEN
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {header.title || "Formulir Dokumentasi Kaizen 8 Langkah"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-300 font-medium flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Status:
          </label>
          {isReadOnly ? (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(header.status)}`}>
              {header.status}
            </span>
          ) : (
            <select
              value={header.status}
              onChange={(e) => handleChange("status", e.target.value as ProjectStatus)}
              className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-1.5 font-medium cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-800 text-white">
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
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Tema Proyek Kaizen <span className="text-indigo-400">*</span>
          </label>
          {isReadOnly ? (
            <p className="text-sm font-semibold text-white bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              {header.title || "-"}
            </p>
          ) : (
            <input
              type="text"
              value={header.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Contoh: Menurunkan Reject Burr pada Process Stamping Line 2 Sebesar 50%"
              className="w-full bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* Departemen / Area */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            Departemen / Area
          </label>
          {isReadOnly ? (
            <p className="text-sm text-slate-200 bg-slate-800/80 p-2 rounded border border-slate-700">
              {header.department || "-"}
            </p>
          ) : (
            <input
              type="text"
              value={header.department}
              onChange={(e) => handleChange("department", e.target.value)}
              placeholder="e.g. Produksi, QC, Maintenance, Machining"
              className="w-full bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* Ketua Tim (PIC) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            Ketua Tim (PIC Utama)
          </label>
          {isReadOnly ? (
            <p className="text-sm text-slate-200 bg-slate-800/80 p-2 rounded border border-slate-700">
              {header.leader || "-"}
            </p>
          ) : (
            <input
              type="text"
              value={header.leader}
              onChange={(e) => handleChange("leader", e.target.value)}
              placeholder="Nama Leader / Supervisor"
              className="w-full bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* Anggota Tim */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Anggota Tim
          </label>
          {isReadOnly ? (
            <p className="text-sm text-slate-200 bg-slate-800/80 p-2 rounded border border-slate-700">
              {header.teamMembers || "-"}
            </p>
          ) : (
            <input
              type="text"
              value={header.teamMembers}
              onChange={(e) => handleChange("teamMembers", e.target.value)}
              placeholder="Budi, Agus, Siti, Joko"
              className="w-full bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* Tanggal Mulai */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Tanggal Mulai
          </label>
          {isReadOnly ? (
            <p className="text-sm text-slate-200 bg-slate-800/80 p-2 rounded border border-slate-700">
              {header.startDate || "-"}
            </p>
          ) : (
            <input
              type="date"
              value={header.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* Target Selesai */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Target Selesai (Due Date)
          </label>
          {isReadOnly ? (
            <p className="text-sm text-slate-200 bg-slate-800/80 p-2 rounded border border-slate-700">
              {header.dueDate || "-"}
            </p>
          ) : (
            <input
              type="date"
              value={header.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>
      </div>
    </div>
  );
};
