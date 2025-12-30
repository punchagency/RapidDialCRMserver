import { DataSource, Repository } from "typeorm";
import { EmailTemplate } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Mock templates to seed if database is empty
 */
const MOCK_TEMPLATES = [
 {
  name: "General Introduction",
  subject: "Introduction: QuantumPunch x {{company}}",
  body: "Hi {{firstName}},\n\nI noticed your work at {{company}} and wanted to reach out.\n\nWe help teams like yours streamline their sales calls. Would you be open to a 10-minute chat next week?\n\nBest,\nAlex",
  specialty: undefined,
 },
 {
  name: "Orthopedics Intro",
  subject: "Better surgical tool tracking for {{company}}",
  body: "Hi {{firstName}},\n\nI know running an orthopedics practice comes with unique inventory challenges.\n\nOur new module helps track surgical kits specifically for orthopedic procedures. Worth a quick look?\n\nBest,\nAlex",
  specialty: "Orthopedics",
 },
 {
  name: "Pediatrics Follow-up",
  subject: "Following up: Patient family communication",
  body: "Hi {{firstName}},\n\nGreat speaking with you. As we discussed, improving communication with parents is key for pediatric clinics.\n\nHere's that case study I mentioned.\n\nBest,\nAlex",
  specialty: "Pediatrics",
 },
 {
  name: "General Practice Check-in",
  subject: "Checking in on your practice volume",
  body: "Hi {{firstName}},\n\nHope you're having a great week. I know general practices are seeing high volume right now.\n\nAre you still looking for ways to reduce admin time?\n\nBest,\nAlex",
  specialty: "General Practice",
 },
 {
  name: "Dentist Special Offer",
  subject: "Exclusive offer for dental partners",
  body: "Hi {{firstName}},\n\nWe have a special partnership program for dental clinics this month.\n\nWould love to share the details if you have 5 minutes.\n\nBest,\nAlex",
  specialty: "Dentist",
 },
];

/**
 * Email Templates Repository Interface
 */
export interface IEmailTemplatesRepository {
 getAllTemplates(): Promise<EmailTemplate[]>;
 getTemplateById(id: string): Promise<EmailTemplate | null>;
 getTemplatesBySpecialty(specialty: string): Promise<EmailTemplate[]>;
 createTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate>;
 updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate | null>;
 deleteTemplate(id: string): Promise<boolean>;
 seedMockTemplates(): Promise<void>;
}

/**
 * Email Templates Repository Implementation
 */
export class EmailTemplatesRepository implements IEmailTemplatesRepository {
 private dataSource: DataSource;
 private templateRepo: Repository<EmailTemplate>;

 constructor() {
  this.dataSource = getDatabaseManager().getDataSource();
  this.templateRepo = this.dataSource.getRepository(EmailTemplate);
 }

 async getAllTemplates(): Promise<EmailTemplate[]> {
  const templates = await this.templateRepo.find({
   order: { name: "ASC" },
  });

  // If no templates exist, seed mock templates
  if (templates.length === 0) {
   await this.seedMockTemplates();
   return await this.templateRepo.find({
    order: { name: "ASC" },
   });
  }

  return templates;
 }

 async getTemplateById(id: string): Promise<EmailTemplate | null> {
  return await this.templateRepo.findOne({ where: { id } });
 }

 async getTemplatesBySpecialty(specialty: string): Promise<EmailTemplate[]> {
  return await this.templateRepo.find({
   where: { specialty },
   order: { name: "ASC" },
  });
 }

 async createTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
  const template = this.templateRepo.create(data);
  return await this.templateRepo.save(template);
 }

 async updateTemplate(
  id: string,
  data: Partial<EmailTemplate>
 ): Promise<EmailTemplate | null> {
  await this.templateRepo.update(id, data);
  return await this.getTemplateById(id);
 }

 async deleteTemplate(id: string): Promise<boolean> {
  const result = await this.templateRepo.delete(id);
  return (result.affected ?? 0) > 0;
 }

 /**
  * Seed mock templates if they don't already exist
  * Checks for duplicates by name to avoid repetitions
  */
 async seedMockTemplates(): Promise<void> {
  try {
   const existingTemplates = await this.templateRepo.find();
   const existingNames = new Set(existingTemplates.map((t) => t.name));

   const templatesToCreate = MOCK_TEMPLATES.filter(
    (mock) => !existingNames.has(mock.name)
   );

   if (templatesToCreate.length > 0) {
    const newTemplates = this.templateRepo.create(templatesToCreate);
    await this.templateRepo.save(newTemplates);
    console.log(`✅ Seeded ${templatesToCreate.length} email templates`);
   }
  } catch (error) {
   console.error("Error seeding mock templates:", error);
   throw error;
  }
 }
}

// Singleton instance
let emailTemplatesRepositoryInstance: EmailTemplatesRepository | null = null;

/**
 * Get singleton instance of EmailTemplatesRepository
 */
export function getEmailTemplatesRepository(): EmailTemplatesRepository {
 if (!emailTemplatesRepositoryInstance) {
  emailTemplatesRepositoryInstance = new EmailTemplatesRepository();
 }
 return emailTemplatesRepositoryInstance;
}

