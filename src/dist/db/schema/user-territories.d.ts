import { z } from "zod";
export declare const userTerritories: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "user_territories";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "user_territories";
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
            tableName: "user_territories";
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
        territory: import("drizzle-orm/pg-core").PgColumn<{
            name: "territory";
            tableName: "user_territories";
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
            tableName: "user_territories";
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
export declare const insertUserTerritorySchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    territory: z.ZodString;
    createdAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, "id" | "createdAt">, "strip", z.ZodTypeAny, {
    territory: string;
    userId: string;
}, {
    territory: string;
    userId: string;
}>;
export type UserTerritory = typeof userTerritories.$inferSelect;
export type InsertUserTerritory = z.infer<typeof insertUserTerritorySchema>;
//# sourceMappingURL=user-territories.d.ts.map