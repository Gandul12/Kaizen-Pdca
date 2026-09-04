import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects, activityLogs } from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";
import { logActivity } from "@/lib/activityLogger";
import { timingSafeCompare } from "@/lib/password";
import { getClientIp, checkRateLimit } from "@/lib/requestHelpers";
import { recordFailure, recordSuccess } from "@/lib/rateLimiter";
import { maskIp, formatVisitorId } from "@/lib/visitor";

const RATE_NS = "admin";

function getAdminPassword(): string {
  const envPw = process.env.ADMIN_PASSWORD;
  if (envPw) return envPw;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASSWORD environment variable is required in production.");
  }
  return "admin123";
}

export async function POST(req: NextRequest) {
  // ── Rate-limit check ──
  const rateLimited = await checkRateLimit(req, RATE_NS);
  if (rateLimited) return rateLimited;

  const ip = getClientIp(req);

  try {
    const body = await req.json().catch(() => ({}));
    const password = body.password || "";
    const timeRange = body.range || "30d"; // "7d" | "30d" | "all"

    let adminPw: string;
    try {
      adminPw = getAdminPassword();
    } catch {
      return NextResponse.json(
        { success: false, error: "Admin dashboard tidak tersedia. ADMIN_PASSWORD belum dikonfigurasi di server." },
        { status: 503 }
      );
    }

    if (!timingSafeCompare(password, adminPw)) {
      recordFailure(RATE_NS, ip);
      return NextResponse.json(
        { success: false, error: "Password admin salah." },
        { status: 403 }
      );
    }

    recordSuccess(RATE_NS, ip);
    await ensureSchema();

    await logActivity({
      action: "admin_login",
      detail: "Admin dashboard accessed",
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || "",
    });

    const allProjects = await db.select().from(kaizenProjects).orderBy(desc(kaizenProjects.updatedAt));
    const totalProjects = allProjects.length;

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    allProjects.forEach((p) => { statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1; });

    // Industry breakdown (New & meaningful)
    const industryBreakdown: Record<string, number> = {
      Manufaktur: 0,
      "F&B": 0,
      Retail: 0,
      Jasa: 0,
      Lainnya: 0,
    };
    allProjects.forEach((p) => {
      const ind = p.industry || "Manufaktur";
      industryBreakdown[ind] = (industryBreakdown[ind] || 0) + 1;
    });

    // Department breakdown
    const deptBreakdown: Record<string, number> = {};
    allProjects.forEach((p) => { deptBreakdown[p.department] = (deptBreakdown[p.department] || 0) + 1; });

    // Overdue & Approaching
    const now = new Date();
    const overdueProjects = allProjects.filter((p) => p.dueDate && p.status !== "Completed" && new Date(p.dueDate) < now);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const approachingDeadline = allProjects.filter((p) => {
      if (!p.dueDate || p.status === "Completed") return false;
      const due = new Date(p.dueDate);
      return due >= now && due <= sevenDaysFromNow;
    });

    // Fetch all logs for comprehensive analytics
    const allLogs = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt));
    const totalLogs = allLogs.length;

    // Action summary across all logs
    const actionSummary: Record<string, number> = {};
    allLogs.forEach((l) => { actionSummary[l.action] = (actionSummary[l.action] || 0) + 1; });

    // ── TRAFFIC ANALYTICS (Using Visitor ID / UUID) ──
    const pageVisits = allLogs.filter((l) => l.action === "page_visit");

    // Range filtering
    let rangeDays = 30;
    if (timeRange === "7d") rangeDays = 7;
    else if (timeRange === "all") rangeDays = 3650;

    const rangeCutoff = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const filteredVisits = pageVisits.filter((l) => new Date(l.createdAt) >= rangeCutoff);

    const totalVisits = filteredVisits.length;
    // Visitor identifier: visitorId preferred, fallback to ipAddress
    const getVisitorKey = (l: typeof activityLogs.$inferSelect) => l.visitorId || l.ipAddress || "anon";

    const uniqueVisitorsAllTime = new Set(pageVisits.map(getVisitorKey)).size;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const visitsToday = pageVisits.filter((l) => new Date(l.createdAt) >= startOfToday);
    const visitsThisWeek = pageVisits.filter((l) => new Date(l.createdAt) >= startOfWeek);
    const uniqueVisitorsToday = new Set(visitsToday.map(getVisitorKey)).size;
    const uniqueVisitorsThisWeek = new Set(visitsThisWeek.map(getVisitorKey)).size;

    // ── RETURNING VS NEW VISITORS ──
    // First visit timestamp for every visitor ever seen
    const firstVisitMap = new Map<string, Date>();
    allLogs.forEach((l) => {
      const vKey = getVisitorKey(l);
      const createdAt = new Date(l.createdAt);
      if (!firstVisitMap.has(vKey) || createdAt < firstVisitMap.get(vKey)!) {
        firstVisitMap.set(vKey, createdAt);
      }
    });

    const activeVisitorsInRange = new Set(filteredVisits.map(getVisitorKey));
    let newVisitorsCount = 0;
    let returningVisitorsCount = 0;

    activeVisitorsInRange.forEach((vKey) => {
      const firstSeen = firstVisitMap.get(vKey);
      if (firstSeen && firstSeen >= rangeCutoff) {
        newVisitorsCount++;
      } else {
        returningVisitorsCount++;
      }
    });

    const totalActiveVisitors = newVisitorsCount + returningVisitorsCount;
    const newPct = totalActiveVisitors > 0 ? Math.round((newVisitorsCount / totalActiveVisitors) * 100) : 100;
    const returningPct = totalActiveVisitors > 0 ? 100 - newPct : 0;

    // ── RETENTION RATES (D1, D7, D30) WITH INDUSTRY-STANDARD WINDOWS ──
    // Uses tolerance windows around target days to reflect real user return patterns:
    // D1:  returned on day H+1 (exact 1 day after first visit)
    // D7:  returned within window H+5 to H+9 (center 7, tolerance ±2 days)
    // D30: returned within window H+23 to H+37 (center 30, tolerance ±7 days)
    let d1Eligible = 0, d1Returned = 0;
    let d7Eligible = 0, d7Returned = 0;
    let d30Eligible = 0, d30Returned = 0;

    const dayMs = 24 * 60 * 60 * 1000;

    firstVisitMap.forEach((firstVisitDate, vKey) => {
      const visitorLogs = allLogs.filter((l) => getVisitorKey(l) === vKey);
      const firstMs = firstVisitDate.getTime();

      const dayOffsets = visitorLogs.map((l) =>
        Math.floor((new Date(l.createdAt).getTime() - firstMs) / dayMs)
      );

      // D1 check (H+1)
      if (now.getTime() >= firstMs + 1 * dayMs) {
        d1Eligible++;
        if (dayOffsets.some((d) => d === 1)) {
          d1Returned++;
        }
      }

      // D7 check (H+5 to H+9)
      if (now.getTime() >= firstMs + 7 * dayMs) {
        d7Eligible++;
        if (dayOffsets.some((d) => d >= 5 && d <= 9)) {
          d7Returned++;
        }
      }

      // D30 check (H+23 to H+37)
      if (now.getTime() >= firstMs + 30 * dayMs) {
        d30Eligible++;
        if (dayOffsets.some((d) => d >= 23 && d <= 37)) {
          d30Returned++;
        }
      }
    });

    const retention = {
      d1: d1Eligible > 0 ? Math.round((d1Returned / d1Eligible) * 100) : 0,
      d7: d7Eligible > 0 ? Math.round((d7Returned / d7Eligible) * 100) : 0,
      d30: d30Eligible > 0 ? Math.round((d30Returned / d30Eligible) * 100) : 0,
    };

    // ── DAILY TREND (Grouped by Date) ──
    const displayDays = rangeDays > 30 ? 30 : rangeDays;
    const dailyTrend: Array<{ date: string; visits: number; uniqueVisitors: number }> = [];

    for (let i = displayDays - 1; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = day.toISOString().split("T")[0];
      const dayLogs = pageVisits.filter(
        (l) => new Date(l.createdAt).toISOString().split("T")[0] === dayStr
      );
      dailyTrend.push({
        date: dayStr.substring(5), // "MM-DD"
        visits: dayLogs.length,
        uniqueVisitors: new Set(dayLogs.map(getVisitorKey)).size,
      });
    }

    // ── CONVERSION FUNNEL (Pure Real Data from Activity Logs — No Fake Fallbacks) ──
    const stage1Visits = new Set(allLogs.filter((l) => l.action === "page_visit").map(getVisitorKey)).size;
    const stage2OpenProject = new Set(allLogs.filter((l) => l.action === "project_unlocked" || l.action === "project_viewed").map(getVisitorKey)).size;
    const stage3EditProject = new Set(allLogs.filter((l) => l.action === "project_edited").map(getVisitorKey)).size;
    const stage4CreateProject = new Set(allLogs.filter((l) => l.action === "project_created").map(getVisitorKey)).size;
    const stage5Exports = new Set(allLogs.filter((l) => l.action === "project_exported_pdf" || l.action === "project_exported_docx" || l.action === "project_exported_pptx").map(getVisitorKey)).size;

    const funnelStages = [
      { stage: "Visit Homepage", name: "1. Kunjungan Utama", count: stage1Visits, pct: stage1Visits > 0 ? 100 : 0, dropOffPct: 0 },
      { stage: "Buka Proyek", name: "2. Buka Dokumen", count: stage2OpenProject, pct: stage1Visits > 0 ? Math.round((stage2OpenProject / stage1Visits) * 100) : 0, dropOffPct: stage1Visits > 0 ? Math.max(0, 100 - Math.round((stage2OpenProject / stage1Visits) * 100)) : 0 },
      { stage: "Mulai Isi Dokumen", name: "3. Edit & Isi Form", count: stage3EditProject, pct: stage1Visits > 0 ? Math.round((stage3EditProject / stage1Visits) * 100) : 0, dropOffPct: stage2OpenProject > 0 ? Math.max(0, Math.round(((stage2OpenProject - stage3EditProject) / stage2OpenProject) * 100)) : 0 },
      { stage: "Buat Proyek Baru", name: "4. Buat Proyek Baru", count: stage4CreateProject, pct: stage1Visits > 0 ? Math.round((stage4CreateProject / stage1Visits) * 100) : 0, dropOffPct: stage3EditProject > 0 ? Math.max(0, Math.round(((stage3EditProject - stage4CreateProject) / stage3EditProject) * 100)) : 0 },
      { stage: "Export PDF/Word", name: "5. Export Laporan", count: stage5Exports, pct: stage1Visits > 0 ? Math.round((stage5Exports / stage1Visits) * 100) : 0, dropOffPct: stage4CreateProject > 0 ? Math.max(0, Math.round(((stage4CreateProject - stage5Exports) / stage4CreateProject) * 100)) : 0 },
    ];

    // ── TOP 5 POPULAR FEATURES / ACTIONS ──
    const actionNameMap: Record<string, string> = {
      project_created: "Buat Proyek Baru",
      project_edited: "Edit & Autosave Dokumen",
      project_unlocked: "Buka Dokumen Terkunci",
      project_exported_pdf: "Export PDF",
      project_exported_docx: "Export Word (.docx)",
      project_exported_pptx: "Export PowerPoint (.pptx)",
      project_duplicated: "Duplikasi Proyek",
      page_visit: "Kunjungan Halaman Utama",
      rate_limit_blocked: "Percobaan Password Gagal",
    };

    const actionCounts = Object.entries(actionSummary)
      .map(([act, cnt]) => ({ action: act, name: actionNameMap[act] || act, count: cnt }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topFeatures = actionCounts.map((f) => ({
      ...f,
      pct: totalLogs > 0 ? Math.round((f.count / totalLogs) * 100) : 0,
    }));

    // ── RECENT LOGS WITH MASKED IP & VISITOR ID (UU PDP COMPLIANCE) ──
    const recentLogs = allLogs.slice(0, 100).map((l) => ({
      id: l.id,
      action: l.action,
      detail: l.detail,
      projectId: l.projectId,
      visitorId: formatVisitorId(l.visitorId),
      maskedIp: maskIp(l.ipAddress),
      createdAt: l.createdAt,
    }));

    const projectsList = allProjects.map((p) => ({
      id: p.id, title: p.title, department: p.department, industry: p.industry || "Manufaktur", leader: p.leader,
      status: p.status, currentStep: p.currentStep, startDate: p.startDate,
      dueDate: p.dueDate, createdAt: p.createdAt, updatedAt: p.updatedAt,
      hasPassword: !!p.projectPassword,
      isOverdue: !!(p.dueDate && p.status !== "Completed" && new Date(p.dueDate) < now),
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalProjects, statusBreakdown, deptBreakdown, industryBreakdown, totalLogs, actionSummary,
        overdueCount: overdueProjects.length,
        approachingDeadlineCount: approachingDeadline.length,
        overdueProjects: overdueProjects.map((p) => ({ id: p.id, title: p.title, dueDate: p.dueDate, leader: p.leader, department: p.department })),
        approachingDeadline: approachingDeadline.map((p) => ({ id: p.id, title: p.title, dueDate: p.dueDate, leader: p.leader, department: p.department })),
        totalVisits,
        uniqueIpsAllTime: uniqueVisitorsAllTime,
        uniqueVisitorsToday,
        uniqueVisitorsThisWeek,
        newVisitorsCount,
        returningVisitorsCount,
        newPct,
        returningPct,
        retention,
        dailyTrend,
        funnelStages,
        topFeatures,
        recentLogs,
        projectsList,
      },
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
