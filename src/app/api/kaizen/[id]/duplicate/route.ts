import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { logActivity } from "@/lib/activityLogger";
import { verifyPassword, hashPassword } from "@/lib/password";
import { getClientIp, checkRateLimit } from "@/lib/requestHelpers";
import { recordFailure, recordSuccess } from "@/lib/rateLimiter";

const RATE_NS = "unlock"; // shares bucket with project password operations

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate-limit check
  const rateLimited = await checkRateLimit(req, RATE_NS);
  if (rateLimited) return rateLimited;

  const ip = getClientIp(req);

  try {
    await ensureSchema();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const existing = await db
      .select()
      .from(kaizenProjects)
      .where(eq(kaizenProjects.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const source = existing[0];
    const inputPassword = body.projectPassword || "";

    // Templates can be cloned without the template's own password.
    // Non-templates require the source project password.
    if (source.isTemplate === 1) {
      // Template — no password check needed for cloning.
      // But a newPassword for the clone is REQUIRED so the new project is secured.
      if (!body.newPassword && !inputPassword) {
        return NextResponse.json(
          { success: false, error: "Password untuk proyek baru wajib diisi." },
          { status: 400 }
        );
      }
    } else {
      // Normal project — verify source password
      const storedHash = source.projectPassword;
      if (storedHash) {
        const valid = await verifyPassword(inputPassword, storedHash);
        if (!valid) {
          recordFailure(RATE_NS, ip);
          return NextResponse.json(
            { success: false, error: "Password proyek tidak cocok. Akses ditolak." },
            { status: 403 }
          );
        }
        recordSuccess(RATE_NS, ip);
      }
    }

    const newId = "kz-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
    const newTitle = source.isTemplate === 1
      ? `${source.templateName || source.title}`
      : `[Salinan] ${source.title}`;

    // Hash password for the new clone
    const newPlainPw = body.newPassword || inputPassword;
    const newHashedPw = await hashPassword(newPlainPw);

    const newContent: any = JSON.parse(JSON.stringify(source.content));
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
      projectPassword: newHashedPw,
      isTemplate: 0, // clone is never a template
      templateName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(kaizenProjects).values(duplicatedProject);

    await logActivity({
      action: "project_duplicated",
      projectId: newId,
      detail: `${source.isTemplate === 1 ? "Created from template" : "Duplicated from"} "${source.title}"`,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || "",
    });

    const { projectPassword: _pw, ...safeProject } = duplicatedProject;
    return NextResponse.json({ success: true, data: safeProject }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/kaizen/[id]/duplicate error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
