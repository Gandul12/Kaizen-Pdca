import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { EMPTY_KAIZEN_CONTENT, KaizenContent } from "@/types/kaizen";
import { desc, ilike, or, eq, and } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";

    const conditions = [];

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

    let projects;
    if (conditions.length > 0) {
      projects = await db
        .select()
        .from(kaizenProjects)
        .where(and(...conditions))
        .orderBy(desc(kaizenProjects.updatedAt));
    } else {
      projects = await db.select().from(kaizenProjects).orderBy(desc(kaizenProjects.updatedAt));
    }

    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    console.error("GET /api/kaizen error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = "kz-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");

    const title = body.title || "Proyek Kaizen Baru";
    const department = body.department || "Produksi";
    const leader = body.leader || "PIC Utama";
    const teamMembers = body.teamMembers || "";
    const startDate = body.startDate || new Date().toISOString().split("T")[0];
    const dueDate = body.dueDate || "";
    const status = body.status || "Draft";

    const content: KaizenContent = body.content || {
      ...EMPTY_KAIZEN_CONTENT,
      header: {
        title,
        department,
        leader,
        teamMembers,
        startDate,
        dueDate,
        status: status as any,
      },
    };

    const newProject = {
      id,
      title,
      department,
      leader,
      teamMembers,
      startDate,
      dueDate,
      status,
      currentStep: 1,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(kaizenProjects).values(newProject);

    return NextResponse.json({ success: true, data: newProject }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/kaizen error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
