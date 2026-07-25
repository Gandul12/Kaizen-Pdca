"use client";

import React, { useState, useCallback } from "react";
import {
  Shield, Lock, BarChart3, Users, FileText, Activity, Eye,
  Clock, CheckCircle, AlertTriangle, Layers, Download, Edit3,
  Trash2, Copy, LogIn, ArrowLeft, RefreshCw, Calendar, Globe,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface AdminStats {
  totalProjects: number;
  statusBreakdown: Record<string, number>;
  deptBreakdown: Record<string, number>;
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
  dailyTrend: Array<{ date: string; visits: number; uniqueVisitors: number }>;
  recentLogs: Array<{ id: string; action: string; detail: string | null; projectId: string | null; ipAddress: string | null; createdAt: string }>;
  projectsList: Array<{ id: string; title: string; department: string; leader: string; status: string; currentStep: number; startDate: string; dueDate: string; createdAt: string; updatedAt: string; hasPassword: boolean; isOverdue: boolean }>;
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  project_created: { label: "Proyek Dibuat", icon: <FileText className="w-3.5 h-3.5" />, color: "text-emerald-600" },
  project_viewed: { label: "Proyek Dilihat", icon: <Eye className="w-3.5 h-3.5" />, color: "text-blue-600" },
  project_edited: { label: "Proyek Diedit", icon: <Edit3 className="w-3.5 h-3.5" />, color: "text-amber-600" },
  project_deleted: { label: "Proyek Dihapus", icon: <Trash2 className="w-3.5 h-3.5" />, color: "text-rose-600" },
  project_duplicated: { label: "Proyek Diduplikasi", icon: <Copy className="w-3.5 h-3.5" />, color: "text-purple-600" },
  project_exported_pdf: { label: "Export PDF", icon: <Download className="w-3.5 h-3.5" />, color: "text-rose-600" },
  project_exported_docx: { label: "Export Word", icon: <Download className="w-3.5 h-3.5" />, color: "text-blue-600" },
  project_unlocked: { label: "Proyek Dibuka", icon: <Lock className="w-3.5 h-3.5" />, color: "text-indigo-600" },
  admin_login: { label: "Admin Login", icon: <Shield className="w-3.5 h-3.5" />, color: "text-slate-600" },
  page_visit: { label: "Halaman Dikunjungi", icon: <Activity className="w-3.5 h-3.5" />, color: "text-slate-400" },
  rate_limit_blocked: { label: "Rate Limit Diblokir", icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-rose-700" },
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);

  const fetchStats = useCallback(async (pw: string) => {
    setIsLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const json = await res.json();
      if (json.success) { setStats(json.data); setIsAuthenticated(true); }
      else { setError(json.error || "Akses ditolak."); setIsAuthenticated(false); }
    } catch { setError("Gagal menghubungi server."); }
    finally { setIsLoading(false); }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setError("Password tidak boleh kosong."); return; }
    fetchStats(password);
  };

  // ── LOGIN ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-indigo-600" /></div>
            <h1 className="text-xl font-black text-slate-900">Admin Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">Masukkan password admin (env: ADMIN_PASSWORD).</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password admin" autoFocus
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}
            <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer">
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {isLoading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>
          <div className="text-center"><Link href="/" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-1"><ArrowLeft className="w-3.5 h-3.5" />Halaman Utama</Link></div>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ──
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg"><Shield className="w-5 h-5 text-white" /></div>
            <div><span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">ADMINISTRATOR</span><h1 className="text-base font-extrabold">Dashboard Monitoring Kaizen</h1></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchStats(password)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"><RefreshCw className="w-4 h-4" /> Refresh</button>
            <button onClick={async () => {
              try {
                const res = await fetch("/api/admin/export-excel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
                if (!res.ok) return;
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `Rekap-Kaizen-${new Date().toISOString().split("T")[0]}.xlsx`; a.click(); URL.revokeObjectURL(url);
              } catch {}
            }} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"><Download className="w-4 h-4" /> Export Excel</button>
            <Link href="/" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Utama</Link>
            <button onClick={() => { setIsAuthenticated(false); setPassword(""); setStats(null); }} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"><Lock className="w-4 h-4" /> Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {stats && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-500 uppercase">Total Proyek</p><p className="text-3xl font-black text-slate-900 mt-1">{stats.totalProjects}</p></div><div className="p-3 bg-indigo-100 rounded-xl"><Layers className="w-6 h-6 text-indigo-600" /></div></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-500 uppercase">Total Aktivitas</p><p className="text-3xl font-black text-slate-900 mt-1">{stats.totalLogs}</p></div><div className="p-3 bg-amber-100 rounded-xl"><Activity className="w-6 h-6 text-amber-600" /></div></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-500 uppercase">Export</p><p className="text-3xl font-black text-slate-900 mt-1">{(stats.actionSummary.project_exported_pdf || 0) + (stats.actionSummary.project_exported_docx || 0)}</p></div><div className="p-3 bg-rose-100 rounded-xl"><Download className="w-6 h-6 text-rose-600" /></div></div>
                <div className="flex gap-3 mt-2 text-[10px] text-slate-500"><span>PDF: {stats.actionSummary.project_exported_pdf || 0}</span><span>DOCX: {stats.actionSummary.project_exported_docx || 0}</span></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-500 uppercase">Selesai</p><p className="text-3xl font-black text-emerald-600 mt-1">{stats.statusBreakdown.Completed || 0}</p></div><div className="p-3 bg-emerald-100 rounded-xl"><CheckCircle className="w-6 h-6 text-emerald-600" /></div></div>
              </div>
              {/* Overdue */}
              <div className={`rounded-xl shadow-sm border p-5 ${stats.overdueCount > 0 ? "bg-rose-50 border-rose-300" : "bg-white"}`}>
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-500 uppercase">Overdue</p><p className={`text-3xl font-black mt-1 ${stats.overdueCount > 0 ? "text-rose-600" : "text-slate-900"}`}>{stats.overdueCount}</p></div><div className={`p-3 rounded-xl ${stats.overdueCount > 0 ? "bg-rose-200" : "bg-slate-100"}`}><AlertTriangle className={`w-6 h-6 ${stats.overdueCount > 0 ? "text-rose-700" : "text-slate-400"}`} /></div></div>
                {stats.approachingDeadlineCount > 0 && <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠ {stats.approachingDeadlineCount} mendekati deadline (≤7 hari)</p>}
              </div>
            </div>

            {/* Traffic Analytics Section */}
            <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                Traffic Website & Pengunjung
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Kunjungan</p>
                      <p className="text-2xl font-black text-indigo-600 mt-1">{stats.totalVisits}</p>
                    </div>
                    <div className="p-2.5 bg-indigo-100 rounded-lg">
                      <Eye className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Pengunjung Unik Total</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">{stats.uniqueIpsAllTime}</p>
                    </div>
                    <div className="p-2.5 bg-emerald-100 rounded-lg">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Pengunjung Hari Ini</p>
                      <p className="text-2xl font-black text-amber-600 mt-1">{stats.uniqueVisitorsToday}</p>
                    </div>
                    <div className="p-2.5 bg-amber-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Pengunjung Minggu Ini</p>
                      <p className="text-2xl font-black text-blue-600 mt-1">{stats.uniqueVisitorsThisWeek}</p>
                    </div>
                    <div className="p-2.5 bg-blue-100 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 30-day Trend Chart */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Tren Kunjungan 30 Hari Terakhir:</p>
                <div className="h-56 w-full">
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

            {/* Overdue & Approaching */}
            {(stats.overdueProjects.length > 0 || stats.approachingDeadline.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.overdueProjects.length > 0 && (
                  <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-rose-800 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Proyek Overdue ({stats.overdueProjects.length})</h3>
                    <div className="space-y-2">
                      {stats.overdueProjects.map((p) => (
                        <div key={p.id} className="bg-white rounded-lg p-3 border border-rose-200 flex justify-between items-center">
                          <div><p className="text-xs font-bold text-slate-900">{p.title}</p><p className="text-[10px] text-slate-500">PIC: {p.leader} • {p.department}</p></div>
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">Due: {p.dueDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {stats.approachingDeadline.length > 0 && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Mendekati Deadline ≤7 Hari ({stats.approachingDeadline.length})</h3>
                    <div className="space-y-2">
                      {stats.approachingDeadline.map((p) => (
                        <div key={p.id} className="bg-white rounded-lg p-3 border border-amber-200 flex justify-between items-center">
                          <div><p className="text-xs font-bold text-slate-900">{p.title}</p><p className="text-[10px] text-slate-500">PIC: {p.leader} • {p.department}</p></div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Due: {p.dueDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status & Dept Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-600" />Distribusi Status</h3>
                <div className="space-y-2">
                  {Object.entries(stats.statusBreakdown).map(([status, count]) => {
                    const pct = stats.totalProjects > 0 ? Math.round((count / stats.totalProjects) * 100) : 0;
                    const c: Record<string, string> = { Draft: "bg-slate-400", "On Progress": "bg-blue-500", "Under Review": "bg-amber-500", Completed: "bg-emerald-500" };
                    return (<div key={status}><div className="flex justify-between text-xs font-medium text-slate-700 mb-1"><span>{status}</span><span>{count} ({pct}%)</span></div><div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className={`h-full rounded-full ${c[status] || "bg-indigo-500"}`} style={{ width: `${pct}%` }} /></div></div>);
                  })}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-600" />Distribusi Departemen</h3>
                <div className="space-y-2">
                  {Object.entries(stats.deptBreakdown).map(([dept, count]) => {
                    const pct = stats.totalProjects > 0 ? Math.round((count / stats.totalProjects) * 100) : 0;
                    return (<div key={dept}><div className="flex justify-between text-xs font-medium text-slate-700 mb-1"><span>{dept}</span><span>{count} ({pct}%)</span></div><div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} /></div></div>);
                  })}
                </div>
              </div>
            </div>

            {/* Action Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-600" />Ringkasan Aktivitas</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(stats.actionSummary).map(([action, count]) => {
                  const info = ACTION_LABELS[action] || { label: action, icon: <Activity className="w-3.5 h-3.5" />, color: "text-slate-600" };
                  return (<div key={action} className="bg-slate-50 border rounded-lg p-3 flex items-center gap-2"><span className={info.color}>{info.icon}</span><div><p className="text-xs font-bold text-slate-800">{count}</p><p className="text-[10px] text-slate-500">{info.label}</p></div></div>);
                })}
              </div>
            </div>

            {/* Projects Table */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" />Seluruh Proyek ({stats.projectsList.length})</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b">
                    <tr><th className="p-2.5">No</th><th className="p-2.5 min-w-[200px]">Judul</th><th className="p-2.5">Dept</th><th className="p-2.5">PIC</th><th className="p-2.5">Status</th><th className="p-2.5">Step</th><th className="p-2.5">Due Date</th><th className="p-2.5">🔒</th><th className="p-2.5 min-w-[120px]">Update</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.projectsList.map((p, idx) => (
                      <tr key={p.id} className={`hover:bg-slate-50 ${p.isOverdue ? "bg-rose-50/50" : ""}`}>
                        <td className="p-2.5 text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-slate-900">
                          {p.title}
                          {p.isOverdue && <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] text-rose-700 font-bold"><AlertTriangle className="w-2.5 h-2.5" />OVERDUE</span>}
                        </td>
                        <td className="p-2.5">{p.department}</td>
                        <td className="p-2.5">{p.leader}</td>
                        <td className="p-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-300" : p.status === "On Progress" ? "bg-blue-50 text-blue-700 border-blue-300" : p.status === "Under Review" ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-slate-50 text-slate-700 border-slate-300"}`}>{p.status}</span></td>
                        <td className="p-2.5 text-center">{p.currentStep}/8</td>
                        <td className={`p-2.5 ${p.isOverdue ? "text-rose-700 font-bold" : "text-slate-600"}`}>{p.dueDate || "—"}</td>
                        <td className="p-2.5 text-center">{p.hasPassword ? <Lock className="w-3.5 h-3.5 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}</td>
                        <td className="p-2.5 text-slate-500">{new Date(p.updatedAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600" />Log Aktivitas Terbaru (100)</h3>
              <div className="max-h-[500px] overflow-y-auto border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b sticky top-0">
                    <tr><th className="p-2.5 min-w-[140px]">Waktu</th><th className="p-2.5">Aksi</th><th className="p-2.5 min-w-[200px]">Detail</th><th className="p-2.5">IP</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentLogs.map((log) => {
                      const info = ACTION_LABELS[log.action] || { label: log.action, icon: null, color: "text-slate-600" };
                      return (<tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-500 font-mono text-[10px]">{new Date(log.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</td>
                        <td className="p-2.5"><span className={`flex items-center gap-1 font-semibold ${info.color}`}>{info.icon} {info.label}</span></td>
                        <td className="p-2.5 text-slate-700 max-w-[300px] truncate">{log.detail || "-"}</td>
                        <td className="p-2.5 text-slate-400 font-mono text-[10px]">{log.ipAddress || "-"}</td>
                      </tr>);
                    })}
                    {stats.recentLogs.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-400">Belum ada log.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
