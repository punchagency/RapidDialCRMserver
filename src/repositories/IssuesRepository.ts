import { DataSource, Repository } from "typeorm";
import { Issue } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Issues Repository Interface
 */
export interface IIssuesRepository {
  getIssue(id: string): Promise<Issue | null>;
  listIssues(status?: string): Promise<Issue[]>;
  createIssue(issue: Partial<Issue>): Promise<Issue>;
  updateIssue(id: string, issue: Partial<Issue>): Promise<Issue | null>;
  deleteIssue(id: string): Promise<void>;
}

/**
 * Issues Repository Implementation
 */
export class IssuesRepository implements IIssuesRepository {
  private dataSource: DataSource;
  private issueRepo: Repository<Issue>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.issueRepo = this.dataSource.getRepository(Issue);
  }

  async getIssue(id: string): Promise<Issue | null> {
    return await this.issueRepo.findOne({ where: { id } });
  }

  async listIssues(status?: string): Promise<Issue[]> {
    if (status) {
      return await this.issueRepo.find({
        where: { status: status as any },
        order: { createdAt: "DESC" },
      });
    }
    return await this.issueRepo.find({ order: { createdAt: "DESC" } });
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
let issuesRepositoryInstance: IssuesRepository | null = null;

/**
 * Get singleton instance of IssuesRepository
 */
export function getIssuesRepository(): IssuesRepository {
  if (!issuesRepositoryInstance) {
    issuesRepositoryInstance = new IssuesRepository();
  }
  return issuesRepositoryInstance;
}
