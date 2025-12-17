import { DataSource, Repository, IsNull } from "typeorm";
import { Prospect } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Prospects Repository Interface
 */
export interface IProspectsRepository {
  getProspect(id: string): Promise<Prospect | null>;
  listAllProspects(): Promise<Prospect[]>;
  listProspectsByTerritory(territory: string): Promise<Prospect[]>;
  createProspect(prospect: Partial<Prospect>): Promise<Prospect>;
  updateProspect(
    id: string,
    prospect: Partial<Prospect>
  ): Promise<Prospect | null>;
  listProspectsWithoutCoordinates(): Promise<Prospect[]>;
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
