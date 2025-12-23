import { DataSource, Repository, IsNull, Not } from "typeorm";
import { Prospect } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Prospects Repository Interface
 */
export interface IProspectsRepository {
  getProspect(id: string): Promise<Prospect | null>;
  listAllProspects(
    called?: boolean,
    limit?: number,
    offset?: number
  ): Promise<[Prospect[], number]>;
  listProspectsByTerritory(territory: string): Promise<[Prospect[], number]>;
  createProspect(prospect: Partial<Prospect>): Promise<Prospect>;
  updateProspect(
    id: string,
    prospect: Partial<Prospect>
  ): Promise<Prospect | null>;
  listProspectsWithoutCoordinates(): Promise<Prospect[]>;
  deleteProspect(id: string): Promise<void>;
}

/**
 * Prospects Repository Implementation
 */
export class ProspectsRepository implements IProspectsRepository {
  private dataSource: DataSource;
  private prospectRepo: Repository<Prospect>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.prospectRepo = this.dataSource.getRepository(Prospect);
  }

  async getProspect(id: string): Promise<Prospect | null> {
    return await this.prospectRepo.findOne({ where: { id } });
  }

  async listAllProspects(
    called: boolean = false,
    limit?: number,
    offset?: number
  ): Promise<[Prospect[], number]> {
    const whereClause = called ? { lastCallOutcome: IsNull() } : {};
    // console.log(called, limit, offset);
    return await this.prospectRepo.findAndCount({
      take: limit || 100,
      skip: offset || 0,
      where: whereClause,
    });
  }

  async listProspectsByTerritory(
    territory: string
  ): Promise<[Prospect[], number]> {
    return await this.prospectRepo.findAndCount({ where: { territory } });
  }

  async createProspect(prospect: Partial<Prospect>): Promise<Prospect> {
    const newProspect = this.prospectRepo.create(prospect);
    return await this.prospectRepo.save(newProspect);
  }

  async updateProspect(
    id: string,
    prospect: Partial<Prospect>
  ): Promise<Prospect | null> {
    await this.prospectRepo.update(id, { ...prospect, updatedAt: new Date() });
    return await this.getProspect(id);
  }

  async listProspectsWithoutCoordinates(): Promise<Prospect[]> {
    return await this.prospectRepo.find({
      where: [{ addressLat: IsNull() }, { addressLng: IsNull() }],
    });
  }
  async deleteProspect(id: string): Promise<void> {
    await this.prospectRepo.delete(id);
  }
}

// Singleton instance
let prospectsRepositoryInstance: ProspectsRepository | null = null;

/**
 * Get singleton instance of ProspectsRepository
 */
export function getProspectsRepository(): ProspectsRepository {
  if (!prospectsRepositoryInstance) {
    prospectsRepositoryInstance = new ProspectsRepository();
  }
  return prospectsRepositoryInstance;
}
