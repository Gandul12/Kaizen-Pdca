import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import crypto from "crypto";

export type ActionType =
  | "project_created"
  | "project_viewed"
  | "project_edited"
  | "project_deleted"
  | "project_duplicated"
  | "project_exported_pdf"
  | "project_exported_docx"
  | "project_unlocked"
  | "admin_login"
  | "page_visit"
  | "rate_limit_blocked";

export async function logActivity(opts: {
  action: ActionType;
  projectId?: string | null;
  detail?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const id = "log-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
    await db.insert(activityLogs).values({
      id,
      projectId: opts.projectId || null,
      action: opts.action,
      detail: opts.detail || null,
      ipAddress: opts.ipAddress || null,
      userAgent: opts.userAgent || null,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Activity logging error:", err);
  }
}
