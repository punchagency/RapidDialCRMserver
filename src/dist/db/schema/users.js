import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, index, } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const users = pgTable("users", {
    id: varchar("id")
        .primaryKey()
        .default(sql `gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: varchar("role", { length: 50 }).notNull().default("data_loader"),
    territory: varchar("territory", { length: 50 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    roleIdx: index("idx_users_role").on(table.role),
    territoryIdx: index("idx_users_territory").on(table.territory),
}));
export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
//# sourceMappingURL=users.js.map