import { Request, Response } from "express";
import {
  getAppointmentsRepository,
  getProspectsRepository,
  getUsersRepository,
  getCallHistoryRepository,
  getStakeholdersRepository,
  getUserTerritoriesRepository,
  getUserProfessionsRepository,
  getTerritoriesRepository,
  getProfessionsRepository,
  getIssuesRepository,
  getSpecialtyColorsRepository,
  getCallOutcomesRepository,
  getFieldRepsRepository,
  UserRole,
} from "../repositories/index.js";
import { getTwilioService } from "../services/TwilioService.js";
import { getLiveKitService } from "../services/LiveKitService.js";
import { getGeocodingService } from "../services/GeocodingService.js";
import { getOptimizationService } from "../services/OptimizationService.js";
import { getLinearService } from "../services/LinearService.js";
import { getEmailService } from "../services/EmailService.js";
import { InviteStatus, User } from "../entities/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
  insertProspectSchema,
  insertFieldRepSchema,
  insertAppointmentSchema,
  insertStakeholderSchema,
  insertUserSchema,
  insertSpecialtyColorSchema,
  insertCallOutcomeSchema,
  insertIssueSchema,
  insertTerritorySchema,
  insertProfessionSchema,
} from "../validators/schemas.js";
import { roundRobin } from "../util/round-robin.js";

type ObjectValueType = {
  has_error: boolean;
  message: string;
  data?: any;
  [key: string]: any;
};

type RouteLinkType = {
  path: string;
  method: string;
  handler: (req: Request, res: Response) => Promise<any>;
};

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const routeResponse = (
  res: Response,
  objectValue: ObjectValueType,
  status?: number
) => {
  return status ? res.status(status).json(objectValue) : res.json(objectValue);
};

// Helper functions for services
const getTwilio = () => getTwilioService();
const getLiveKit = () => getLiveKitService();
const getGeocoding = () => getGeocodingService();
const getOptimization = () => getOptimizationService();
const getLinear = () => getLinearService();
const getEmail = () => getEmailService();

// Services will be initialized lazily when needed
// Don't initialize storage here as database may not be ready yet

// Cache for specialty colors and call outcomes
let cachedColors: any[] | null = null;
let colorsCacheTime = 0;
let cachedOutcomes: any[] | null = null;
let outcomesCacheTime = 0;

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z
    .enum([
      "admin",
      "manager",
      "inside_sales_rep",
      "field_sales_rep",
      "data_loader",
    ])
    .default("data_loader"),
  territory: z.string().max(50).optional(),
});

const createUserSchema = insertUserSchema.extend({
  password: z.string().min(6).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type JwtPayloadType = {
  userId: string;
  role: string;
};

const sanitizeUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  territory: user.territory || null,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const signToken = (user: User) => {
  const payload: JwtPayloadType = {
    userId: user.id,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

const getUserFromToken = async (req: Request): Promise<User | null> => {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadType;
    return await getUsersRepository().getUser(decoded.userId);
  } catch (err) {
    return null;
  }
};

const buildResetToken = (user: User) => {
  const payload = { userId: user.id, type: "password_reset" as const };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

const verifyResetToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded?.type !== "password_reset") return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
};

const buildResetLink = (token: string) => {
  const baseClient = process.env.CLIENT_URL || "http://localhost:5173";
  return `${baseClient.replace(/\/$/, "")}/password-reset?token=${token}`;
};

const verifyGoogleToken = async (idToken: string) => {
  // @ts-ignore
  const fetchImpl =
    (global as any).fetch ?? (await import("node-fetch")).default;
  const response = await fetchImpl(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
  );
  if (!response.ok) {
    throw new Error("Invalid Google token");
  }
  const data = await response.json();
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (clientId && data.aud !== clientId) {
    throw new Error("Google token audience mismatch");
  }
  return {
    email: data.email as string,
    name: (data.name as string) || (data.email as string),
    emailVerified:
      data.email_verified === "true" || data.email_verified === true,
  };
};

export const routesLinks: Array<RouteLinkType> = [
  // ==================== AUTH ====================
  {
    path: "/auth/register",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const input = registerSchema.parse(req.body);
        const existing = await getUsersRepository().getUserByEmail(input.email);
        if (existing) {
          return routeResponse(
            res,
            { has_error: true, message: "User already exists", data: null },
            409
          );
        }

        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await getUsersRepository().createUser({
          email: input.email,
          passwordHash,
          name: input.name,
          role: input.role,
          territory: input.territory,
          isActive: true,
        });

        const token = signToken(user);

        // Send invite email with reset link
        try {
          const resetToken = buildResetToken(user);
          const link = buildResetLink(resetToken);
          console.log("link", link); //TODO: delete
          await getEmail().sendInviteEmail(user.email, user.name, link);
        } catch (mailErr) {
          console.warn("Failed to send invite email", mailErr);
        }
        return routeResponse(
          res,
          {
            has_error: false,
            message: "User registered successfully",
            data: {
              token,
              user: sanitizeUser(user),
            },
          },
          201
        );
      } catch (error: any) {
        const message =
          error instanceof z.ZodError
            ? "Invalid registration data"
            : "Registration failed";
        return routeResponse(
          res,
          { has_error: true, message, data: error?.message },
          400
        );
      }
    },
  },
  {
    path: "/auth/password-reset/request",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      const schema = z.object({ email: z.string().email() });
      try {
        const { email } = schema.parse(req.body);
        const user = await getUsersRepository().getUserByEmail(email);
        if (!user) {
          return routeResponse(res, {
            has_error: false,
            message: "If the email exists, a reset link was sent.",
          });
        }
        const resetToken = buildResetToken(user);
        const link = buildResetLink(resetToken);
        console.log("link", link); //TODO: delete
        await getEmail().sendPasswordResetEmail(user.email, user.name, link);
        return routeResponse(res, {
          has_error: false,
          message: "Reset link sent.",
        });
      } catch (error: any) {
        const message =
          error instanceof z.ZodError
            ? "Invalid request data"
            : "Failed to process request";
        return routeResponse(
          res,
          { has_error: true, message, data: error?.message },
          400
        );
      }
    },
  },
  {
    path: "/auth/password-reset/confirm",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      const schema = z.object({
        token: z.string().min(10),
        password: z.string().min(6),
      });
      try {
        const { token, password } = schema.parse(req.body);
        const decoded = verifyResetToken(token);
        if (!decoded) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Invalid or expired token",
              data: null,
            },
            400
          );
        }
        const user = await getUsersRepository().getUser(decoded.userId);
        if (!user) {
          return routeResponse(
            res,
            { has_error: true, message: "User not found", data: null },
            404
          );
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await getUsersRepository().updateUser(user.id, {
          passwordHash,
          inviteStatus: InviteStatus.ACCEPTED,
        });
        return routeResponse(res, {
          has_error: false,
          message: "Password updated successfully",
        });
      } catch (error: any) {
        const message =
          error instanceof z.ZodError
            ? "Invalid request data"
            : "Failed to reset password";
        return routeResponse(
          res,
          { has_error: true, message, data: error?.message },
          400
        );
      }
    },
  },
  {
    path: "/auth/google",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      const schema = z.object({ idToken: z.string().min(10) });
      try {
        const { idToken } = schema.parse(req.body);
        const profile = await verifyGoogleToken(idToken);
        if (!profile.email) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Google account missing email",
              data: null,
            },
            400
          );
        }

        let user = await getUsersRepository().getUserByEmail(profile.email);
        if (!user) {
          throw new Error(
            "Forbidden Login with Google. Reachout to admin for invitation."
          );
        }

        const token = signToken(user);
        return routeResponse(res, {
          has_error: false,
          message: "Google login successful",
          data: { token, user: sanitizeUser(user) },
        });
      } catch (error: any) {
        const message =
          error instanceof z.ZodError
            ? "Invalid Google login data"
            : error?.message || "Google login failed";
        return routeResponse(
          res,
          { has_error: true, message, data: error?.message },
          400
        );
      }
    },
  },
  {
    path: "/auth/login",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const input = loginSchema.parse(req.body);
        const user = await getUsersRepository().getUserByEmail(input.email);
        if (!user) {
          return routeResponse(
            res,
            { has_error: true, message: "Invalid credentials", data: null },
            401
          );
        }

        if (!user.isActive) {
          return routeResponse(
            res,
            { has_error: true, message: "Account is inactive", data: null },
            403
          );
        }

        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
          return routeResponse(
            res,
            { has_error: true, message: "Invalid credentials", data: null },
            401
          );
        }

        const token = signToken(user);
        return routeResponse(res, {
          has_error: false,
          message: "Login successful",
          data: {
            token,
            user: sanitizeUser(user),
          },
        });
      } catch (error: any) {
        const message =
          error instanceof z.ZodError ? "Invalid login data" : "Login failed";
        return routeResponse(
          res,
          { has_error: true, message, data: error?.message },
          400
        );
      }
    },
  },
  {
    path: "/auth/me",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const user = await getUserFromToken(req);
        if (!user) {
          return routeResponse(
            res,
            { has_error: true, message: "Unauthorized", data: null },
            401
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "User profile fetched",
          data: sanitizeUser(user),
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch user",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== HEALTH CHECK ====================
  // Note: Health check is handled in Server.ts, but keeping for consistency
  {
    path: "/health",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        return routeResponse(res, {
          has_error: false,
          message: "Server is healthy",
          data: { status: "ok" },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Health check failed",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== PROSPECTS ====================
  {
    path: "/prospects",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const territory = req.query.territory as string;
        const userId = req.query.userId as string;
        const role = req.query.role as string;
        const { limit, offset, called } = req.query;
        let prospects;
        let total;
        if (territory) {
          [prospects, total] =
            await getProspectsRepository().listProspectsByTerritory(territory);
        } else {
          [prospects, total] = await getProspectsRepository().listAllProspects(
            Boolean(called),
            Number(limit),
            Number(offset)
          );
        }

        if (userId && role === UserRole.INSIDE_SALES_REP) {
          prospects = prospects.filter(
            (prospect) => prospect.assignedInsideSalesRepId === userId
          );
        }

        return routeResponse(res, {
          has_error: false,
          message: "Prospects fetched successfully",
          data: prospects,
          total,
          offset,
          limit,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch prospects",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/prospects/:id",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const prospect = await getProspectsRepository().getProspect(
          req.params.id
        );
        if (!prospect) {
          return routeResponse(
            res,
            { has_error: true, message: "Prospect not found", data: null },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Prospect fetched successfully",
          data: prospect,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch prospect",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/prospects",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const data = insertProspectSchema.parse(req.body);
        const prospect = await getProspectsRepository().createProspect(data);
        return routeResponse(
          res,
          {
            has_error: false,
            message: "Prospect created successfully",
            data: prospect,
          },
          201
        );
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Invalid prospect data",
            data: error?.message,
          },
          400
        );
      }
    },
  },

  {
    path: "/prospects/:id",
    method: "PATCH",
    handler: async (req: Request, res: Response) => {
      try {
        const prospect = await getProspectsRepository().updateProspect(
          req.params.id,
          req.body
        );
        if (!prospect) {
          return routeResponse(
            res,
            { has_error: true, message: "Prospect not found", data: null },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Prospect updated successfully",
          data: prospect,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update prospect",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/prospects/territory/:territory",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const [prospects] =
          await getProspectsRepository().listProspectsByTerritory(
            req.params.territory
          );
        return routeResponse(res, {
          has_error: false,
          message: "Prospects fetched successfully",
          data: prospects,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch prospects",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/prospects/:id",
    method: "DELETE",
    handler: async (req: Request, res: Response) => {
      try {
        const prospect = await getProspectsRepository().getProspect(
          req.params.id
        );
        if (!prospect) {
          return routeResponse(
            res,
            { has_error: true, message: "Prospect not found", data: null },
            404
          );
        }
        await getProspectsRepository().deleteProspect(req.params.id);
        return routeResponse(res, {
          has_error: false,
          message: "Prospect deleted successfully",
          data: { status: "deleted" },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to delete prospect",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== CALLING LIST ====================
  {
    path: "/calling-list/:fieldRepId",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const { fieldRepId } = req.params;
        const fieldRep = await getFieldRepsRepository().getFieldRep(fieldRepId);

        if (!fieldRep) {
          return routeResponse(
            res,
            { has_error: true, message: "Field rep not found", data: null },
            404
          );
        }

        const [allProspects] =
          await getProspectsRepository().listProspectsByTerritory(
            fieldRep.territory
          );
        const optimizedList = getOptimization().generateSmartCallingList(
          allProspects,
          fieldRep
        );

        return routeResponse(res, {
          has_error: false,
          message: "Calling list generated successfully",
          data: {
            fieldRepId,
            territory: fieldRep.territory,
            count: optimizedList.length,
            prospects: optimizedList.slice(0, 50),
          },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch calling list",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== FIELD REPS ====================
  {
    path: "/field-reps",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const reps = await getFieldRepsRepository().listFieldReps();
        return routeResponse(res, {
          has_error: false,
          message: "Field reps fetched successfully",
          data: reps,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch field reps",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/field-reps",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const data = insertFieldRepSchema.parse(req.body);
        const rep = await getFieldRepsRepository().createFieldRep(data);
        return routeResponse(
          res,
          {
            has_error: false,
            message: "Field rep created successfully",
            data: rep,
          },
          201
        );
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Invalid field rep data",
            data: error?.message,
          },
          400
        );
      }
    },
  },

  {
    path: "/field-reps/:id",
    method: "PATCH",
    handler: async (req: Request, res: Response) => {
      try {
        const rep = await getFieldRepsRepository().updateFieldRep(
          req.params.id,
          req.body
        );
        if (!rep) {
          return routeResponse(
            res,
            { has_error: true, message: "Field rep not found", data: null },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Field rep updated successfully",
          data: rep,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update field rep",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== APPOINTMENTS ====================
  {
    path: "/appointments",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const data = insertAppointmentSchema.parse(req.body);
        const appointment = await getAppointmentsRepository().createAppointment(
          data
        );
        return routeResponse(
          res,
          {
            has_error: false,
            message: "Appointment created successfully",
            data: appointment,
          },
          201
        );
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Invalid appointment data",
            data: error?.message,
          },
          400
        );
      }
    },
  },

  {
    path: "/appointments/:fieldRepId/:date",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const appointments =
          await getAppointmentsRepository().listAppointmentsByFieldRepAndDate(
            req.params.fieldRepId,
            req.params.date
          );
        return routeResponse(res, {
          has_error: false,
          message: "Appointments fetched successfully",
          data: appointments,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch appointments",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/appointments/today",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const territory = req.query.territory as string | undefined;
        console.log("territory", territory);
        const appointments =
          await getAppointmentsRepository().listTodayAppointments(territory);
        return routeResponse(res, {
          has_error: false,
          message: "Today's appointments fetched successfully",
          data: appointments,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch today's appointments",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/appointments/:id",
    method: "PATCH",
    handler: async (req: Request, res: Response) => {
      try {
        const appointment = await getAppointmentsRepository().updateAppointment(
          req.params.id,
          req.body
        );
        if (!appointment) {
          return routeResponse(
            res,
            { has_error: true, message: "Appointment not found", data: null },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Appointment updated successfully",
          data: appointment,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update appointment",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== GEOCODING ====================
  {
    path: "/geocode-prospects",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const unlocated =
          await getProspectsRepository().listProspectsWithoutCoordinates();
        const results = await getGeocoding().geocodeProspects(
          unlocated.map((p) => ({
            id: p.id,
            addressStreet: p.addressStreet || undefined,
            addressCity: p.addressCity || undefined,
            addressState: p.addressState || undefined,
            addressZip: p.addressZip || undefined,
          }))
        );

        // Update prospects with coordinates
        for (const result of results) {
          await getProspectsRepository().updateProspect(result.id, {
            addressLat: result.lat.toString(),
            addressLng: result.lng.toString(),
          });
        }

        return routeResponse(res, {
          has_error: false,
          message: "Prospects geocoded successfully",
          data: { geocoded: results.length, total: unlocated.length },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to geocode prospects",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/recalculate-priorities",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const [prospects] =
          await getProspectsRepository().listProspectsByTerritory(
            (req.body.territory as string) || ""
          );

        for (const prospect of prospects) {
          const score = getOptimization().calculatePriorityScore(prospect);
          await getProspectsRepository().updateProspect(prospect.id, {
            priorityScore: score,
          });
        }

        return routeResponse(res, {
          has_error: false,
          message: "Priorities recalculated successfully",
          data: { updated: prospects.length },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to recalculate priorities",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== STAKEHOLDERS ====================
  {
    path: "/stakeholders/:prospectId",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const stakeholders =
          await getStakeholdersRepository().listStakeholdersByProspect(
            req.params.prospectId
          );
        return routeResponse(res, {
          has_error: false,
          message: "Stakeholders fetched successfully",
          data: stakeholders,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch stakeholders",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/stakeholders",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const data = insertStakeholderSchema.parse(req.body);
        const stakeholder = await getStakeholdersRepository().createStakeholder(
          data
        );
        return routeResponse(
          res,
          {
            has_error: false,
            message: "Stakeholder created successfully",
            data: stakeholder,
          },
          201
        );
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Invalid stakeholder data",
            data: error?.message,
          },
          400
        );
      }
    },
  },

  {
    path: "/stakeholders/detail/:id",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const stakeholder = await getStakeholdersRepository().getStakeholder(
          req.params.id
        );
        if (!stakeholder) {
          return routeResponse(
            res,
            { has_error: true, message: "Stakeholder not found", data: null },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Stakeholder fetched successfully",
          data: stakeholder,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch stakeholder",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/stakeholders/:id",
    method: "PATCH",
    handler: async (req: Request, res: Response) => {
      try {
        const stakeholder = await getStakeholdersRepository().updateStakeholder(
          req.params.id,
          req.body
        );
        if (!stakeholder) {
          return routeResponse(
            res,
            { has_error: true, message: "Stakeholder not found", data: null },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Stakeholder updated successfully",
          data: stakeholder,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update stakeholder",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/stakeholders/:id",
    method: "DELETE",
    handler: async (req: Request, res: Response) => {
      try {
        await getStakeholdersRepository().deleteStakeholder(req.params.id);
        return routeResponse(res, {
          has_error: false,
          message: "Stakeholder deleted successfully",
          data: { status: "deleted" },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to delete stakeholder",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== USERS ====================
  {
    path: "/users",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const users = await getUsersRepository().listUsers();
        return routeResponse(res, {
          has_error: false,
          message: "Users fetched successfully",
          data: users,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch users",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/users",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const input = createUserSchema.parse(req.body);
        const passwordHash = input.passwordHash
          ? input.passwordHash
          : input.password
          ? await bcrypt.hash(input.password, 10)
          : null;
        if (!passwordHash) {
          return routeResponse(
            res,
            { has_error: true, message: "Password is required", data: null },
            400
          );
        }
        const user = await getUsersRepository().createUser({
          email: input.email,
          name: input.name,
          role: input.role,
          territory: input.territory,
          isActive: input.isActive ?? true,
          passwordHash,
        });

        try {
          const resetToken = buildResetToken(user);
          const link = buildResetLink(resetToken);
          await getEmail().sendInviteEmail(user.email, user.name, link);
        } catch (mailErr) {
          console.warn("Failed to send invite email", mailErr);
        }

        return routeResponse(
          res,
          {
            has_error: false,
            message: "User created successfully",
            data: user,
          },
          201
        );
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Invalid user data",
            data: error?.message,
          },
          400
        );
      }
    },
  },

  {
    path: "/users/:id",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const user = await getUsersRepository().getUser(req.params.id);
        if (!user) {
          return routeResponse(
            res,
            { has_error: true, message: "User not found", data: null },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "User fetched successfully",
          data: user,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch user",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/users/email/:email",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const user = await getUsersRepository().getUserByEmail(
          req.params.email
        );
        if (!user) {
          return routeResponse(
            res,
            { has_error: true, message: "User not found", data: null },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "User fetched successfully",
          data: user,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch user",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/users/:id",
    method: "PATCH",
    handler: async (req: Request, res: Response) => {
      try {
        const updateData: any = { ...req.body };
        if (req.body?.password) {
          updateData.passwordHash = await bcrypt.hash(req.body.password, 10);
          delete updateData.password;
        }
        const user = await getUsersRepository().updateUser(
          req.params.id,
          updateData
        );
        if (!user) {
          return routeResponse(
            res,
            { has_error: true, message: "User not found", data: null },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "User updated successfully",
          data: user,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update user",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/users/:id",
    method: "DELETE",
    handler: async (req: Request, res: Response) => {
      try {
        await getUsersRepository().deleteUser(req.params.id);
        return routeResponse(res, {
          has_error: false,
          message: "User deleted successfully",
          data: { status: "deleted" },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to delete user",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== USER TERRITORIES & PROFESSIONS ====================
  {
    path: "/users/:id/territories",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const territories =
          await getUserTerritoriesRepository().getUserTerritories(
            req.params.id
          );
        return routeResponse(res, {
          has_error: false,
          message: "User territories fetched successfully",
          data: territories.map((t) => t.territory),
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch user territories",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/users/:id/territories",
    method: "PUT",
    handler: async (req: Request, res: Response) => {
      try {
        const { territories } = req.body;
        if (!Array.isArray(territories)) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "territories must be an array",
              data: null,
            },
            400
          );
        }
        const result = await getUserTerritoriesRepository().setUserTerritories(
          req.params.id,
          territories
        );
        return routeResponse(res, {
          has_error: false,
          message: "User territories updated successfully",
          data: result!.map((t) => t.territory),
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update user territories",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/users/:id/professions",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const professions =
          await getUserProfessionsRepository().getUserProfessions(
            req.params.id
          );
        return routeResponse(res, {
          has_error: false,
          message: "User professions fetched successfully",
          data: professions.map((p) => p.profession),
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch user professions",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/users/:id/professions",
    method: "PUT",
    handler: async (req: Request, res: Response) => {
      try {
        const { professions } = req.body;
        if (!Array.isArray(professions)) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "professions must be an array",
              data: null,
            },
            400
          );
        }
        const result = await getUserProfessionsRepository().setUserProfessions(
          req.params.id,
          professions
        );
        return routeResponse(res, {
          has_error: false,
          message: "User professions updated successfully",
          data: result.map((p) => p.profession),
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update user professions",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/users/:id/assignments",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const [territories, professions] = await Promise.all([
          getUserTerritoriesRepository().getUserTerritories(req.params.id),
          getUserProfessionsRepository().getUserProfessions(req.params.id),
        ]);
        return routeResponse(res, {
          has_error: false,
          message: "User assignments fetched successfully",
          data: {
            territories: territories.map((t) => t.territory),
            professions: professions.map((p) => p.profession),
          },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch user assignments",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/users/:id/assignments",
    method: "PUT",
    handler: async (req: Request, res: Response) => {
      try {
        const { territories, professions } = req.body;
        if (!Array.isArray(territories) || !Array.isArray(professions)) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "territories and professions must be arrays",
              data: null,
            },
            400
          );
        }

        const [newTerritories, newProfessions] = await Promise.all([
          getUserTerritoriesRepository().setUserTerritories(
            req.params.id,
            territories
          ),
          getUserProfessionsRepository().setUserProfessions(
            req.params.id,
            professions
          ),
        ]);

        return routeResponse(res, {
          has_error: false,
          message: "User assignments updated successfully",
          data: {
            territories: newTerritories!.map((t) => t.territory),
            professions: newProfessions.map((p) => p.profession),
          },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update user assignments",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== SPECIALTY COLORS ====================
  {
    path: "/specialty-colors",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const now = Date.now();
        // Cache for 5 minutes
        if (cachedColors && now - colorsCacheTime < 300000) {
          return routeResponse(res, {
            has_error: false,
            message: "Specialty colors fetched successfully",
            data: cachedColors,
          });
        }

        const colors =
          await getSpecialtyColorsRepository().listSpecialtyColors();
        cachedColors = colors;
        colorsCacheTime = now;
        return routeResponse(res, {
          has_error: false,
          message: "Specialty colors fetched successfully",
          data: colors,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch specialty colors",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/specialty-colors/:specialty",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const color = await getSpecialtyColorsRepository().getSpecialtyColor(
          req.params.specialty
        );
        if (!color) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Specialty color not found",
              data: null,
            },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Specialty color fetched successfully",
          data: color,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch specialty color",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/specialty-colors/:specialty",
    method: "PATCH",
    handler: async (req: Request, res: Response) => {
      try {
        const color = await getSpecialtyColorsRepository().updateSpecialtyColor(
          req.params.specialty,
          req.body
        );
        if (!color) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Specialty color not found",
              data: null,
            },
            404
          );
        }
        cachedColors = null; // Clear cache
        return routeResponse(res, {
          has_error: false,
          message: "Specialty color updated successfully",
          data: color,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update specialty color",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== CALL HISTORY ====================
  {
    path: "/call-history",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const { limit, offset, callerId, search } = req.query;
        const [callHistory, total] =
          await getCallHistoryRepository().getAllCallHistory(
            Number(limit) || 20,
            Number(offset) || 0,
            callerId ? String(callerId) : undefined,
            search ? String(search) : undefined
          );
        if (!callHistory) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Call history not found",
              data: null,
            },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Call history fetched successfully",
          data: callHistory,
          total,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch Call History",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== TERRITORIES ====================
  {
    path: "/territories",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const territories =
          await getTerritoriesRepository().getAllTerritories();
        return routeResponse(res, {
          has_error: false,
          message: "Territories fetched successfully",
          data: territories,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch territories",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/territories/:id",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const territory = await getTerritoriesRepository().getTerritoryById(
          req.params.id
        );
        if (!territory) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Territory not found",
              data: null,
            },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Territory fetched successfully",
          data: territory,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch territory",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/territories",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const data = insertTerritorySchema.parse(req.body);
        // Check if territory with same name already exists
        const existing = await getTerritoriesRepository().getTerritoryByName(
          data.name
        );
        if (existing) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Territory with this name already exists",
              data: null,
            },
            409
          );
        }
        const territory = await getTerritoriesRepository().createTerritory(
          data
        );
        return routeResponse(
          res,
          {
            has_error: false,
            message: "Territory created successfully",
            data: territory,
          },
          201
        );
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Invalid territory data",
            data: error?.message,
          },
          400
        );
      }
    },
  },

  {
    path: "/territories/:id",
    method: "PATCH",
    handler: async (req: Request, res: Response) => {
      try {
        const data = insertTerritorySchema.partial().parse(req.body);
        // If name is being updated, check for duplicates
        if (data.name) {
          const existing = await getTerritoriesRepository().getTerritoryByName(
            data.name
          );
          if (existing && existing.id !== req.params.id) {
            return routeResponse(
              res,
              {
                has_error: true,
                message: "Territory with this name already exists",
                data: null,
              },
              409
            );
          }
        }
        const territory = await getTerritoriesRepository().updateTerritory(
          req.params.id,
          data
        );
        if (!territory) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Territory not found",
              data: null,
            },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Territory updated successfully",
          data: territory,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update territory",
            data: error?.message,
          },
          400
        );
      }
    },
  },

  {
    path: "/territories/:id",
    method: "DELETE",
    handler: async (req: Request, res: Response) => {
      try {
        const deleted = await getTerritoriesRepository().deleteTerritory(
          req.params.id
        );
        if (!deleted) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Territory not found",
              data: null,
            },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Territory deleted successfully",
          data: null,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to delete territory",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== PROFESSIONS ====================
  {
    path: "/professions",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const professions =
          await getProfessionsRepository().getAllProfessions();
        return routeResponse(res, {
          has_error: false,
          message: "Professions fetched successfully",
          data: professions,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch professions",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/professions/:id",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const profession = await getProfessionsRepository().getProfessionById(
          req.params.id
        );
        if (!profession) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Profession not found",
              data: null,
            },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Profession fetched successfully",
          data: profession,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch profession",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/professions",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const data = insertProfessionSchema.parse(req.body);
        // Check if profession with same name already exists
        const existing = await getProfessionsRepository().getProfessionByName(
          data.name
        );
        if (existing) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Profession with this name already exists",
              data: null,
            },
            409
          );
        }
        const profession = await getProfessionsRepository().createProfession(
          data
        );
        return routeResponse(
          res,
          {
            has_error: false,
            message: "Profession created successfully",
            data: profession,
          },
          201
        );
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Invalid profession data",
            data: error?.message,
          },
          400
        );
      }
    },
  },

  {
    path: "/professions/:id",
    method: "PATCH",
    handler: async (req: Request, res: Response) => {
      try {
        const data = insertProfessionSchema.partial().parse(req.body);
        // If name is being updated, check for duplicates
        if (data.name) {
          const existing = await getProfessionsRepository().getProfessionByName(
            data.name
          );
          if (existing && existing.id !== req.params.id) {
            return routeResponse(
              res,
              {
                has_error: true,
                message: "Profession with this name already exists",
                data: null,
              },
              409
            );
          }
        }
        const profession = await getProfessionsRepository().updateProfession(
          req.params.id,
          data
        );
        if (!profession) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Profession not found",
              data: null,
            },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Profession updated successfully",
          data: profession,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update profession",
            data: error?.message,
          },
          400
        );
      }
    },
  },

  {
    path: "/professions/:id",
    method: "DELETE",
    handler: async (req: Request, res: Response) => {
      try {
        const deleted = await getProfessionsRepository().deleteProfession(
          req.params.id
        );
        if (!deleted) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Profession not found",
              data: null,
            },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Profession deleted successfully",
          data: null,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to delete profession",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== CALL OUTCOMES ====================
  {
    path: "/call-outcomes",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const now = Date.now();
        // Cache for 5 minutes
        if (cachedOutcomes && now - outcomesCacheTime < 300000) {
          return routeResponse(res, {
            has_error: false,
            message: "Call outcomes fetched successfully",
            data: cachedOutcomes,
          });
        }

        const outcomes = await getCallOutcomesRepository().listCallOutcomes();
        cachedOutcomes = outcomes;
        outcomesCacheTime = now;
        return routeResponse(res, {
          has_error: false,
          message: "Call outcomes fetched successfully",
          data: outcomes,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch call outcomes",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/call-outcomes",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const data = insertCallOutcomeSchema.parse(req.body);
        const outcome = await getCallOutcomesRepository().createCallOutcome(
          data
        );
        cachedOutcomes = null; // Clear cache
        return routeResponse(
          res,
          {
            has_error: false,
            message: "Call outcome created successfully",
            data: outcome,
          },
          201
        );
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Invalid call outcome data",
            data: error?.message,
          },
          400
        );
      }
    },
  },

  {
    path: "/call-outcomes/:id",
    method: "PATCH",
    handler: async (req: Request, res: Response) => {
      try {
        const outcome = await getCallOutcomesRepository().updateCallOutcome(
          req.params.id,
          req.body
        );
        if (!outcome) {
          return routeResponse(
            res,
            { has_error: true, message: "Call outcome not found", data: null },
            404
          );
        }
        cachedOutcomes = null; // Clear cache
        return routeResponse(res, {
          has_error: false,
          message: "Call outcome updated successfully",
          data: outcome,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update call outcome",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/call-outcomes/:id",
    method: "DELETE",
    handler: async (req: Request, res: Response) => {
      try {
        await getCallOutcomesRepository().deleteCallOutcome(req.params.id);
        cachedOutcomes = null; // Clear cache
        return routeResponse(res, {
          has_error: false,
          message: "Call outcome deleted successfully",
          data: { success: true },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to delete call outcome",
            data: error?.message,
          },
          500
        );
      }
    },
  },
  {
    path: "/call-outcome",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const { prospectId, callerId, outcome, notes } = req.body;
        await getCallHistoryRepository().recordCallOutcome(
          prospectId,
          callerId,
          outcome,
          notes
        );
        return routeResponse(res, {
          has_error: false,
          message: "Call outcome recorded successfully",
          data: { status: "recorded" },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to record call outcome",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/call-outcomes/init",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        await getCallOutcomesRepository().initializeCallOutcomes();
        return routeResponse(res, {
          has_error: false,
          message: "Call outcomes initialized successfully",
          data: { status: "initialized" },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to initialize call outcome",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== LIVEKIT ====================
  {
    path: "/livekit/config",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        return routeResponse(res, {
          has_error: false,
          message: "LiveKit config fetched successfully",
          data: {
            configured: getLiveKit().isConfigured(),
            url: getLiveKit().getLiveKitUrl(),
          },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch LiveKit config",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/livekit/token",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const { identity, roomName, name } = req.body;
        if (!identity) {
          return routeResponse(
            res,
            { has_error: true, message: "Identity is required", data: null },
            400
          );
        }

        const room = roomName || `room_${identity}_${Date.now()}`;
        const token = await getLiveKit().generateLiveKitToken(identity, room, {
          name,
        });

        return routeResponse(res, {
          has_error: false,
          message: "LiveKit token generated successfully",
          data: {
            token,
            identity,
            roomName: room,
            url: getLiveKit().getLiveKitUrl(),
          },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to generate LiveKit token",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/livekit/call",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const { callerId, callerName, phoneNumber, prospectId } = req.body;
        if (!callerId || !phoneNumber) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "callerId and phoneNumber are required",
              data: null,
            },
            400
          );
        }

        const roomName = getLiveKit().generateCallRoomName(
          callerId,
          phoneNumber
        );
        const token = await getLiveKit().generateLiveKitToken(
          callerId,
          roomName,
          { name: callerName }
        );

        // Log call attempt if prospectId provided
        if (prospectId) {
          await getCallHistoryRepository().recordCallOutcome(
            prospectId,
            callerId,
            "Call initiated",
            `LiveKit Room: ${roomName}`
          );
        }

        return routeResponse(res, {
          has_error: false,
          message: "Call room created successfully",
          data: {
            success: true,
            roomName,
            token,
            url: getLiveKit().getLiveKitUrl(),
            phoneNumber,
          },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to create call room",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/livekit/end-call",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const { roomName, prospectId, callerId, outcome, notes, duration } =
          req.body;

        if (prospectId && callerId) {
          const outcomeText = outcome || "Call ended";
          const noteText =
            notes || `Duration: ${duration || 0}s, Room: ${roomName}`;
          await getCallHistoryRepository().recordCallOutcome(
            prospectId,
            callerId,
            outcomeText,
            noteText
          );
        }

        return routeResponse(res, {
          has_error: false,
          message: "Call ended successfully",
          data: { success: true },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to record call end",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== BULK OPERATIONS ====================
  {
    path: "/bulk-search",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const { specialty, location } = req.body;
        if (!specialty || !location) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "Missing specialty or location",
              data: null,
            },
            400
          );
        }

        const results = await getGeocoding().searchProfessionalsByLocation(
          specialty,
          location
        );
        return routeResponse(res, {
          has_error: false,
          message: "Search completed successfully",
          data: { results },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          { has_error: true, message: "Search failed", data: error?.message },
          500
        );
      }
    },
  },

  {
    path: "/bulk-add",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const { contacts, territory, specialty } = req.body;
        if (!Array.isArray(contacts) || !territory || !specialty) {
          return routeResponse(
            res,
            { has_error: true, message: "Invalid request body", data: null },
            400
          );
        }

        const [existingProspects] =
          await getProspectsRepository().listAllProspects();
        const existingPhones = new Set(
          existingProspects.map((p) => p.phoneNumber)
        );
        const insideSalesReps =
          await getUsersRepository().listInsideSalesReps();

        const added: any[] = [];
        const skipped: any[] = [];

        if (insideSalesReps.length === 0) {
          return routeResponse(
            res,
            {
              has_error: true,
              message: "No inside sales reps found",
              data: {
                added: 0,
                skipped: 0,
                details: { added: [], skipped: [] },
              },
            },
            400
          );
        }

        await roundRobin(
          insideSalesReps,
          contacts,
          async (prospectContact, insideSalesRep) => {
            const hasNoPhone = !prospectContact.phone;
            const isAlreadyInDatabase = existingPhones.has(
              prospectContact.phone
            );

            if (hasNoPhone || isAlreadyInDatabase) {
              skipped.push({
                name: prospectContact.name,
                reason: hasNoPhone ? "No phone number" : "Already in database",
              });
            } else {
              try {
                const prospect = await getProspectsRepository().createProspect({
                  businessName: prospectContact.name,
                  phoneNumber: prospectContact.phone,
                  addressStreet: prospectContact.address,
                  addressCity: prospectContact.city,
                  addressState: prospectContact.state,
                  addressZip: prospectContact.zip,
                  specialty,
                  territory,
                  addressLat: prospectContact.latitude?.toString(),
                  addressLng: prospectContact.longitude?.toString(),
                  assignedInsideSalesRepId: insideSalesRep.id,
                });

                added.push(prospect);
              } catch (err) {
                skipped.push({
                  name: prospectContact.name,
                  reason: "Failed to add",
                });
              }
            }
          }
        );

        return routeResponse(res, {
          has_error: false,
          message: "Bulk add completed",
          data: {
            added: added.length,
            skipped: skipped.length,
            details: { added, skipped },
          },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to add contacts",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/update-prospect-addresses",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const [prospects] = await getProspectsRepository().listAllProspects();
        let updated = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const prospect of prospects) {
          try {
            const address = [
              prospect.addressStreet,
              prospect.addressCity,
              prospect.addressState,
              prospect.addressZip,
            ]
              .filter(Boolean)
              .join(", ");

            if (!address) {
              failed++;
              errors.push(`Prospect ${prospect.id}: No address to lookup`);
              continue;
            }

            const result = await getGeocoding().getFullAddressFromHere(address);
            if (result) {
              await getProspectsRepository().updateProspect(prospect.id, {
                addressStreet: result.street || prospect.addressStreet,
                addressCity: result.city || prospect.addressCity,
                addressState: result.state || prospect.addressState,
                addressZip: result.zip || prospect.addressZip,
                addressLat: result.latitude.toString(),
                addressLng: result.longitude.toString(),
              });
              updated++;
            } else {
              failed++;
              errors.push(`Prospect ${prospect.id}: HERE API lookup failed`);
            }

            // Rate limiting
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (err) {
            failed++;
            errors.push(
              `Prospect ${prospect.id}: ${
                err instanceof Error ? err.message : "Unknown error"
              }`
            );
          }
        }

        return routeResponse(res, {
          has_error: false,
          message: "Prospect addresses updated",
          data: {
            total: prospects.length,
            updated,
            failed,
            errors: errors.slice(0, 10), // Return first 10 errors
          },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update prospect addresses",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== ISSUES ====================
  {
    path: "/issues",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const status = req.query.status as string | undefined;
        const issues = await getIssuesRepository().listIssues(status);
        return routeResponse(res, {
          has_error: false,
          message: "Issues fetched successfully",
          data: issues,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch issues",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/issues/:id",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const issue = await getIssuesRepository().getIssue(req.params.id);
        if (!issue) {
          return routeResponse(
            res,
            { has_error: true, message: "Issue not found", data: null },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Issue fetched successfully",
          data: issue,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch issue",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/issues",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const data = insertIssueSchema.parse(req.body);
        const syncToLinear = req.body.syncToLinear !== false;

        let linearIssueId: string | undefined = undefined;
        let linearIssueUrl: string | undefined = undefined;

        if (syncToLinear) {
          try {
            const linearResult = await getLinear().createLinearIssue({
              title: data.title,
              description: data.description || undefined,
              priority: data.priority || 2,
            });

            if (linearResult.success && linearResult.issue) {
              const linearIssue = await linearResult.issue;
              linearIssueId = linearIssue.id;
              linearIssueUrl = linearIssue.url;
            }
          } catch (linearError) {
            console.warn("Failed to sync to Linear:", linearError);
          }
        }

        const issue = await getIssuesRepository().createIssue({
          ...data,
          priority: (data.priority || 2) as 0 | 1 | 2 | 3 | 4,
          linearIssueId: linearIssueId || undefined,
          linearIssueUrl: linearIssueUrl || undefined,
        });

        return routeResponse(
          res,
          {
            has_error: false,
            message: "Issue created successfully",
            data: issue,
          },
          201
        );
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Invalid issue data",
            data: error?.message,
          },
          400
        );
      }
    },
  },

  {
    path: "/issues/:id",
    method: "PATCH",
    handler: async (req: Request, res: Response) => {
      try {
        const issue = await getIssuesRepository().updateIssue(
          req.params.id,
          req.body
        );
        if (!issue) {
          return routeResponse(
            res,
            { has_error: true, message: "Issue not found", data: null },
            404
          );
        }
        return routeResponse(res, {
          has_error: false,
          message: "Issue updated successfully",
          data: issue,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to update issue",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/issues/:id",
    method: "DELETE",
    handler: async (req: Request, res: Response) => {
      try {
        await getIssuesRepository().deleteIssue(req.params.id);
        return routeResponse(res, {
          has_error: false,
          message: "Issue deleted successfully",
          data: { success: true },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to delete issue",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== LINEAR ====================
  {
    path: "/linear/teams",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const teams = await getLinear().getLinearTeams();
        return routeResponse(res, {
          has_error: false,
          message: "Linear teams fetched successfully",
          data: teams,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch Linear teams",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/linear/issues",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const teamId = req.query.teamId as string | undefined;
        const issues = await getLinear().getLinearIssues(teamId);
        return routeResponse(res, {
          has_error: false,
          message: "Linear issues fetched successfully",
          data: issues,
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch Linear issues",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  // ==================== TWILIO ====================
  {
    path: "/twilio/token",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const { identity } = req.body;
        if (!identity) {
          return routeResponse(
            res,
            { has_error: true, message: "Identity is required", data: null },
            400
          );
        }

        const token = getTwilioService().generateAccessToken(identity);
        return routeResponse(res, {
          has_error: false,
          message: "Twilio token generated successfully",
          data: { token, identity },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to generate Twilio token",
            data: error?.message,
          },
          500
        );
      }
    },
  },

  {
    path: "/twilio/voice",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const to = req.body.To || req.body.to;
        const prospectId = req.body.prospectId;
        console.log("twilio voice", req.body);
        console.log("twilio voice", to);
        console.log("twilio voice", prospectId);
        const twiml = getTwilioService().getTwiMLForBrowserCall(
          to,
          undefined,
          prospectId
        );
        res.type("text/xml");
        return res.send(twiml);
      } catch (error: any) {
        return res.status(500).send("Error generating TwiML");
      }
    },
  },

  {
    path: "/twilio/status",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const { CallSid, ParentCallSid, CallStatus, To, Duration } = req.body;
        const prospectId = req.query.prospectId as string | undefined;

        // Use ParentCallSid if available (for browser calls), otherwise use CallSid
        // This ensures we use the same CallSid as the recording webhook
        const callSidToUse = ParentCallSid || CallSid;

        console.log(
          `Call ${callSidToUse} to ${To}: ${CallStatus} (duration: ${Duration}s)`
        );
        if (prospectId) {
          console.log(`ProspectId: ${prospectId}`);
        }
        if (ParentCallSid) {
          console.log(
            `Using ParentCallSid: ${ParentCallSid} instead of ${CallSid}`
          );
        }

        // Save call status to database
        if (callSidToUse && CallStatus) {
          await getCallHistoryRepository().upsertCallHistory({
            callSid: callSidToUse,
            status: CallStatus,
            prospectId,
          });
        }

        return res.sendStatus(200);
      } catch (error: any) {
        return res.sendStatus(500);
      }
    },
  },

  {
    path: "/twilio/recording",
    method: "POST",
    handler: async (req: Request, res: Response) => {
      try {
        const { RecordingUrl, CallSid, RecordingDuration, To, From } = req.body;

        console.log(`Received recording webhook for call ${CallSid}`);
        console.log(`Webhook body:`, JSON.stringify(req.body, null, 2));

        if (!RecordingUrl || !CallSid) {
          console.error("Missing RecordingUrl or CallSid in webhook");
          return res.sendStatus(400);
        }

        // Process recording asynchronously (don't block Twilio webhook)
        (async () => {
          try {
            // Download from Twilio, upload to S3
            const recordingService = getTwilio();

            // Get phone number from query parameter (we pass it in recordingStatusCallback URL)
            // Fallback to webhook body if not in query params
            let phoneNumber = req.query.phoneNumber as string | undefined;

            const s3Url = await recordingService.processRecording(
              RecordingUrl,
              CallSid,
              phoneNumber
            );

            // Save recording URL and duration to database
            const prospectId = req.query.prospectId as string | undefined;
            await getCallHistoryRepository().upsertCallHistory({
              callSid: CallSid,
              recordingUrl: s3Url,
              duration: RecordingDuration
                ? parseInt(RecordingDuration)
                : undefined,
              outcome: "Call completed",
              prospectId, // Add prospectId from query params
            });

            console.log(
              `Successfully processed recording for ${CallSid}: ${s3Url}`
            );
          } catch (error: any) {
            console.error(
              `Error processing recording for ${CallSid}:`,
              error?.message || error
            );
          }
        })();

        // Immediately respond to Twilio
        return res.sendStatus(200);
      } catch (error: any) {
        console.error("Error in recording webhook:", error);
        return res.sendStatus(500);
      }
    },
  },

  {
    path: "/twilio/config",
    method: "GET",
    handler: async (req: Request, res: Response) => {
      try {
        const phoneNumber = getTwilioService().getPhoneNumber();
        return routeResponse(res, {
          has_error: false,
          message: "Twilio config fetched successfully",
          data: {
            configured: getTwilioService().isConfigured(),
            phoneNumber: phoneNumber
              ? phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")
              : null,
          },
        });
      } catch (error: any) {
        return routeResponse(
          res,
          {
            has_error: true,
            message: "Failed to fetch Twilio config",
            data: error?.message,
          },
          500
        );
      }
    },
  },
];
