import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertProspectSchema,
  insertFieldRepSchema,
  insertAppointmentSchema,
  insertStakeholderSchema,
  insertUserSchema,
  insertSpecialtyColorSchema,
  insertCallOutcomeSchema,
  insertIssueSchema,
} from "./db/schema";
import {
  createLinearIssue,
  getLinearIssues,
  getLinearTeams,
  getLinearLabels,
} from "./services/linear";
import {
  generateSmartCallingList,
  calculatePriorityScore,
} from "./services/optimization";
import { geocodeProspects, getFullAddressFromHere } from "./services/geocoding";
import { seedDatabase } from "./scripts/seedData";
import { seedAllMockData } from "./scripts/seedAllData";
import {
  generateAccessToken,
  getTwiMLForBrowserCall,
  makeOutboundCall,
  phoneNumber as twilioPhoneNumber,
} from "./services/twilio";
import {
  searchProfessionalsByLocation,
  type ProfessionalSearchResult,
} from "./services/geocoding";
import {
  generateLiveKitToken,
  isLiveKitConfigured,
  getLiveKitUrl,
  generateCallRoomName,
} from "./services/livekit";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed database on startup - COMMENTED OUT TO PREVENT STARTUP ERRORS
  await seedDatabase().catch((err) =>
    console.error("Failed to seed database:", err)
  );
  await seedAllMockData().catch((err) =>
    console.error("Failed to seed mock data:", err)
  );

  // Initialize specialty colors
  await storage
    .initializeSpecialtyColors([
      "Dental",
      "Chiropractor",
      "Optometry",
      "Physical Therapy",
      "Orthodontics",
    ])
    .catch((err) =>
      console.error("Failed to initialize specialty colors:", err)
    );

  // Initialize call outcomes
  await storage
    .initializeCallOutcomes()
    .catch((err) => console.error("Failed to initialize call outcomes:", err));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // GET /api/prospects - List all prospects with pagination
  app.get("/api/prospects", async (req, res) => {
    try {
      const territory = req.query.territory as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      let prospects;
      if (territory) {
        prospects = await storage.listProspectsByTerritory(territory);
      } else {
        prospects = await storage.listAllProspects();
      }

      const total = prospects.length;
      const paginated = prospects.slice(offset, offset + limit);

      res.json({ data: paginated, total, offset, limit });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prospects" });
    }
  });

  // GET /api/calling-list/:fieldRepId - Get smart optimized calling list for field rep
  app.get("/api/calling-list/:fieldRepId", async (req, res) => {
    try {
      const { fieldRepId } = req.params;
      const fieldRep = await storage.getFieldRep(fieldRepId);

      if (!fieldRep) {
        return res.status(404).json({ error: "Field rep not found" });
      }

      const allProspects = await storage.listProspectsByTerritory(
        fieldRep.territory
      );

      // Generate smart calling list
      const optimizedList = generateSmartCallingList(allProspects, fieldRep);

      res.json({
        fieldRepId,
        territory: fieldRep.territory,
        count: optimizedList.length,
        prospects: optimizedList.slice(0, 50),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calling list" });
    }
  });

  // POST /api/prospects - Create prospect
  app.post("/api/prospects", async (req, res) => {
    try {
      const data = insertProspectSchema.parse(req.body);
      const prospect = await storage.createProspect(data);
      res.status(201).json(prospect);
    } catch (error) {
      res.status(400).json({ error: "Invalid prospect data" });
    }
  });

  // GET /api/prospects/:id - Get prospect
  app.get("/api/prospects/:id", async (req, res) => {
    try {
      const prospect = await storage.getProspect(req.params.id);
      if (!prospect) {
        return res.status(404).json({ error: "Prospect not found" });
      }
      res.json(prospect);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prospect" });
    }
  });

  // PATCH /api/prospects/:id - Update prospect
  app.patch("/api/prospects/:id", async (req, res) => {
    try {
      const prospect = await storage.updateProspect(req.params.id, req.body);
      if (!prospect) {
        return res.status(404).json({ error: "Prospect not found" });
      }
      res.json(prospect);
    } catch (error) {
      res.status(500).json({ error: "Failed to update prospect" });
    }
  });

  // GET /api/field-reps - List all field reps
  app.get("/api/field-reps", async (req, res) => {
    try {
      const reps = await storage.listFieldReps();
      res.json(reps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch field reps" });
    }
  });

  // POST /api/field-reps - Create field rep
  app.post("/api/field-reps", async (req, res) => {
    try {
      const data = insertFieldRepSchema.parse(req.body);
      const rep = await storage.createFieldRep(data);
      res.status(201).json(rep);
    } catch (error) {
      res.status(400).json({ error: "Invalid field rep data" });
    }
  });

  // POST /api/appointments - Create appointment
  app.post("/api/appointments", async (req, res) => {
    try {
      const data = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(data);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ error: "Invalid appointment data" });
    }
  });

  // GET /api/appointments/:fieldRepId/:date - Get appointments for field rep on date
  app.get("/api/appointments/:fieldRepId/:date", async (req, res) => {
    try {
      const appointments = await storage.listAppointmentsByFieldRepAndDate(
        req.params.fieldRepId,
        req.params.date
      );
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // GET /api/appointments/today - Get all today's appointments with details
  app.get("/api/appointments/today", async (req, res) => {
    try {
      const territory = req.query.territory as string | undefined;
      const appointments = await storage.listTodayAppointments(territory);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today's appointments" });
    }
  });

  // POST /api/call-outcome - Record call outcome
  app.post("/api/call-outcome", async (req, res) => {
    try {
      const { prospectId, callerId, outcome, notes } = req.body;
      await storage.recordCallOutcome(prospectId, callerId, outcome, notes);
      res.json({ status: "recorded" });
    } catch (error) {
      res.status(500).json({ error: "Failed to record call outcome" });
    }
  });

  // POST /api/geocode-prospects - Geocode unlocated prospects
  app.post("/api/geocode-prospects", async (req, res) => {
    try {
      const unlocated = await storage.listProspectsWithoutCoordinates();
      const results = await geocodeProspects(
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
        await storage.updateProspect(result.id, {
          addressLat: result.lat.toString() as any,
          addressLng: result.lng.toString() as any,
        });
      }

      res.json({
        geocoded: results.length,
        total: unlocated.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to geocode prospects" });
    }
  });

  // POST /api/recalculate-priorities - Recalculate priority scores for all prospects
  app.post("/api/recalculate-priorities", async (req, res) => {
    try {
      const prospects = await storage.listProspectsByTerritory(
        req.body.territory || ""
      );

      for (const prospect of prospects) {
        const score = calculatePriorityScore(prospect);
        await storage.updateProspect(prospect.id, { priorityScore: score });
      }

      res.json({
        updated: prospects.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to recalculate priorities" });
    }
  });

  // GET /api/stakeholders/:prospectId - Get stakeholders for a prospect
  app.get("/api/stakeholders/:prospectId", async (req, res) => {
    try {
      const stakeholders = await storage.listStakeholdersByProspect(
        req.params.prospectId
      );
      res.json(stakeholders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stakeholders" });
    }
  });

  // POST /api/stakeholders - Create stakeholder
  app.post("/api/stakeholders", async (req, res) => {
    try {
      const data = insertStakeholderSchema.parse(req.body);
      const stakeholder = await storage.createStakeholder(data);
      res.status(201).json(stakeholder);
    } catch (error) {
      res.status(400).json({ error: "Invalid stakeholder data" });
    }
  });

  // GET /api/stakeholders/detail/:id - Get single stakeholder
  app.get("/api/stakeholders/detail/:id", async (req, res) => {
    try {
      const stakeholder = await storage.getStakeholder(req.params.id);
      if (!stakeholder) {
        return res.status(404).json({ error: "Stakeholder not found" });
      }
      res.json(stakeholder);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stakeholder" });
    }
  });

  // PATCH /api/stakeholders/:id - Update stakeholder
  app.patch("/api/stakeholders/:id", async (req, res) => {
    try {
      const stakeholder = await storage.updateStakeholder(
        req.params.id,
        req.body
      );
      if (!stakeholder) {
        return res.status(404).json({ error: "Stakeholder not found" });
      }
      res.json(stakeholder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update stakeholder" });
    }
  });

  // DELETE /api/stakeholders/:id - Delete stakeholder
  app.delete("/api/stakeholders/:id", async (req, res) => {
    try {
      await storage.deleteStakeholder(req.params.id);
      res.json({ status: "deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stakeholder" });
    }
  });

  // GET /api/users - List all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // POST /api/users - Create user
  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // GET /api/users/:id - Get user
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // GET /api/users/email/:email - Get user by email
  app.get("/api/users/email/:email", async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // PATCH /api/users/:id - Update user
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // DELETE /api/users/:id - Delete user
  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ status: "deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // ============================================================
  // USER TERRITORY AND PROFESSION ASSIGNMENT ROUTES
  // SECURITY NOTE: These routes currently have no server-side
  // authentication. The frontend enforces role-based access via
  // UserRoleContext (only admins/managers see the UI). For production,
  // add proper session-based authentication middleware.
  // ============================================================

  // GET /api/users/:id/territories - Get user territories
  app.get("/api/users/:id/territories", async (req, res) => {
    try {
      const territories = await storage.getUserTerritories(req.params.id);
      res.json(territories.map((t) => t.territory));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user territories" });
    }
  });

  // PUT /api/users/:id/territories - Set user territories
  app.put("/api/users/:id/territories", async (req, res) => {
    try {
      const { territories } = req.body;
      if (!Array.isArray(territories)) {
        return res.status(400).json({ error: "territories must be an array" });
      }
      const result = await storage.setUserTerritories(
        req.params.id,
        territories
      );
      res.json(result.map((t) => t.territory));
    } catch (error) {
      res.status(500).json({ error: "Failed to update user territories" });
    }
  });

  // GET /api/territories - List all available territories
  app.get("/api/territories", async (req, res) => {
    try {
      const territories = await storage.listAllTerritories();
      res.json(territories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch territories" });
    }
  });

  // GET /api/users/:id/professions - Get user professions
  app.get("/api/users/:id/professions", async (req, res) => {
    try {
      const professions = await storage.getUserProfessions(req.params.id);
      res.json(professions.map((p) => p.profession));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user professions" });
    }
  });

  // PUT /api/users/:id/professions - Set user professions
  app.put("/api/users/:id/professions", async (req, res) => {
    try {
      const { professions } = req.body;
      if (!Array.isArray(professions)) {
        return res.status(400).json({ error: "professions must be an array" });
      }
      const result = await storage.setUserProfessions(
        req.params.id,
        professions
      );
      res.json(result.map((p) => p.profession));
    } catch (error) {
      res.status(500).json({ error: "Failed to update user professions" });
    }
  });

  // GET /api/professions - List all available professions
  app.get("/api/professions", async (req, res) => {
    try {
      const professions = await storage.listAllProfessions();
      res.json(professions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch professions" });
    }
  });

  // GET /api/users/:id/assignments - Get user territories and professions together
  app.get("/api/users/:id/assignments", async (req, res) => {
    try {
      const [territories, professions] = await Promise.all([
        storage.getUserTerritories(req.params.id),
        storage.getUserProfessions(req.params.id),
      ]);
      res.json({
        territories: territories.map((t) => t.territory),
        professions: professions.map((p) => p.profession),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user assignments" });
    }
  });

  // PUT /api/users/:id/assignments - Set user territories and professions together
  app.put("/api/users/:id/assignments", async (req, res) => {
    try {
      const { territories, professions } = req.body;
      if (!Array.isArray(territories) || !Array.isArray(professions)) {
        return res
          .status(400)
          .json({ error: "territories and professions must be arrays" });
      }

      const [newTerritories, newProfessions] = await Promise.all([
        storage.setUserTerritories(req.params.id, territories),
        storage.setUserProfessions(req.params.id, professions),
      ]);

      res.json({
        territories: newTerritories.map((t) => t.territory),
        professions: newProfessions.map((p) => p.profession),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user assignments" });
    }
  });

  // POST /api/update-prospect-addresses - Update all prospects with full addresses from HERE API
  app.post("/api/update-prospect-addresses", async (req, res) => {
    try {
      const prospects = await storage.listAllProspects();
      let updated = 0;
      let failed = 0;
      const errors = [];

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

          const result = await getFullAddressFromHere(address);
          if (result) {
            await storage.updateProspect(prospect.id, {
              addressStreet: result.street || prospect.addressStreet,
              addressCity: result.city || prospect.addressCity,
              addressState: result.state || prospect.addressState,
              addressZip: result.zip || prospect.addressZip,
              addressLat: result.latitude.toString() as any,
              addressLng: result.longitude.toString() as any,
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

      res.json({
        total: prospects.length,
        updated,
        failed,
        errors: errors.slice(0, 10), // Return first 10 errors
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update prospect addresses" });
    }
  });

  // GET /api/specialty-colors - List all specialty colors (cached)
  let cachedColors: any[] | null = null;
  let colorsCacheTime = 0;

  app.get("/api/specialty-colors", async (req, res) => {
    try {
      const now = Date.now();
      // Cache for 5 minutes
      if (cachedColors && now - colorsCacheTime < 300000) {
        return res.json(cachedColors);
      }

      const colors = await storage.listSpecialtyColors();
      cachedColors = colors;
      colorsCacheTime = now;
      res.json(colors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch specialty colors" });
    }
  });

  // GET /api/specialty-colors/:specialty - Get color for specific specialty
  app.get("/api/specialty-colors/:specialty", async (req, res) => {
    try {
      const color = await storage.getSpecialtyColor(req.params.specialty);
      if (!color) {
        return res.status(404).json({ error: "Specialty color not found" });
      }
      res.json(color);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch specialty color" });
    }
  });

  // PATCH /api/specialty-colors/:specialty - Update specialty color
  app.patch("/api/specialty-colors/:specialty", async (req, res) => {
    try {
      const color = await storage.updateSpecialtyColor(
        req.params.specialty,
        req.body
      );
      if (!color) {
        return res.status(404).json({ error: "Specialty color not found" });
      }
      res.json(color);
    } catch (error) {
      res.status(500).json({ error: "Failed to update specialty color" });
    }
  });

  // GET /api/call-outcomes - List all call outcomes (cached)
  let cachedOutcomes: any[] | null = null;
  let outcomesCacheTime = 0;

  app.get("/api/call-outcomes", async (req, res) => {
    try {
      const now = Date.now();
      // Cache for 5 minutes
      if (cachedOutcomes && now - outcomesCacheTime < 300000) {
        return res.json(cachedOutcomes);
      }

      const outcomes = await storage.listCallOutcomes();
      cachedOutcomes = outcomes;
      outcomesCacheTime = now;
      res.json(outcomes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch call outcomes" });
    }
  });

  // POST /api/call-outcomes - Create call outcome
  app.post("/api/call-outcomes", async (req, res) => {
    try {
      const data = insertCallOutcomeSchema.parse(req.body);
      const outcome = await storage.createCallOutcome(data);
      res.status(201).json(outcome);
    } catch (error) {
      res.status(400).json({ error: "Invalid call outcome data" });
    }
  });

  // PATCH /api/call-outcomes/:id - Update call outcome
  app.patch("/api/call-outcomes/:id", async (req, res) => {
    try {
      const outcome = await storage.updateCallOutcome(req.params.id, req.body);
      if (!outcome) {
        return res.status(404).json({ error: "Call outcome not found" });
      }
      cachedOutcomes = null; // Clear cache
      res.json(outcome);
    } catch (error) {
      res.status(500).json({ error: "Failed to update call outcome" });
    }
  });

  // DELETE /api/call-outcomes/:id - Delete call outcome
  app.delete("/api/call-outcomes/:id", async (req, res) => {
    try {
      await storage.deleteCallOutcome(req.params.id);
      cachedOutcomes = null; // Clear cache
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete call outcome" });
    }
  });

  // ==================== TWILIO ENDPOINTS ====================

  // POST /api/twilio/token - Generate Twilio access token for browser client
  app.post("/api/twilio/token", async (req, res) => {
    try {
      const { identity } = req.body;
      if (!identity) {
        return res.status(400).json({ error: "Identity is required" });
      }

      const token = generateAccessToken(identity);
      res.json({ token, identity });
    } catch (error) {
      console.error("Twilio token error:", error);
      res.status(500).json({ error: "Failed to generate Twilio token" });
    }
  });

  // POST /api/twilio/voice - TwiML endpoint for handling browser-initiated calls
  app.post("/api/twilio/voice", async (req, res) => {
    try {
      const to = req.body.To || req.body.to;
      const twiml = getTwiMLForBrowserCall(to);
      res.type("text/xml");
      res.send(twiml);
    } catch (error) {
      console.error("Twilio voice error:", error);
      res.status(500).send("Error generating TwiML");
    }
  });

  // POST /api/twilio/call - Initiate outbound call from server
  app.post("/api/twilio/call", async (req, res) => {
    try {
      const { to, prospectId } = req.body;
      if (!to) {
        return res.status(400).json({ error: "Phone number (to) is required" });
      }

      const call = await makeOutboundCall(to);

      // Log call attempt if prospectId provided
      if (prospectId) {
        await storage.recordCallOutcome(
          prospectId,
          "system",
          "Call initiated",
          `Call SID: ${call.sid}`
        );
      }

      res.json({
        success: true,
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
      });
    } catch (error) {
      console.error("Twilio call error:", error);
      res.status(500).json({ error: "Failed to initiate call" });
    }
  });

  // POST /api/twilio/status - Call status callback from Twilio
  app.post("/api/twilio/status", async (req, res) => {
    try {
      const { CallSid, CallStatus, To, Duration } = req.body;
      console.log(
        `Call ${CallSid} to ${To}: ${CallStatus} (duration: ${Duration}s)`
      );
      res.sendStatus(200);
    } catch (error) {
      console.error("Twilio status error:", error);
      res.sendStatus(500);
    }
  });

  // GET /api/twilio/config - Get Twilio configuration (non-sensitive)
  app.get("/api/twilio/config", async (req, res) => {
    res.json({
      configured: !!(
        process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ),
      phoneNumber: twilioPhoneNumber
        ? twilioPhoneNumber.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")
        : null,
    });
  });

  // ========== LiveKit Routes ==========

  // GET /api/livekit/config - Get LiveKit configuration status
  app.get("/api/livekit/config", async (req, res) => {
    res.json({
      configured: isLiveKitConfigured(),
      url: getLiveKitUrl(),
    });
  });

  // POST /api/livekit/token - Generate LiveKit access token for audio/video calls
  app.post("/api/livekit/token", async (req, res) => {
    try {
      const { identity, roomName, name } = req.body;
      if (!identity) {
        return res.status(400).json({ error: "Identity is required" });
      }

      const room = roomName || `room_${identity}_${Date.now()}`;
      const token = await generateLiveKitToken(identity, room, { name });

      res.json({
        token,
        identity,
        roomName: room,
        url: getLiveKitUrl(),
      });
    } catch (error) {
      console.error("LiveKit token error:", error);
      res.status(500).json({ error: "Failed to generate LiveKit token" });
    }
  });

  // POST /api/livekit/call - Create a call room and generate token for caller
  app.post("/api/livekit/call", async (req, res) => {
    try {
      const { callerId, callerName, phoneNumber, prospectId } = req.body;
      if (!callerId || !phoneNumber) {
        return res
          .status(400)
          .json({ error: "callerId and phoneNumber are required" });
      }

      const roomName = generateCallRoomName(callerId, phoneNumber);
      const token = await generateLiveKitToken(callerId, roomName, {
        name: callerName,
      });

      // Log call attempt if prospectId provided
      if (prospectId) {
        await storage.recordCallOutcome(
          prospectId,
          callerId,
          "Call initiated",
          `LiveKit Room: ${roomName}`
        );
      }

      res.json({
        success: true,
        roomName,
        token,
        url: getLiveKitUrl(),
        phoneNumber,
      });
    } catch (error) {
      console.error("LiveKit call error:", error);
      res.status(500).json({ error: "Failed to create call room" });
    }
  });

  // POST /api/livekit/end-call - End a call and record outcome
  app.post("/api/livekit/end-call", async (req, res) => {
    try {
      const { roomName, prospectId, callerId, outcome, notes, duration } =
        req.body;

      if (prospectId && callerId) {
        const outcomeText = outcome || "Call ended";
        const noteText =
          notes || `Duration: ${duration || 0}s, Room: ${roomName}`;
        await storage.recordCallOutcome(
          prospectId,
          callerId,
          outcomeText,
          noteText
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error("LiveKit end call error:", error);
      res.status(500).json({ error: "Failed to record call end" });
    }
  });

  // POST /api/bulk-search - Search for professionals by location and specialty
  app.post("/api/bulk-search", async (req, res) => {
    try {
      const { specialty, location } = req.body;
      if (!specialty || !location) {
        return res.status(400).json({ error: "Missing specialty or location" });
      }
      const results = await searchProfessionalsByLocation(specialty, location);
      res.json({ results });
    } catch (error) {
      console.error("Bulk search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // POST /api/bulk-add - Add multiple prospects if not already in database
  app.post("/api/bulk-add", async (req, res) => {
    try {
      const { contacts, territory, specialty } = req.body;
      if (!Array.isArray(contacts) || !territory || !specialty) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const existingProspects = await storage.listAllProspects();
      const existingPhones = new Set(
        existingProspects.map((p) => p.phoneNumber)
      );

      const added: any[] = [];
      const skipped: any[] = [];

      for (const contact of contacts) {
        if (!contact.phone) {
          skipped.push({ name: contact.name, reason: "No phone number" });
          continue;
        }

        if (existingPhones.has(contact.phone)) {
          skipped.push({ name: contact.name, reason: "Already in database" });
          continue;
        }

        try {
          const prospect = await storage.createProspect({
            businessName: contact.name,
            phoneNumber: contact.phone,
            addressStreet: contact.address,
            addressCity: contact.city,
            addressState: contact.state,
            addressZip: contact.zip,
            specialty,
            territory,
            addressLat: contact.latitude.toString(),
            addressLng: contact.longitude.toString(),
          });
          added.push(prospect);
        } catch (err) {
          skipped.push({ name: contact.name, reason: "Failed to add" });
        }
      }

      res.json({
        added: added.length,
        skipped: skipped.length,
        details: { added, skipped },
      });
    } catch (error) {
      console.error("Bulk add error:", error);
      res.status(500).json({ error: "Failed to add contacts" });
    }
  });

  // ==================== ISSUE TRACKING ENDPOINTS ====================

  // GET /api/issues - List all issues
  app.get("/api/issues", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const issues = await storage.listIssues(status);
      res.json(issues);
    } catch (error) {
      console.error("List issues error:", error);
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  // GET /api/issues/:id - Get single issue
  app.get("/api/issues/:id", async (req, res) => {
    try {
      const issue = await storage.getIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }
      res.json(issue);
    } catch (error) {
      console.error("Get issue error:", error);
      res.status(500).json({ error: "Failed to fetch issue" });
    }
  });

  // POST /api/issues - Create issue and optionally sync to Linear
  app.post("/api/issues", async (req, res) => {
    try {
      const data = insertIssueSchema.parse(req.body);
      const syncToLinear = req.body.syncToLinear !== false;

      let linearIssueId = null;
      let linearIssueUrl = null;

      if (syncToLinear) {
        try {
          const linearResult = await createLinearIssue({
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

      const issue = await storage.createIssue({
        ...data,
        linearIssueId,
        linearIssueUrl,
      });

      res.status(201).json(issue);
    } catch (error) {
      console.error("Create issue error:", error);
      res.status(400).json({ error: "Invalid issue data" });
    }
  });

  // PATCH /api/issues/:id - Update issue
  app.patch("/api/issues/:id", async (req, res) => {
    try {
      const issue = await storage.updateIssue(req.params.id, req.body);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }
      res.json(issue);
    } catch (error) {
      console.error("Update issue error:", error);
      res.status(500).json({ error: "Failed to update issue" });
    }
  });

  // DELETE /api/issues/:id - Delete issue
  app.delete("/api/issues/:id", async (req, res) => {
    try {
      await storage.deleteIssue(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete issue error:", error);
      res.status(500).json({ error: "Failed to delete issue" });
    }
  });

  // GET /api/linear/teams - Get Linear teams
  app.get("/api/linear/teams", async (req, res) => {
    try {
      const teams = await getLinearTeams();
      res.json(teams);
    } catch (error) {
      console.error("Get Linear teams error:", error);
      res.status(500).json({ error: "Failed to fetch Linear teams" });
    }
  });

  // GET /api/linear/issues - Get issues from Linear
  app.get("/api/linear/issues", async (req, res) => {
    try {
      const teamId = req.query.teamId as string | undefined;
      const issues = await getLinearIssues(teamId);
      res.json(issues);
    } catch (error) {
      console.error("Get Linear issues error:", error);
      res.status(500).json({ error: "Failed to fetch Linear issues" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
