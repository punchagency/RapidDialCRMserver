import { z } from "zod";
export declare const appointments: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "appointments";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "appointments";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        prospectId: import("drizzle-orm/pg-core").PgColumn<{
            name: "prospect_id";
            tableName: "appointments";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        fieldRepId: import("drizzle-orm/pg-core").PgColumn<{
            name: "field_rep_id";
            tableName: "appointments";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        scheduledDate: import("drizzle-orm/pg-core").PgColumn<{
            name: "scheduled_date";
            tableName: "appointments";
            dataType: "string";
            columnType: "PgDateString";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        scheduledTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "scheduled_time";
            tableName: "appointments";
            dataType: "string";
            columnType: "PgTime";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        durationMinutes: import("drizzle-orm/pg-core").PgColumn<{
            name: "duration_minutes";
            tableName: "appointments";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        googleCalendarEventId: import("drizzle-orm/pg-core").PgColumn<{
            name: "google_calendar_event_id";
            tableName: "appointments";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "appointments";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 50;
        }>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "appointments";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "appointments";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const insertAppointmentSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    prospectId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    fieldRepId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    scheduledDate: z.ZodString;
    scheduledTime: z.ZodString;
    durationMinutes: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    googleCalendarEventId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, "id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    scheduledDate: string;
    scheduledTime: string;
    prospectId?: string | null | undefined;
    fieldRepId?: string | null | undefined;
    durationMinutes?: number | null | undefined;
    googleCalendarEventId?: string | null | undefined;
    status?: string | null | undefined;
}, {
    scheduledDate: string;
    scheduledTime: string;
    prospectId?: string | null | undefined;
    fieldRepId?: string | null | undefined;
    durationMinutes?: number | null | undefined;
    googleCalendarEventId?: string | null | undefined;
    status?: string | null | undefined;
}>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
//# sourceMappingURL=appointments.d.ts.map