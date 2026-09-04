"use client";

import React, { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Shield, Lock, BarChart3, Users, FileText, Activity, Eye,
  Clock, CheckCircle, AlertTriangle, Layers, Download, Edit3,
  Trash2, Copy, LogIn, ArrowLeft, RefreshCw, Calendar, Globe,
  UserCheck, UserPlus, Filter, TrendingUp, Sparkles, Building2,
  Presentation,
} from "lucide-react";
import Link from "next/link";
import { BrandMonogram } from "@/components/BrandMonogram";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

// ──── TYPES ────
interface AdminStats {
  totalProjects: number;
  statusBreakdown: Record<string, number>;
  deptBreakdown: Record<string, number>;
  industryBreakdown: Record<string, number>;
  totalLogs: number;
  actionSummary: Record<string, number>;
  overdueCount: number;
  approachingDeadlineCount: number;
  overdueProjects: Array<{ id: string; title: string; dueDate: string; leader: string; department: string }>;
  approachingDeadline: Array<{ id: string; title: string; dueDate: string; leader: string; department: string }>;
  avgCompletionByDept: Record<string, number>;
  deptLeaderboard: Array<{ rank: number; department: string; totalProjects: number }>;
  totalVisits: number;
  uniqueIpsAllTime: number;
  uniqueVisitorsToday: number;
  uniqueVisitorsThisWeek: number;
  newVisitorsCount: number;
  returningVisitorsCount: number;
  newPct: number;
  returningPct: number;
  retention: { d1: number; d7: number; d30: number };
  dailyTrend: Array<{ date: string; visits: number; uniqueVisitors: number }>;
  funnelStages: Array<{ stage: string; name: string; count: number; pct: number; dropOffPct: number }>;
  topFeatures: Array<{ action: string; name: string; count: number; pct: number }>;
  recentLogs: Array<{ id: string; action: string; detail: string | null; projectId: string | null; visitorId: string; maskedIp: string; createdAt: string }>;
  projectsList: Array<{ id: string; title: string; department: string; industry: string; leader: string; status: string; currentStep: number; startDate: string; dueDate: string; createdAt: string; updatedAt: string; hasPassword: boolean; isOverdue: boolean }>;
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  project_created: { label: "Proyek Dibuat", icon: <FileText className="w-3.5 h-3.5" />, color: "text-emerald-600" },
  project_viewed: { label: "Proyek Dilihat", icon: <Eye className="w-3.5 h-3.5" />, color: "text-blue-600" },
  project_edited: { label: "Proyek Diedit", icon: <Edit3 className="w-3.5 h-3.5" />, color: "text-amber-600" },
  project_deleted: { label: "Proyek Dihapus", icon: <Trash2 className="w-3.5 h-3.5" />, color: "text-rose-600" },
  project_duplicated: { label: "Proyek Diduplikasi", icon: <Copy className="w-3.5 h-3.5" />, color: "text-purple-600" },
  project_exported_pdf: { label: "Export PDF", icon: <Download className="w-3.5 h-3.5" />, color: "text-rose-600" },
  project_exported_docx: { label: "Export Word", icon: <Download className="w-3.5 h-3.5" />, color: "text-blue-600" },
  project_exported_pptx: { label: "Export PowerPoint", icon: <Presentation className="w-3.5 h-3.5" />, color: "text-violet-600" },
  project_unlocked: { label: "Proyek Dibuka", icon: <Lock className="w-3.5 h-3.5" />, color: "text-indigo-600" },
  admin_login: { label: "Admin Login", icon: <Shield className="w-3.5 h-3.5" />, color: "text-slate-600" },
  page_visit: { label: "Halaman Utama", icon: <Activity className="w-3.5 h-3.5" />, color: "text-slate-400" },
  rate_limit_blocked: { label: "Rate Limit Blokir", icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-rose-700" },
};

const INDUSTRY_COLORS: Record<string, string> = {
  Manufaktur: "#6366f1",
  "F&B": "#f59e0b",
  Retail: "#10b981",
  Jasa: "#3b82f6",
  Lainnya: "#8b5cf6",
};

// ──── SWR FETCHER FUNCTION ────
// Centralized fetcher using POST body with automatic request deduplication via SWR
const adminStatsFetcher = async ([_, password, range]: [string, string, string]): Promise<AdminStats> => {
  const res = await fetch("/api/admin/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, range }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Password admin salah atau akses ditolak.");
  }
  return json.data as AdminStats;
};

// ──── CHILD COMPONENTS ────

function SectionA_KpiSummary({ stats }: { stats: AdminStats }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <Layers className="w-4 h-4 text-indigo-600" /> A. Ringkasan KPI Utama
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold text-slate-500 uppercase">Total Proyek</p><p className="text-3xl font-black text-slate-900 mt-1">{stats.totalProjects}</p></div>
            <div className="p-3 bg-indigo-100 rounded-xl"><Layers className="w-6 h-6 text-indigo-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold text-slate-500 uppercase">Total Aktivitas</p><p className="text-3xl font-black text-slate-900 mt-1">{stats.totalLogs}</p></div>
            <div className="p-3 bg-amber-100 rounded-xl"><Activity className="w-6 h-6 text-amber-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold text-slate-500 uppercase">Total Export</p><p className="text-3xl font-black text-slate-900 mt-1">{(stats.actionSummary.project_exported_pdf || 0) + (stats.actionSummary.project_exported_docx || 0) + (stats.actionSummary.project_exported_pptx || 0)}</p></div>
            <div className="p-3 bg-rose-100 rounded-xl"><Download className="w-6 h-6 text-rose-600" /></div>
          </div>
          <div className="flex gap-3 mt-2 text-[10px] text-slate-500"><span>PDF: {stats.actionSummary.project_exported_pdf || 0}</span><span>DOCX: {stats.actionSummary.project_exported_docx || 0}</span><span>PPTX: {stats.actionSummary.project_exported_pptx || 0}</span></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold text-slate-500 uppercase">Proyek Selesai</p><p className="text-3xl font-black text-emerald-600 mt-1">{stats.statusBreakdown.Completed || 0}</p></div>
            <div className="p-3 bg-emerald-100 rounded-xl"><CheckCircle className="w-6 h-6 text-emerald-600" /></div>
          </div>
        </div>
        <div className={`rounded-xl shadow-sm border p-5 ${stats.overdueCount > 0 ? "bg-rose-50 border-rose-300" : "bg-white"}`}>
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold text-slate-500 uppercase">Proyek Overdue</p><p className={`text-3xl font-black mt-1 ${stats.overdueCount > 0 ? "text-rose-600" : "text-slate-900"}`}>{stats.overdueCount}</p></div>
            <div className={`p-3 rounded-xl ${stats.overdueCount > 0 ? "bg-rose-200" : "bg-slate-100"}`}><AlertTriangle className={`w-6 h-6 ${stats.overdueCount > 0 ? "text-rose-700" : "text-slate-400"}`} /></div>
          </div>
          {stats.approachingDeadlineCount > 0 && <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠ {stats.approachingDeadlineCount} mendekati deadline (≤7 hari)</p>}
        </div>
      </div>
    </div>
  );
}

function SectionB_TrafficAndRetention({
  stats, timeRange, onRangeChange,
}: {
  stats: AdminStats;
  timeRange: "7d" | "30d" | "all";
  onRangeChange: (r: "7d" | "30d" | "all") => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-extrabold text-slate-900">B. Traffic &amp; Retensi Pengunjung</h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(["7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                timeRange === r ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {r === "7d" ? "7 Hari" : r === "30d" ? "30 Hari" : "Semua Waktu"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-[11px] font-semibold text-slate-500 uppercase">Total Kunjungan</p><p className="text-2xl font-black text-indigo-600 mt-1">{stats.totalVisits}</p></div>
            <div className="p-2.5 bg-indigo-100 rounded-lg"><Eye className="w-5 h-5 text-indigo-600" /></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-[11px] font-semibold text-slate-500 uppercase">Pengunjung Unik Total</p><p className="text-2xl font-black text-emerald-600 mt-1">{stats.uniqueIpsAllTime}</p></div>
            <div className="p-2.5 bg-emerald-100 rounded-lg"><Users className="w-5 h-5 text-emerald-600" /></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-[11px] font-semibold text-slate-500 uppercase">Pengunjung Hari Ini</p><p className="text-2xl font-black text-amber-600 mt-1">{stats.uniqueVisitorsToday}</p></div>
            <div className="p-2.5 bg-amber-100 rounded-lg"><Calendar className="w-5 h-5 text-amber-600" /></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-[11px] font-semibold text-slate-500 uppercase">Pengunjung Minggu Ini</p><p className="text-2xl font-black text-blue-600 mt-1">{stats.uniqueVisitorsThisWeek}</p></div>
            <div className="p-2.5 bg-blue-100 rounded-lg"><Activity className="w-5 h-5 text-blue-600" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" /> Retention Rate Pengunjung (D1 / D7 / D30)
          </p>
          <p className="text-[11px] text-slate-500">Persentase pengunjung yang kembali menggunakan aplikasi setelah kunjungan pertama:</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border text-center shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">D1 Retention</span>
              <span className="text-xl font-black text-emerald-600">{stats.retention.d1}%</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Balik Hari Ke-2</span>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">D7 Retention</span>
              <span className="text-xl font-black text-indigo-600">{stats.retention.d7}%</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Balik Mgg Ke-2</span>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">D30 Retention</span>
              <span className="text-xl font-black text-amber-600">{stats.retention.d30}%</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Balik Bln Ke-2</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-indigo-600" /> Returning vs New Visitor
          </p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-indigo-700 font-bold">Baru (New)</span>
                <span className="font-bold">{stats.newVisitorsCount} ({stats.newPct}%)</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${stats.newPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-emerald-700 font-bold">Kembali (Returning)</span>
                <span className="font-bold">{stats.returningVisitorsCount} ({stats.returningPct}%)</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${stats.returningPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Tren Kunjungan Harian ({timeRange === "7d" ? "7 Hari" : timeRange === "all" ? "Semua Waktu" : "30 Hari"})
        </p>
        <div className="h-60 w-full bg-slate-50 p-3 rounded-xl border border-slate-200">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="visits" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} name="Kunjungan" />
              <Area type="monotone" dataKey="uniqueVisitors" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Pengunjung Unik" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SectionC_ConversionFunnel({ stats }: { stats: AdminStats }) {
  const hasData = stats.funnelStages && stats.funnelStages.length > 0 && stats.funnelStages[0].count > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="border-b pb-3">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" /> C. Funnel Konversi Pengguna
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Melacak tingkat kelanjutan pengguna dari kunjungan pertama hingga eksekusi export laporan.
        </p>
      </div>

      {!hasData ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
          Belum ada data traffic yang cukup untuk funnel ini.
        </div>
      ) : (
        <div className="space-y-3">
          {stats.funnelStages.map((st, idx) => (
            <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{st.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-black text-indigo-600 text-sm">{st.count} user</span>
                  <span className="font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-[10px]">
                    {st.pct}% konversi
                  </span>
                  {idx > 0 && st.dropOffPct > 0 && (
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                      Drop-off: {st.dropOffPct}%
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, st.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionD_IndustryAndDepartment({ stats }: { stats: AdminStats }) {
  const industryPieData = Object.entries(stats.industryBreakdown).map(([name, value]) => ({
    name, value, color: INDUSTRY_COLORS[name] || "#64748b",
  })).filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <div className="border-b pb-3">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" /> D. Distribusi Industri &amp; Departemen
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600" /> Distribusi Industri Pengguna
          </h4>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {industryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
            {Object.entries(stats.industryBreakdown).map(([ind, cnt]) => (
              <div key={ind} className="flex justify-between items-center p-1.5 bg-white rounded border">
                <span className="font-semibold text-slate-700">{ind}</span>
                <span className="font-bold text-indigo-600">{cnt}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" /> Distribusi per Departemen
          </h4>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {Object.entries(stats.deptBreakdown).map(([dept, count]) => {
              const pct = stats.totalProjects > 0 ? Math.round((count / stats.totalProjects) * 100) : 0;
              return (
                <div key={dept}>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>{dept}</span>
                    <span>{count} proyek ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionE_TopFeatures({ stats }: { stats: AdminStats }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="border-b pb-3">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" /> E. Fitur / Aksi Terpopuler
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.topFeatures.map((f, idx) => (
          <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">{idx + 1}. {f.name}</span>
              <span className="text-[10px] text-slate-500">{f.action}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-indigo-600 block">{f.count} kali</span>
              <span className="text-[10px] font-bold text-slate-500">{f.pct}% dari total log</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionAboutContentEdit({ adminPassword }: { adminPassword: string }) {
  const [aboutTitle, setAboutTitle] = useState("");
  const [narrative, setNarrative] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [ach1Label, setAch1Label] = useState("");
  const [ach1Value, setAch1Value] = useState("");
  const [ach2Label, setAch2Label] = useState("");
  const [ach2Value, setAch2Value] = useState("");
  const [ach3Label, setAch3Label] = useState("");
  const [ach3Value, setAch3Value] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  React.useEffect(() => {
    fetch("/api/about")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setAboutTitle(d.title || "");
          setNarrative(d.narrative || "");
          setAuthorName(d.authorName || "");
          setAuthorRole(d.authorRole || "");
          const achs = d.achievements || [];
          if (achs[0]) { setAch1Label(achs[0].label || ""); setAch1Value(achs[0].value || ""); }
          if (achs[1]) { setAch2Label(achs[1].label || ""); setAch2Value(achs[1].value || ""); }
          if (achs[2]) { setAch3Label(achs[2].label || ""); setAch3Value(achs[2].value || ""); }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMsg("");

    const achievements = [
      { label: ach1Label, value: ach1Value },
      { label: ach2Label, value: ach2Value },
      { label: ach3Label, value: ach3Value },
    ].filter((a) => a.label && a.value);

    try {
      const res = await fetch("/api/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          title: aboutTitle,
          narrative,
          authorName,
          authorRole,
          achievements,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveMsg("Konten Informasi Umum berhasil diperbarui ✓");
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        setSaveMsg(`Error: ${json.error || "Gagal menyimpan."}`);
      }
    } catch {
      setSaveMsg("Error koneksi server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="border-b pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-600" /> Edit Section &quot;Informasi Umum&quot; (Halaman Depan)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ubah narasi asal-usul, profil pembuat, dan angka pencapaian yang tampil di publik.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveAbout} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Judul Section</label>
            <input
              type="text"
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Narasi Cerita Asal-Usul (1-2 Paragraf)</label>
            <textarea
              rows={4}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Pembuat / Praktisi</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Peran / Latar Belakang</label>
            <input
              type="text"
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <label className="block font-bold text-slate-700">Badge Pencapaian / Angka Stat (Maks 3):</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-2.5 rounded-lg border space-y-1">
              <span className="font-semibold text-slate-600 block">Pencapaian 1</span>
              <input type="text" value={ach1Label} onChange={(e) => setAch1Label(e.target.value)} placeholder="Label (e.g. Kapasitas)" className="w-full border rounded p-1" />
              <input type="text" value={ach1Value} onChange={(e) => setAch1Value(e.target.value)} placeholder="Nilai (e.g. 158%)" className="w-full border rounded p-1 font-bold text-indigo-600" />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border space-y-1">
              <span className="font-semibold text-slate-600 block">Pencapaian 2</span>
              <input type="text" value={ach2Label} onChange={(e) => setAch2Label(e.target.value)} placeholder="Label (e.g. Cycle Time)" className="w-full border rounded p-1" />
              <input type="text" value={ach2Value} onChange={(e) => setAch2Value(e.target.value)} placeholder="Nilai (e.g. 61%)" className="w-full border rounded p-1 font-bold text-indigo-600" />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border space-y-1">
              <span className="font-semibold text-slate-600 block">Pencapaian 3</span>
              <input type="text" value={ach3Label} onChange={(e) => setAch3Label(e.target.value)} placeholder="Label (e.g. Metode)" className="w-full border rounded p-1" />
              <input type="text" value={ach3Value} onChange={(e) => setAch3Value(e.target.value)} placeholder="Nilai (e.g. PDCA)" className="w-full border rounded p-1 font-bold text-indigo-600" />
            </div>
          </div>
        </div>

        {saveMsg && (
          <div className={`p-2.5 rounded-lg text-xs font-semibold ${saveMsg.startsWith("Error") ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
            {saveMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
        >
          {isSaving ? "Menyimpan..." : "Simpan Perubahan Informasi Umum"}
        </button>
      </form>
    </div>
  );
}

function SectionProjectsTable({
  stats,
  adminPassword,
  onRefresh,
}: {
  stats: AdminStats;
  adminPassword: string;
  onRefresh: () => void;
}) {
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ADMIN OVERRIDE: Apakah Anda yakin ingin menghapus proyek "${title}" secara permanen?`)) return;

    try {
      const res = await fetch(`/api/kaizen/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      const json = await res.json();
      if (json.success) {
        alert("Proyek berhasil dihapus oleh Admin.");
        onRefresh();
      } else {
        alert(json.error || "Gagal menghapus proyek.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="border-b pb-3 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Seluruh Proyek ({stats.projectsList.length})
        </h3>
        <span className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
          🛡️ Admin Moderasi Mode
        </span>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b">
            <tr>
              <th className="p-2.5">No</th>
              <th className="p-2.5 min-w-[200px]">Judul Proyek</th>
              <th className="p-2.5">Dept</th>
              <th className="p-2.5">Industri</th>
              <th className="p-2.5">PIC</th>
              <th className="p-2.5">Status</th>
              <th className="p-2.5">Step</th>
              <th className="p-2.5">Due Date</th>
              <th className="p-2.5 text-center">Aksi Moderasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.projectsList.map((p, idx) => (
              <tr key={p.id} className={`hover:bg-slate-50 ${p.isOverdue ? "bg-rose-50/50" : ""}`}>
                <td className="p-2.5 text-slate-500">{idx + 1}</td>
                <td className="p-2.5 font-semibold text-slate-900">
                  {p.title}
                  {p.isOverdue && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] text-rose-700 font-bold">
                      <AlertTriangle className="w-2.5 h-2.5" />OVERDUE
                    </span>
                  )}
                </td>
                <td className="p-2.5">{p.department}</td>
                <td className="p-2.5 font-medium text-slate-700">{p.industry}</td>
                <td className="p-2.5">{p.leader}</td>
                <td className="p-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    p.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : p.status === "On Progress" ? "bg-blue-50 text-blue-700 border-blue-300"
                    : p.status === "Under Review" ? "bg-amber-50 text-amber-700 border-amber-300"
                    : "bg-slate-50 text-slate-700 border-slate-300"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-2.5 text-center">{p.currentStep}/8</td>
                <td className={`p-2.5 ${p.isOverdue ? "text-rose-700 font-bold" : "text-slate-600"}`}>{p.dueDate || "—"}</td>
                <td className="p-2.5 text-center">
                  <button
                    onClick={() => handleDelete(p.id, p.title)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] px-2.5 py-1 rounded border border-rose-200 flex items-center gap-1 mx-auto cursor-pointer transition-colors"
                    title="Hapus proyek ini sebagai Admin Override"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionF_ActivityLog({ stats }: { stats: AdminStats }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="border-b pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> F. Log Aktivitas Terbaru (UU PDP Compliance)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gunakan Visitor ID anonim (10 karakter) &amp; IP address ter-masking (114.79.x.x) sesuai regulasi UU PDP.
          </p>
        </div>
        <span className="text-xs text-slate-500 font-semibold">100 Log Terakhir</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto border rounded-lg">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b sticky top-0">
            <tr>
              <th className="p-2.5 min-w-[130px]">Waktu</th>
              <th className="p-2.5 min-w-[140px]">Aksi</th>
              <th className="p-2.5 min-w-[200px]">Detail</th>
              <th className="p-2.5 min-w-[120px]">Visitor ID</th>
              <th className="p-2.5 min-w-[100px]">IP (Masked)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.recentLogs.map((log) => {
              const info = ACTION_LABELS[log.action] || { label: log.action, icon: null, color: "text-slate-600" };
              return (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-slate-500 font-mono text-[10px]">
                    {new Date(log.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td className="p-2.5">
                    <span className={`flex items-center gap-1 font-semibold ${info.color}`}>
                      {info.icon} {info.label}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-700 max-w-[280px] truncate">{log.detail || "-"}</td>
                  <td className="p-2.5 font-mono text-[10px] text-indigo-700 font-bold">{log.visitorId}</td>
                  <td className="p-2.5 text-slate-400 font-mono text-[10px]">{log.maskedIp}</td>
                </tr>
              );
            })}
            {stats.recentLogs.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-400">Belum ada log.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──── MAIN PAGE COMPONENT ────
export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");
  const [isCooldown, setIsCooldown] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // ── SWR DATA FETCHING ──
  // Deduplicates simultaneous requests, caches stats, and manages loading/validation state
  const {
    data: stats,
    error: swrError,
    isValidating,
    mutate,
  } = useSWR<AdminStats>(
    isAuthenticated && password ? ["admin-stats", password, timeRange] : null,
    adminStatsFetcher,
    {
      dedupingInterval: 5000,      // Merge identical requests within 5s window
      revalidateOnFocus: false,    // Prevent unexpected re-fetches on tab focus
      revalidateOnReconnect: true, // Revalidate if internet reconnects
      keepPreviousData: true,      // Keep existing dashboard rendered while range changes
      onError: (err) => {
        setAuthError(err.message || "Akses ditolak.");
        setIsAuthenticated(false);
      },
    }
  );

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) {
      setAuthError("Password tidak boleh kosong.");
      return;
    }
    setAuthError("");
    setPassword(inputPassword.trim());
    setIsAuthenticated(true);
  };

  const handleRangeChange = (r: "7d" | "30d" | "all") => {
    setTimeRange(r);
  };

  // Debounced manual refresh (1.5s cooldown to prevent request spam)
  const handleManualRefresh = () => {
    if (isCooldown || isValidating) return;
    setIsCooldown(true);
    mutate();
    setTimeout(() => setIsCooldown(false), 1500);
  };

  // ── LOGIN SCREEN ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Admin Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">Masukkan password admin (env: ADMIN_PASSWORD).</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => { setInputPassword(e.target.value); setAuthError(""); }}
                placeholder="Password admin"
                autoFocus
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {(authError || swrError) && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {authError || swrError?.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isValidating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {isValidating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {isValidating ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>

          <div className="text-center">
            <Link href="/" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Halaman Utama
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── DASHBOARD SCREEN ──
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMonogram size="sm" showSubtitle={false} />
            <div className="h-5 w-[1px] bg-[#8fa3bd]/20 hidden sm:block" />
            <span className="text-xs font-bold text-[#f0d68a] uppercase tracking-wider hidden sm:block">ADMIN DASHBOARD</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={isCooldown || isValidating}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Refresh Data (Debounced 1.5s)"
            >
              <RefreshCw className={`w-4 h-4 ${isValidating ? "animate-spin text-indigo-400" : ""}`} />
              {isValidating ? "Memuat..." : "Refresh"}
            </button>

            <button
              onClick={async () => {
                setIsExportingExcel(true);
                try {
                  const res = await fetch("/api/admin/export-excel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password }),
                  });
                  if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    alert(`Gagal export Excel (status ${res.status}): ${errBody.error || "Terjadi kesalahan tidak diketahui."}`);
                    return;
                  }
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Rekap-Kaizen-${new Date().toISOString().split("T")[0]}.xlsx`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (err: any) {
                  alert(`Gagal export Excel: ${err?.message || "Koneksi bermasalah atau server tidak merespons."}`);
                } finally {
                  setIsExportingExcel(false);
                }
              }}
              disabled={isExportingExcel}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className={`w-4 h-4 ${isExportingExcel ? "animate-pulse" : ""}`} />
              {isExportingExcel ? "Memproses..." : "Export Excel"}
            </button>

            <Link href="/" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Utama
            </Link>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                setPassword("");
                setInputPassword("");
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {!stats && isValidating ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 mx-auto animate-spin" />
            <p className="text-sm font-semibold text-slate-700">Memuat statistik admin dashboard...</p>
          </div>
        ) : stats ? (
          <>
            <SectionA_KpiSummary stats={stats} />
            <SectionB_TrafficAndRetention stats={stats} timeRange={timeRange} onRangeChange={handleRangeChange} />
            <SectionC_ConversionFunnel stats={stats} />
            <SectionD_IndustryAndDepartment stats={stats} />
            <SectionE_TopFeatures stats={stats} />
            <SectionAboutContentEdit adminPassword={password} />
            <SectionProjectsTable stats={stats} adminPassword={password} onRefresh={handleManualRefresh} />
            <SectionF_ActivityLog stats={stats} />
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Gagal memuat data statistik.</p>
          </div>
        )}
      </main>
    </div>
  );
}
