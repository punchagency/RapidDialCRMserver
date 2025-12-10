import { prospects, fieldReps, appointments, callHistory, stakeholders, users, specialtyColors, callOutcomes, userTerritories, userProfessions, issues } from "./db/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, asc, isNull } from "drizzle-orm";
const db = drizzle(neon(process.env.DATABASE_URL));
export class DatabaseStorage {
    async getProspect(id) {
        const result = await db.select().from(prospects).where(eq(prospects.id, id)).limit(1);
        return result[0];
    }
    async listAllProspects() {
        return await db.select().from(prospects);
    }
    async listProspectsByTerritory(territory) {
        return await db.select().from(prospects).where(eq(prospects.territory, territory));
    }
    async createProspect(prospect) {
        const [result] = await db.insert(prospects).values(prospect).returning();
        return result;
    }
    async updateProspect(id, prospect) {
        const [result] = await db.update(prospects).set({ ...prospect, updatedAt: new Date() }).where(eq(prospects.id, id)).returning();
        return result;
    }
    async listProspectsWithoutCoordinates() {
        return await db.select().from(prospects).where(and(isNull(prospects.addressLat), isNull(prospects.addressLng)));
    }
    async getFieldRep(id) {
        const result = await db.select().from(fieldReps).where(eq(fieldReps.id, id)).limit(1);
        return result[0];
    }
    async getFieldRepByTerritory(territory) {
        const result = await db.select().from(fieldReps).where(eq(fieldReps.territory, territory)).limit(1);
        return result[0];
    }
    async createFieldRep(rep) {
        const [result] = await db.insert(fieldReps).values(rep).returning();
        return result;
    }
    async listFieldReps() {
        return await db.select().from(fieldReps);
    }
    async updateFieldRep(id, rep) {
        const [result] = await db.update(fieldReps).set({ ...rep, updatedAt: new Date() }).where(eq(fieldReps.id, id)).returning();
        return result;
    }
    async getAppointment(id) {
        const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
        return result[0];
    }
    async listAppointmentsByFieldRepAndDate(fieldRepId, date) {
        return await db.select().from(appointments).where(and(eq(appointments.fieldRepId, fieldRepId), eq(appointments.scheduledDate, date))).orderBy(asc(appointments.scheduledTime));
    }
    async listTodayAppointments(territory) {
        const today = new Date().toISOString().split('T')[0];
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
            return result.filter(a => a.territory === territory);
        }
        return result;
    }
    async createAppointment(appointment) {
        const [result] = await db.insert(appointments).values(appointment).returning();
        return result;
    }
    async updateAppointment(id, appointment) {
        const [result] = await db.update(appointments).set({ ...appointment, updatedAt: new Date() }).where(eq(appointments.id, id)).returning();
        return result;
    }
    async recordCallOutcome(prospectId, callerId, outcome, notes) {
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
    async getStakeholder(id) {
        const result = await db.select().from(stakeholders).where(eq(stakeholders.id, id)).limit(1);
        return result[0];
    }
    async listStakeholdersByProspect(prospectId) {
        return await db.select().from(stakeholders).where(eq(stakeholders.prospectId, prospectId));
    }
    async createStakeholder(stakeholder) {
        const [result] = await db.insert(stakeholders).values(stakeholder).returning();
        return result;
    }
    async updateStakeholder(id, stakeholder) {
        const [result] = await db.update(stakeholders).set({ ...stakeholder, updatedAt: new Date() }).where(eq(stakeholders.id, id)).returning();
        return result;
    }
    async deleteStakeholder(id) {
        await db.delete(stakeholders).where(eq(stakeholders.id, id));
    }
    async getUser(id) {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0];
    }
    async getUserByEmail(email) {
        const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return result[0];
    }
    async listUsers() {
        return await db.select().from(users);
    }
    async createUser(user) {
        const [result] = await db.insert(users).values(user).returning();
        return result;
    }
    async updateUser(id, user) {
        const [result] = await db.update(users).set({ ...user, updatedAt: new Date() }).where(eq(users.id, id)).returning();
        return result;
    }
    async deleteUser(id) {
        await db.delete(users).where(eq(users.id, id));
    }
    async getSpecialtyColor(specialty) {
        const result = await db.select().from(specialtyColors).where(eq(specialtyColors.specialty, specialty)).limit(1);
        return result[0];
    }
    async listSpecialtyColors() {
        return await db.select().from(specialtyColors);
    }
    async updateSpecialtyColor(specialty, color) {
        const [result] = await db.update(specialtyColors).set({ ...color, updatedAt: new Date() }).where(eq(specialtyColors.specialty, specialty)).returning();
        return result;
    }
    async initializeSpecialtyColors(specialtiesList) {
        const defaultColors = [
            { specialty: "Dental", bgColor: "bg-blue-100", textColor: "text-blue-700" },
            { specialty: "Chiropractor", bgColor: "bg-emerald-100", textColor: "text-emerald-700" },
            { specialty: "Optometry", bgColor: "bg-purple-100", textColor: "text-purple-700" },
            { specialty: "Physical Therapy", bgColor: "bg-orange-100", textColor: "text-orange-700" },
            { specialty: "Orthodontics", bgColor: "bg-pink-100", textColor: "text-pink-700" },
        ];
        for (const color of defaultColors) {
            const existing = await this.getSpecialtyColor(color.specialty);
            if (!existing) {
                await db.insert(specialtyColors).values(color).onConflictDoNothing();
            }
        }
    }
    async getCallOutcome(label) {
        const result = await db.select().from(callOutcomes).where(eq(callOutcomes.label, label)).limit(1);
        return result[0];
    }
    async listCallOutcomes() {
        return await db.select().from(callOutcomes).orderBy(asc(callOutcomes.sortOrder));
    }
    async createCallOutcome(outcome) {
        const [result] = await db.insert(callOutcomes).values(outcome).returning();
        return result;
    }
    async updateCallOutcome(id, outcome) {
        const [result] = await db.update(callOutcomes).set({ ...outcome, updatedAt: new Date() }).where(eq(callOutcomes.id, id)).returning();
        return result;
    }
    async deleteCallOutcome(id) {
        await db.delete(callOutcomes).where(eq(callOutcomes.id, id));
    }
    async initializeCallOutcomes() {
        const defaultOutcomes = [
            { label: "Booked", bgColor: "bg-green-100", textColor: "text-green-700", borderColor: "border-green-200", hoverColor: "hover:bg-green-200", sortOrder: 1 },
            { label: "Call back", bgColor: "bg-yellow-100", textColor: "text-yellow-700", borderColor: "border-yellow-200", hoverColor: "hover:bg-yellow-200", sortOrder: 2 },
            { label: "Don't Call", bgColor: "bg-gray-700", textColor: "text-white", borderColor: "border-gray-700", hoverColor: "hover:bg-gray-800", sortOrder: 3 },
            { label: "Send an email", bgColor: "bg-blue-100", textColor: "text-blue-700", borderColor: "border-blue-200", hoverColor: "hover:bg-blue-200", sortOrder: 4 },
            { label: "Not Interested", bgColor: "bg-red-600", textColor: "text-white", borderColor: "border-red-600", hoverColor: "hover:bg-red-700", sortOrder: 5 },
            { label: "Hang up", bgColor: "bg-pink-100", textColor: "text-pink-700", borderColor: "border-pink-200", hoverColor: "hover:bg-pink-200", sortOrder: 6 },
            { label: "Get back to you", bgColor: "bg-purple-300", textColor: "text-purple-700", borderColor: "border-purple-300", hoverColor: "hover:bg-purple-400", sortOrder: 7 },
        ];
        for (const outcome of defaultOutcomes) {
            const existing = await this.getCallOutcome(outcome.label);
            if (!existing) {
                await db.insert(callOutcomes).values(outcome).onConflictDoNothing();
            }
        }
    }
    // User Territories
    async getUserTerritories(userId) {
        return await db.select().from(userTerritories).where(eq(userTerritories.userId, userId));
    }
    async setUserTerritories(userId, territories) {
        await db.delete(userTerritories).where(eq(userTerritories.userId, userId));
        if (territories.length === 0) {
            return [];
        }
        const values = territories.map(territory => ({ userId, territory }));
        const results = await db.insert(userTerritories).values(values).returning();
        return results;
    }
    async listAllTerritories() {
        return ["Miami", "Washington DC", "Los Angeles", "New York", "Chicago", "Dallas"];
    }
    // User Professions
    async getUserProfessions(userId) {
        return await db.select().from(userProfessions).where(eq(userProfessions.userId, userId));
    }
    async setUserProfessions(userId, professions) {
        await db.delete(userProfessions).where(eq(userProfessions.userId, userId));
        if (professions.length === 0) {
            return [];
        }
        const values = professions.map(profession => ({ userId, profession }));
        const results = await db.insert(userProfessions).values(values).returning();
        return results;
    }
    async listAllProfessions() {
        return ["Dental", "Chiropractor", "Optometry", "Physical Therapy", "Orthodontics", "Legal", "Financial", "Real Estate"];
    }
    // Issues (project tracking)
    async getIssue(id) {
        const result = await db.select().from(issues).where(eq(issues.id, id)).limit(1);
        return result[0];
    }
    async listIssues(status) {
        if (status) {
            return await db.select().from(issues).where(eq(issues.status, status)).orderBy(desc(issues.createdAt));
        }
        return await db.select().from(issues).orderBy(desc(issues.createdAt));
    }
    async createIssue(issue) {
        const [result] = await db.insert(issues).values(issue).returning();
        return result;
    }
    async updateIssue(id, issue) {
        const [result] = await db.update(issues).set({ ...issue, updatedAt: new Date() }).where(eq(issues.id, id)).returning();
        return result;
    }
    async deleteIssue(id) {
        await db.delete(issues).where(eq(issues.id, id));
    }
}
export const storage = new DatabaseStorage();
//# sourceMappingURL=storage.js.map