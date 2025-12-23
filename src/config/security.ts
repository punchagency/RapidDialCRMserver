import helmet from "helmet";
import cors, { CorsOptions } from "cors";
import rateLimit from "express-rate-limit";
import { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Security Manager Class
 * Handles all security-related middleware and configurations
 */
export class SecurityManager {
  private corsOptions: CorsOptions;
  private rateLimiter: ReturnType<typeof rateLimit>;

  constructor() {
    this.corsOptions = this._configureCORS();
    this.rateLimiter = this._configureRateLimit();
  }

  /**
   * Configure CORS options
   * @returns {CorsOptions} CORS configuration object
   */
  private _configureCORS(): CorsOptions {
    const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:3000", "http://localhost:5173"];

    return {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["X-Total-Count", "X-Page", "X-Per-Page"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  /**
   * Configure rate limiting
   * @returns {ReturnType<typeof rateLimit>} Rate limiter middleware
   */
  private _configureRateLimit(): ReturnType<typeof rateLimit> {
    return rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10), // limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req: Request) => {
        // Skip rate limiting for health checks
        return req.path === "/health";
      },
    });
  }

  /**
   * Configure Helmet security headers
   * @returns {ReturnType<typeof helmet>} Helmet configuration
   */
  private _configureHelmet(): ReturnType<typeof helmet> {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    });
  }

  /**
   * Apply all security middleware to the Express app
   * @param {Express} app - Express application instance
   */
  applySecurity(app: Express): void {
    // Apply Helmet for security headers
    app.use(this._configureHelmet());

    // Apply CORS
    app.use(cors(this.corsOptions));

    // Apply rate limiting
    app.use(this.rateLimiter);

    // Trust proxy (important for rate limiting behind reverse proxy)
    app.set("trust proxy", 1);

    console.log("Security middleware applied successfully");
  }
}
