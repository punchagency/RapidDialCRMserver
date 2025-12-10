import { z } from "zod";
export declare const specialtyColors: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "specialty_colors";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "specialty_colors";
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
        specialty: import("drizzle-orm/pg-core").PgColumn<{
            name: "specialty";
            tableName: "specialty_colors";
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
            tableName: "specialty_colors";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 20;
        }>;
        textColor: import("drizzle-orm/pg-core").PgColumn<{
            name: "text_color";
            tableName: "specialty_colors";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 20;
        }>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "specialty_colors";
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
            tableName: "specialty_colors";
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
export declare const insertSpecialtyColorSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    specialty: z.ZodString;
    bgColor: z.ZodOptional<z.ZodString>;
    textColor: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, "id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    specialty: string;
    bgColor?: string | undefined;
    textColor?: string | undefined;
}, {
    specialty: string;
    bgColor?: string | undefined;
    textColor?: string | undefined;
}>;
export type SpecialtyColor = typeof specialtyColors.$inferSelect;
export type InsertSpecialtyColor = z.infer<typeof insertSpecialtyColorSchema>;
//# sourceMappingURL=specialty-colors.d.ts.map