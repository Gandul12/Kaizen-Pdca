import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const kaizenProjects = pgTable("kaizen_projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  leader: text("leader").notNull(),
  teamMembers: text("team_members"),
  startDate: varchar("start_date", { length: 20 }),
  dueDate: varchar("due_date", { length: 20 }),
  status: varchar("status", { length: 30 }).default("Draft").notNull(),
  currentStep: integer("current_step").default(1).notNull(),
  content: jsonb("content").notNull(),
  projectPassword: text("project_password").notNull().default(""),
  isTemplate: integer("is_template").default(0).notNull(),
  templateName: text("template_name"),
  shareToken: text("share_token"), // unique token for view-only public link
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: text("id").primaryKey(),
  projectId: text("project_id"),
  action: varchar("action", { length: 50 }).notNull(),
  detail: text("detail"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kaizenRevisions = pgTable("kaizen_revisions", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  revisionNumber: integer("revision_number").notNull(),
  trigger: varchar("trigger", { length: 50 }).notNull(),
  snapshotContent: jsonb("snapshot_content").notNull(),
  snapshotStatus: varchar("snapshot_status", { length: 30 }).notNull(),
  snapshotStep: integer("snapshot_step").notNull(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KaizenProjectSelect = typeof kaizenProjects.$inferSelect;
export type KaizenProjectInsert = typeof kaizenProjects.$inferInsert;
export type ActivityLogSelect = typeof activityLogs.$inferSelect;
export type ActivityLogInsert = typeof activityLogs.$inferInsert;
export type KaizenRevisionSelect = typeof kaizenRevisions.$inferSelect;
