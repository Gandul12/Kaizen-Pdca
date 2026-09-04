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
import { BrandMonogram } from "@/components/BrandMonogram";
import { HeroPdcaIllustration } from "@/components/HeroPdcaIllustration";
import { AboutSection } from "@/components/AboutSection";
import { getMyProjectIds, addMyProjectId, removeMyProjectId, hasMyProjectId } from "@/lib/ownership";
import { getVisitorId } from "@/lib/visitor";
import Link from "next/link";
import {
  Plus, Search, Filter, Copy, Trash2, Eye, Edit3, Save,
  ArrowLeft, ArrowRight, CheckCircle, Clock,
  FileCheck, RefreshCw, Lock, Shield, AlertTriangle, BookTemplate,
  UserPlus, Share2, ArrowUpRight, Sparkles, SlidersHorizontal,
} from "lucide-react";

const unlockedPasswords: Record<string, string> = {};

function daysUntilDue(dueDate: string | null | undefined): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate + "T23:59:59");
  return Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function KaizenApp() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [activeProject, setActiveProject] = useState<KaizenProject | null>(null);
  const [viewMode, setViewMode] = useState<"landing" | "list" | "edit" | "preview">("landing");
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
  const [newIndustry, setNewIndustry] = useState("Manufaktur");
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

  // List mode: "all" (public directory) vs "mine" (my projects only)
  const [listFilterMode, setListFilterMode] = useState<"all" | "mine">("all");

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

  // ──── Fetch projects (public directory or my projects) ────
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (listFilterMode === "mine") {
        const myIds = getMyProjectIds();
        if (myIds.length === 0) {
          setProjects([]);
          setIsLoading(false);
          return;
        }
        params.set("ids", myIds.join(","));
      } else {
        // Direktori publik disengaja (fitur "all") — API sekarang mewajibkan
        // opt-in eksplisit ini, tidak lagi default terbuka tanpa parameter.
        params.set("public", "true");
      }

      if (searchQuery) params.set("search", searchQuery);
      if (departmentFilter !== "all") params.set("department", departmentFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/kaizen?${params.toString()}`);
      const json = await res.json();
      if (json.success) setProjects(json.data || []);
    } catch {} finally { setIsLoading(false); }
  }, [searchQuery, departmentFilter, statusFilter, listFilterMode]);

  useEffect(() => {
    if (viewMode === "list") fetchProjects();
  }, [viewMode, fetchProjects]);

  const fetchTemplates = useCallback(async () => {
    try { const res = await fetch("/api/templates"); const json = await res.json(); if (json.success) setTemplates(json.data || []); } catch {}
  }, []);
  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // ──── Track homepage visit once per day per session ────
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const key = `visit_logged_${today}`;
    if (!sessionStorage.getItem(key)) {
      fetch("/api/track-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: "/", visitorId: getVisitorId() }),
      }).catch(() => {});
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
    openPasswordModal("enter", mode === "edit" ? "Buka Dokumen Proyek" : "Lihat Dokumen Proyek", "Masukkan password proyek untuk mengakses.",
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

  const goToLanding = async () => {
    if (activeProjectRef.current && isDirty) { await saveProjectToDb(activeProjectRef.current); setIsDirty(false); }
    setViewMode("landing");
  };

  // ──── Create ────
  const handleCreateProject = () => { setNewTitle(""); setNewDepartment(""); setNewIndustry("Manufaktur"); setNewLeader(""); setNewTeamMembers(""); setSaveAsTemplate(false); setTemplateName(""); setShowCreateForm(true); setViewMode("list"); };

  const submitNewProject = () => {
    if (!newTitle.trim() || !newLeader.trim()) { alert("Nama proyek dan Ketua Tim wajib diisi."); return; }
    openPasswordModal("create", "Kunci Dokumen Proyek", "Buat password untuk mengamankan dokumen.",
      async (pw) => {
        setPwModalLoading(true);
        try {
          const content = { ...EMPTY_KAIZEN_CONTENT, header: { title: newTitle.trim(), department: newDepartment.trim() || "Produksi", leader: newLeader.trim(), teamMembers: newTeamMembers.trim(), startDate: new Date().toISOString().split("T")[0], dueDate: "", status: "Draft" as ProjectStatus } };
          const res = await fetch("/api/kaizen", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle.trim(), department: newDepartment.trim() || "Produksi", industry: newIndustry, leader: newLeader.trim(), teamMembers: newTeamMembers.trim(), status: "Draft", projectPassword: pw, content, isTemplate: saveAsTemplate ? 1 : 0, templateName: saveAsTemplate ? (templateName.trim() || newTitle.trim()) : null, visitorId: getVisitorId() }) });
          const json = await res.json();
          if (json.success && json.data) {
            addMyProjectId(json.data.id);
            unlockedPasswords[json.data.id] = pw;
            setActiveProject(json.data); setActiveStep(1); setIsDirty(false); setViewMode("edit"); setPwModalOpen(false); setShowCreateForm(false); fetchProjects(); fetchTemplates();
          } else setPwModalError(json.error || "Gagal membuat proyek.");
        } catch { setPwModalError("Gagal menghubungi server."); }
        setPwModalLoading(false);
      });
  };

  const createFromTemplate = async (templateId: string) => {
    openPasswordModal("create", "Buat Proyek dari Template", "Buat password untuk mengamankan proyek baru ini.",
      async (pw) => {
        setPwModalLoading(true);
        const res = await fetch(`/api/kaizen/${templateId}/duplicate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword: pw }) });
        const json = await res.json();
        if (json.success) { addMyProjectId(json.data.id); unlockedPasswords[json.data.id] = pw; setActiveProject(json.data); setActiveStep(1); setIsDirty(false); setViewMode("edit"); setPwModalOpen(false); setShowTemplates(false); fetchProjects(); }
        else setPwModalError(json.error || "Gagal.");
        setPwModalLoading(false);
      });
  };

  // ──── Join project ────
  const joinProject = () => {
    const id = joinProjectId.trim();
    if (!id) { alert("ID Proyek wajib diisi."); return; }
    if (getMyProjectIds().includes(id)) { alert("Proyek ini sudah ada di daftar Anda."); setShowJoinForm(false); setViewMode("list"); return; }
    openPasswordModal("enter", "Gabung ke Proyek", "Masukkan password proyek untuk menambahkannya ke daftar Anda.",
      async (pw) => {
        setPwModalLoading(true); setPwModalError("");
        const { project, error } = await unlockProject(id, pw);
        if (project) {
          addMyProjectId(id);
          unlockedPasswords[id] = pw;
          setPwModalOpen(false); setShowJoinForm(false); setJoinProjectId(""); setViewMode("list"); fetchProjects();
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
    openPasswordModal("enter", "Duplikasi Proyek", "Masukkan password proyek asli.",
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
            if (activeProject?.id === id) { setActiveProject(null); setViewMode("list"); }
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
    if (days < 0) return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3 text-rose-400" /> Overdue {Math.abs(days)}d</span>;
    if (days <= 3) return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-full animate-pulse"><Clock className="w-3 h-3" /> H-{days} ⚠️</span>;
    if (days <= 7) return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#f0d68a] bg-[#d4a94c]/20 border border-[#d4a94c]/40 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> {days}d left</span>;
    return null;
  };

  const statusBadgeClass = (s: string) =>
    s === "Completed" ? "bg-[#d4a94c]/15 text-[#f0d68a] border-[#d4a94c]/40"
    : s === "On Progress" ? "bg-[#1fb6a8]/15 text-[#5fe8d8] border-[#1fb6a8]/40"
    : s === "Under Review" ? "bg-[#d4a94c]/15 text-[#d4a94c] border-[#d4a94c]/40"
    : s === "Rejected" ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
    : "bg-[#16304f] text-[#8fa3bd] border-[#8fa3bd]/30";

  return (
    <div className="min-h-screen bg-[#050b16] text-[#f8fafc] flex flex-col font-body selection:bg-[#1fb6a8] selection:text-[#050b16]">
      {/* Password modal */}
      <PasswordModal isOpen={pwModalOpen} onClose={() => setPwModalOpen(false)} onSubmit={(pw) => pwModalCallback?.(pw)} title={pwModalTitle} description={pwModalDesc} error={pwModalError} isLoading={pwModalLoading} mode={pwModalMode} />

      {/* Share link modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowShareModal(false)} />
          <div className="relative bg-[#101f36] border border-[#8fa3bd]/20 rounded-2xl shadow-2xl p-6 max-w-md w-full z-10 space-y-4 text-white">
            <div className="text-center">
              <div className="w-14 h-14 bg-[#16304f] border border-[#d4a94c]/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#f0d68a]"><Share2 className="w-7 h-7 text-[#1fb6a8]" /></div>
              <h2 className="font-display text-xl font-bold text-white tracking-wide">Link View-Only</h2>
              <p className="text-xs text-[#8fa3bd] mt-1 font-body">Bagikan link ini untuk akses baca saja (tanpa bisa edit). Tidak perlu password.</p>
            </div>
            <div className="flex gap-2">
              <input type="text" readOnly value={shareUrl} className="flex-1 bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl px-3 py-2 text-xs text-white font-mono" />
              <button onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Link disalin!"); }} className="btn-gold text-xs px-4 py-2 cursor-pointer shrink-0">Salin</button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full text-center text-xs text-[#8fa3bd] hover:text-white cursor-pointer py-1">Tutup</button>
          </div>
        </div>
      )}

      <OnboardingGuide />

      {/* ════════ TOPBAR BRAND HEADER ════════ */}
      <header className="bg-[#0d1b30] border-b border-[#8fa3bd]/16 sticky top-0 z-30 shadow-xl backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo Monogram */}
          <BrandMonogram onClick={goToLanding} size="md" />

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {viewMode !== "landing" && (
              <button
                onClick={goToLanding}
                className="btn-ghost text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Landing Hero</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ════════ MAIN CONTENT ════════ */}
      <main className="flex-1 w-full">

        {/* ════════════════ VIEW MODE 1: HERO / LANDING PAGE ════════════════ */}
        {viewMode === "landing" && (
          <div className="w-full space-y-0">
            {/* HERO SECTION */}
            <section className="relative w-full py-12 sm:py-20 px-4 sm:px-6 overflow-hidden flex flex-col items-center justify-center text-center">
              {/* Radial glow background */}
              <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#1fb6a8]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#d4a94c]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-4xl mx-auto space-y-8 relative z-10 flex flex-col items-center">
                {/* Eyebrow Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#d4a94c]/40 bg-[#16304f]/60 text-[#f0d68a] text-xs font-bold uppercase tracking-widest font-body shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#f0d68a]" />
                  PDCA · KAIZEN · SIKLUS PERBAIKAN
                </div>

                {/* Main Headline */}
                <div className="space-y-3 max-w-3xl">
                  <h1 className="font-display text-4xl sm:text-6xl font-black text-white tracking-wide uppercase leading-tight sm:leading-none">
                    SIKLUS <span className="text-[#5fe8d8]">KAIZEN</span> TIDAK PERNAH BERHENTI
                  </h1>
                  <p className="font-body text-sm sm:text-base text-[#8fa3bd] max-w-xl mx-auto leading-relaxed">
                    Dokumentasikan setiap langkah perbaikan manufaktur dengan metode PDCA 8 Langkah. Terstruktur, aman, dan siap diexport ke PDF/Word.
                  </p>
                </div>

                {/* Animated PDCA Ring Illustration */}
                <HeroPdcaIllustration />

                {/* CTA Hierarchy Section */}
                <div className="w-full max-w-md space-y-4 pt-4">
                  {/* Primary CTA Button: BIG Solid Gold Button */}
                  <button
                    onClick={handleCreateProject}
                    className="w-full btn-gold py-4 text-base sm:text-lg uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 shadow-2xl cursor-pointer"
                  >
                    <span>Buat Proyek Baru</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </button>

                  {/* Secondary CTA: Search Pill Input */}
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-[#8fa3bd] absolute left-4 top-3.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setViewMode("list");
                      }}
                      onFocus={() => {
                        setViewMode("list");
                      }}
                      placeholder="Cari nama proyek..."
                      className="w-full bg-[#101f36]/80 border border-[#8fa3bd]/25 rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-[#8fa3bd]/60 focus:outline-none focus:border-[#5fe8d8] focus:ring-1 focus:ring-[#5fe8d8] transition-all shadow-inner font-body"
                    />
                  </div>

                  {/* Quick link to view my projects list */}
                  {getMyProjectIds().length > 0 && (
                    <button
                      onClick={() => setViewMode("list")}
                      className="text-xs text-[#5fe8d8] hover:underline font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      Lihat {getMyProjectIds().length} Proyek Saya <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION 3B: INFORMASI UMUM (Story / Author Section) */}
            <AboutSection onStartClick={handleCreateProject} />
          </div>
        )}

        {/* ════════════════ DASHBOARD / APP SHELL (List / Edit / Preview) ════════════════ */}
        {viewMode !== "landing" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

            {/* NAVBAR TOOLBAR */}
            {viewMode === "list" && (
              <div className="bg-[#101f36] p-4 rounded-2xl border border-[#8fa3bd]/16 shadow-lg flex flex-wrap items-center justify-between gap-4">
                {/* Search Field */}
                <div className="flex-1 min-w-[220px] relative">
                  <Search className="w-4 h-4 text-[#8fa3bd] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari proyek saya..."
                    className="w-full bg-[#16304f] border border-[#8fa3bd]/25 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#8fa3bd]/50 focus:outline-none focus:border-[#5fe8d8]"
                  />
                </div>

                {/* Directory Toggle & Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-[#16304f] p-1 rounded-xl border border-[#8fa3bd]/25">
                    <button
                      onClick={() => setListFilterMode("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        listFilterMode === "all" ? "bg-[#1fb6a8] text-[#050b16] shadow-xs" : "text-[#8fa3bd] hover:text-white"
                      }`}
                    >
                      Semua Publik
                    </button>
                    <button
                      onClick={() => setListFilterMode("mine")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        listFilterMode === "mine" ? "bg-[#1fb6a8] text-[#050b16] shadow-xs" : "text-[#8fa3bd] hover:text-white"
                      }`}
                    >
                      Proyek Saya ({getMyProjectIds().length})
                    </button>
                  </div>

                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="bg-[#16304f] border border-[#8fa3bd]/25 text-white text-xs rounded-xl px-3 py-2 font-medium cursor-pointer"
                  >
                    <option value="all">Semua Dept</option>
                    {departmentsList.map((d) => <option key={d} value={d} className="bg-[#0d1b30]">{d}</option>)}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#16304f] border border-[#8fa3bd]/25 text-white text-xs rounded-xl px-3 py-2 font-medium cursor-pointer"
                  >
                    <option value="all">Semua Status</option>
                    <option value="Draft" className="bg-[#0d1b30]">Draft</option>
                    <option value="On Progress" className="bg-[#0d1b30]">On Progress</option>
                    <option value="Under Review" className="bg-[#0d1b30]">Under Review</option>
                    <option value="Completed" className="bg-[#0d1b30]">Completed</option>
                    <option value="Rejected" className="bg-[#0d1b30]">Rejected</option>
                  </select>

                  <button
                    onClick={() => fetchProjects()}
                    className="btn-ghost p-2 rounded-xl text-[#8fa3bd] hover:text-[#5fe8d8] cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Vertical Divider */}
                  <div className="h-5 w-[1px] bg-[#8fa3bd]/20 mx-1" />

                  {/* Account status & Gabung button */}
                  <span className="text-[11px] text-[#8fa3bd] font-medium hidden sm:inline">
                    Masuk sebagai Tamu
                  </span>

                  <button
                    onClick={() => setShowJoinForm(!showJoinForm)}
                    className="btn-ghost px-2.5 py-1.5 rounded-xl text-xs font-bold border-[#1fb6a8]/40 text-[#5fe8d8] flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Gabung</span>
                  </button>
                </div>
              </div>
            )}

            {/* Template picker banner */}
            {showTemplates && viewMode === "list" && templates.length > 0 && (
              <div className="bg-[#16304f] border border-[#d4a94c]/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#f0d68a] flex items-center gap-2 uppercase tracking-wider">
                    <BookTemplate className="w-4 h-4 text-[#1fb6a8]" /> Template Kaizen Standar
                  </h3>
                  <button onClick={() => setShowTemplates(false)} className="text-xs text-[#8fa3bd] hover:text-white cursor-pointer">✕</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {templates.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => createFromTemplate(t.id)}
                      className="bg-[#101f36] rounded-xl p-3 border border-[#8fa3bd]/20 hover:border-[#1fb6a8] text-left cursor-pointer transition-all"
                    >
                      <p className="text-xs font-bold text-white">{t.templateName || t.title}</p>
                      <p className="text-[10px] text-[#8fa3bd] mt-0.5">{t.department}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create project form */}
            {showCreateForm && viewMode === "list" && (
              <div className="bg-[#101f36] rounded-2xl shadow-xl border border-[#1fb6a8]/40 p-5 space-y-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#1fb6a8]" /> Buat Proyek Baru
                  </h2>
                  <button onClick={() => setShowCreateForm(false)} className="text-xs text-[#8fa3bd] hover:text-rose-400 cursor-pointer">Batal ✕</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8fa3bd] mb-1">
                      Nama / Tema Proyek <span className="text-[#1fb6a8]">*</span>
                    </label>
                    <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Menurunkan Defect Burr" className="w-full bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl p-2.5 text-xs text-white placeholder-[#8fa3bd]/50 focus:ring-2 focus:ring-[#1fb6a8] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8fa3bd] mb-1">
                      Ketua Tim <span className="text-[#1fb6a8]">*</span>
                    </label>
                    <input type="text" value={newLeader} onChange={(e) => setNewLeader(e.target.value)} placeholder="Nama Leader" className="w-full bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl p-2.5 text-xs text-white placeholder-[#8fa3bd]/50 focus:ring-2 focus:ring-[#1fb6a8] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8fa3bd] mb-1">Departemen</label>
                    <input type="text" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} placeholder="Produksi" className="w-full bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl p-2.5 text-xs text-white placeholder-[#8fa3bd]/50 focus:ring-2 focus:ring-[#1fb6a8] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8fa3bd] mb-1">Industri Pengguna</label>
                    <select value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} className="w-full bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-[#1fb6a8] focus:outline-none cursor-pointer">
                      <option value="Manufaktur" className="bg-[#0d1b30]">Manufaktur</option>
                      <option value="F&B" className="bg-[#0d1b30]">F&B (Makanan &amp; Minuman)</option>
                      <option value="Retail" className="bg-[#0d1b30]">Retail &amp; Perdagangan</option>
                      <option value="Jasa" className="bg-[#0d1b30]">Jasa / Layanan</option>
                      <option value="Lainnya" className="bg-[#0d1b30]">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8fa3bd] mb-1">Anggota Tim</label>
                    <input type="text" value={newTeamMembers} onChange={(e) => setNewTeamMembers(e.target.value)} placeholder="Budi, Agus, Siti" className="w-full bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl p-2.5 text-xs text-white placeholder-[#8fa3bd]/50 focus:ring-2 focus:ring-[#1fb6a8] focus:outline-none" />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input type="checkbox" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} className="accent-[#1fb6a8]" />
                  <span className="text-xs font-medium text-slate-300">Simpan juga sebagai template publik</span>
                </label>
                {saveAsTemplate && (
                  <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Nama template..." className="bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl p-2 text-xs text-white w-full" />
                )}
                <div className="flex justify-end">
                  <button onClick={submitNewProject} className="btn-gold text-xs px-5 py-2.5 flex items-center gap-2 cursor-pointer">
                    <Lock className="w-4 h-4" /> Buat &amp; Kunci Dokumen
                  </button>
                </div>
              </div>
            )}

            {/* Join form */}
            {showJoinForm && viewMode === "list" && (
              <div className="bg-[#101f36] rounded-2xl shadow-xl border border-[#1fb6a8]/40 p-5 space-y-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#5fe8d8]" /> Gabung ke Proyek
                  </h2>
                  <button onClick={() => setShowJoinForm(false)} className="text-xs text-[#8fa3bd] hover:text-rose-400 cursor-pointer">Batal ✕</button>
                </div>
                <p className="text-xs text-[#8fa3bd]">Masukkan ID proyek yang diberikan oleh pemilik proyek. Anda akan diminta memasukkan password untuk memverifikasi akses.</p>
                <div className="flex gap-2">
                  <input type="text" value={joinProjectId} onChange={(e) => setJoinProjectId(e.target.value)} placeholder="ID Proyek (e.g. kz-1234567890-abcdef12)" className="flex-1 bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl px-3 py-2 text-xs font-mono text-white focus:ring-2 focus:ring-[#1fb6a8] focus:outline-none" />
                  <button onClick={joinProject} className="btn-gold text-xs px-4 py-2 cursor-pointer shrink-0">Verifikasi &amp; Gabung</button>
                </div>
              </div>
            )}

            {/* ═══ PROJECT CARDS GRID ═══ */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-16 text-[#8fa3bd] text-sm">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-[#1fb6a8]" />
                    Memuat proyek saya...
                  </div>
                ) : projects.length === 0 && !showCreateForm && !showJoinForm ? (
                  <div className="bg-[#101f36] rounded-2xl p-10 text-center border border-[#8fa3bd]/16 max-w-xl mx-auto space-y-4 shadow-xl">
                    <div className="p-4 bg-[#16304f] rounded-full w-16 h-16 mx-auto flex items-center justify-center text-[#f0d68a] border border-[#d4a94c]/30">
                      <FileCheck className="w-8 h-8" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-white">Belum Ada Proyek di Daftar Anda</h3>
                    <p className="text-xs text-[#8fa3bd] leading-relaxed font-body">
                      Buat proyek Kaizen baru, gunakan template standar, atau gabung ke proyek yang sudah ada lewat ID proyek.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center pt-2">
                      <button onClick={handleCreateProject} className="btn-gold text-xs px-4 py-2.5 flex items-center gap-2 cursor-pointer">
                        <Plus className="w-4 h-4" /> Buat Proyek Baru
                      </button>
                      <button onClick={() => setShowJoinForm(true)} className="btn-ghost text-xs px-4 py-2.5 rounded-xl border-[#1fb6a8]/40 text-[#5fe8d8] flex items-center gap-2 cursor-pointer">
                        <UserPlus className="w-4 h-4" /> Gabung ke Proyek
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {projects.map((proj: any) => {
                      const stepNum = proj.currentStep || 1;
                      const progressPct = Math.round((stepNum / 8) * 100);

                      return (
                        <div
                          key={proj.id}
                          onClick={() => openProject(proj.id, "edit")}
                          className="card-navy p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                        >
                          {/* Top Accent Gradient Line */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1fb6a8] via-[#5fe8d8] to-[#d4a94c]" />

                          <div>
                            {/* Card Header Info */}
                            <div className="flex items-center justify-between mb-3 gap-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#16304f] text-[#8fa3bd] rounded-md border border-[#8fa3bd]/20">
                                {proj.department || "Produksi"}
                              </span>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                <DeadlineBadge dueDate={proj.dueDate} status={proj.status} />
                                {hasMyProjectId(proj.id) && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1fb6a8]/20 text-[#5fe8d8] border border-[#1fb6a8]/40">
                                    Milik Saya
                                  </span>
                                )}
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#d4a94c]/15 text-[#f0d68a] border border-[#d4a94c]/30 font-bold" title="ID Proyek">
                                  {proj.id.substring(0, 10)}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass(proj.status)}`}>
                                  {proj.status}
                                </span>
                              </div>
                            </div>

                            {/* Project Title */}
                            <h3 className="font-display font-bold text-white text-lg line-clamp-2 group-hover:text-[#5fe8d8] transition-colors mb-3 tracking-wide">
                              {proj.title || "Tanpa Judul"}
                            </h3>

                            <div className="text-xs text-[#8fa3bd] space-y-1 font-medium mb-4">
                              <p>PIC: <strong className="text-slate-200">{proj.leader || "-"}</strong></p>
                              <p>Langkah: <strong className="text-[#5fe8d8]">Langkah {stepNum} dari 8</strong></p>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1 mb-4">
                              <div className="flex justify-between text-[10px] text-[#8fa3bd] font-bold">
                                <span>Progress Dokumen</span>
                                <span className="text-[#5fe8d8]">{progressPct}%</span>
                              </div>
                              <div className="w-full bg-[#16304f] h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#1fb6a8] to-[#5fe8d8] rounded-full transition-all duration-300"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="border-t border-[#8fa3bd]/15 pt-3 flex items-center justify-between">
                            <button
                              onClick={(e) => { e.stopPropagation(); openProject(proj.id, "preview"); }}
                              className="text-xs font-bold text-[#5fe8d8] hover:text-white flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" /> Pratinjau A3
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => duplicateProject(proj.id, e)}
                                className="p-1.5 text-[#8fa3bd] hover:text-[#5fe8d8] rounded-lg hover:bg-[#16304f] transition-colors cursor-pointer"
                                title="Duplikasi Proyek"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => deleteProject(proj.id, e)}
                                className="p-1.5 text-[#8fa3bd] hover:text-rose-400 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer"
                                title="Hapus Proyek (Perlu Password)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══ EDIT MODE ═══ */}
            {viewMode === "edit" && activeProject && (
              <div className="space-y-4">
                <div className="bg-[#101f36] px-4 py-3 rounded-2xl border border-[#8fa3bd]/16 shadow-xl flex flex-wrap items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={goBackToList} className="btn-ghost text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer">
                      <ArrowLeft className="w-4 h-4" /> Proyek Saya
                    </button>
                    <span className="hidden sm:inline h-4 w-[1px] bg-[#8fa3bd]/20" />
                    <span className="text-xs font-bold text-[#f0d68a]">Step {activeStep} / 7</span>
                    <span title="Dokumen terkunci"><Lock className="w-3.5 h-3.5 text-[#1fb6a8]" /></span>
                    {autoSaveStatus === "saving" && <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 animate-pulse"><Clock className="w-3 h-3" /> Menyimpan...</span>}
                    {autoSaveStatus === "saved" && <span className="text-[11px] text-[#5fe8d8] font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Tersimpan ✓</span>}
                    {isDirty && autoSaveStatus === "idle" && <span className="text-[11px] text-[#8fa3bd] font-medium flex items-center gap-1"><Edit3 className="w-3 h-3" /> Ada perubahan</span>}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={getShareLink} className="btn-ghost text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer" title="Dapatkan link view-only">
                      <Share2 className="w-3.5 h-3.5 text-[#1fb6a8]" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                    <span className="text-[10px] text-[#8fa3bd] font-mono hidden lg:inline" title="ID Proyek">{activeProject.id}</span>
                    <button onClick={() => saveProject(activeProject, true)} className="btn-ghost text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer">
                      <Save className="w-4 h-4 text-[#1fb6a8]" />
                      <span className="hidden sm:inline">Simpan</span>
                    </button>
                    <button onClick={switchToPreview} className="btn-gold text-xs px-4 py-1.5 flex items-center gap-1.5 cursor-pointer">
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Pratinjau</span>
                    </button>
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
                  <div className="bg-[#16304f] border border-[#d4a94c]/40 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-[#f0d68a] flex items-center gap-1.5 uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-[#d4a94c]" /> Langkah Belum Lengkap:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {stepValidations.filter((v) => !v.isComplete).map((v) => (
                        <button key={v.step} onClick={() => setActiveStep(v.step)} className="text-left text-xs text-[#8fa3bd] hover:text-[#5fe8d8] cursor-pointer py-0.5">
                          • Langkah {v.step} ({v.label}): {v.errors.join(", ")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-[#101f36] p-4 rounded-2xl border border-[#8fa3bd]/16 shadow-xl flex items-center justify-between">
                  <button disabled={activeStep === 1} onClick={() => setActiveStep((p) => Math.max(1, p - 1))} className="btn-ghost text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-40">
                    <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Sebelumnya</span>
                  </button>
                  <span className="text-xs text-[#8fa3bd] font-bold">{activeStep} / 7</span>
                  {activeStep < 7 ? (
                    <button onClick={() => setActiveStep((p) => Math.min(7, p + 1))} className="btn-gold text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer">
                      <span className="hidden sm:inline">Selanjutnya</span> <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={switchToPreview} className="btn-gold text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer">
                      <span className="hidden sm:inline">Selesai</span> <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ═══ PREVIEW MODE ═══ */}
            {viewMode === "preview" && activeProject && (
              <KaizenReportView project={activeProject} onEditClick={() => setViewMode("edit")} />
            )}
          </div>
        )}
      </main>

      {/* ════════ FOOTER ════════ */}
      <footer className="bg-[#0d1b30] border-t border-[#8fa3bd]/16 py-6 text-center text-xs text-[#8fa3bd] mt-16 space-y-2">
        <p className="font-body">
          KAIZEN PDCA 8 LANGKAH · DOKUMENTASI IMPROVEMENT MANUFAKTUR
        </p>
        <div>
          <Link href="/admin" className="text-[#8fa3bd] hover:text-[#5fe8d8] transition-colors inline-flex items-center gap-1 font-semibold">
            🔒 Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
