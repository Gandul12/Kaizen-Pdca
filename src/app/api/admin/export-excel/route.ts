import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { desc } from "drizzle-orm";
import ExcelJS from "exceljs";
import { timingSafeCompare } from "@/lib/password";
import { getClientIp, checkRateLimit } from "@/lib/requestHelpers";
import { recordFailure, recordSuccess } from "@/lib/rateLimiter";

const RATE_NS = "admin"; // shares the same namespace as admin/stats

function getAdminPassword(): string {
  const envPw = process.env.ADMIN_PASSWORD;
  if (envPw) return envPw;
  if (process.env.NODE_ENV === "production") return "";
  return "admin123";
}

export async function POST(req: NextRequest) {
  // ── Rate-limit check (same bucket as admin stats) ──
  const rateLimited = await checkRateLimit(req, RATE_NS);
  if (rateLimited) return rateLimited;

  const ip = getClientIp(req);

  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const password = body.password || "";
    const adminPw = getAdminPassword();

    if (!adminPw || !timingSafeCompare(password, adminPw)) {
      recordFailure(RATE_NS, ip);
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    recordSuccess(RATE_NS, ip);

    const allProjects = await db.select().from(kaizenProjects).orderBy(desc(kaizenProjects.updatedAt));

    const wb = new ExcelJS.Workbook();
    wb.creator = "Kaizen PDCA App";
    wb.created = new Date();

    // Sheet 1: Rekap
    const ws1 = wb.addWorksheet("Rekap Proyek");
    ws1.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Judul Proyek", key: "title", width: 40 },
      { header: "Departemen", key: "department", width: 18 },
      { header: "PIC / Ketua Tim", key: "leader", width: 20 },
      { header: "Anggota Tim", key: "team", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Langkah Aktif", key: "step", width: 14 },
      { header: "Tanggal Mulai", key: "startDate", width: 14 },
      { header: "Target Selesai", key: "dueDate", width: 14 },
      { header: "Tema Proyek (SMART)", key: "theme", width: 50 },
      { header: "Root Cause", key: "rootCause", width: 40 },
      { header: "Action Plan Utama", key: "mainAction", width: 40 },
      { header: "Keputusan Follow-Up", key: "followUp", width: 25 },
      { header: "Overdue?", key: "overdue", width: 10 },
      { header: "Dibuat", key: "createdAt", width: 18 },
      { header: "Update Terakhir", key: "updatedAt", width: 18 },
    ];
    ws1.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws1.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };

    const now = new Date();
    allProjects.forEach((p, idx) => {
      const c = p.content as any;
      const isOverdue = !!(p.dueDate && p.status !== "Completed" && new Date(p.dueDate) < now);
      const decisionMap: Record<string, string> = { proliferasi: "Proliferasi", monitoring: "Monitoring", pdca_ulang: "PDCA Ulang", eskalasi: "Eskalasi" };
      ws1.addRow({
        no: idx + 1, title: p.title, department: p.department, leader: p.leader,
        team: p.teamMembers || "", status: p.status, step: `${p.currentStep}/8`,
        startDate: p.startDate || "", dueDate: p.dueDate || "",
        theme: c?.step3?.projectTheme || "", rootCause: c?.step4?.fiveWhys?.rootCause || "",
        mainAction: c?.step5_6?.actionPlans?.[0]?.plan || "",
        followUp: decisionMap[c?.step7?.followUpDecision] || c?.step7?.followUpDecision || "",
        overdue: isOverdue ? "YA" : "",
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString("id-ID") : "",
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("id-ID") : "",
      });
    });

    // Sheet 2: Statistik
    const ws2 = wb.addWorksheet("Statistik");
    ws2.columns = [{ header: "Metrik", key: "metric", width: 40 }, { header: "Nilai", key: "value", width: 20 }];
    ws2.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws2.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };

    const statusCounts: Record<string, number> = {};
    const deptCounts: Record<string, number> = {};
    let overdueCount = 0;
    let completedCount = 0;
    const completionDays: number[] = [];
    const deptCompletionDays: Record<string, number[]> = {};

    allProjects.forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      deptCounts[p.department] = (deptCounts[p.department] || 0) + 1;
      if (p.status === "Completed") {
        completedCount++;
        if (p.startDate && p.updatedAt) {
          const days = Math.ceil((new Date(p.updatedAt).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24));
          if (days > 0) {
            completionDays.push(days);
            if (!deptCompletionDays[p.department]) deptCompletionDays[p.department] = [];
            deptCompletionDays[p.department].push(days);
          }
        }
      }
      if (p.dueDate && p.status !== "Completed" && new Date(p.dueDate) < now) overdueCount++;
    });

    const avgDays = completionDays.length > 0 ? Math.round(completionDays.reduce((a, b) => a + b, 0) / completionDays.length) : 0;
    ws2.addRow({ metric: "Total Proyek", value: allProjects.length });
    ws2.addRow({ metric: "Proyek Selesai", value: completedCount });
    ws2.addRow({ metric: "Proyek Overdue", value: overdueCount });
    ws2.addRow({ metric: "Rata-rata Waktu Penyelesaian (hari)", value: avgDays || "N/A" });
    ws2.addRow({ metric: "", value: "" });
    ws2.addRow({ metric: "--- DISTRIBUSI STATUS ---", value: "" });
    Object.entries(statusCounts).forEach(([s, c]) => ws2.addRow({ metric: `Status: ${s}`, value: c }));
    ws2.addRow({ metric: "", value: "" });
    ws2.addRow({ metric: "--- DISTRIBUSI DEPARTEMEN ---", value: "" });
    Object.entries(deptCounts).forEach(([d, c]) => ws2.addRow({ metric: `Dept: ${d}`, value: c }));
    ws2.addRow({ metric: "", value: "" });
    ws2.addRow({ metric: "--- RATA-RATA PENYELESAIAN PER DEPARTEMEN (hari) ---", value: "" });
    Object.entries(deptCompletionDays).forEach(([dept, days]) => {
      ws2.addRow({ metric: `Dept: ${dept}`, value: Math.round(days.reduce((a, b) => a + b, 0) / days.length) });
    });

    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Rekap-Kaizen-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Excel export error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
