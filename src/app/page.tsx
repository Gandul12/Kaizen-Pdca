"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { KaizenProject, EMPTY_KAIZEN_CONTENT, ProjectStatus, KaizenContent, validateSteps } from "@/types/kaizen";
import { HeaderCard } from "@/components/HeaderCard";
import { WizardStepsNav } from "@/components/WizardStepsNav";
import { Step1Editor } from "@/components/steps/Step1Editor";
import { Step2Editor } from "@/components/steps/Step2Editor";
import { Step3Editor } from "@/components/steps/Step3Editor";
import { Step4Editor } from "@/components/steps/Step4Editor";
import { Step5And6Editor } from "@/components/steps/Step5And6Editor";
import { Step7Editor } from "@/components/steps/Step7Editor";
import { Step8Editor } from "@/components/steps/Step8Editor";
import { KaizenReportView } from "@/components/KaizenReportView";
import { PasswordModal } from "@/components/PasswordModal";
import { RevisionHistory } from "@/components/RevisionHistory";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { getMyProjectIds, addMyProjectId, removeMyProjectId } from "@/lib/ownership";
import Link from "next/link";
import {
  Plus, Search, Filter, Copy, Trash2, Eye, Edit3, Save,
  ArrowLeft, ArrowRight, Sparkles, CheckCircle, Clock,
  FileCheck, RefreshCw, Lock, Shield, AlertTriangle, BookTemplate,
  Link as LinkIcon, UserPlus, Share2, ClipboardCheck,
} from "lucide-react";

const unlockedPasswords: Record<string, string> = {};

function daysUntilDue(dueDate: string | null | undefined): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate + "T23:59:59");
  return Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function KaizenApp() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [activeProject, setActiveProject] = useState<KaizenProject | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "edit" | "preview">("list");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const [isDirty, setIsDirty] = useState(false);
  const activeProjectRef = useRef<KaizenProject | null>(null);
  activeProjectRef.current = activeProject;

  // Password modal
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwModalMode, setPwModalMode] = useState<"enter" | "create">("enter");
  const [pwModalTitle, setPwModalTitle] = useState("");
  const [pwModalDesc, setPwModalDesc] = useState("");
  const [pwModalError, setPwModalError] = useState("");
  const [pwModalLoading, setPwModalLoading] = useState(false);
  const [pwModalCallback, setPwModalCallback] = useState<((pw: string) => void) | null>(null);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newLeader, setNewLeader] = useState("");
  const [newTeamMembers, setNewTeamMembers] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Join project form
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinProjectId, setJoinProjectId] = useState("");

  // Share link modal
  const [shareUrl, setShareUrl] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const stepValidations = useMemo(() => {
    if (!activeProject) return [];
    return validateSteps(activeProject.content);
  }, [activeProject]);

  const openPasswordModal = (mode: "enter" | "create", title: string, desc: string, callback: (pw: string) => void) => {
    setPwModalMode(mode); setPwModalTitle(title); setPwModalDesc(desc);
    setPwModalError(""); setPwModalLoading(false);
    setPwModalCallback(() => callback); setPwModalOpen(true);
  };

  // ──── Fetch MY projects (filtered by localStorage IDs) ────
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const myIds = getMyProjectIds();
      if (myIds.length === 0) { setProjects([]); setIsLoading(false); return; }

      const params = new URLSearchParams();
      params.set("ids", myIds.join(","));
      if (searchQuery) params.set("search", searchQuery);
      if (departmentFilter !== "all") params.set("department", departmentFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/kaizen?${params.toString()}`);
      const json = await res.json();
      if (json.success) setProjects(json.data || []);
    } catch {} finally { setIsLoading(false); }
  }, [searchQuery, departmentFilter, statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const fetchTemplates = useCallback(async () => {
    try { const res = await fetch("/api/templates"); const json = await res.json(); if (json.success) setTemplates(json.data || []); } catch {}
  }, []);
  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // ──── Track homepage visit once per day per session ────
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const key = `visit_logged_${today}`;
    if (!sessionStorage.getItem(key)) {
      fetch("/api/track-visit", { method: "POST" }).catch(() => {});
      sessionStorage.setItem(key, "1");
    }
  }, []);

  // ──── Unlock ────
  const unlockProject = async (id: string, password: string): Promise<{ project: KaizenProject | null; error?: string }> => {
    try {
      const res = await fetch(`/api/kaizen/${id}/unlock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectPassword: password }) });
      const json = await res.json();
      if (json.success && !json.locked) return { project: json.data as KaizenProject };
      return { project: null, error: json.error || "Password salah." };
    } catch { return { project: null, error: "Network error" }; }
  };

  // ──── Save ────
  const saveProjectToDb = useCallback(async (proj: KaizenProject): Promise<boolean> => {
    const pw = unlockedPasswords[proj.id] || "";
    try {
      const res = await fetch(`/api/kaizen/${proj.id}`, { method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: proj.content.header.title || proj.title, department: proj.content.header.department || proj.department, leader: proj.content.header.leader || proj.leader, teamMembers: proj.content.header.teamMembers, startDate: proj.content.header.startDate, dueDate: proj.content.header.dueDate, status: proj.content.header.status, currentStep: proj.currentStep, content: proj.content, projectPassword: pw }) });
      return (await res.json()).success === true;
    } catch { return false; }
  }, []);

  const saveProject = useCallback(async (proj: KaizenProject, refreshList = false) => {
    setAutoSaveStatus("saving");
    const ok = await saveProjectToDb(proj);
    if (ok) { setIsDirty(false); setAutoSaveStatus("saved"); setTimeout(() => setAutoSaveStatus("idle"), 2500); if (refreshList) fetchProjects(); }
    else setAutoSaveStatus("idle");
  }, [saveProjectToDb, fetchProjects]);

  useEffect(() => {
    if (viewMode === "edit" && activeProject && isDirty) {
      const t = setTimeout(() => saveProject(activeProject, false), 1200);
      return () => clearTimeout(t);
    }
  }, [activeProject, viewMode, isDirty, saveProject]);

  // ──── Open project ────
  const openProject = async (id: string, mode: "edit" | "preview") => {
    if (activeProjectRef.current && isDirty) await saveProjectToDb(activeProjectRef.current);
    const cached = unlockedPasswords[id];
    if (cached !== undefined) {
      const { project } = await unlockProject(id, cached);
      if (project) { setActiveProject(project); setActiveStep(mode === "edit" ? (project.currentStep || 1) : 1); setIsDirty(false); setViewMode(mode); return; }
    }
    openPasswordModal("enter", mode === "edit" ? "Buka Dokumen" : "Lihat Dokumen", "Masukkan password proyek.",
      async (pw) => {
        setPwModalLoading(true); setPwModalError("");
        const { project, error } = await unlockProject(id, pw);
        if (project) { unlockedPasswords[id] = pw; setActiveProject(project); setActiveStep(mode === "edit" ? (project.currentStep || 1) : 1); setIsDirty(false); setViewMode(mode); setPwModalOpen(false); }
        else setPwModalError(error || "Password salah.");
        setPwModalLoading(false);
      });
  };

  const switchToPreview = async () => {
    if (activeProject && isDirty) { await saveProjectToDb(activeProject); setIsDirty(false); }
    if (activeProject) { const pw = unlockedPasswords[activeProject.id] || ""; const { project } = await unlockProject(activeProject.id, pw); if (project) setActiveProject(project); }
    setViewMode("preview");
  };

  const goBackToList = async () => {
    if (activeProjectRef.current && isDirty) { await saveProjectToDb(activeProjectRef.current); setIsDirty(false); }
    fetchProjects(); setViewMode("list");
  };

  // ──── Create ────
  const handleCreateProject = () => { setNewTitle(""); setNewDepartment(""); setNewLeader(""); setNewTeamMembers(""); setSaveAsTemplate(false); setTemplateName(""); setShowCreateForm(true); };

  const submitNewProject = () => {
    if (!newTitle.trim() || !newLeader.trim()) { alert("Nama proyek dan Ketua Tim wajib diisi."); return; }
    openPasswordModal("create", "Kunci Dokumen", "Buat password untuk mengamankan dokumen.",
      async (pw) => {
        setPwModalLoading(true);
        try {
          const content = { ...EMPTY_KAIZEN_CONTENT, header: { title: newTitle.trim(), department: newDepartment.trim() || "Produksi", leader: newLeader.trim(), teamMembers: newTeamMembers.trim(), startDate: new Date().toISOString().split("T")[0], dueDate: "", status: "Draft" as ProjectStatus } };
          const res = await fetch("/api/kaizen", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle.trim(), department: newDepartment.trim() || "Produksi", leader: newLeader.trim(), teamMembers: newTeamMembers.trim(), status: "Draft", projectPassword: pw, content, isTemplate: saveAsTemplate ? 1 : 0, templateName: saveAsTemplate ? (templateName.trim() || newTitle.trim()) : null }) });
          const json = await res.json();
          if (json.success && json.data) {
            addMyProjectId(json.data.id); // ← track ownership
            unlockedPasswords[json.data.id] = pw;
            setActiveProject(json.data); setActiveStep(1); setIsDirty(false); setViewMode("edit"); setPwModalOpen(false); setShowCreateForm(false); fetchProjects(); fetchTemplates();
          } else setPwModalError(json.error || "Gagal membuat proyek.");
        } catch { setPwModalError("Gagal menghubungi server."); }
        setPwModalLoading(false);
      });
  };

  const createFromTemplate = async (templateId: string) => {
    openPasswordModal("create", "Buat dari Template", "Buat password untuk proyek baru ini.",
      async (pw) => {
        setPwModalLoading(true);
        const res = await fetch(`/api/kaizen/${templateId}/duplicate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword: pw }) });
        const json = await res.json();
        if (json.success) { addMyProjectId(json.data.id); unlockedPasswords[json.data.id] = pw; setActiveProject(json.data); setActiveStep(1); setIsDirty(false); setViewMode("edit"); setPwModalOpen(false); setShowTemplates(false); fetchProjects(); }
        else setPwModalError(json.error || "Gagal.");
        setPwModalLoading(false);
      });
  };

  // ──── Join project (add existing project by ID + password) ────
  const joinProject = () => {
    const id = joinProjectId.trim();
    if (!id) { alert("ID Proyek wajib diisi."); return; }
    if (getMyProjectIds().includes(id)) { alert("Proyek ini sudah ada di daftar Anda."); setShowJoinForm(false); return; }
    openPasswordModal("enter", "Gabung ke Proyek", "Masukkan password proyek untuk menambahkannya ke daftar Anda.",
      async (pw) => {
        setPwModalLoading(true); setPwModalError("");
        const { project, error } = await unlockProject(id, pw);
        if (project) {
          addMyProjectId(id);
          unlockedPasswords[id] = pw;
          setPwModalOpen(false); setShowJoinForm(false); setJoinProjectId(""); fetchProjects();
        } else setPwModalError(error || "ID atau password salah.");
        setPwModalLoading(false);
      });
  };

  // ──── Get share link ────
  const getShareLink = async () => {
    if (!activeProject) return;
    const pw = unlockedPasswords[activeProject.id] || "";
    try {
      const res = await fetch(`/api/kaizen/${activeProject.id}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectPassword: pw }) });
      const json = await res.json();
      if (json.success) {
        const fullUrl = `${window.location.origin}${json.shareUrl}`;
        setShareUrl(fullUrl);
        setShowShareModal(true);
      }
    } catch {}
  };

  // ──── Duplicate / Delete ────
  const duplicateProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const doDup = async (pw: string) => {
      const res = await fetch(`/api/kaizen/${id}/duplicate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectPassword: pw }) });
      const json = await res.json();
      if (json.success) { addMyProjectId(json.data.id); return true; }
      return false;
    };
    const cached = unlockedPasswords[id]; if (cached !== undefined) { await doDup(cached); fetchProjects(); return; }
    openPasswordModal("enter", "Duplikasi", "Masukkan password proyek.",
      async (pw) => { setPwModalLoading(true); const ok = await doDup(pw); if (ok) { unlockedPasswords[id] = pw; fetchProjects(); setPwModalOpen(false); } else setPwModalError("Password salah."); setPwModalLoading(false); });
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    openPasswordModal(
      "enter",
      "Konfirmasi Hapus Proyek",
      "Masukkan password proyek yang dibuat saat pendaftaran untuk mengonfirmasi penghapusan. Proyek tidak dapat dihapus jika password salah.",
      async (pw: string) => {
        setPwModalLoading(true);
        setPwModalError("");

        try {
          const res = await fetch(`/api/kaizen/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectPassword: pw }),
          });
          const json = await res.json();

          if (json.success) {
            delete unlockedPasswords[id];
            removeMyProjectId(id);
            if (activeProject?.id === id) {
              setActiveProject(null);
              setViewMode("list");
            }
            fetchProjects();
            setPwModalOpen(false);
          } else {
            setPwModalError(json.error || "Password proyek salah. Akses ditolak.");
          }
        } catch {
          setPwModalError("Gagal menghapus proyek. Periksa koneksi internet Anda.");
        } finally {
          setPwModalLoading(false);
        }
      }
    );
  };

  // ──── Content ────
  const updateContentStep = (stepKey: keyof KaizenContent, data: any) => {
    if (!activeProject) return; setIsDirty(true);
    setActiveProject({ ...activeProject, content: { ...activeProject.content, [stepKey]: data } });
  };
  const updateHeader = (h: typeof EMPTY_KAIZEN_CONTENT.header) => {
    if (!activeProject) return; setIsDirty(true);
    setActiveProject({ ...activeProject, title: h.title, department: h.department, leader: h.leader, status: h.status, content: { ...activeProject.content, header: h } });
  };

  const departmentsList = Array.from(new Set(projects.map((p: any) => p.department).filter(Boolean)));

  const DeadlineBadge = ({ dueDate, status }: { dueDate?: string | null; status: string }) => {
    if (!dueDate || status === "Completed") return null;
    const days = daysUntilDue(dueDate); if (days === null) return null;
    if (days < 0) return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" /> Overdue {Math.abs(days)}d</span>;
    if (days <= 3) return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full animate-pulse"><Clock className="w-3 h-3" /> H-{days} ⚠️</span>;
    if (days <= 7) return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full"><Clock className="w-3 h-3" /> {days}d left</span>;
    return null;
  };

  const statusBadgeClass = (s: string) =>
    s === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-300"
    : s === "On Progress" ? "bg-blue-50 text-blue-700 border-blue-300"
    : s === "Under Review" ? "bg-amber-50 text-amber-700 border-amber-300"
    : s === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-300"
    : "bg-slate-50 text-slate-700 border-slate-300";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <PasswordModal isOpen={pwModalOpen} onClose={() => setPwModalOpen(false)} onSubmit={(pw) => pwModalCallback?.(pw)} title={pwModalTitle} description={pwModalDesc} error={pwModalError} isLoading={pwModalLoading} mode={pwModalMode} />

      {/* Share link modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full z-10 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Share2 className="w-7 h-7 text-indigo-600" /></div>
              <h2 className="text-lg font-bold text-slate-900">Link View-Only</h2>
              <p className="text-xs text-slate-500 mt-1">Bagikan link ini untuk akses baca saja (tanpa bisa edit). Tidak perlu password.</p>
            </div>
            <div className="flex gap-2">
              <input type="text" readOnly value={shareUrl} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-slate-50 font-mono" />
              <button onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Link disalin!"); }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shrink-0">Salin</button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full text-center text-xs text-slate-500 hover:text-slate-700 cursor-pointer py-1">Tutup</button>
          </div>
        </div>
      )}

      <OnboardingGuide />

      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div onClick={goBackToList} className="flex items-center gap-3 cursor-pointer group">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-lg shadow-md group-hover:scale-105 transition-transform"><Sparkles className="w-5 h-5 text-white" /></div>
            <div><span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">KAIZEN PDCA 8 LANGKAH</span><h1 className="text-sm sm:text-base font-extrabold tracking-tight">Dokumentasi Improvement</h1></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {viewMode !== "list" && <button onClick={goBackToList} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Proyek Saya</span></button>}
            <button onClick={handleCreateProject} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Baru</span></button>
            {templates.length > 0 && <button onClick={() => setShowTemplates(!showTemplates)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"><BookTemplate className="w-3.5 h-3.5" /></button>}
            <Link href="/genba" className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1" title="Genba Harian"><ClipboardCheck className="w-3.5 h-3.5" /></Link>
            <Link href="/admin" className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1"><Shield className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Templates */}
        {showTemplates && viewMode === "list" && templates.length > 0 && (
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2"><BookTemplate className="w-4 h-4" /> Template</h3><button onClick={() => setShowTemplates(false)} className="text-xs text-slate-500 cursor-pointer">✕</button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((t: any) => (
                <button key={t.id} onClick={() => createFromTemplate(t.id)} className="bg-white rounded-lg p-3 border border-indigo-200 hover:border-indigo-400 hover:shadow-md text-left cursor-pointer transition-all">
                  <p className="text-xs font-bold text-slate-900">{t.templateName || t.title}</p>
                  <p className="text-[10px] text-slate-500">{t.department}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create form */}
        {showCreateForm && viewMode === "list" && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 p-4 sm:p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-600" /> Buat Proyek Baru</h2><button onClick={() => setShowCreateForm(false)} className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer">Batal ✕</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Nama / Tema <span className="text-rose-500">*</span></label><input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Menurunkan Defect Burr" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Ketua Tim <span className="text-rose-500">*</span></label><input type="text" value={newLeader} onChange={(e) => setNewLeader(e.target.value)} placeholder="Nama Leader" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Departemen</label><input type="text" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} placeholder="Produksi" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" /></div>
              <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Anggota Tim</label><input type="text" value={newTeamMembers} onChange={(e) => setNewTeamMembers(e.target.value)} placeholder="Budi, Agus, Siti" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} className="accent-indigo-600" /><span className="text-xs font-semibold text-slate-700">Simpan juga sebagai template</span></label>
            {saveAsTemplate && <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Nama template..." className="border border-slate-300 rounded px-2 py-1 text-xs w-full" />}
            <div className="flex justify-end"><button onClick={submitNewProject} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow cursor-pointer"><Lock className="w-4 h-4" /> Buat & Kunci</button></div>
          </div>
        )}

        {/* Join project form */}
        {showJoinForm && viewMode === "list" && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-200 p-4 sm:p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><UserPlus className="w-5 h-5 text-emerald-600" /> Gabung ke Proyek</h2><button onClick={() => setShowJoinForm(false)} className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer">Batal ✕</button></div>
            <p className="text-xs text-slate-500">Masukkan ID proyek yang diberikan oleh pemilik proyek. Anda akan diminta memasukkan password untuk memverifikasi akses.</p>
            <div className="flex gap-2">
              <input type="text" value={joinProjectId} onChange={(e) => setJoinProjectId(e.target.value)} placeholder="ID Proyek (e.g. kz-1234567890-abcdef12)" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              <button onClick={joinProject} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shrink-0">Verifikasi & Gabung</button>
            </div>
          </div>
        )}

        {/* ═══ LIST ═══ */}
        {viewMode === "list" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Action bar */}
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-[200px] relative"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari proyek saya..." className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" /></div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs font-medium cursor-pointer"><option value="all">Semua Dept</option>{departmentsList.map((d) => <option key={d} value={d}>{d}</option>)}</select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs font-medium cursor-pointer"><option value="all">Semua Status</option><option value="Draft">Draft</option><option value="On Progress">On Progress</option><option value="Under Review">Under Review</option><option value="Completed">Completed</option><option value="Rejected">Rejected</option></select>
                <button onClick={() => setShowJoinForm(!showJoinForm)} className="bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer flex items-center gap-1" title="Gabung ke proyek orang lain"><UserPlus className="w-3.5 h-3.5" /><span className="hidden sm:inline">Gabung</span></button>
                <button onClick={() => fetchProjects()} className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-600 hover:bg-indigo-50 cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-slate-500 text-sm"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Memuat...</div>
            ) : projects.length === 0 && !showCreateForm && !showJoinForm ? (
              <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 max-w-xl mx-auto space-y-4">
                <div className="p-4 bg-indigo-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-indigo-600"><FileCheck className="w-8 h-8" /></div>
                <h3 className="font-bold text-slate-800 text-lg">Belum Ada Proyek</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Buat proyek Kaizen baru, gunakan template, atau gabung ke proyek yang sudah ada.</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button onClick={handleCreateProject} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-2 shadow-md cursor-pointer"><Plus className="w-4 h-4" /> Buat Proyek Baru</button>
                  <button onClick={() => setShowJoinForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-2 shadow-md cursor-pointer"><UserPlus className="w-4 h-4" /> Gabung ke Proyek</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {projects.map((proj: any) => (
                  <div key={proj.id} onClick={() => openProject(proj.id, "edit")} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer p-4 sm:p-5 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-2 gap-1 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{proj.department || "Produksi"}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <DeadlineBadge dueDate={proj.dueDate} status={proj.status} />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass(proj.status)}`}>{proj.status}</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2">{proj.title || "Tanpa Judul"}</h3>
                      <div className="text-xs text-slate-500 space-y-0.5 font-medium mb-3">
                        <p>PIC: {proj.leader || "-"} • Step {proj.currentStep || 1}/8</p>
                        {proj.dueDate && <p>Due: {proj.dueDate}</p>}
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                      <button onClick={(e) => { e.stopPropagation(); openProject(proj.id, "preview"); }} className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Pratinjau</button>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => duplicateProject(proj.id, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50" title="Duplikasi"><Copy className="w-4 h-4" /></button>
                        <button onClick={(e) => deleteProject(proj.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ EDIT ═══ */}
        {viewMode === "edit" && activeProject && (
          <div className="space-y-4">
            <div className="bg-white px-3 sm:px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button onClick={goBackToList} className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"><ArrowLeft className="w-4 h-4" /> Kembali</button>
                <span className="hidden sm:inline h-4 w-[1px] bg-slate-300" />
                <span className="text-xs font-bold text-slate-800">Step {activeStep}/7</span>
                {autoSaveStatus === "saving" && <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 animate-pulse"><Clock className="w-3 h-3" /> Menyimpan...</span>}
                {autoSaveStatus === "saved" && <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Tersimpan ✓</span>}
                {isDirty && autoSaveStatus === "idle" && <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1"><Edit3 className="w-3 h-3" /> Belum disimpan</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={getShareLink} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer" title="Dapatkan link view-only"><Share2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Share</span></button>
                <span className="text-[10px] text-slate-400 font-mono hidden lg:inline" title="ID Proyek — bagikan ke rekan untuk Join">{activeProject.id}</span>
                <button onClick={() => saveProject(activeProject, true)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1.5 cursor-pointer"><Save className="w-4 h-4" /><span className="hidden sm:inline">Simpan</span></button>
                <button onClick={switchToPreview} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"><Eye className="w-4 h-4" /><span className="hidden sm:inline">Pratinjau</span></button>
              </div>
            </div>

            <HeaderCard header={activeProject.content.header} onChange={updateHeader} />
            <WizardStepsNav activeStep={activeStep} onSelectStep={setActiveStep} validations={stepValidations} />

            <div>
              {activeStep === 1 && <Step1Editor data={activeProject.content.step1} onChange={(d) => updateContentStep("step1", d)} />}
              {activeStep === 2 && <Step2Editor data={activeProject.content.step2} onChange={(d) => updateContentStep("step2", d)} />}
              {activeStep === 3 && <Step3Editor data={activeProject.content.step3} onChange={(d) => updateContentStep("step3", d)} />}
              {activeStep === 4 && <Step4Editor data={activeProject.content.step4} onChange={(d) => updateContentStep("step4", d)} />}
              {activeStep === 5 && <Step5And6Editor data={activeProject.content.step5_6} onChange={(d) => updateContentStep("step5_6", d)} />}
              {activeStep === 6 && <Step7Editor data={activeProject.content.step7} onChange={(d) => updateContentStep("step7", d)} />}
              {activeStep === 7 && <Step8Editor data={activeProject.content.step8} onChange={(d) => updateContentStep("step8", d)} />}
            </div>

            <RevisionHistory projectId={activeProject.id} projectPassword={unlockedPasswords[activeProject.id] || ""} />

            {stepValidations.some((v) => !v.isComplete) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Langkah Belum Lengkap:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {stepValidations.filter((v) => !v.isComplete).map((v) => (
                    <button key={v.step} onClick={() => setActiveStep(v.step)} className="text-left text-xs text-amber-800 hover:text-indigo-700 cursor-pointer py-0.5">
                      • Langkah {v.step} ({v.label}): {v.errors.join(", ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <button disabled={activeStep === 1} onClick={() => setActiveStep((p) => Math.max(1, p - 1))} className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"><ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Sebelumnya</span></button>
              <span className="text-xs text-slate-500">{activeStep} / 7</span>
              {activeStep < 7
                ? <button onClick={() => setActiveStep((p) => Math.min(7, p + 1))} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 shadow cursor-pointer"><span className="hidden sm:inline">Selanjutnya</span> <ArrowRight className="w-4 h-4" /></button>
                : <button onClick={switchToPreview} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 shadow cursor-pointer"><span className="hidden sm:inline">Selesai</span> <CheckCircle className="w-4 h-4" /></button>
              }
            </div>
          </div>
        )}

        {/* ═══ PREVIEW ═══ */}
        {viewMode === "preview" && activeProject && (
          <KaizenReportView project={activeProject} onEditClick={() => setViewMode("edit")} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-8">
        Kaizen PDCA 8 Langkah • <Link href="/admin" className="text-indigo-600 hover:underline">Admin</Link>
      </footer>
    </div>
  );
}
