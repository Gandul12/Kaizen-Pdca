import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET templates — public (no password needed to list templates)
export async function GET() {
  try {
    await ensureSchema();
    const templates = await db
      .select({
        id: kaizenProjects.id,
        title: kaizenProjects.title,
        department: kaizenProjects.department,
        templateName: kaizenProjects.templateName,
        createdAt: kaizenProjects.createdAt,
      })
      .from(kaizenProjects)
      .where(eq(kaizenProjects.isTemplate, 1))
      .orderBy(desc(kaizenProjects.createdAt));

    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
