import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./users";
export const userTerritories = pgTable("user_territories", {
    id: varchar("id")
        .primaryKey()
        .default(sql `gen_random_uuid()`),
    userId: varchar("user_id")
        .notNull()
        .references(() => users.id),
    territory: varchar("territory", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    userIdx: index("idx_user_territories_user").on(table.userId),
    territoryIdx: index("idx_user_territories_territory").on(table.territory),
}));
export const insertUserTerritorySchema = createInsertSchema(userTerritories).omit({
    id: true,
    createdAt: true,
});
//# sourceMappingURL=user-territories.js.map