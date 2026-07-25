import { db } from "@/db";
import { kaizenRevisions, kaizenProjects } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import crypto from "crypto";

export type RevisionTrigger = "status_changed";

/**
 * Create a snapshot of the project content whenever the status changes.
 */
export async function createRevision(opts: {
  projectId: string;
  trigger: RevisionTrigger;
  createdBy?: string;
}) {
  try {
    const project = await db
      .select()
      .from(kaizenProjects)
      .where(eq(kaizenProjects.id, opts.projectId))
      .limit(1);

    if (!project.length) return;

    const existing = await db
      .select({ total: count() })
      .from(kaizenRevisions)
      .where(eq(kaizenRevisions.projectId, opts.projectId));

    const revisionNumber = (existing[0]?.total || 0) + 1;

    const id = "rev-snap-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");

    await db.insert(kaizenRevisions).values({
      id,
      projectId: opts.projectId,
      revisionNumber,
      trigger: opts.trigger,
      snapshotContent: project[0].content,
      snapshotStatus: project[0].status,
      snapshotStep: project[0].currentStep,
      createdBy: opts.createdBy || null,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Revision snapshot error:", err);
  }
}
