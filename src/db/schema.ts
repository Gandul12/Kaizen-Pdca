import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";

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

export const genbaEntries = pgTable("genba_entries", {
  id: text("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // format YYYY-MM-DD
  leaderName: text("leader_name").notNull(),
  lineName: text("line_name"),
  dailyTarget: text("daily_target"),
  items: jsonb("items").notNull(),
  linkedProjectId: text("linked_project_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GenbaEntrySelect = typeof genbaEntries.$inferSelect;
export type GenbaEntryInsert = typeof genbaEntries.$inferInsert;

// FR-11: master data checklist genba, sebelumnya konstanta statis
// (GENBA_SCHEDULE di src/lib/genbaSchedule.ts). Mengubah tabel ini TIDAK
// memengaruhi entry genba yang sudah tersimpan — genba_entries.items (jsonb)
// menyimpan salinan item apa adanya di saat entry dibuat, bukan referensi
// ke master data. Perubahan di sini hanya berlaku untuk entry BARU.
export const genbaScheduleItems = pgTable("genba_schedule_items", {
  id: text("id").primaryKey(),
  sectionId: text("section_id").notNull(),
  sectionTitle: text("section_title").notNull(),
  sectionOrder: integer("section_order").notNull().default(0),
  itemOrder: integer("item_order").notNull().default(0),
  point: text("point").notNull(),
  standard: text("standard").notNull(),
  endMinutes: integer("end_minutes").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GenbaScheduleItemSelect = typeof genbaScheduleItems.$inferSelect;
export type GenbaScheduleItemInsert = typeof genbaScheduleItems.$inferInsert;

export type KaizenProjectSelect = typeof kaizenProjects.$inferSelect;
export type KaizenProjectInsert = typeof kaizenProjects.$inferInsert;
export type ActivityLogSelect = typeof activityLogs.$inferSelect;
export type ActivityLogInsert = typeof activityLogs.$inferInsert;
export type KaizenRevisionSelect = typeof kaizenRevisions.$inferSelect;
