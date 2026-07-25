import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { kaizenRevisions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const revisions = await db
      .select({
        id: kaizenRevisions.id,
        revisionNumber: kaizenRevisions.revisionNumber,
        trigger: kaizenRevisions.trigger,
        snapshotStatus: kaizenRevisions.snapshotStatus,
        snapshotStep: kaizenRevisions.snapshotStep,
        createdBy: kaizenRevisions.createdBy,
        createdAt: kaizenRevisions.createdAt,
        // Note: snapshotContent is omitted to keep the list response small.
        // Client can fetch individual revision by ID if needed.
      })
      .from(kaizenRevisions)
      .where(eq(kaizenRevisions.projectId, id))
      .orderBy(desc(kaizenRevisions.createdAt));

    return NextResponse.json({ success: true, data: revisions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
