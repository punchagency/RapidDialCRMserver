import express, { Express } from 'express';
import 'reflect-metadata';
import { SecurityManager } from './src/config/security.js';
import { DatabaseManager, getDatabaseManager } from './src/config/database.js';
import { setupRoutes, getV1Routes } from './src/routes/index.js';
import { Server } from './src/core/Server.js';
import Logger from './src/logging/logger.js';

/**
 * Application Entry Point
 * Initializes and starts the CRM backend server
 */
class Application {
  private server: Server | null = null;
  private databaseManager: DatabaseManager | null = null;

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    try {
      // Create Express app instance
      const app: Express = express();

      // Initialize security middleware
      const securityManager = new SecurityManager();
      securityManager.applySecurity(app);

      // Body parsing middleware - MUST be before routes
      app.use(express.json({ limit: '10mb' }));
      app.use(express.urlencoded({ extended: true, limit: '10mb' }));

      // Initialize database connection
      this.databaseManager = getDatabaseManager();
      await this.databaseManager.initialize();

      // Setup routes with database connection
      const routes = setupRoutes(this.databaseManager);
      app.use('/api', routes);

      // Also mount v1 routes directly at /v1 (without /api prefix)
      const v1Routes = getV1Routes();
      app.use('/v1', v1Routes);

      // Initialize and configure server (this adds logging, health check, 404, error handlers)
      this.server = new Server(app);
      await this.server.configure();

      Logger.show('log', 'Application initialized successfully');
    } catch (error) {
      Logger.show('error', 'Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    if (!this.server) {
      await this.initialize();
    }

    // TypeScript now knows server is not null after initialize()
    if (this.server) {
      await this.server.start();
    } else {
      throw new Error('Failed to initialize server');
    }
  }

  /**
   * Gracefully shutdown the application
   */
  async shutdown(): Promise<void> {
    try {
      if (this.server) {
        await this.server.stop();
      }
      if (this.databaseManager) {
        await this.databaseManager.close();
      }
      console.log('Application shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error);
      throw error;
    }
  }
}

// Start the application
const app = new Application();
app.start().catch((error: unknown) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await app.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await app.shutdown();
  process.exit(0);
});

