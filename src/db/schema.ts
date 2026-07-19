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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type KaizenProjectSelect = typeof kaizenProjects.$inferSelect;
export type KaizenProjectInsert = typeof kaizenProjects.$inferInsert;
