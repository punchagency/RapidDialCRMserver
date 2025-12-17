import { DataSource, Repository } from "typeorm";
import { Stakeholder } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Stakeholders Repository Interface
 */
export interface IStakeholdersRepository {
  getStakeholder(id: string): Promise<Stakeholder | null>;
  listStakeholdersByProspect(prospectId: string): Promise<Stakeholder[]>;
  createStakeholder(stakeholder: Partial<Stakeholder>): Promise<Stakeholder>;
  updateStakeholder(
    id: string,
    stakeholder: Partial<Stakeholder>
  ): Promise<Stakeholder | null>;
  deleteStakeholder(id: string): Promise<void>;
}

/**
 * Stakeholders Repository Implementation
 */
export class StakeholdersRepository implements IStakeholdersRepository {
  private dataSource: DataSource;
  private stakeholderRepo: Repository<Stakeholder>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.stakeholderRepo = this.dataSource.getRepository(Stakeholder);
  }

  async getStakeholder(id: string): Promise<Stakeholder | null> {
    return await this.stakeholderRepo.findOne({ where: { id } });
  }

  async listStakeholdersByProspect(prospectId: string): Promise<Stakeholder[]> {
    return await this.stakeholderRepo.find({ where: { prospectId } });
  }

  async createStakeholder(
    stakeholder: Partial<Stakeholder>
  ): Promise<Stakeholder> {
    const newStakeholder = this.stakeholderRepo.create(stakeholder);
    return await this.stakeholderRepo.save(newStakeholder);
  }

  async updateStakeholder(
    id: string,
    stakeholder: Partial<Stakeholder>
  ): Promise<Stakeholder | null> {
    await this.stakeholderRepo.update(id, {
      ...stakeholder,
      updatedAt: new Date(),
    });
    return await this.getStakeholder(id);
  }

  async deleteStakeholder(id: string): Promise<void> {
    await this.stakeholderRepo.delete(id);
  }
}

// Singleton instance
let stakeholdersRepositoryInstance: StakeholdersRepository | null = null;

/**
 * Get singleton instance of StakeholdersRepository
 */
export function getStakeholdersRepository(): StakeholdersRepository {
  if (!stakeholdersRepositoryInstance) {
    stakeholdersRepositoryInstance = new StakeholdersRepository();
  }
  return stakeholdersRepositoryInstance;
}
