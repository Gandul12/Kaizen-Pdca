import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activityLogger";
import { verifyPassword } from "@/lib/password";
import { getClientIp, checkRateLimit } from "@/lib/requestHelpers";
import { recordFailure, recordSuccess } from "@/lib/rateLimiter";

const RATE_NS = "unlock";

/**
 * POST /api/kaizen/[id]/unlock
 * Body: { projectPassword: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Rate-limit check ──
  const rateLimited = await checkRateLimit(req, RATE_NS);
  if (rateLimited) return rateLimited;

  const ip = getClientIp(req);

  try {
    await ensureSchema();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const inputPassword = body.projectPassword || "";

    const project = await db
      .select()
      .from(kaizenProjects)
      .where(eq(kaizenProjects.id, id))
      .limit(1);

    if (!project.length) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const storedHash = project[0].projectPassword;
    const valid = await verifyPassword(inputPassword, storedHash);

    if (!valid) {
      recordFailure(RATE_NS, ip);
      return NextResponse.json(
        { success: false, locked: true, error: "Password salah." },
        { status: 403 }
      );
    }

    // Success → reset counter
    recordSuccess(RATE_NS, ip);

    await logActivity({
      action: "project_unlocked",
      projectId: id,
      detail: `Project "${project[0].title}" unlocked`,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || "",
    });

    const { projectPassword: _pw, ...safeProject } = project[0];
    return NextResponse.json({ success: true, locked: false, data: safeProject });
  } catch (error: any) {
    console.error("POST /api/kaizen/[id]/unlock error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
