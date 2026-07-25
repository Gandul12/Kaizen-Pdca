import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects, activityLogs } from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";
import { logActivity } from "@/lib/activityLogger";
import { timingSafeCompare } from "@/lib/password";
import { getClientIp, checkRateLimit } from "@/lib/requestHelpers";
import { recordFailure, recordSuccess } from "@/lib/rateLimiter";

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

    let adminPw: string;
    try {
      adminPw = getAdminPassword();
    } catch {
      return NextResponse.json(
        { success: false, error: "Admin dashboard tidak tersedia. ADMIN_PASSWORD belum dikonfigurasi di server." },
        { status: 503 }
      );
    }

    // Timing-safe comparison
    if (!timingSafeCompare(password, adminPw)) {
      recordFailure(RATE_NS, ip);
      return NextResponse.json(
        { success: false, error: "Password admin salah." },
        { status: 403 }
      );
    }

    // Success → reset counter
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

    const statusBreakdown: Record<string, number> = {};
    allProjects.forEach((p) => { statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1; });

    const deptBreakdown: Record<string, number> = {};
    allProjects.forEach((p) => { deptBreakdown[p.department] = (deptBreakdown[p.department] || 0) + 1; });

    const now = new Date();
    const overdueProjects = allProjects.filter((p) => p.dueDate && p.status !== "Completed" && new Date(p.dueDate) < now);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const approachingDeadline = allProjects.filter((p) => {
      if (!p.dueDate || p.status === "Completed") return false;
      const due = new Date(p.dueDate);
      return due >= now && due <= sevenDaysFromNow;
    });

    const recentLogs = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(100);

    const actionSummary: Record<string, number> = {};
    recentLogs.forEach((l) => { actionSummary[l.action] = (actionSummary[l.action] || 0) + 1; });

    const totalLogsResult = await db.select({ total: count() }).from(activityLogs);
    const totalLogs = totalLogsResult[0]?.total || 0;

    // Deeper analytics: avg completion time per department
    const deptCompletionDays: Record<string, number[]> = {};
    allProjects.forEach((p) => {
      if (p.status === "Completed" && p.startDate && p.updatedAt) {
        const days = Math.ceil((new Date(p.updatedAt).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          if (!deptCompletionDays[p.department]) deptCompletionDays[p.department] = [];
          deptCompletionDays[p.department].push(days);
        }
      }
    });
    const avgCompletionByDept: Record<string, number> = {};
    Object.entries(deptCompletionDays).forEach(([dept, days]) => {
      avgCompletionByDept[dept] = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    });

    // Leaderboard: most active departments (by total projects)
    const deptLeaderboard = Object.entries(deptBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([dept, count], idx) => ({ rank: idx + 1, department: dept, totalProjects: count }));

    // ── Traffic analytics ──
    const pageVisits = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.action, "page_visit"));

    const totalVisits = pageVisits.length;
    const uniqueIpsAllTime = new Set(pageVisits.map((l) => l.ipAddress).filter(Boolean)).size;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const visitsToday = pageVisits.filter((l) => new Date(l.createdAt) >= startOfToday);
    const visitsThisWeek = pageVisits.filter((l) => new Date(l.createdAt) >= startOfWeek);
    const uniqueVisitorsToday = new Set(visitsToday.map((l) => l.ipAddress).filter(Boolean)).size;
    const uniqueVisitorsThisWeek = new Set(visitsThisWeek.map((l) => l.ipAddress).filter(Boolean)).size;

    // Tren harian, 30 hari terakhir
    const dailyTrend: Array<{ date: string; visits: number; uniqueVisitors: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = day.toISOString().split("T")[0];
      const dayLogs = pageVisits.filter(
        (l) => new Date(l.createdAt).toISOString().split("T")[0] === dayStr
      );
      dailyTrend.push({
        date: dayStr,
        visits: dayLogs.length,
        uniqueVisitors: new Set(dayLogs.map((l) => l.ipAddress).filter(Boolean)).size,
      });
    }

    const projectsList = allProjects.map((p) => ({
      id: p.id, title: p.title, department: p.department, leader: p.leader,
      status: p.status, currentStep: p.currentStep, startDate: p.startDate,
      dueDate: p.dueDate, createdAt: p.createdAt, updatedAt: p.updatedAt,
      hasPassword: !!p.projectPassword,
      isOverdue: !!(p.dueDate && p.status !== "Completed" && new Date(p.dueDate) < now),
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalProjects, statusBreakdown, deptBreakdown, totalLogs, actionSummary,
        overdueCount: overdueProjects.length,
        approachingDeadlineCount: approachingDeadline.length,
        overdueProjects: overdueProjects.map((p) => ({ id: p.id, title: p.title, dueDate: p.dueDate, leader: p.leader, department: p.department })),
        approachingDeadline: approachingDeadline.map((p) => ({ id: p.id, title: p.title, dueDate: p.dueDate, leader: p.leader, department: p.department })),
        avgCompletionByDept,
        deptLeaderboard,
        totalVisits,
        uniqueIpsAllTime,
        uniqueVisitorsToday,
        uniqueVisitorsThisWeek,
        dailyTrend,
        recentLogs: recentLogs.map((l) => ({ id: l.id, action: l.action, detail: l.detail, projectId: l.projectId, ipAddress: l.ipAddress, createdAt: l.createdAt })),
        projectsList,
      },
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
