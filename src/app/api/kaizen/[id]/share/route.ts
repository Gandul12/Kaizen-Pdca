import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/password";
import { getClientIp, checkRateLimit } from "@/lib/requestHelpers";
import { recordFailure, recordSuccess } from "@/lib/rateLimiter";

const RATE_NS = "unlock";

/**
 * POST /api/kaizen/[id]/share
 * Body: { projectPassword }
 * Returns the share token (owner needs password to get the link).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await checkRateLimit(req, RATE_NS);
  if (rateLimited) return rateLimited;
  const ip = getClientIp(req);

  try {
    await ensureSchema();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const inputPassword = body.projectPassword || "";

    const project = await db.select().from(kaizenProjects)
      .where(eq(kaizenProjects.id, id)).limit(1);

    if (!project.length) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const valid = await verifyPassword(inputPassword, project[0].projectPassword);
    if (!valid) {
      recordFailure(RATE_NS, ip);
      return NextResponse.json({ success: false, error: "Password proyek tidak cocok." }, { status: 403 });
    }
    recordSuccess(RATE_NS, ip);

    return NextResponse.json({
      success: true,
      shareToken: project[0].shareToken,
      shareUrl: `/share/${project[0].shareToken}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
