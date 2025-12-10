import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const specialtyColors = pgTable(
  "specialty_colors",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    specialty: varchar("specialty", { length: 50 }).notNull().unique(),
    bgColor: varchar("bg_color", { length: 20 })
      .notNull()
      .default("bg-blue-100"),
    textColor: varchar("text_color", { length: 20 })
      .notNull()
      .default("text-blue-700"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    specialtyIdx: index("idx_specialty_colors_specialty").on(table.specialty),
  })
);

export const insertSpecialtyColorSchema = createInsertSchema(
  specialtyColors
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SpecialtyColor = typeof specialtyColors.$inferSelect;
export type InsertSpecialtyColor = z.infer<typeof insertSpecialtyColorSchema>;
