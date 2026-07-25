import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenProjects } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/share/[token]
 * Public view-only access — no password needed, returns full content
 * but NOT the password hash.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await ensureSchema();
    const { token } = await params;

    if (!token || token.length < 10) {
      return NextResponse.json({ success: false, error: "Token tidak valid." }, { status: 400 });
    }

    const project = await db.select().from(kaizenProjects)
      .where(eq(kaizenProjects.shareToken, token)).limit(1);

    if (!project.length) {
      return NextResponse.json({ success: false, error: "Proyek tidak ditemukan atau link sudah tidak berlaku." }, { status: 404 });
    }

    const { projectPassword: _pw, shareToken: _st, ...safeProject } = project[0];
    return NextResponse.json({ success: true, data: safeProject, viewOnly: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
