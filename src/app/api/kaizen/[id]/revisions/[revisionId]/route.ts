import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenRevisions, kaizenProjects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword } from "@/lib/password";
import { getClientIp, checkRateLimit } from "@/lib/requestHelpers";
import { recordFailure, recordSuccess } from "@/lib/rateLimiter";

const RATE_NS = "unlock"; // same bucket as unlock/comments/reviews/duplicate

/**
 * POST /api/kaizen/[id]/revisions/[revisionId]
 * Body: { projectPassword: string }
 *
 * Returns the full revision snapshot (including snapshotContent) only
 * after verifying the project password. Rate-limited in the same
 * bucket as all other project-password endpoints.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  // Rate-limit check
  const rateLimited = await checkRateLimit(req, RATE_NS);
  if (rateLimited) return rateLimited;

  const ip = getClientIp(req);

  try {
    await ensureSchema();
    const { id, revisionId } = await params;
    const body = await req.json().catch(() => ({}));
    const inputPassword = body.projectPassword || "";

    // Verify project password
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

    const valid = await verifyPassword(inputPassword, project[0].projectPassword);
    if (!valid) {
      recordFailure(RATE_NS, ip);
      return NextResponse.json(
        { success: false, error: "Password proyek tidak cocok." },
        { status: 403 }
      );
    }

    recordSuccess(RATE_NS, ip);

    // Fetch the specific revision
    const revision = await db
      .select()
      .from(kaizenRevisions)
      .where(
        and(
          eq(kaizenRevisions.projectId, id),
          eq(kaizenRevisions.id, revisionId)
        )
      )
      .limit(1);

    if (!revision.length) {
      return NextResponse.json(
        { success: false, error: "Revisi tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: revision[0] });
  } catch (error: any) {
    console.error("POST revision detail error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
