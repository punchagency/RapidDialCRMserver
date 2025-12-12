import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { prospects } from "./prospects";

export const stakeholders = pgTable(
  "stakeholders",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    prospectId: varchar("prospect_id")
      .notNull()
      .references(() => prospects.id),
    name: text("name").notNull(),
    title: varchar("title", { length: 100 }),
    email: varchar("email", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 20 }),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    prospectIdx: index("idx_stakeholders_prospect").on(table.prospectId),
    emailIdx: index("idx_stakeholders_email").on(table.email),
  })
);

export const insertStakeholderSchema = createInsertSchema(stakeholders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Stakeholder = typeof stakeholders.$inferSelect;
export type InsertStakeholder = z.infer<typeof insertStakeholderSchema>;
