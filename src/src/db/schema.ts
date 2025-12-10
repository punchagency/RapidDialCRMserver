import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, jsonb, integer, date, time, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Prospects Table
export const prospects = pgTable("prospects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  appointmentStatus: jsonb("appointment_status").default(sql`'{"isBooked": false, "scheduledDate": null, "fieldRepId": null}'::jsonb`),
  priorityScore: integer("priority_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  territoryIdx: index("idx_prospects_territory").on(table.territory),
  coordinatesIdx: index("idx_prospects_coordinates").on(table.addressLat, table.addressLng),
  specialtyIdx: index("idx_prospects_specialty").on(table.specialty),
  lastContactIdx: index("idx_prospects_last_contact").on(table.lastContactDate),
}));

// Field Reps Table
export const fieldReps = pgTable("field_reps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  territory: varchar("territory", { length: 20 }).notNull(),
  homeZipCode: varchar("home_zip_code", { length: 10 }),
  homeLat: decimal("home_lat", { precision: 10, scale: 8 }),
  homeLng: decimal("home_lng", { precision: 11, scale: 8 }),
  googleCalendarId: varchar("google_calendar_id", { length: 255 }),
  googleRefreshToken: text("google_refresh_token"),
  workSchedule: jsonb("work_schedule").default(sql`'{"daysOfWeek": ["monday","tuesday","wednesday","thursday","friday"], "startTime": "09:00", "endTime": "17:00"}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointments Table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectId: varchar("prospect_id").references(() => prospects.id),
  fieldRepId: varchar("field_rep_id").references(() => fieldReps.id),
  scheduledDate: date("scheduled_date").notNull(),
  scheduledTime: time("scheduled_time").notNull(),
  durationMinutes: integer("duration_minutes").default(45),
  googleCalendarEventId: varchar("google_calendar_event_id", { length: 255 }),
  status: varchar("status", { length: 50 }).default("confirmed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  fieldRepIdx: index("idx_appointments_field_rep").on(table.fieldRepId),
  dateIdx: index("idx_appointments_date").on(table.scheduledDate),
}));

// Call History Table
export const callHistory = pgTable("call_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectId: varchar("prospect_id").references(() => prospects.id),
  callerId: varchar("caller_id", { length: 100 }),
  attemptDate: timestamp("attempt_date").defaultNow(),
  outcome: varchar("outcome", { length: 50 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  prospectIdx: index("idx_call_history_prospect").on(table.prospectId),
  dateIdx: index("idx_call_history_date").on(table.attemptDate),
  callerIdx: index("idx_call_history_caller").on(table.callerId),
}));

// Stakeholders Table
export const stakeholders = pgTable("stakeholders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectId: varchar("prospect_id").notNull().references(() => prospects.id),
  name: text("name").notNull(),
  title: varchar("title", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  prospectIdx: index("idx_stakeholders_prospect").on(table.prospectId),
  emailIdx: index("idx_stakeholders_email").on(table.email),
}));

// Users Table (for RBAC)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

// User Territories Junction Table (many-to-many)
export const userTerritories = pgTable("user_territories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  territory: varchar("territory", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("idx_user_territories_user").on(table.userId),
  territoryIdx: index("idx_user_territories_territory").on(table.territory),
}));

// User Professions Junction Table (many-to-many)
export const userProfessions = pgTable("user_professions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  profession: varchar("profession", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("idx_user_professions_user").on(table.userId),
  professionIdx: index("idx_user_professions_profession").on(table.profession),
}));

// Specialty Colors Table
export const specialtyColors = pgTable("specialty_colors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  specialty: varchar("specialty", { length: 50 }).notNull().unique(),
  bgColor: varchar("bg_color", { length: 20 }).notNull().default("bg-blue-100"),
  textColor: varchar("text_color", { length: 20 }).notNull().default("text-blue-700"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  specialtyIdx: index("idx_specialty_colors_specialty").on(table.specialty),
}));

// Call Outcomes Table
export const callOutcomes = pgTable("call_outcomes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

// Issues Table (for project/functionality tracking - syncs with Linear)
export const issues = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("backlog"),
  priority: integer("priority").default(2),
  screenshotUrl: text("screenshot_url"),
  screenshotData: text("screenshot_data"),
  pagePath: varchar("page_path", { length: 255 }),
  linearIssueId: varchar("linear_issue_id", { length: 100 }),
  linearIssueUrl: varchar("linear_issue_url", { length: 500 }),
  labels: text("labels").array(),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("idx_issues_status").on(table.status),
  priorityIdx: index("idx_issues_priority").on(table.priority),
  linearIdx: index("idx_issues_linear").on(table.linearIssueId),
}));

// Zod Schemas
export const insertProspectSchema = createInsertSchema(prospects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFieldRepSchema = createInsertSchema(fieldReps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStakeholderSchema = createInsertSchema(stakeholders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserTerritorySchema = createInsertSchema(userTerritories).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfessionSchema = createInsertSchema(userProfessions).omit({
  id: true,
  createdAt: true,
});

export const insertSpecialtyColorSchema = createInsertSchema(specialtyColors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCallOutcomeSchema = createInsertSchema(callOutcomes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = z.infer<typeof insertProspectSchema>;

export type FieldRep = typeof fieldReps.$inferSelect;
export type InsertFieldRep = z.infer<typeof insertFieldRepSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type CallHistory = typeof callHistory.$inferSelect;

export type Stakeholder = typeof stakeholders.$inferSelect;
export type InsertStakeholder = z.infer<typeof insertStakeholderSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserTerritory = typeof userTerritories.$inferSelect;
export type InsertUserTerritory = z.infer<typeof insertUserTerritorySchema>;

export type UserProfession = typeof userProfessions.$inferSelect;
export type InsertUserProfession = z.infer<typeof insertUserProfessionSchema>;

export type SpecialtyColor = typeof specialtyColors.$inferSelect;
export type InsertSpecialtyColor = z.infer<typeof insertSpecialtyColorSchema>;

export type CallOutcome = typeof callOutcomes.$inferSelect;
export type InsertCallOutcome = z.infer<typeof insertCallOutcomeSchema>;

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;

export type UserRole = 'admin' | 'manager' | 'inside_sales_rep' | 'field_sales_rep' | 'data_loader';

export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type IssuePriority = 0 | 1 | 2 | 3 | 4;
