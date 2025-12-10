import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, jsonb, } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const fieldReps = pgTable("field_reps", {
    id: varchar("id")
        .primaryKey()
        .default(sql `gen_random_uuid()`),
    name: text("name").notNull(),
    territory: varchar("territory", { length: 20 }).notNull(),
    homeZipCode: varchar("home_zip_code", { length: 10 }),
    homeLat: decimal("home_lat", { precision: 10, scale: 8 }),
    homeLng: decimal("home_lng", { precision: 11, scale: 8 }),
    googleCalendarId: varchar("google_calendar_id", { length: 255 }),
    googleRefreshToken: text("google_refresh_token"),
    workSchedule: jsonb("work_schedule").default(sql `'{"daysOfWeek": ["monday","tuesday","wednesday","thursday","friday"], "startTime": "09:00", "endTime": "17:00"}'::jsonb`),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertFieldRepSchema = createInsertSchema(fieldReps).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
//# sourceMappingURL=field-reps.js.map