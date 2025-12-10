import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, integer, index, } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const callOutcomes = pgTable("call_outcomes", {
    id: varchar("id")
        .primaryKey()
        .default(sql `gen_random_uuid()`),
    label: varchar("label", { length: 50 }).notNull().unique(),
    bgColor: varchar("bg_color", { length: 30 }).notNull(),
    textColor: varchar("text_color", { length: 30 }).notNull(),
    borderColor: varchar("border_color", { length: 30 }),
    hoverColor: varchar("hover_color", { length: 30 }),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
    labelIdx: index("idx_call_outcomes_label").on(table.label),
    orderIdx: index("idx_call_outcomes_sort_order").on(table.sortOrder),
}));
export const insertCallOutcomeSchema = createInsertSchema(callOutcomes).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
//# sourceMappingURL=call-outcomes.js.map