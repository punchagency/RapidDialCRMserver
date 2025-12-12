import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const issues = pgTable(
  "issues",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).notNull().default("backlog"),
    priority: integer("priority").default(2),
    screenshotUrl: text("screenshot_url"),
    screenshotData: text("screenshot_data"),
    pagePath: varchar("page_path", { length: 255 }),
    linearIssueId: varchar("linear_issue_id", { length: 100 }),
    linearIssueUrl: varchar("linear_issue_url", { length: 500 }),
    labels: text("labels").array(),
    createdBy: varchar("created_by", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    statusIdx: index("idx_issues_status").on(table.status),
    priorityIdx: index("idx_issues_priority").on(table.priority),
    linearIdx: index("idx_issues_linear").on(table.linearIssueId),
  })
);

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;

export type IssueStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "cancelled";

export type IssuePriority = 0 | 1 | 2 | 3 | 4;
