import express, { Router, Request, Response } from "express";
import { DatabaseManager } from "../config/database.js";
import { routesLinks } from "./route-links.js";

/**
 * Routes Manager Class
 * Handles all API route definitions and middleware
 */
export class RoutesManager {
  private router: Router;
  private databaseManager: DatabaseManager | null = null;

  constructor() {
    this.router = express.Router();
  }

  /**
   * Initialize routes with database connection
   * @param {DatabaseManager} databaseManager - Database manager instance
   */
  initialize(databaseManager: DatabaseManager): Router {
    this.databaseManager = databaseManager;
    this.setupRoutes();
    return this.router;
  }

  /**
   * Setup all application routes
   */
  private setupRoutes(): void {
    // API version prefix
    this.router.use("/v1", this.fissRoutes());

    // Root API endpoint
    this.router.get("/", (req: Request, res: Response) => {
      res.json({
        message: "CRM Backend API",
        version: "1.0.0",
        status: "active",
        database: this.databaseManager?.isConnected()
          ? "connected"
          : "disconnected",
        endpoints: {
          health: "/health",
          api: "/api",
          v1: "/api/v1",
        },
      });
    });
  }

  private fissRoutes() {
    const routerArchor = express.Router();

    routesLinks.forEach(({ method, handler, path }) => {
      const methodInLowerCase = method.toLowerCase() as
        | "get"
        | "post"
        | "put"
        | "delete"
        | "patch";

      // @ts-ignore
      routerArchor[methodInLowerCase](path, handler);
    });

    return routerArchor;
  }

  /**
   * Get database manager instance
   * @returns {DatabaseManager | null}
   */
  getDatabaseManager(): DatabaseManager | null {
    return this.databaseManager;
  }
}
//

/**
 * Create and configure routes
 * @param {DatabaseManager} databaseManager - Database manager instance
 * @returns {Router} Configured Express router
 */
export function setupRoutes(databaseManager: DatabaseManager): Router {
  const routesManager = new RoutesManager();
  return routesManager.initialize(databaseManager);
}

/**
 * Get v1 routes directly (for mounting at /v1 without /api prefix)
 * @returns {Router} Router with v1 routes
 */
export function getV1Routes(): Router {
  const router = express.Router();

  routesLinks.forEach(({ method, handler, path }) => {
    const methodInLowerCase = method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch";
    // @ts-ignore
    router[methodInLowerCase](path, handler);
  });

  return router;
}
