"use client";

import React, { useState, useEffect, useCallback } from "react";
import { KaizenProject, EMPTY_KAIZEN_CONTENT, ProjectStatus } from "@/types/kaizen";
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
import {
  Plus,
  Search,
  Filter,
  Copy,
  Trash2,
  Eye,
  Edit3,
  Save,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle,
  Clock,
  LayoutGrid,
  List,
  FileCheck,
} from "lucide-react";

export default function KaizenApp() {
  const [projects, setProjects] = useState<KaizenProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected active project for editing or viewing
  const [activeProject, setActiveProject] = useState<KaizenProject | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "edit" | "preview">("list");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "idle">("idle");

  // Fetch projects list
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (departmentFilter !== "all") params.set("department", departmentFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/kaizen?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProjects(json.data || []);
      }
    } catch (err) {
      console.error("Fetch projects error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, departmentFilter, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Save Project Handler
  const saveProject = async (projectToSave: KaizenProject, showNotice = false) => {
    setAutoSaveStatus("saving");
    try {
      const res = await fetch(`/api/kaizen/${projectToSave.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectToSave.content.header.title,
          department: projectToSave.content.header.department,
          leader: projectToSave.content.header.leader,
          teamMembers: projectToSave.content.header.teamMembers,
          startDate: projectToSave.content.header.startDate,
          dueDate: projectToSave.content.header.dueDate,
          status: projectToSave.content.header.status,
          currentStep: activeStep,
          content: projectToSave.content,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2500);
        if (showNotice) {
          fetchProjects();
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      setAutoSaveStatus("idle");
    }
  };

  // Debounced Autosave effect
  useEffect(() => {
    if (viewMode === "edit" && activeProject) {
      const timer = setTimeout(() => {
        saveProject(activeProject, false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeProject, viewMode]);

  // Create New Blank Kaizen Template
  const createNewProject = async () => {
    try {
      const res = await fetch("/api/kaizen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Proyek Kaizen Baru",
          department: "Produksi",
          leader: "PIC Utama",
          status: "Draft",
          content: EMPTY_KAIZEN_CONTENT,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setActiveProject(json.data);
        setActiveStep(1);
        setViewMode("edit");
        fetchProjects();
      }
    } catch (err) {
      console.error("Create project error:", err);
    }
  };

  // Duplicate Project Template
  const duplicateProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/kaizen/${id}/duplicate`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        fetchProjects();
      }
    } catch (err) {
      console.error("Duplicate project error:", err);
    }
  };

  // Delete Project
  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus proyek Kaizen ini?")) return;

    try {
      const res = await fetch(`/api/kaizen/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        if (activeProject?.id === id) {
          setActiveProject(null);
          setViewMode("list");
        }
        fetchProjects();
      }
    } catch (err) {
      console.error("Delete project error:", err);
    }
  };

  // Update nested step content
  const updateContentStep = (stepKey: keyof typeof EMPTY_KAIZEN_CONTENT, updatedStepData: any) => {
    if (!activeProject) return;

    setActiveProject({
      ...activeProject,
      content: {
        ...activeProject.content,
        [stepKey]: updatedStepData,
      },
    });
  };

  // Update Header
  const updateHeader = (updatedHeader: typeof EMPTY_KAIZEN_CONTENT.header) => {
    if (!activeProject) return;

    setActiveProject({
      ...activeProject,
      title: updatedHeader.title,
      department: updatedHeader.department,
      leader: updatedHeader.leader,
      status: updatedHeader.status,
      content: {
        ...activeProject.content,
        header: updatedHeader,
      },
    });
  };

  const departmentsList = Array.from(
    new Set(projects.map((p) => p.department).filter(Boolean))
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Main Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div
            onClick={() => setViewMode("list")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-lg shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                STANDARD MANUFACTURING TEMPLATE
              </span>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                Dokumentasi Kaizen PDCA 8 Langkah
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {viewMode !== "list" && (
              <button
                onClick={() => {
                  fetchProjects();
                  setViewMode("list");
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Daftar Proyek Kaizen
              </button>
            )}

            <button
              onClick={createNewProject}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Proyek Baru (Form Kosong)
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* VIEW MODE 1: LIST / DASHBOARD */}
        {viewMode === "list" && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[280px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tema proyek, PIC leader, atau departemen..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </div>

                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <option value="all">Semua Departemen</option>
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="Draft">Draft</option>
                  <option value="On Progress">On Progress</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Memuat daftar proyek kaizen...
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 max-w-xl mx-auto space-y-4">
                <div className="p-4 bg-indigo-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-indigo-600">
                  <FileCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Belum Ada Proyek Kaizen</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Buat formulir proyek perbaikan baru dengan template standar PDCA 8 Langkah.
                  </p>
                </div>
                <button
                  onClick={createNewProject}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-2 shadow-md transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Buat Proyek Kaizen Baru
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((proj) => {
                  const contentHeader = proj.content?.header || {
                    title: proj.title,
                    department: proj.department,
                    leader: proj.leader,
                    status: proj.status,
                  };

                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setActiveProject(proj);
                        setActiveStep(proj.currentStep || 1);
                        setViewMode("edit");
                      }}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all duration-200 cursor-pointer p-5 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {proj.department || "Produksi"}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              proj.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : proj.status === "On Progress"
                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                : "bg-slate-50 text-slate-700 border-slate-300"
                            }`}
                          >
                            {proj.status}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors mb-3">
                          {proj.title || "Proyek Kaizen Tanpa Judul"}
                        </h3>

                        <div className="text-xs text-slate-500 space-y-1 font-medium mb-4">
                          <p>PIC: {proj.leader || "-"}</p>
                          <p>Langkah Aktif: Langkah {proj.currentStep || 1} dari 8</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProject(proj);
                            setViewMode("preview");
                          }}
                          className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Pratinjau A3
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => duplicateProject(proj.id, e)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50"
                            title="Duplikasi Proyek"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => deleteProject(proj.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Hapus Proyek"
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

        {/* VIEW MODE 2: WIZARD EDIT FORM */}
        {viewMode === "edit" && activeProject && (
          <div className="space-y-4">
            {/* Control Header Bar */}
            <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode("list")}
                  className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembalian ke Daftar
                </button>

                <div className="h-4 w-[1px] bg-slate-300" />

                <span className="text-xs font-bold text-slate-800">
                  Langkah {activeStep} dari 8
                </span>

                {autoSaveStatus === "saving" && (
                  <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3" /> Menyimpan Draft...
                  </span>
                )}
                {autoSaveStatus === "saved" && (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Draft Otomatis Tersimpan
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveProject(activeProject, true)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Simpan Draft
                </button>

                <button
                  onClick={() => setViewMode("preview")}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" /> Lihat Laporan A3 & Export
                </button>
              </div>
            </div>

            {/* Always Pinned Header Project Card */}
            <HeaderCard
              header={activeProject.content.header}
              onChange={updateHeader}
            />

            {/* Step Wizard Nav bar */}
            <WizardStepsNav
              activeStep={activeStep}
              onSelectStep={(step) => setActiveStep(step)}
            />

            {/* Dynamic Step Content Editor View */}
            <div>
              {activeStep === 1 && (
                <Step1Editor
                  data={activeProject.content.step1}
                  onChange={(d) => updateContentStep("step1", d)}
                />
              )}
              {activeStep === 2 && (
                <Step2Editor
                  data={activeProject.content.step2}
                  onChange={(d) => updateContentStep("step2", d)}
                />
              )}
              {activeStep === 3 && (
                <Step3Editor
                  data={activeProject.content.step3}
                  onChange={(d) => updateContentStep("step3", d)}
                />
              )}
              {activeStep === 4 && (
                <Step4Editor
                  data={activeProject.content.step4}
                  onChange={(d) => updateContentStep("step4", d)}
                />
              )}
              {activeStep === 5 && (
                <Step5And6Editor
                  data={activeProject.content.step5_6}
                  onChange={(d) => updateContentStep("step5_6", d)}
                />
              )}
              {activeStep === 6 && (
                <Step7Editor
                  data={activeProject.content.step7}
                  onChange={(d) => updateContentStep("step7", d)}
                />
              )}
              {activeStep === 7 && (
                <Step8Editor
                  data={activeProject.content.step8}
                  onChange={(d) => updateContentStep("step8", d)}
                />
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <button
                disabled={activeStep === 1}
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Langkah Sebelumnya
              </button>

              <div className="text-xs text-slate-500 font-medium">
                Langkah {activeStep} / 7
              </div>

              {activeStep < 7 ? (
                <button
                  onClick={() => setActiveStep((prev) => Math.min(7, prev + 1))}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  Langkah Selanjutnya
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setViewMode("preview")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  Selesai & Lihat Pratinjau A3
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW MODE 3: PREVIEW A3 REPORT VIEW */}
        {viewMode === "preview" && activeProject && (
          <KaizenReportView
            project={activeProject}
            onEditClick={() => setViewMode("edit")}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-12">
        Aplikasi Dokumentasi Kaizen PDCA 8 Langkah • Manufaktur Template • Fullstack Next.js & Drizzle PostgreSQL
      </footer>
    </div>
  );
}
