import { DataSource, Repository, IsNull } from 'typeorm';
import {
 Prospect,
 User,
 FieldRep,
 Appointment,
 CallHistory,
 Stakeholder,
 SpecialtyColor,
 CallOutcome,
 UserTerritory,
 UserProfession,
 Issue,
} from '../entities/index.js';
import { getDatabaseManager } from '../config/database.js';

/**
 * Storage Repository Interface
 * Defines all data access operations following the original IStorage interface
 */
export interface IStorageRepository {
 // Prospects
 getProspect(id: string): Promise<Prospect | null>;
 listAllProspects(): Promise<Prospect[]>;
 listProspectsByTerritory(territory: string): Promise<Prospect[]>;
 createProspect(prospect: Partial<Prospect>): Promise<Prospect>;
 updateProspect(id: string, prospect: Partial<Prospect>): Promise<Prospect | null>;
 deleteProspect(id: string): Promise<void>;
 listProspectsWithoutCoordinates(): Promise<Prospect[]>;

 // Field Reps
 getFieldRep(id: string): Promise<FieldRep | null>;
 getFieldRepByTerritory(territory: string): Promise<FieldRep | null>;
 createFieldRep(rep: Partial<FieldRep>): Promise<FieldRep>;
 listFieldReps(): Promise<FieldRep[]>;
 updateFieldRep(id: string, rep: Partial<FieldRep>): Promise<FieldRep | null>;

 // Appointments
 getAppointment(id: string): Promise<Appointment | null>;
 listAppointmentsByFieldRepAndDate(fieldRepId: string, date: string): Promise<Appointment[]>;
 listTodayAppointments(territory?: string): Promise<any[]>;
 createAppointment(appointment: Partial<Appointment>): Promise<Appointment>;
 updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment | null>;

 // Call History
 recordCallOutcome(prospectId: string, callerId: string, outcome: string, notes?: string): Promise<void>;

 // Stakeholders
 getStakeholder(id: string): Promise<Stakeholder | null>;
 listStakeholdersByProspect(prospectId: string): Promise<Stakeholder[]>;
 createStakeholder(stakeholder: Partial<Stakeholder>): Promise<Stakeholder>;
 updateStakeholder(id: string, stakeholder: Partial<Stakeholder>): Promise<Stakeholder | null>;
 deleteStakeholder(id: string): Promise<void>;

 // Users
 getUser(id: string): Promise<User | null>;
 getUserByEmail(email: string): Promise<User | null>;
 listUsers(): Promise<User[]>;
 createUser(user: Partial<User>): Promise<User>;
 updateUser(id: string, user: Partial<User>): Promise<User | null>;
 deleteUser(id: string): Promise<void>;

 // Specialty Colors
 getSpecialtyColor(specialty: string): Promise<SpecialtyColor | null>;
 listSpecialtyColors(): Promise<SpecialtyColor[]>;
 updateSpecialtyColor(specialty: string, color: Partial<SpecialtyColor>): Promise<SpecialtyColor | null>;
 initializeSpecialtyColors(specialties: string[]): Promise<void>;

 // Call Outcomes
 getCallOutcome(label: string): Promise<CallOutcome | null>;
 listCallOutcomes(): Promise<CallOutcome[]>;
 createCallOutcome(outcome: Partial<CallOutcome>): Promise<CallOutcome>;
 updateCallOutcome(id: string, outcome: Partial<CallOutcome>): Promise<CallOutcome | null>;
 deleteCallOutcome(id: string): Promise<void>;
 initializeCallOutcomes(): Promise<void>;

 // User Territories
 getUserTerritories(userId: string): Promise<UserTerritory[]>;
 setUserTerritories(userId: string, territories: string[]): Promise<UserTerritory[]>;
 listAllTerritories(): Promise<string[]>;

 // User Professions
 getUserProfessions(userId: string): Promise<UserProfession[]>;
 setUserProfessions(userId: string, professions: string[]): Promise<UserProfession[]>;
 listAllProfessions(): Promise<string[]>;

 // Issues
 getIssue(id: string): Promise<Issue | null>;
 listIssues(status?: string): Promise<Issue[]>;
 createIssue(issue: Partial<Issue>): Promise<Issue>;
 updateIssue(id: string, issue: Partial<Issue>): Promise<Issue | null>;
 deleteIssue(id: string): Promise<void>;
}

/**
 * Storage Repository Implementation
 * Implements all data access operations using TypeORM
 */
export class StorageRepository implements IStorageRepository {
 private dataSource: DataSource;
 private prospectRepo: Repository<Prospect>;
 private userRepo: Repository<User>;
 private fieldRepRepo: Repository<FieldRep>;
 private appointmentRepo: Repository<Appointment>;
 private callHistoryRepo: Repository<CallHistory>;
 private stakeholderRepo: Repository<Stakeholder>;
 private specialtyColorRepo: Repository<SpecialtyColor>;
 private callOutcomeRepo: Repository<CallOutcome>;
 private userTerritoryRepo: Repository<UserTerritory>;
 private userProfessionRepo: Repository<UserProfession>;
 private issueRepo: Repository<Issue>;

 constructor() {
  this.dataSource = getDatabaseManager().getDataSource();
  this.prospectRepo = this.dataSource.getRepository(Prospect);
  this.userRepo = this.dataSource.getRepository(User);
  this.fieldRepRepo = this.dataSource.getRepository(FieldRep);
  this.appointmentRepo = this.dataSource.getRepository(Appointment);
  this.callHistoryRepo = this.dataSource.getRepository(CallHistory);
  this.stakeholderRepo = this.dataSource.getRepository(Stakeholder);
  this.specialtyColorRepo = this.dataSource.getRepository(SpecialtyColor);
  this.callOutcomeRepo = this.dataSource.getRepository(CallOutcome);
  this.userTerritoryRepo = this.dataSource.getRepository(UserTerritory);
  this.userProfessionRepo = this.dataSource.getRepository(UserProfession);
  this.issueRepo = this.dataSource.getRepository(Issue);
 }

 // Prospects
 async getProspect(id: string): Promise<Prospect | null> {
  return await this.prospectRepo.findOne({ where: { id } });
 }

 async listAllProspects(): Promise<Prospect[]> {
  return await this.prospectRepo.find();
 }

 async listProspectsByTerritory(territory: string): Promise<Prospect[]> {
  return await this.prospectRepo.find({ where: { territory } });
 }

 async createProspect(prospect: Partial<Prospect>): Promise<Prospect> {
  const newProspect = this.prospectRepo.create(prospect);
  return await this.prospectRepo.save(newProspect);
 }

 async updateProspect(id: string, prospect: Partial<Prospect>): Promise<Prospect | null> {
  await this.prospectRepo.update(id, { ...prospect, updatedAt: new Date() });
  return await this.getProspect(id);
 }

 async deleteProspect(id: string): Promise<void> {
  await this.prospectRepo.delete(id);
 }

 async listProspectsWithoutCoordinates(): Promise<Prospect[]> {
  return await this.prospectRepo.find({
   where: [
    { addressLat: IsNull() },
    { addressLng: IsNull() },
   ],
  });
 }

 // Field Reps
 async getFieldRep(id: string): Promise<FieldRep | null> {
  return await this.fieldRepRepo.findOne({ where: { id } });
 }

 async getFieldRepByTerritory(territory: string): Promise<FieldRep | null> {
  return await this.fieldRepRepo.findOne({ where: { territory } });
 }

 async createFieldRep(rep: Partial<FieldRep>): Promise<FieldRep> {
  const newRep = this.fieldRepRepo.create(rep);
  return await this.fieldRepRepo.save(newRep);
 }

 async listFieldReps(): Promise<FieldRep[]> {
  return await this.fieldRepRepo.find();
 }

 async updateFieldRep(id: string, rep: Partial<FieldRep>): Promise<FieldRep | null> {
  await this.fieldRepRepo.update(id, { ...rep, updatedAt: new Date() });
  return await this.getFieldRep(id);
 }

 // Appointments
 async getAppointment(id: string): Promise<Appointment | null> {
  return await this.appointmentRepo.findOne({ where: { id } });
 }

 async listAppointmentsByFieldRepAndDate(fieldRepId: string, date: string): Promise<Appointment[]> {
  return await this.appointmentRepo.find({
   where: { fieldRepId, scheduledDate: date },
   order: { scheduledTime: 'ASC' },
  });
 }

 async listTodayAppointments(territory?: string): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];

  const query = this.appointmentRepo
   .createQueryBuilder('appointment')
   .leftJoinAndSelect('appointment.prospect', 'prospect')
   .leftJoinAndSelect('appointment.fieldRep', 'fieldRep')
   .where('appointment.scheduledDate = :today', { today })
   .orderBy('appointment.scheduledTime', 'ASC');

  if (territory) {
   query.andWhere('fieldRep.territory = :territory', { territory });
  }

  const appointments = await query.getMany();

  return appointments.map((app) => ({
   id: app.id,
   scheduledDate: app.scheduledDate,
   scheduledTime: app.scheduledTime,
   durationMinutes: app.durationMinutes,
   status: app.status,
   prospectId: app.prospectId,
   prospectName: app.prospect?.businessName,
   prospectPhone: app.prospect?.phoneNumber,
   prospectAddress: app.prospect?.addressStreet,
   prospectCity: app.prospect?.addressCity,
   fieldRepId: app.fieldRepId,
   fieldRepName: app.fieldRep?.name,
   territory: app.fieldRep?.territory,
  }));
 }

 async createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
  const newAppointment = this.appointmentRepo.create(appointment);
  return await this.appointmentRepo.save(newAppointment);
 }

 async updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment | null> {
  await this.appointmentRepo.update(id, { ...appointment, updatedAt: new Date() });
  return await this.getAppointment(id);
 }

 // Call History
 async recordCallOutcome(prospectId: string, callerId: string, outcome: string, notes?: string): Promise<void> {
  const callHistory = this.callHistoryRepo.create({
   prospectId,
   callerId,
   outcome,
   notes,
  });
  await this.callHistoryRepo.save(callHistory);

  // Update prospect's lastContactDate
  await this.updateProspect(prospectId, {
   lastContactDate: new Date(),
  });
 }

 // Stakeholders
 async getStakeholder(id: string): Promise<Stakeholder | null> {
  return await this.stakeholderRepo.findOne({ where: { id } });
 }

 async listStakeholdersByProspect(prospectId: string): Promise<Stakeholder[]> {
  return await this.stakeholderRepo.find({ where: { prospectId } });
 }

 async createStakeholder(stakeholder: Partial<Stakeholder>): Promise<Stakeholder> {
  const newStakeholder = this.stakeholderRepo.create(stakeholder);
  return await this.stakeholderRepo.save(newStakeholder);
 }

 async updateStakeholder(id: string, stakeholder: Partial<Stakeholder>): Promise<Stakeholder | null> {
  await this.stakeholderRepo.update(id, { ...stakeholder, updatedAt: new Date() });
  return await this.getStakeholder(id);
 }

 async deleteStakeholder(id: string): Promise<void> {
  await this.stakeholderRepo.delete(id);
 }

 // Users
 async getUser(id: string): Promise<User | null> {
  return await this.userRepo.findOne({ where: { id } });
 }

 async getUserByEmail(email: string): Promise<User | null> {
  return await this.userRepo.findOne({ where: { email } });
 }

 async listUsers(): Promise<User[]> {
  return await this.userRepo.find();
 }

 async createUser(user: Partial<User>): Promise<User> {
  const newUser = this.userRepo.create(user);
  return await this.userRepo.save(newUser);
 }

 async updateUser(id: string, user: Partial<User>): Promise<User | null> {
  await this.userRepo.update(id, { ...user, updatedAt: new Date() });
  return await this.getUser(id);
 }

 async deleteUser(id: string): Promise<void> {
  await this.userRepo.delete(id);
 }

 // Specialty Colors
 async getSpecialtyColor(specialty: string): Promise<SpecialtyColor | null> {
  return await this.specialtyColorRepo.findOne({ where: { specialty } });
 }

 async listSpecialtyColors(): Promise<SpecialtyColor[]> {
  return await this.specialtyColorRepo.find();
 }

 async updateSpecialtyColor(specialty: string, color: Partial<SpecialtyColor>): Promise<SpecialtyColor | null> {
  await this.specialtyColorRepo.update({ specialty }, { ...color, updatedAt: new Date() });
  return await this.getSpecialtyColor(specialty);
 }

 async initializeSpecialtyColors(specialtiesList: string[]): Promise<void> {
  const defaultColors = [
   { specialty: 'Dental', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
   { specialty: 'Chiropractor', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
   { specialty: 'Optometry', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
   { specialty: 'Physical Therapy', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
   { specialty: 'Orthodontics', bgColor: 'bg-pink-100', textColor: 'text-pink-700' },
  ];

  for (const color of defaultColors) {
   const existing = await this.getSpecialtyColor(color.specialty);
   if (!existing) {
    await this.specialtyColorRepo.save(color);
   }
  }
 }

 // Call Outcomes
 async getCallOutcome(label: string): Promise<CallOutcome | null> {
  return await this.callOutcomeRepo.findOne({ where: { label } });
 }

 async listCallOutcomes(): Promise<CallOutcome[]> {
  return await this.callOutcomeRepo.find({ order: { sortOrder: 'ASC' } });
 }

 async createCallOutcome(outcome: Partial<CallOutcome>): Promise<CallOutcome> {
  const newOutcome = this.callOutcomeRepo.create(outcome);
  return await this.callOutcomeRepo.save(newOutcome);
 }

 async updateCallOutcome(id: string, outcome: Partial<CallOutcome>): Promise<CallOutcome | null> {
  await this.callOutcomeRepo.update(id, { ...outcome, updatedAt: new Date() });
  return await this.callOutcomeRepo.findOne({ where: { id } });
 }

 async deleteCallOutcome(id: string): Promise<void> {
  await this.callOutcomeRepo.delete(id);
 }

 async initializeCallOutcomes(): Promise<void> {
  const defaultOutcomes = [
   { label: 'Booked', bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200', hoverColor: 'hover:bg-green-200', sortOrder: 1 },
   { label: 'Call back', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-200', hoverColor: 'hover:bg-yellow-200', sortOrder: 2 },
   { label: "Don't Call", bgColor: 'bg-gray-700', textColor: 'text-white', borderColor: 'border-gray-700', hoverColor: 'hover:bg-gray-800', sortOrder: 3 },
   { label: 'Send an email', bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200', hoverColor: 'hover:bg-blue-200', sortOrder: 4 },
   { label: 'Not Interested', bgColor: 'bg-red-600', textColor: 'text-white', borderColor: 'border-red-600', hoverColor: 'hover:bg-red-700', sortOrder: 5 },
   { label: 'Hang up', bgColor: 'bg-pink-100', textColor: 'text-pink-700', borderColor: 'border-pink-200', hoverColor: 'hover:bg-pink-200', sortOrder: 6 },
   { label: 'Get back to you', bgColor: 'bg-purple-300', textColor: 'text-purple-700', borderColor: 'border-purple-300', hoverColor: 'hover:bg-purple-400', sortOrder: 7 },
  ];

  for (const outcome of defaultOutcomes) {
   const existing = await this.getCallOutcome(outcome.label);
   if (!existing) {
    await this.callOutcomeRepo.save(outcome);
   }
  }
 }

 // User Territories
 async getUserTerritories(userId: string): Promise<UserTerritory[]> {
  return await this.userTerritoryRepo.find({ where: { userId } });
 }

 async setUserTerritories(userId: string, territories: string[]): Promise<UserTerritory[]> {
  // Delete existing territories
  await this.userTerritoryRepo.delete({ userId });

  if (territories.length === 0) {
   return [];
  }

  // Create new territories
  const newTerritories = territories.map((territory) =>
   this.userTerritoryRepo.create({ userId, territory })
  );
  return await this.userTerritoryRepo.save(newTerritories);
 }

 async listAllTerritories(): Promise<string[]> {
  return ['Miami', 'Washington DC', 'Los Angeles', 'New York', 'Chicago', 'Dallas'];
 }

 // User Professions
 async getUserProfessions(userId: string): Promise<UserProfession[]> {
  return await this.userProfessionRepo.find({ where: { userId } });
 }

 async setUserProfessions(userId: string, professions: string[]): Promise<UserProfession[]> {
  // Delete existing professions
  await this.userProfessionRepo.delete({ userId });

  if (professions.length === 0) {
   return [];
  }

  // Create new professions
  const newProfessions = professions.map((profession) =>
   this.userProfessionRepo.create({ userId, profession })
  );
  return await this.userProfessionRepo.save(newProfessions);
 }

 async listAllProfessions(): Promise<string[]> {
  return ['Dental', 'Chiropractor', 'Optometry', 'Physical Therapy', 'Orthodontics', 'Legal', 'Financial', 'Real Estate'];
 }

 // Issues
 async getIssue(id: string): Promise<Issue | null> {
  return await this.issueRepo.findOne({ where: { id } });
 }

 async listIssues(status?: string): Promise<Issue[]> {
  if (status) {
   return await this.issueRepo.find({
    where: { status: status as any },
    order: { createdAt: 'DESC' },
   });
  }
  return await this.issueRepo.find({ order: { createdAt: 'DESC' } });
 }

 async createIssue(issue: Partial<Issue>): Promise<Issue> {
  const newIssue = this.issueRepo.create(issue);
  return await this.issueRepo.save(newIssue);
 }

 async updateIssue(id: string, issue: Partial<Issue>): Promise<Issue | null> {
  await this.issueRepo.update(id, { ...issue, updatedAt: new Date() });
  return await this.getIssue(id);
 }

 async deleteIssue(id: string): Promise<void> {
  await this.issueRepo.delete(id);
 }
}

// Singleton instance
let storageRepositoryInstance: StorageRepository | null = null;

/**
 * Get singleton instance of StorageRepository
 * @returns {StorageRepository}
 */
export function getStorageRepository(): StorageRepository {
 if (!storageRepositoryInstance) {
  storageRepositoryInstance = new StorageRepository();
 }
 return storageRepositoryInstance;
}

