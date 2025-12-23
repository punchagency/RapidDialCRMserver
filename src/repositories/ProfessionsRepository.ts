import { DataSource, Repository } from "typeorm";
import { Profession } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Professions Repository Interface
 */
export interface IProfessionsRepository {
  getAllProfessions(): Promise<Profession[]>;
  getProfessionById(id: string): Promise<Profession | null>;
  getProfessionByName(name: string): Promise<Profession | null>;
  createProfession(data: Partial<Profession>): Promise<Profession>;
  updateProfession(id: string, data: Partial<Profession>): Promise<Profession | null>;
  deleteProfession(id: string): Promise<boolean>;
}

/**
 * Professions Repository Implementation
 */
export class ProfessionsRepository implements IProfessionsRepository {
  private dataSource: DataSource;
  private professionRepo: Repository<Profession>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.professionRepo = this.dataSource.getRepository(Profession);
  }

  async getAllProfessions(): Promise<Profession[]> {
    return await this.professionRepo.find({
      order: { name: "ASC" },
    });
  }

  async getProfessionById(id: string): Promise<Profession | null> {
    return await this.professionRepo.findOne({ where: { id } });
  }

  async getProfessionByName(name: string): Promise<Profession | null> {
    return await this.professionRepo.findOne({ where: { name } });
  }

  async createProfession(data: Partial<Profession>): Promise<Profession> {
    const profession = this.professionRepo.create(data);
    return await this.professionRepo.save(profession);
  }

  async updateProfession(
    id: string,
    data: Partial<Profession>
  ): Promise<Profession | null> {
    await this.professionRepo.update(id, data);
    return await this.getProfessionById(id);
  }

  async deleteProfession(id: string): Promise<boolean> {
    const result = await this.professionRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

// Singleton instance
let professionsRepositoryInstance: ProfessionsRepository | null = null;

/**
 * Get singleton instance of ProfessionsRepository
 */
export function getProfessionsRepository(): ProfessionsRepository {
  if (!professionsRepositoryInstance) {
    professionsRepositoryInstance = new ProfessionsRepository();
  }
  return professionsRepositoryInstance;
}
