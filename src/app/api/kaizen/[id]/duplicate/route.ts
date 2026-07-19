import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db
      .select()
      .from(kaizenProjects)
      .where(eq(kaizenProjects.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const source = existing[0];
    const newId = "kz-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
    const newTitle = `[Salinan] ${source.title}`;

    const newContent: any = {
      ...JSON.parse(JSON.stringify(source.content)),
    };
    if (newContent.header) {
      newContent.header.title = newTitle;
      newContent.header.status = "Draft";
    }

    const duplicatedProject = {
      id: newId,
      title: newTitle,
      department: source.department,
      leader: source.leader,
      teamMembers: source.teamMembers,
      startDate: new Date().toISOString().split("T")[0],
      dueDate: source.dueDate,
      status: "Draft",
      currentStep: 1,
      content: newContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(kaizenProjects).values(duplicatedProject);

    return NextResponse.json({ success: true, data: duplicatedProject }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/kaizen/[id]/duplicate error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
