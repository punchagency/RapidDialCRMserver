import { DataSource, DataSourceOptions } from "typeorm";
import dotenv from "dotenv";
import {
  Prospect,
  User,
  FieldRep,
  Appointment,
  CallHistory,
  Stakeholder,
  UserTerritory,
  UserProfession,
  Territory,
  Profession,
  SpecialtyColor,
  CallOutcome,
  Issue,
  TeamRelationship,
  EmailTemplate,
  EmailLog,
  Script,
} from "../entities/index.js";

// Load environment variables
dotenv.config({ path: [".env.development", ".env.production"] });

/**
 * Database Manager Class
 * Handles TypeORM database connection and configuration
 */
export class DatabaseManager {
  private dataSource: DataSource | null = null;

  /**
   * Create and configure TypeORM DataSource
   * @returns {DataSource} TypeORM DataSource instance
   */
  createDataSource(): DataSource {
    const dbType: string = process.env.DB_TYPE || "mysql";

    // Determine file extension based on environment
    const fileExtension = process.env.NODE_ENV === "production" ? "js" : "ts";

    // Import entities directly as classes (avoids file loading issues)
    const entities = [
      Prospect,
      User,
      FieldRep,
      Appointment,
      CallHistory,
      Stakeholder,
      UserTerritory,
      UserProfession,
      Territory,
      Profession,
      SpecialtyColor,
      CallOutcome,
      Issue,
      TeamRelationship,
      EmailTemplate,
      EmailLog,
      Script,
    ];

    const commonConfig: Partial<DataSourceOptions> = {
      synchronize: process.env.DB_SYNCHRONIZE === "true",
      logging: false, // logging: process.env.NODE_ENV !== 'production',
      entities: process.env.DB_ENTITIES_PATH
        ? [process.env.DB_ENTITIES_PATH]
        : entities,
      migrations: process.env.DB_MIGRATIONS_PATH
        ? [process.env.DB_MIGRATIONS_PATH]
        : [`src/migrations/**/*.${fileExtension}`],
      subscribers: process.env.DB_SUBSCRIBERS_PATH
        ? [process.env.DB_SUBSCRIBERS_PATH]
        : [`src/subscribers/**/*.${fileExtension}`],
    };

    let dataSourceConfig: DataSourceOptions;

    switch (dbType.toLowerCase()) {
      case "postgres":
      case "postgresql":
        dataSourceConfig = {
          type: "postgres",
          host: process.env.DB_HOST || "localhost",
          port: parseInt(process.env.DB_PORT || "5432", 10),
          username: process.env.DB_USERNAME || "postgres",
          password: process.env.DB_PASSWORD || "postgres",
          database: process.env.DB_NAME || "crm_db",
          ...commonConfig,
        } as DataSourceOptions;
        break;

      case "mysql":
      case "mariadb":
        dataSourceConfig = {
          type: "mysql",
          host: process.env.DB_HOST || "localhost",
          port: parseInt(process.env.DB_PORT || "3306", 10),
          username: process.env.DB_USERNAME || "root",
          password: process.env.DB_PASSWORD || "",
          database: process.env.DB_NAME || "recrowdly",
          ...commonConfig,
        } as DataSourceOptions;
        break;

      case "sqlite":
        dataSourceConfig = {
          type: "sqlite",
          database: process.env.DB_NAME || "database.sqlite",
          ...commonConfig,
        } as DataSourceOptions;
        break;

      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }

    return new DataSource(dataSourceConfig);
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    try {
      if (!this.dataSource) {
        this.dataSource = this.createDataSource();
      }

      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
        console.log("✅ Database connection established successfully");
        console.log(`📊 Database: ${process.env.DB_NAME || "crm_db"}`);
        console.log(`🔌 Type: ${process.env.DB_TYPE || "postgres"}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Database connection failed:", errorMessage);
      throw error;
    }
  }

  /**
   * Get the DataSource instance
   * @returns {DataSource} TypeORM DataSource
   */
  getDataSource(): DataSource {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.dataSource;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        console.log("Database connection closed");
      }
    } catch (error) {
      console.error("Error closing database connection:", error);
      throw error;
    }
  }

  /**
   * Check if database is connected
   * @returns {boolean}
   */
  isConnected(): boolean {
    return this.dataSource !== null && this.dataSource.isInitialized;
  }
}

// Singleton instance
let databaseManagerInstance: DatabaseManager | null = null;

/**
 * Get singleton instance of DatabaseManager
 * @returns {DatabaseManager}
 */
export function getDatabaseManager(): DatabaseManager {
  if (!databaseManagerInstance) {
    databaseManagerInstance = new DatabaseManager();
  }
  return databaseManagerInstance;
}
