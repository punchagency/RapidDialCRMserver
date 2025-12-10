import { z } from "zod";
export declare const userProfessions: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "user_professions";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "user_professions";
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
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "user_professions";
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
            length: number | undefined;
        }>;
        profession: import("drizzle-orm/pg-core").PgColumn<{
            name: "profession";
            tableName: "user_professions";
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
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "user_professions";
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
export declare const insertUserProfessionSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profession: z.ZodString;
    createdAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, "id" | "createdAt">, "strip", z.ZodTypeAny, {
    userId: string;
    profession: string;
}, {
    userId: string;
    profession: string;
}>;
export type UserProfession = typeof userProfessions.$inferSelect;
export type InsertUserProfession = z.infer<typeof insertUserProfessionSchema>;
//# sourceMappingURL=user-professions.d.ts.map