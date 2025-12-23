import { DataSource, Repository } from "typeorm";
import { UserTerritory } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * User Territories Repository Interface
 */
export interface IUserTerritoriesRepository {
  getUserTerritories(userId: string): Promise<UserTerritory[]>;
  setUserTerritories(
    userId: string,
    territories: string[]
  ): Promise<UserTerritory[] | null>;
  listAllTerritories(): Promise<UserTerritory[]>;
}

/**
 * User Territories Repository Implementation
 */
export class UserTerritoriesRepository implements IUserTerritoriesRepository {
  private dataSource: DataSource;
  private userTerritoryRepo: Repository<UserTerritory>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.userTerritoryRepo = this.dataSource.getRepository(UserTerritory);
  }

  async getUserTerritories(userId: string): Promise<UserTerritory[]> {
    const territories = await this.userTerritoryRepo.find({
      where: { userId },
    });
    return territories;
  }

  async setUserTerritories(
    userId: string,
    territories: string[]
  ): Promise<UserTerritory[] | null> {
    // Delete existing territories
    await this.userTerritoryRepo.delete({ userId });

    // Create new territories
    const newTerritories = territories.map((territory) =>
      this.userTerritoryRepo.create({ userId, territory })
    );

    if (newTerritories.length > 0) {
      return await this.userTerritoryRepo.save(newTerritories);
    }
    return null;
  }

  async listAllTerritories(): Promise<UserTerritory[]> {
    const territories = await this.userTerritoryRepo
      .createQueryBuilder("userTerritory")
      .select("DISTINCT userTerritory.territory", "territory")
      .getRawMany();

    return territories;
  }
}

// Singleton instance
let userTerritoriesRepositoryInstance: UserTerritoriesRepository | null = null;

/**
 * Get singleton instance of UserTerritoriesRepository
 */
export function getUserTerritoriesRepository(): UserTerritoriesRepository {
  if (!userTerritoriesRepositoryInstance) {
    userTerritoriesRepositoryInstance = new UserTerritoriesRepository();
  }
  return userTerritoriesRepositoryInstance;
}
