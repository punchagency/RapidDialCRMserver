import express, { Express, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

/**
 * Server Class
 * Manages Express server configuration and lifecycle
 */
export class Server {
  private app: Express;
  private port: number;
  private host: string;
  private serverInstance: ReturnType<Express['listen']> | null = null;

  constructor(app: Express) {
    this.app = app;
    this.port = parseInt(process.env.PORT || '3001', 10);
    // On Heroku/cloud platforms, bind to 0.0.0.0 to accept external connections
    // If PORT is set (Heroku always sets this), use 0.0.0.0, otherwise use localhost for local dev
    this.host = process.env.HOST || (process.env.PORT ? '0.0.0.0' : 'localhost');
  }

  /**
   * Configure the Express server
   */
  async configure(): Promise<void> {
    // Note: Body parsing middleware is now applied in server.ts before routes
    // This ensures req.body is available in route handlers

    // Logging middleware
    if (process.env.NODE_ENV !== 'production') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
      });
    });

    // Error handling middleware
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);

      const statusCode = (err as any).statusCode || 500;
      const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message;

      res.status(statusCode).json({
        error: 'Internal Server Error',
        message: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
      });
    });

    console.log('Server configuration completed');
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.serverInstance = this.app.listen(this.port, this.host, () => {
          console.log(`🚀 Server running on http://${this.host}:${this.port}`);
          console.log(`📊 Health check: http://${this.host}:${this.port}/health`);
          console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
          resolve();
        });

        // Handle server errors on the server instance, not the app
        if (this.serverInstance) {
          this.serverInstance.on('error', (error: Error) => {
            console.error('Server error:', error);
            reject(error);
          });
        }
      } catch (error) {
        console.error('Failed to start server:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop the server gracefully
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.serverInstance) {
        this.serverInstance.close(() => {
          console.log('Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

