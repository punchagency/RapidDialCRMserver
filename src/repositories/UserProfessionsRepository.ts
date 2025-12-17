import { DataSource, Repository } from "typeorm";
import { UserProfession } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * User Professions Repository Interface
 */
export interface IUserProfessionsRepository {
  getUserProfessions(userId: string): Promise<UserProfession[]>;
  setUserProfessions(
    userId: string,
    professions: string[]
  ): Promise<UserProfession[]>;
  listAllProfessions(): Promise<string[]>;
}

/**
 * User Professions Repository Implementation
 */
export class UserProfessionsRepository implements IUserProfessionsRepository {
  private dataSource: DataSource;
  private userProfessionRepo: Repository<UserProfession>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.userProfessionRepo = this.dataSource.getRepository(UserProfession);
  }

  async getUserProfessions(userId: string): Promise<UserProfession[]> {
    const professions = await this.userProfessionRepo.find({
      where: { userId },
    });
    return professions;
  }

  async setUserProfessions(
    userId: string,
    professions: string[]
  ): Promise<UserProfession[]> {
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
    const professions = await this.userProfessionRepo
      .createQueryBuilder("userProfession")
      .select("DISTINCT userProfession.profession", "profession")
      .getRawMany();

    return professions.map((p) => p.profession);
  }
}

// Singleton instance
let userProfessionsRepositoryInstance: UserProfessionsRepository | null = null;

/**
 * Get singleton instance of UserProfessionsRepository
 */
export function getUserProfessionsRepository(): UserProfessionsRepository {
  if (!userProfessionsRepositoryInstance) {
    userProfessionsRepositoryInstance = new UserProfessionsRepository();
  }
  return userProfessionsRepositoryInstance;
}
