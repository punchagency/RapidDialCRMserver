import { z } from "zod";
export declare const callOutcomes: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "call_outcomes";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "call_outcomes";
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
        label: import("drizzle-orm/pg-core").PgColumn<{
            name: "label";
            tableName: "call_outcomes";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
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
        bgColor: import("drizzle-orm/pg-core").PgColumn<{
            name: "bg_color";
            tableName: "call_outcomes";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 30;
        }>;
        textColor: import("drizzle-orm/pg-core").PgColumn<{
            name: "text_color";
            tableName: "call_outcomes";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 30;
        }>;
        borderColor: import("drizzle-orm/pg-core").PgColumn<{
            name: "border_color";
            tableName: "call_outcomes";
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
            length: 30;
        }>;
        hoverColor: import("drizzle-orm/pg-core").PgColumn<{
            name: "hover_color";
            tableName: "call_outcomes";
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
            length: 30;
        }>;
        sortOrder: import("drizzle-orm/pg-core").PgColumn<{
            name: "sort_order";
            tableName: "call_outcomes";
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
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "call_outcomes";
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
            tableName: "call_outcomes";
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
export declare const insertCallOutcomeSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    label: z.ZodString;
    bgColor: z.ZodString;
    textColor: z.ZodString;
    borderColor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    hoverColor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    createdAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, "id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    bgColor: string;
    textColor: string;
    label: string;
    borderColor?: string | null | undefined;
    hoverColor?: string | null | undefined;
    sortOrder?: number | null | undefined;
}, {
    bgColor: string;
    textColor: string;
    label: string;
    borderColor?: string | null | undefined;
    hoverColor?: string | null | undefined;
    sortOrder?: number | null | undefined;
}>;
export type CallOutcome = typeof callOutcomes.$inferSelect;
export type InsertCallOutcome = z.infer<typeof insertCallOutcomeSchema>;
//# sourceMappingURL=call-outcomes.d.ts.map