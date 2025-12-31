import { DataSource, Repository } from "typeorm";
import { EmailLog } from "../entities/EmailLog.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Email Log Repository Interface
 */
export interface IEmailLogRepository {
  logEmail(data: Partial<EmailLog>): Promise<EmailLog>;
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
