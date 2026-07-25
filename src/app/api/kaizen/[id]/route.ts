import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activityLogger";
import { verifyPassword } from "@/lib/password";
import { createRevision } from "@/lib/revisionHelper";

// GET — returns locked status without content (no password in URL)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const project = await db
      .select()
      .from(kaizenProjects)
      .where(eq(kaizenProjects.id, id))
      .limit(1);

    if (!project.length) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Always return locked/limited info from GET — use POST /unlock for full data
    return NextResponse.json({
      success: true,
      locked: true,
      data: {
        id: project[0].id,
        title: project[0].title,
        department: project[0].department,
        leader: project[0].leader,
        status: project[0].status,
        currentStep: project[0].currentStep,
        createdAt: project[0].createdAt,
        updatedAt: project[0].updatedAt,
      },
    });
  } catch (error: any) {
    console.error("GET /api/kaizen/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT — update project (password in body, verified with bcrypt)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
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

    // Verify password via bcrypt
    const storedHash = existing[0].projectPassword;
    const inputPassword = body.projectPassword || "";

    if (storedHash) {
      const valid = await verifyPassword(inputPassword, storedHash);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Password proyek tidak cocok. Akses ditolak." },
          { status: 403 }
        );
      }
    }

    const {
      title, department, leader, teamMembers, startDate, dueDate,
      status, currentStep, content,
    } = body;

    const updateData: any = { updatedAt: new Date() };

    if (title !== undefined) updateData.title = title;
    if (department !== undefined) updateData.department = department;
    if (leader !== undefined) updateData.leader = leader;
    if (teamMembers !== undefined) updateData.teamMembers = teamMembers;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (status !== undefined) updateData.status = status;
    if (currentStep !== undefined) updateData.currentStep = currentStep;
    if (content !== undefined) updateData.content = content;

    // Create revision snapshot on every status change
    if (status && status !== existing[0].status) {
      await createRevision({
        projectId: id,
        trigger: "status_changed",
        createdBy: leader || existing[0].leader,
      });
    }

    await db.update(kaizenProjects).set(updateData).where(eq(kaizenProjects.id, id));

    await logActivity({
      action: "project_edited",
      projectId: id,
      detail: `Project "${title || existing[0].title}" updated`,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    const updated = await db
      .select()
      .from(kaizenProjects)
      .where(eq(kaizenProjects.id, id))
      .limit(1);

    const { projectPassword: _pw, ...safeProject } = updated[0];
    return NextResponse.json({ success: true, data: safeProject });
  } catch (error: any) {
    console.error("PUT /api/kaizen/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE — password in body (POST-style delete via query avoided)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;

    const existing = await db
      .select()
      .from(kaizenProjects)
      .where(eq(kaizenProjects.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Password sent in body (DELETE can have body)
    let inputPassword = "";
    try {
      const body = await req.json();
      inputPassword = body.projectPassword || "";
    } catch {
      // no body
    }

    const storedHash = existing[0].projectPassword;
    if (storedHash) {
      const valid = await verifyPassword(inputPassword, storedHash);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Password proyek tidak cocok. Akses ditolak." },
          { status: 403 }
        );
      }
    }

    await db.delete(kaizenProjects).where(eq(kaizenProjects.id, id));

    await logActivity({
      action: "project_deleted",
      projectId: id,
      detail: `Project "${existing[0].title}" deleted`,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/kaizen/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
