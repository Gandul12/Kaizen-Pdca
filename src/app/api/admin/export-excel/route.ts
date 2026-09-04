import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { desc } from "drizzle-orm";
import { timingSafeCompare } from "@/lib/password";
import { getClientIp, checkRateLimit } from "@/lib/requestHelpers";
import { recordFailure, recordSuccess } from "@/lib/rateLimiter";
import { generateAdminInsight } from "@/lib/adminInsight";

const RATE_NS = "admin";

function getAdminPassword(): string {
  const envPw = process.env.ADMIN_PASSWORD;
  if (envPw) return envPw;
  if (process.env.NODE_ENV === "production") return "";
  return "admin123";
}

export async function POST(req: NextRequest) {
  // ── Rate-limit check ──
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
    const now = new Date();

    // ── Prepare Rekap Proyek data ──
    const rekapHeaders = [
      "No", "Judul Proyek", "Departemen", "PIC / Ketua Tim", "Anggota Tim",
      "Status", "Langkah Aktif", "Tanggal Mulai", "Target Selesai",
      "Tema Proyek (SMART)", "Root Cause", "Action Plan Utama",
      "Keputusan Follow-Up", "Overdue?", "Dibuat", "Update Terakhir",
    ];

    const decisionMap: Record<string, string> = {
      proliferasi: "Proliferasi",
      monitoring: "Monitoring",
      pdca_ulang: "PDCA Ulang",
      eskalasi: "Eskalasi",
    };

    const rekapRows = allProjects.map((p, idx) => {
      const c = p.content as any;
      const isOverdue = !!(p.dueDate && p.status !== "Completed" && new Date(p.dueDate) < now);
      return [
        idx + 1,
        p.title,
        p.department,
        p.leader,
        p.teamMembers || "",
        p.status,
        `${p.currentStep}/8`,
        p.startDate || "",
        p.dueDate || "",
        c?.step3?.projectTheme || "",
        c?.step4?.fiveWhys?.rootCause || "",
        c?.step5_6?.actionPlans?.[0]?.plan || "",
        decisionMap[c?.step7?.followUpDecision] || c?.step7?.followUpDecision || "",
        isOverdue ? "YA" : "",
        p.createdAt ? new Date(p.createdAt).toLocaleDateString("id-ID") : "",
        p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("id-ID") : "",
      ];
    });

    // ── Calculate all statuses & departments ──
    const allStatuses = Array.from(new Set(allProjects.map((p) => p.status))).filter(Boolean);
    const allDepts = Array.from(new Set(allProjects.map((p) => p.department))).filter(Boolean);

    // ── Dept x Status Matrix ──
    const deptStatusMatrix = allDepts.map((dept) => ({
      dept,
      counts: allStatuses.map((s) => allProjects.filter((p) => p.department === dept && p.status === s).length),
      total: allProjects.filter((p) => p.department === dept).length,
    }));
    const deptStatusColumnTotals = allStatuses.map((s) => allProjects.filter((p) => p.status === s).length);
    const deptStatusGrandTotal = allProjects.length;

    // ─ Month x Status Matrix ──
    const monthMap = new Map<string, string>();
    allProjects.forEach((p) => {
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
        monthMap.set(yyyymm, label);
      }
    });
    const sortedYyyyMms = Array.from(monthMap.keys()).sort();

    const monthStatusMatrix = sortedYyyyMms.map((yyyymm) => ({
      month: monthMap.get(yyyymm) || yyyymm,
      counts: allStatuses.map((s) =>
        allProjects.filter((p) => {
          if (!p.createdAt) return false;
          const d = new Date(p.createdAt);
          const pYyyyMm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          return pYyyyMm === yyyymm && p.status === s;
        }).length
      ),
      total: allProjects.filter((p) => {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        const pYyyyMm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return pYyyyMm === yyyymm;
      }).length,
    }));
    const monthStatusColumnTotals = allStatuses.map((s) => allProjects.filter((p) => p.status === s).length);
    const monthStatusGrandTotal = allProjects.length;

    // ─ Statistik Rows ──
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

    const statistikRows = [
      ["Total Proyek", allProjects.length],
      ["Proyek Selesai", completedCount],
      ["Proyek Overdue", overdueCount],
      ["Rata-rata Waktu Penyelesaian (hari)", avgDays || "N/A"],
      ["", ""],
      ["--- DISTRIBUSI STATUS ---", ""],
      ...Object.entries(statusCounts).map(([s, c]) => [`Status: ${s}`, c]),
      ["", ""],
      ["--- DISTRIBUSI DEPARTEMEN ---", ""],
      ...Object.entries(deptCounts).map(([d, c]) => [`Dept: ${d}`, c]),
      ["", ""],
      ["--- RATA-RATA PENYELESAIAN PER DEPARTEMEN (hari) ---", ""],
      ...Object.entries(deptCompletionDays).map(([dept, days]) => [`Dept: ${dept}`, Math.round(days.reduce((a, b) => a + b, 0) / days.length)]),
    ];

    // ── Pie Chart Data ──
    const statusDistribution = {
      labels: Object.keys(statusCounts),
      values: Object.values(statusCounts),
    };
    const deptDistribution = {
      labels: Object.keys(deptCounts),
      values: Object.values(deptCounts),
    };

    // ── Kesimpulan Analitik ──
    const kesimpulanLines = generateAdminInsight(allProjects);

    // ── Build payload for Python ──
    const payload = {
      filename: `Rekap-Kaizen-${new Date().toISOString().slice(0, 10)}.xlsx`,
      rekapHeaders,
      rekapRows,
      allStatuses,
      deptStatusMatrix,
      deptStatusColumnTotals,
      deptStatusGrandTotal,
      monthStatusMatrix,
      monthStatusColumnTotals,
      monthStatusGrandTotal,
      statistikRows,
      statusDistribution,
      deptDistribution,
      kesimpulanLines,
    };

    // ── Call Python serverless function ──
    const pythonRes = await fetch(new URL("/api/generate_excel_chart", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!pythonRes.ok) {
      throw new Error(`Python function returned ${pythonRes.status}`);
    }

    const arrayBuffer = await pythonRes.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${payload.filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Excel export error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
