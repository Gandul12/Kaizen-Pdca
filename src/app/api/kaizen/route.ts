import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { EMPTY_KAIZEN_CONTENT, KaizenContent } from "@/types/kaizen";
import { desc, ilike, or, eq, and, inArray } from "drizzle-orm";
import crypto from "crypto";
import { logActivity } from "@/lib/activityLogger";
import { hashPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/requestHelpers";

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";
    const ids = searchParams.get("ids") || ""; // comma-separated list of project IDs

    const conditions = [];

    // If IDs are provided, only return those projects (ownership filter)
    if (ids) {
      const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
      if (idList.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      conditions.push(inArray(kaizenProjects.id, idList));
    }

    if (search) {
      conditions.push(
        or(
          ilike(kaizenProjects.title, `%${search}%`),
          ilike(kaizenProjects.leader, `%${search}%`),
          ilike(kaizenProjects.department, `%${search}%`)
        )
      );
    }

    if (department && department !== "all") {
      conditions.push(eq(kaizenProjects.department, department));
    }

    if (status && status !== "all") {
      conditions.push(eq(kaizenProjects.status, status));
    }

    // Never return content or password in list
    const selectFields = {
      id: kaizenProjects.id,
      title: kaizenProjects.title,
      department: kaizenProjects.department,
      leader: kaizenProjects.leader,
      teamMembers: kaizenProjects.teamMembers,
      startDate: kaizenProjects.startDate,
      dueDate: kaizenProjects.dueDate,
      status: kaizenProjects.status,
      currentStep: kaizenProjects.currentStep,
      createdAt: kaizenProjects.createdAt,
      updatedAt: kaizenProjects.updatedAt,
    };

    let projects;
    if (conditions.length > 0) {
      projects = await db.select(selectFields).from(kaizenProjects)
        .where(and(...conditions)).orderBy(desc(kaizenProjects.updatedAt));
    } else {
      // No IDs and no filters → return empty (force ownership-based access)
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    console.error("GET /api/kaizen error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Rate limit project creation: 10 per 15 min per IP
  const rateLimited = await checkRateLimit(req, "create_project", 10, 15 * 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const id = "kz-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");

    const title = body.title || "Proyek Kaizen Baru";
    const department = body.department || "Produksi";
    const leader = body.leader || "PIC Utama";
    const teamMembers = body.teamMembers || "";
    const startDate = body.startDate || new Date().toISOString().split("T")[0];
    const dueDate = body.dueDate || "";
    const status = body.status || "Draft";
    const plainPassword = body.projectPassword || "";

    if (!plainPassword) {
      return NextResponse.json(
        { success: false, error: "Password proyek wajib diisi untuk mengamankan dokumen." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(plainPassword);

    // Generate a share token for view-only access
    const shareToken = crypto.randomBytes(16).toString("hex");

    const content: KaizenContent = body.content || {
      ...EMPTY_KAIZEN_CONTENT,
      header: { title, department, leader, teamMembers, startDate, dueDate, status: status as any },
    };

    const newProject = {
      id, title, department, leader, teamMembers, startDate, dueDate, status,
      currentStep: 1, content, projectPassword: hashedPassword,
      isTemplate: body.isTemplate === 1 ? 1 : 0,
      templateName: body.templateName || null,
      shareToken,
      createdAt: new Date(), updatedAt: new Date(),
    };

    await db.insert(kaizenProjects).values(newProject);

    await logActivity({
      action: "project_created",
      projectId: id,
      detail: `Project "${title}" created by ${leader}`,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    const { projectPassword: _pw, ...safeProject } = newProject;
    return NextResponse.json({ success: true, data: safeProject }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/kaizen error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
