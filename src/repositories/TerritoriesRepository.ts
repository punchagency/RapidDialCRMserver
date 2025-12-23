import { DataSource, Repository } from "typeorm";
import { Territory } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Territories Repository Interface
 */
export interface ITerritoriesRepository {
  getAllTerritories(): Promise<Territory[]>;
  getTerritoryById(id: string): Promise<Territory | null>;
  getTerritoryByName(name: string): Promise<Territory | null>;
  createTerritory(data: Partial<Territory>): Promise<Territory>;
  updateTerritory(id: string, data: Partial<Territory>): Promise<Territory | null>;
  deleteTerritory(id: string): Promise<boolean>;
}

/**
 * Territories Repository Implementation
 */
export class TerritoriesRepository implements ITerritoriesRepository {
  private dataSource: DataSource;
  private territoryRepo: Repository<Territory>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.territoryRepo = this.dataSource.getRepository(Territory);
  }

  async getAllTerritories(): Promise<Territory[]> {
    return await this.territoryRepo.find({
      order: { name: "ASC" },
    });
  }

  async getTerritoryById(id: string): Promise<Territory | null> {
    return await this.territoryRepo.findOne({ where: { id } });
  }

  async getTerritoryByName(name: string): Promise<Territory | null> {
    return await this.territoryRepo.findOne({ where: { name } });
  }

  async createTerritory(data: Partial<Territory>): Promise<Territory> {
    const territory = this.territoryRepo.create(data);
    return await this.territoryRepo.save(territory);
  }

  async updateTerritory(
    id: string,
    data: Partial<Territory>
  ): Promise<Territory | null> {
    await this.territoryRepo.update(id, data);
    return await this.getTerritoryById(id);
  }

  async deleteTerritory(id: string): Promise<boolean> {
    const result = await this.territoryRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

// Singleton instance
let territoriesRepositoryInstance: TerritoriesRepository | null = null;

/**
 * Get singleton instance of TerritoriesRepository
 */
export function getTerritoriesRepository(): TerritoriesRepository {
  if (!territoriesRepositoryInstance) {
    territoriesRepositoryInstance = new TerritoriesRepository();
  }
  return territoriesRepositoryInstance;
}
