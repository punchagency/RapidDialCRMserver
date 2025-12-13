import { z } from 'zod';

/**
 * Validation Schemas
 * Using Zod for runtime validation
 */

// Prospect schemas
export const insertProspectSchema = z.object({
  businessName: z.string().min(1),
  phoneNumber: z.string().min(1).max(20),
  addressStreet: z.string().max(255).optional(),
  addressCity: z.string().max(100).optional(),
  addressState: z.string().max(2).optional(),
  addressZip: z.string().max(10).optional(),
  addressLat: z.string().optional(),
  addressLng: z.string().optional(),
  specialty: z.string().max(50).min(1),
  territory: z.string().max(20).min(1),
  lastContactDate: z.date().optional(),
  lastCallOutcome: z.string().max(50).optional(),
  appointmentStatus: z
    .object({
      isBooked: z.boolean(),
      scheduledDate: z.string().nullable(),
      fieldRepId: z.string().nullable(),
    })
    .optional(),
  priorityScore: z.number().optional(),
});

// Field Rep schemas
export const insertFieldRepSchema = z.object({
  name: z.string().min(1),
  territory: z.string().max(20).min(1),
  homeZipCode: z.string().max(10).optional(),
  homeLat: z.string().optional(),
  homeLng: z.string().optional(),
  googleCalendarId: z.string().max(255).optional(),
  googleRefreshToken: z.string().optional(),
  workSchedule: z
    .object({
      daysOfWeek: z.array(z.string()),
      startTime: z.string(),
      endTime: z.string(),
    })
    .optional(),
});

// Appointment schemas
export const insertAppointmentSchema = z.object({
  prospectId: z.string().optional(),
  fieldRepId: z.string().optional(),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().min(1),
  durationMinutes: z.number().default(45),
  googleCalendarEventId: z.string().max(255).optional(),
  status: z.string().max(50).default('confirmed'),
});

// Stakeholder schemas
export const insertStakeholderSchema = z.object({
  prospectId: z.string().min(1),
  name: z.string().min(1),
  title: z.string().max(100).optional(),
  email: z.string().max(255).email().optional(),
  phoneNumber: z.string().max(20).optional(),
  isPrimary: z.boolean().default(false),
});

// User schemas
export const insertUserSchema = z.object({
  email: z.string().email().max(255),
  passwordHash: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(['admin', 'manager', 'inside_sales_rep', 'field_sales_rep', 'data_loader']).default('data_loader'),
  territory: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
});

// Specialty Color schemas
export const insertSpecialtyColorSchema = z.object({
  specialty: z.string().max(50).min(1),
  bgColor: z.string().max(20).default('bg-blue-100'),
  textColor: z.string().max(20).default('text-blue-700'),
});

// Call Outcome schemas
export const insertCallOutcomeSchema = z.object({
  label: z.string().max(50).min(1),
  bgColor: z.string().max(30).min(1),
  textColor: z.string().max(30).min(1),
  borderColor: z.string().max(30).optional(),
  hoverColor: z.string().max(30).optional(),
  sortOrder: z.number().default(0),
});

// Issue schemas
export const insertIssueSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']).default('backlog'),
  priority: z.number().min(0).max(4).default(2),
  screenshotUrl: z.string().optional(),
  screenshotData: z.string().optional(),
  pagePath: z.string().max(255).optional(),
  linearIssueId: z.string().max(100).optional(),
  linearIssueUrl: z.string().max(500).optional(),
  labels: z.array(z.string()).optional(),
  createdBy: z.string().max(100).optional(),
});

