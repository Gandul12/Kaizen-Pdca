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
  industry: varchar("industry", { length: 50 }).default("Manufaktur").notNull(),
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
  visitorId: text("visitor_id"), // Anonymous client UUID for UU PDP privacy
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

export const aboutContent = pgTable("about_content", {
  id: text("id").primaryKey(), // default 'main'
  title: text("title").notNull(),
  narrative: text("narrative").notNull(),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(),
  avatarUrl: text("avatar_url"),
  achievements: jsonb("achievements").notNull(), // Array of { label: string, value: string }
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const genbaEntries = pgTable("genba_entries", {
  id: text("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(),
  leaderName: text("leader_name").notNull(),
  lineName: text("line_name"),
  dailyTarget: text("daily_target"),
  items: jsonb("items").notNull(),
  linkedProjectId: text("linked_project_id"),
  linkedProjectShareToken: text("linked_project_share_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Master checklist genba (FR-11) — bisa diatur lewat UI (/genba/pengaturan).
// Entry genba (di atas) TIDAK melakukan lookup ke tabel ini saat render;
// tiap GenbaItem di dalam entry membawa salinan sectionTitle/point/standard
// sendiri (self-contained), supaya entry lama tidak berubah kalau baris di
// sini diedit/dinonaktifkan belakangan.
export const genbaScheduleItems = pgTable("genba_schedule_items", {
  id: text("id").primaryKey(),
  sectionId: text("section_id").notNull(),
  sectionTitle: text("section_title").notNull(),
  sectionOrder: integer("section_order").notNull(),
  itemOrder: integer("item_order").notNull(),
  point: text("point").notNull(),
  standard: text("standard").notNull(),
  endMinutes: integer("end_minutes").notNull(),
  isActive: integer("is_active").default(1).notNull(), // 1=aktif, 0=soft-deleted (pola sama seperti isTemplate)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type KaizenProjectSelect = typeof kaizenProjects.$inferSelect;
export type KaizenProjectInsert = typeof kaizenProjects.$inferInsert;
export type ActivityLogSelect = typeof activityLogs.$inferSelect;
export type ActivityLogInsert = typeof activityLogs.$inferInsert;
export type KaizenRevisionSelect = typeof kaizenRevisions.$inferSelect;
export type AboutContentSelect = typeof aboutContent.$inferSelect;
export type GenbaEntrySelect = typeof genbaEntries.$inferSelect;
export type GenbaEntryInsert = typeof genbaEntries.$inferInsert;
export type GenbaScheduleItemSelect = typeof genbaScheduleItems.$inferSelect;
export type GenbaScheduleItemInsert = typeof genbaScheduleItems.$inferInsert;
