import {
  type Prospect,
  type InsertProspect,
  type FieldRep,
  type InsertFieldRep,
  type Appointment,
  type InsertAppointment,
  type Stakeholder,
  type InsertStakeholder,
  type User,
  type InsertUser,
  type SpecialtyColor,
  type InsertSpecialtyColor,
  type CallOutcome,
  type InsertCallOutcome,
  type UserTerritory,
  type InsertUserTerritory,
  type UserProfession,
  type InsertUserProfession,
  type Issue,
  type InsertIssue,
  prospects,
  fieldReps,
  appointments,
  callHistory,
  stakeholders,
  users,
  specialtyColors,
  callOutcomes,
  userTerritories,
  userProfessions,
  issues,
} from "./db/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, desc, asc, isNull } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle(pool);

export interface IStorage {
  // Prospects
  getProspect(id: string): Promise<Prospect | undefined>;
  listAllProspects(): Promise<Prospect[]>;
  listProspectsByTerritory(territory: string): Promise<Prospect[]>;
  createProspect(prospect: InsertProspect): Promise<Prospect>;
  updateProspect(
    id: string,
    prospect: Partial<InsertProspect>
  ): Promise<Prospect | undefined>;
  listProspectsWithoutCoordinates(): Promise<Prospect[]>;

  // Field Reps
  getFieldRep(id: string): Promise<FieldRep | undefined>;
  getFieldRepByTerritory(territory: string): Promise<FieldRep | undefined>;
  createFieldRep(rep: InsertFieldRep): Promise<FieldRep>;
  listFieldReps(): Promise<FieldRep[]>;
  updateFieldRep(
    id: string,
    rep: Partial<InsertFieldRep>
  ): Promise<FieldRep | undefined>;

  // Appointments
  getAppointment(id: string): Promise<Appointment | undefined>;
  listAppointmentsByFieldRepAndDate(
    fieldRepId: string,
    date: string
  ): Promise<Appointment[]>;
  listTodayAppointments(territory?: string): Promise<any[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(
    id: string,
    appointment: Partial<InsertAppointment>
  ): Promise<Appointment | undefined>;

  // Call History
  recordCallOutcome(
    prospectId: string,
    callerId: string,
    outcome: string,
    notes?: string
  ): Promise<void>;

  // Stakeholders
  getStakeholder(id: string): Promise<Stakeholder | undefined>;
  listStakeholdersByProspect(prospectId: string): Promise<Stakeholder[]>;
  createStakeholder(stakeholder: InsertStakeholder): Promise<Stakeholder>;
  updateStakeholder(
    id: string,
    stakeholder: Partial<InsertStakeholder>
  ): Promise<Stakeholder | undefined>;
  deleteStakeholder(id: string): Promise<void>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  // Specialty Colors
  getSpecialtyColor(specialty: string): Promise<SpecialtyColor | undefined>;
  listSpecialtyColors(): Promise<SpecialtyColor[]>;
  updateSpecialtyColor(
    specialty: string,
    color: Partial<InsertSpecialtyColor>
  ): Promise<SpecialtyColor | undefined>;
  initializeSpecialtyColors(specialties: string[]): Promise<void>;

  // Call Outcomes
  getCallOutcome(label: string): Promise<CallOutcome | undefined>;
  listCallOutcomes(): Promise<CallOutcome[]>;
  createCallOutcome(outcome: InsertCallOutcome): Promise<CallOutcome>;
  updateCallOutcome(
    id: string,
    outcome: Partial<InsertCallOutcome>
  ): Promise<CallOutcome | undefined>;
  deleteCallOutcome(id: string): Promise<void>;
  initializeCallOutcomes(): Promise<void>;

  // User Territories
  getUserTerritories(userId: string): Promise<UserTerritory[]>;
  setUserTerritories(
    userId: string,
    territories: string[]
  ): Promise<UserTerritory[]>;
  listAllTerritories(): Promise<string[]>;

  // User Professions
  getUserProfessions(userId: string): Promise<UserProfession[]>;
  setUserProfessions(
    userId: string,
    professions: string[]
  ): Promise<UserProfession[]>;
  listAllProfessions(): Promise<string[]>;

  // Issues (project tracking)
  getIssue(id: string): Promise<Issue | undefined>;
  listIssues(status?: string): Promise<Issue[]>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(
    id: string,
    issue: Partial<InsertIssue>
  ): Promise<Issue | undefined>;
  deleteIssue(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProspect(id: string): Promise<Prospect | undefined> {
    const result = await db
      .select()
      .from(prospects)
      .where(eq(prospects.id, id))
      .limit(1);
    return result[0];
  }

  async listAllProspects(): Promise<Prospect[]> {
    return await db.select().from(prospects);
  }

  async listProspectsByTerritory(territory: string): Promise<Prospect[]> {
    return await db
      .select()
      .from(prospects)
      .where(eq(prospects.territory, territory));
  }

  async createProspect(prospect: InsertProspect): Promise<Prospect> {
    const [result] = await db.insert(prospects).values(prospect).returning();
    return result;
  }

  async updateProspect(
    id: string,
    prospect: Partial<InsertProspect>
  ): Promise<Prospect | undefined> {
    const [result] = await db
      .update(prospects)
      .set({ ...prospect, updatedAt: new Date() })
      .where(eq(prospects.id, id))
      .returning();
    return result;
  }

  async listProspectsWithoutCoordinates(): Promise<Prospect[]> {
    return await db
      .select()
      .from(prospects)
      .where(and(isNull(prospects.addressLat), isNull(prospects.addressLng)));
  }

  async getFieldRep(id: string): Promise<FieldRep | undefined> {
    const result = await db
      .select()
      .from(fieldReps)
      .where(eq(fieldReps.id, id))
      .limit(1);
    return result[0];
  }

  async getFieldRepByTerritory(
    territory: string
  ): Promise<FieldRep | undefined> {
    const result = await db
      .select()
      .from(fieldReps)
      .where(eq(fieldReps.territory, territory))
      .limit(1);
    return result[0];
  }

  async createFieldRep(rep: InsertFieldRep): Promise<FieldRep> {
    const [result] = await db.insert(fieldReps).values(rep).returning();
    return result;
  }

  async listFieldReps(): Promise<FieldRep[]> {
    return await db.select().from(fieldReps);
  }

  async updateFieldRep(
    id: string,
    rep: Partial<InsertFieldRep>
  ): Promise<FieldRep | undefined> {
    const [result] = await db
      .update(fieldReps)
      .set({ ...rep, updatedAt: new Date() })
      .where(eq(fieldReps.id, id))
      .returning();
    return result;
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const result = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    return result[0];
  }

  async listAppointmentsByFieldRepAndDate(
    fieldRepId: string,
    date: string
  ): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.fieldRepId, fieldRepId),
          eq(appointments.scheduledDate, date)
        )
      )
      .orderBy(asc(appointments.scheduledTime));
  }

  async listTodayAppointments(territory?: string): Promise<any[]> {
    const today = new Date().toISOString().split("T")[0];

    // Join appointments with prospects and field_reps to get full details
    const result = await db
      .select({
        id: appointments.id,
        scheduledDate: appointments.scheduledDate,
        scheduledTime: appointments.scheduledTime,
        durationMinutes: appointments.durationMinutes,
        status: appointments.status,
        prospectId: appointments.prospectId,
        prospectName: prospects.businessName,
        prospectPhone: prospects.phoneNumber,
        prospectAddress: prospects.addressStreet,
        prospectCity: prospects.addressCity,
        fieldRepId: appointments.fieldRepId,
        fieldRepName: fieldReps.name,
        territory: fieldReps.territory,
      })
      .from(appointments)
      .leftJoin(prospects, eq(appointments.prospectId, prospects.id))
      .leftJoin(fieldReps, eq(appointments.fieldRepId, fieldReps.id))
      .where(eq(appointments.scheduledDate, today))
      .orderBy(asc(appointments.scheduledTime));

    // Filter by territory if provided
    if (territory) {
      return result.filter((a) => a.territory === territory);
    }

    return result;
  }

  async createAppointment(
    appointment: InsertAppointment
  ): Promise<Appointment> {
    const [result] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    return result;
  }

  async updateAppointment(
    id: string,
    appointment: Partial<InsertAppointment>
  ): Promise<Appointment | undefined> {
    const [result] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return result;
  }

  async recordCallOutcome(
    prospectId: string,
    callerId: string,
    outcome: string,
    notes?: string
  ): Promise<void> {
    await db.insert(callHistory).values({
      prospectId,
      callerId,
      outcome,
      notes,
    });

    // Update prospect's lastContactDate
    await this.updateProspect(prospectId, {
      lastContactDate: new Date(),
    });
  }

  async getStakeholder(id: string): Promise<Stakeholder | undefined> {
    const result = await db
      .select()
      .from(stakeholders)
      .where(eq(stakeholders.id, id))
      .limit(1);
    return result[0];
  }

  async listStakeholdersByProspect(prospectId: string): Promise<Stakeholder[]> {
    return await db
      .select()
      .from(stakeholders)
      .where(eq(stakeholders.prospectId, prospectId));
  }

  async createStakeholder(
    stakeholder: InsertStakeholder
  ): Promise<Stakeholder> {
    const [result] = await db
      .insert(stakeholders)
      .values(stakeholder)
      .returning();
    return result;
  }

  async updateStakeholder(
    id: string,
    stakeholder: Partial<InsertStakeholder>
  ): Promise<Stakeholder | undefined> {
    const [result] = await db
      .update(stakeholders)
      .set({ ...stakeholder, updatedAt: new Date() })
      .where(eq(stakeholders.id, id))
      .returning();
    return result;
  }

  async deleteStakeholder(id: string): Promise<void> {
    await db.delete(stakeholders).where(eq(stakeholders.id, id));
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async updateUser(
    id: string,
    user: Partial<InsertUser>
  ): Promise<User | undefined> {
    const [result] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getSpecialtyColor(
    specialty: string
  ): Promise<SpecialtyColor | undefined> {
    const result = await db
      .select()
      .from(specialtyColors)
      .where(eq(specialtyColors.specialty, specialty))
      .limit(1);
    return result[0];
  }

  async listSpecialtyColors(): Promise<SpecialtyColor[]> {
    return await db.select().from(specialtyColors);
  }

  async updateSpecialtyColor(
    specialty: string,
    color: Partial<InsertSpecialtyColor>
  ): Promise<SpecialtyColor | undefined> {
    const [result] = await db
      .update(specialtyColors)
      .set({ ...color, updatedAt: new Date() })
      .where(eq(specialtyColors.specialty, specialty))
      .returning();
    return result;
  }

  async initializeSpecialtyColors(specialtiesList: string[]): Promise<void> {
    const defaultColors = [
      {
        specialty: "Dental",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
      },
      {
        specialty: "Chiropractor",
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-700",
      },
      {
        specialty: "Optometry",
        bgColor: "bg-purple-100",
        textColor: "text-purple-700",
      },
      {
        specialty: "Physical Therapy",
        bgColor: "bg-orange-100",
        textColor: "text-orange-700",
      },
      {
        specialty: "Orthodontics",
        bgColor: "bg-pink-100",
        textColor: "text-pink-700",
      },
    ];

    for (const color of defaultColors) {
      const existing = await this.getSpecialtyColor(color.specialty);
      if (!existing) {
        await db.insert(specialtyColors).values(color).onConflictDoNothing();
      }
    }
  }

  async getCallOutcome(label: string): Promise<CallOutcome | undefined> {
    const result = await db
      .select()
      .from(callOutcomes)
      .where(eq(callOutcomes.label, label))
      .limit(1);
    return result[0];
  }

  async listCallOutcomes(): Promise<CallOutcome[]> {
    return await db
      .select()
      .from(callOutcomes)
      .orderBy(asc(callOutcomes.sortOrder));
  }

  async createCallOutcome(outcome: InsertCallOutcome): Promise<CallOutcome> {
    const [result] = await db.insert(callOutcomes).values(outcome).returning();
    return result;
  }

  async updateCallOutcome(
    id: string,
    outcome: Partial<InsertCallOutcome>
  ): Promise<CallOutcome | undefined> {
    const [result] = await db
      .update(callOutcomes)
      .set({ ...outcome, updatedAt: new Date() })
      .where(eq(callOutcomes.id, id))
      .returning();
    return result;
  }

  async deleteCallOutcome(id: string): Promise<void> {
    await db.delete(callOutcomes).where(eq(callOutcomes.id, id));
  }

  async initializeCallOutcomes(): Promise<void> {
    const defaultOutcomes = [
      {
        label: "Booked",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        hoverColor: "hover:bg-green-200",
        sortOrder: 1,
      },
      {
        label: "Call back",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-700",
        borderColor: "border-yellow-200",
        hoverColor: "hover:bg-yellow-200",
        sortOrder: 2,
      },
      {
        label: "Don't Call",
        bgColor: "bg-gray-700",
        textColor: "text-white",
        borderColor: "border-gray-700",
        hoverColor: "hover:bg-gray-800",
        sortOrder: 3,
      },
      {
        label: "Send an email",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        hoverColor: "hover:bg-blue-200",
        sortOrder: 4,
      },
      {
        label: "Not Interested",
        bgColor: "bg-red-600",
        textColor: "text-white",
        borderColor: "border-red-600",
        hoverColor: "hover:bg-red-700",
        sortOrder: 5,
      },
      {
        label: "Hang up",
        bgColor: "bg-pink-100",
        textColor: "text-pink-700",
        borderColor: "border-pink-200",
        hoverColor: "hover:bg-pink-200",
        sortOrder: 6,
      },
      {
        label: "Get back to you",
        bgColor: "bg-purple-300",
        textColor: "text-purple-700",
        borderColor: "border-purple-300",
        hoverColor: "hover:bg-purple-400",
        sortOrder: 7,
      },
    ];

    for (const outcome of defaultOutcomes) {
      const existing = await this.getCallOutcome(outcome.label);
      if (!existing) {
        await db.insert(callOutcomes).values(outcome).onConflictDoNothing();
      }
    }
  }

  // User Territories
  async getUserTerritories(userId: string): Promise<UserTerritory[]> {
    return await db
      .select()
      .from(userTerritories)
      .where(eq(userTerritories.userId, userId));
  }

  async setUserTerritories(
    userId: string,
    territories: string[]
  ): Promise<UserTerritory[]> {
    await db.delete(userTerritories).where(eq(userTerritories.userId, userId));

    if (territories.length === 0) {
      return [];
    }

    const values = territories.map((territory) => ({ userId, territory }));
    const results = await db.insert(userTerritories).values(values).returning();
    return results;
  }

  async listAllTerritories(): Promise<string[]> {
    return [
      "Miami",
      "Washington DC",
      "Los Angeles",
      "New York",
      "Chicago",
      "Dallas",
    ];
  }

  // User Professions
  async getUserProfessions(userId: string): Promise<UserProfession[]> {
    return await db
      .select()
      .from(userProfessions)
      .where(eq(userProfessions.userId, userId));
  }

  async setUserProfessions(
    userId: string,
    professions: string[]
  ): Promise<UserProfession[]> {
    await db.delete(userProfessions).where(eq(userProfessions.userId, userId));

    if (professions.length === 0) {
      return [];
    }

    const values = professions.map((profession) => ({ userId, profession }));
    const results = await db.insert(userProfessions).values(values).returning();
    return results;
  }

  async listAllProfessions(): Promise<string[]> {
    return [
      "Dental",
      "Chiropractor",
      "Optometry",
      "Physical Therapy",
      "Orthodontics",
      "Legal",
      "Financial",
      "Real Estate",
    ];
  }

  // Issues (project tracking)
  async getIssue(id: string): Promise<Issue | undefined> {
    const result = await db
      .select()
      .from(issues)
      .where(eq(issues.id, id))
      .limit(1);
    return result[0];
  }

  async listIssues(status?: string): Promise<Issue[]> {
    if (status) {
      return await db
        .select()
        .from(issues)
        .where(eq(issues.status, status))
        .orderBy(desc(issues.createdAt));
    }
    return await db.select().from(issues).orderBy(desc(issues.createdAt));
  }

  async createIssue(issue: InsertIssue): Promise<Issue> {
    const [result] = await db.insert(issues).values(issue).returning();
    return result;
  }

  async updateIssue(
    id: string,
    issue: Partial<InsertIssue>
  ): Promise<Issue | undefined> {
    const [result] = await db
      .update(issues)
      .set({ ...issue, updatedAt: new Date() })
      .where(eq(issues.id, id))
      .returning();
    return result;
  }

  async deleteIssue(id: string): Promise<void> {
    await db.delete(issues).where(eq(issues.id, id));
  }
}

export const storage = new DatabaseStorage();
