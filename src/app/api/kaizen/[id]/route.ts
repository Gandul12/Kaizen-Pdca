import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db
      .select()
      .from(kaizenProjects)
      .where(eq(kaizenProjects.id, id))
      .limit(1);

    if (!project.length) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: project[0] });
  } catch (error: any) {
    console.error("GET /api/kaizen/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db
      .select()
      .from(kaizenProjects)
      .where(eq(kaizenProjects.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const { title, department, leader, teamMembers, startDate, dueDate, status, currentStep, content } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (department !== undefined) updateData.department = department;
    if (leader !== undefined) updateData.leader = leader;
    if (teamMembers !== undefined) updateData.teamMembers = teamMembers;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (status !== undefined) updateData.status = status;
    if (currentStep !== undefined) updateData.currentStep = currentStep;
    if (content !== undefined) updateData.content = content;

    await db.update(kaizenProjects).set(updateData).where(eq(kaizenProjects.id, id));

    const updated = await db
      .select()
      .from(kaizenProjects)
      .where(eq(kaizenProjects.id, id))
      .limit(1);

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error: any) {
    console.error("PUT /api/kaizen/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(kaizenProjects).where(eq(kaizenProjects.id, id));
    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/kaizen/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
