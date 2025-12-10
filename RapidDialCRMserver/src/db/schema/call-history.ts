import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, text, index } from "drizzle-orm/pg-core";
import { prospects } from "./prospects";

export const callHistory = pgTable(
  "call_history",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    prospectId: varchar("prospect_id").references(() => prospects.id),
    callerId: varchar("caller_id", { length: 100 }),
    attemptDate: timestamp("attempt_date").defaultNow(),
    outcome: varchar("outcome", { length: 50 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    prospectIdx: index("idx_call_history_prospect").on(table.prospectId),
    dateIdx: index("idx_call_history_date").on(table.attemptDate),
    callerIdx: index("idx_call_history_caller").on(table.callerId),
  })
);

export type CallHistory = typeof callHistory.$inferSelect;
