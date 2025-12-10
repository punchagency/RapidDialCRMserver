import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  date,
  time,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { prospects } from "./prospects";
import { fieldReps } from "./field-reps";

export const appointments = pgTable(
  "appointments",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    prospectId: varchar("prospect_id").references(() => prospects.id),
    fieldRepId: varchar("field_rep_id").references(() => fieldReps.id),
    scheduledDate: date("scheduled_date").notNull(),
    scheduledTime: time("scheduled_time").notNull(),
    durationMinutes: integer("duration_minutes").default(45),
    googleCalendarEventId: varchar("google_calendar_event_id", { length: 255 }),
    status: varchar("status", { length: 50 }).default("confirmed"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    fieldRepIdx: index("idx_appointments_field_rep").on(table.fieldRepId),
    dateIdx: index("idx_appointments_date").on(table.scheduledDate),
  })
);

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
