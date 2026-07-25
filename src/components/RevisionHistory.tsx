"use client";

import React, { useState, useEffect, useCallback } from "react";
import { KaizenContent } from "@/types/kaizen";
import {
  History,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  CheckCircle,
  Send,
  FileText,
  ArrowUpRight,
} from "lucide-react";

interface RevisionMeta {
  id: string;
  revisionNumber: number;
  trigger: string;
  snapshotStatus: string;
  snapshotStep: number;
  createdBy: string | null;
  createdAt: string;
}

interface RevisionDetail extends RevisionMeta {
  snapshotContent: KaizenContent;
}

const TRIGGER_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  status_changed: {
    label: "Status Diubah",
    icon: <ArrowUpRight className="w-3.5 h-3.5" />,
    color: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
  // Legacy triggers kept for backward compatibility with existing data
  status_under_review: {
    label: "Status → Under Review",
    icon: <Send className="w-3.5 h-3.5" />,
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  status_completed: {
    label: "Status → Completed",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
};

interface RevisionHistoryProps {
  projectId: string;
  projectPassword: string;
}

export const RevisionHistory: React.FC<RevisionHistoryProps> = ({ projectId, projectPassword }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [revisions, setRevisions] = useState<RevisionMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<RevisionDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchRevisions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/kaizen/${projectId}/revisions`);
      const json = await res.json();
      if (json.success) setRevisions(json.data || []);
    } catch {
      /* ignore */
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (isOpen && revisions.length === 0) fetchRevisions();
  }, [isOpen, fetchRevisions, revisions.length]);

  const viewRevisionDetail = async (revisionId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/kaizen/${projectId}/revisions/${revisionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPassword }),
      });
      const json = await res.json();
      if (json.success) setSelectedRevision(json.data);
    } catch {
      /* ignore */
    }
    setIsLoadingDetail(false);
  };

  const closeDetail = () => setSelectedRevision(null);

  // Helper to render a concise summary of snapshot content
  const renderSnapshotSummary = (content: KaizenContent) => {
    const fields = [
      { label: "Tema Proyek", value: content.header?.title },
      { label: "Departemen", value: content.header?.department },
      { label: "PIC", value: content.header?.leader },
      { label: "Standar", value: content.step1?.standard },
      { label: "Gap", value: content.step1?.gap },
      { label: "Root Cause", value: content.step4?.fiveWhys?.rootCause },
      { label: "Tema SMART", value: content.step3?.projectTheme },
      { label: "Short-term Action", value: content.step5_6?.shortTermPlan },
      { label: "Long-term Action", value: content.step5_6?.longTermPlan },
      { label: "Ringkasan Follow-Up", value: content.step7?.testResultSummary },
      { label: "PIC Standar", value: content.step8?.maintenancePic },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {fields.map((f, i) => (
          <div key={i} className="text-xs">
            <span className="font-bold text-slate-600">{f.label}:</span>{" "}
            <span className="text-slate-800">{f.value || <span className="text-slate-400 italic">Kosong</span>}</span>
          </div>
        ))}
        {/* Action plans count */}
        <div className="text-xs">
          <span className="font-bold text-slate-600">Jumlah Action Plan:</span>{" "}
          <span className="text-slate-800">
            {content.step5_6?.actionPlans?.filter((a) => a.plan).length || 0} item
          </span>
        </div>
        {/* Documents count */}
        <div className="text-xs">
          <span className="font-bold text-slate-600">Jumlah Dokumen SOP:</span>{" "}
          <span className="text-slate-800">
            {content.step8?.documentsCreated?.filter((d) => d.docName).length || 0} item
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchRevisions(); }}
        className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-indigo-700 cursor-pointer w-full text-left"
      >
        <History className="w-5 h-5 text-indigo-600" />
        Riwayat Revisi & Snapshot Versi
        <span className="text-xs font-normal text-slate-500 ml-auto flex items-center gap-1">
          {revisions.length} revisi
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <p className="text-xs text-slate-400 text-center py-4">Memuat riwayat revisi...</p>
          ) : revisions.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-200">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Belum ada snapshot revisi.</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Snapshot otomatis dibuat setiap kali status proyek diubah (Draft → On Progress → Under Review → Completed, dsb).
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {revisions.map((rev) => {
                const triggerInfo = TRIGGER_LABELS[rev.trigger] || {
                  label: rev.trigger,
                  icon: <FileText className="w-3.5 h-3.5" />,
                  color: "text-slate-700 bg-slate-50 border-slate-200",
                };

                return (
                  <div
                    key={rev.id}
                    className="border border-slate-200 rounded-lg p-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                          v{rev.revisionNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${triggerInfo.color}`}>
                          {triggerInfo.icon} {rev.trigger === "status_changed" ? `Status → ${rev.snapshotStatus}` : triggerInfo.label}
                        </span>
                      </div>

                      <button
                        onClick={() => viewRevisionDetail(rev.id)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat Isi Snapshot
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rev.createdAt).toLocaleString("id-ID", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      {rev.createdBy && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {rev.createdBy}
                        </span>
                      )}
                      <span>Status saat itu: <strong>{rev.snapshotStatus}</strong></span>
                      <span>Step: {rev.snapshotStep}/8</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Detail Snapshot Modal ── */}
      {selectedRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeDetail} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden z-10 flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  Snapshot Revisi v{selectedRevision.revisionNumber}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedRevision.createdAt).toLocaleString("id-ID", {
                      day: "2-digit", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </span>
                  {selectedRevision.createdBy && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {selectedRevision.createdBy}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {isLoadingDetail ? (
                <p className="text-center text-slate-400 text-sm py-8">Memuat konten snapshot...</p>
              ) : (
                <>
                  {/* Metadata bar */}
                  <div className="flex items-center gap-3 flex-wrap text-xs">
                    {(() => {
                      const ti = TRIGGER_LABELS[selectedRevision.trigger] || {
                        label: selectedRevision.trigger,
                        icon: <FileText className="w-3.5 h-3.5" />,
                        color: "text-slate-700 bg-slate-50 border-slate-200",
                      };
                      return (
                        <span className={`font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${ti.color}`}>
                          {ti.icon} {ti.label}
                        </span>
                      );
                    })()}
                    <span className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                      Status: {selectedRevision.snapshotStatus}
                    </span>
                    <span className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                      Step aktif: {selectedRevision.snapshotStep}/8
                    </span>
                  </div>

                  {/* Content summary */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Ringkasan Konten pada Saat Snapshot
                    </h4>
                    {renderSnapshotSummary(selectedRevision.snapshotContent)}
                  </div>

                  {/* Action plans at time of snapshot */}
                  {selectedRevision.snapshotContent?.step5_6?.actionPlans?.some((a) => a.plan) && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 border-b border-slate-200">
                        Action Plan saat Snapshot:
                      </div>
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2">Plan</th>
                            <th className="p-2">PIC</th>
                            <th className="p-2">Progress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedRevision.snapshotContent.step5_6.actionPlans
                            .filter((a) => a.plan)
                            .map((a, i) => (
                              <tr key={i}>
                                <td className="p-2">{a.plan}</td>
                                <td className="p-2">{a.pic || "-"}</td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${a.progress >= 100 ? "bg-emerald-600" : "bg-indigo-600"}`}
                                        style={{ width: `${a.progress}%` }}
                                      />
                                    </div>
                                    <span className="font-bold">{a.progress}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 5-Why at time of snapshot */}
                  {selectedRevision.snapshotContent?.step4?.fiveWhys?.rootCause && (
                    <div className="border border-rose-200 bg-rose-50/30 rounded-lg p-3 text-xs space-y-1">
                      <span className="font-bold text-rose-900 text-[10px] uppercase">
                        Root Cause Analysis saat Snapshot:
                      </span>
                      <div className="pl-2 border-l-2 border-rose-300 space-y-0.5">
                        {selectedRevision.snapshotContent.step4.fiveWhys.why1 && (
                          <p><strong>WHY 1:</strong> {selectedRevision.snapshotContent.step4.fiveWhys.why1}</p>
                        )}
                        {selectedRevision.snapshotContent.step4.fiveWhys.why2 && (
                          <p><strong>WHY 2:</strong> {selectedRevision.snapshotContent.step4.fiveWhys.why2}</p>
                        )}
                        {selectedRevision.snapshotContent.step4.fiveWhys.why3 && (
                          <p><strong>WHY 3:</strong> {selectedRevision.snapshotContent.step4.fiveWhys.why3}</p>
                        )}
                      </div>
                      <p className="font-bold text-rose-900 pt-1 border-t border-rose-200">
                        Root Cause: {selectedRevision.snapshotContent.step4.fiveWhys.rootCause}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
