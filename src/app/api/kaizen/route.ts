import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { EMPTY_KAIZEN_CONTENT, KaizenContent } from "@/types/kaizen";
import { desc, ilike, or, eq, and, inArray } from "drizzle-orm";
import crypto from "crypto";
import { logActivity } from "@/lib/activityLogger";
import { hashPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/requestHelpers";
import { readJsonBodyWithLimit, validateKaizenContent } from "@/lib/kaizenContentSchema";

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";
    const ids = searchParams.get("ids") || ""; // comma-separated list of project IDs
    const isPublic = searchParams.get("public") === "true"; // eksplisit opt-in ke direktori publik

    // SECURITY: sebelumnya, request tanpa "ids" (mis. dipanggil langsung tanpa
    // parameter apa pun) diam-diam mengembalikan SEMUA proyek — memungkinkan
    // enumerasi metadata proyek oleh siapa saja. Sekarang wajib pilih salah
    // satu secara eksplisit: filter "ids" (mode "mine") atau "public=true"
    // (mode direktori publik yang memang disengaja oleh UI).
    if (!ids && !isPublic) {
      return NextResponse.json(
        {
          success: false,
          error: "Wajib menyertakan parameter 'ids' atau 'public=true' untuk mengambil daftar proyek.",
        },
        { status: 400 }
      );
    }

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
          ilike(kaizenProjects.department, `%${search}%`),
          ilike(kaizenProjects.industry, `%${search}%`)
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
      industry: kaizenProjects.industry,
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
      projects = await db.select(selectFields).from(kaizenProjects)
        .orderBy(desc(kaizenProjects.updatedAt));
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

    const parsed = await readJsonBodyWithLimit(req);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: parsed.status });
    }
    const body = parsed.body;

    if (body.content !== undefined) {
      const contentError = validateKaizenContent(body.content);
      if (contentError) {
        return NextResponse.json({ success: false, error: contentError }, { status: 400 });
      }
    }

    const id = "kz-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");

    const title = body.title || "Proyek Kaizen Baru";
    const department = body.department || "Produksi";
    const industry = body.industry || "Manufaktur";
    const leader = body.leader || "PIC Utama";
    const teamMembers = body.teamMembers || "";
    const startDate = body.startDate || new Date().toISOString().split("T")[0];
    const dueDate = body.dueDate || "";
    const status = body.status || "Draft";
    const plainPassword = body.projectPassword || "";
    const visitorId = body.visitorId || null;

    if (!plainPassword) {
      return NextResponse.json(
        { success: false, error: "Password proyek wajib diisi untuk mengamankan dokumen." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(plainPassword);
    const shareToken = crypto.randomBytes(16).toString("hex");

    const content: KaizenContent = body.content || {
      ...EMPTY_KAIZEN_CONTENT,
      header: { title, department, leader, teamMembers, startDate, dueDate, status: status as any },
    };

    const newProject = {
      id, title, department, industry, leader, teamMembers, startDate, dueDate, status,
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
      detail: `Project "${title}" (${industry}) created by ${leader}`,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
      visitorId,
    });

    const { projectPassword: _pw, ...safeProject } = newProject;
    return NextResponse.json({ success: true, data: safeProject }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/kaizen error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
