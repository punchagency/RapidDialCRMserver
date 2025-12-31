import { DataSource, Repository, Brackets } from "typeorm";
import { EmailLog } from "../entities/EmailLog.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Email Log Repository Interface
 */
export interface IEmailLogRepository {
  logEmail(data: Partial<EmailLog>): Promise<EmailLog>;
  getAllLogs(
    limit: number,
    offset: number,
    search?: string
  ): Promise<[EmailLog[], number]>;
  getLogById(id: string): Promise<EmailLog | null>;
}

/**
 * Email Log Repository Implementation
 */
export class EmailLogRepository implements IEmailLogRepository {
  private dataSource: DataSource;
  private emailLogRepo: Repository<EmailLog>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.emailLogRepo = this.dataSource.getRepository(EmailLog);
  }

  async logEmail(data: Partial<EmailLog>): Promise<EmailLog> {
    const emailLog = this.emailLogRepo.create(data);
    return await this.emailLogRepo.save(emailLog);
  }

  async getAllLogs(
    limit: number,
    offset: number,
    search?: string
  ): Promise<[EmailLog[], number]> {
    const query = this.emailLogRepo
      .createQueryBuilder("emailLog")
      .orderBy("emailLog.createdAt", "DESC")
      .take(limit || 100)
      .skip(offset || 0);

    if (search) {
      const searchTerm = `%${search}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where("emailLog.to LIKE :search", { search: searchTerm })
            .orWhere("emailLog.subject LIKE :search", { search: searchTerm })
            .orWhere("emailLog.title LIKE :search", { search: searchTerm });
        })
      );
    }

    return await query.getManyAndCount();
  }

  async getLogById(id: string): Promise<EmailLog | null> {
    return await this.emailLogRepo.findOne({
      where: { id },
    });
  }
}

// Singleton instance
let emailLogRepositoryInstance: EmailLogRepository | null = null;

/**
 * Get singleton instance of EmailLogRepository
 */
export function getEmailLogRepository(): EmailLogRepository {
  if (!emailLogRepositoryInstance) {
    emailLogRepositoryInstance = new EmailLogRepository();
  }
  return emailLogRepositoryInstance;
}
