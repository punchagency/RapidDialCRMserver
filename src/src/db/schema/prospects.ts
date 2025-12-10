import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  decimal,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const prospects = pgTable(
  "prospects",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    businessName: text("business_name").notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    addressStreet: varchar("address_street", { length: 255 }),
    addressCity: varchar("address_city", { length: 100 }),
    addressState: varchar("address_state", { length: 2 }),
    addressZip: varchar("address_zip", { length: 10 }),
    addressLat: decimal("address_lat", { precision: 10, scale: 8 }),
    addressLng: decimal("address_lng", { precision: 11, scale: 8 }),
    specialty: varchar("specialty", { length: 50 }).notNull(),
    territory: varchar("territory", { length: 20 }).notNull(),
    lastContactDate: timestamp("last_contact_date"),
    lastCallOutcome: varchar("last_call_outcome", { length: 50 }),
    appointmentStatus: jsonb("appointment_status").default(
      sql`'{"isBooked": false, "scheduledDate": null, "fieldRepId": null}'::jsonb`
    ),
    priorityScore: integer("priority_score"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    territoryIdx: index("idx_prospects_territory").on(table.territory),
    coordinatesIdx: index("idx_prospects_coordinates").on(
      table.addressLat,
      table.addressLng
    ),
    specialtyIdx: index("idx_prospects_specialty").on(table.specialty),
    lastContactIdx: index("idx_prospects_last_contact").on(
      table.lastContactDate
    ),
  })
);

export const insertProspectSchema = createInsertSchema(prospects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = z.infer<typeof insertProspectSchema>;
