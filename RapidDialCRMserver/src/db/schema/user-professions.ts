import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";

export const userProfessions = pgTable(
  "user_professions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    profession: varchar("profession", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_user_professions_user").on(table.userId),
    professionIdx: index("idx_user_professions_profession").on(
      table.profession
    ),
  })
);

export const insertUserProfessionSchema = createInsertSchema(
  userProfessions
).omit({
  id: true,
  createdAt: true,
});

export type UserProfession = typeof userProfessions.$inferSelect;
export type InsertUserProfession = z.infer<typeof insertUserProfessionSchema>;
