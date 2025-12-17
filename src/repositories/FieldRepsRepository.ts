import { DataSource, Repository } from "typeorm";
import { FieldRep } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Field Reps Repository Interface
 */
export interface IFieldRepsRepository {
  getFieldRep(id: string): Promise<FieldRep | null>;
  getFieldRepByTerritory(territory: string): Promise<FieldRep | null>;
  createFieldRep(rep: Partial<FieldRep>): Promise<FieldRep>;
  listFieldReps(): Promise<FieldRep[]>;
  updateFieldRep(id: string, rep: Partial<FieldRep>): Promise<FieldRep | null>;
}

/**
 * Field Reps Repository Implementation
 */
export class FieldRepsRepository implements IFieldRepsRepository {
  private dataSource: DataSource;
  private fieldRepRepo: Repository<FieldRep>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.fieldRepRepo = this.dataSource.getRepository(FieldRep);
  }

  async getFieldRep(id: string): Promise<FieldRep | null> {
    return await this.fieldRepRepo.findOne({ where: { id } });
  }

  async getFieldRepByTerritory(territory: string): Promise<FieldRep | null> {
    return await this.fieldRepRepo.findOne({ where: { territory } });
  }

  async createFieldRep(rep: Partial<FieldRep>): Promise<FieldRep> {
    const newRep = this.fieldRepRepo.create(rep);
    return await this.fieldRepRepo.save(newRep);
  }

  async listFieldReps(): Promise<FieldRep[]> {
    return await this.fieldRepRepo.find();
  }

  async updateFieldRep(
    id: string,
    rep: Partial<FieldRep>
  ): Promise<FieldRep | null> {
    await this.fieldRepRepo.update(id, { ...rep, updatedAt: new Date() });
    return await this.getFieldRep(id);
  }
}

// Singleton instance
let fieldRepsRepositoryInstance: FieldRepsRepository | null = null;

/**
 * Get singleton instance of FieldRepsRepository
 */
export function getFieldRepsRepository(): FieldRepsRepository {
  if (!fieldRepsRepositoryInstance) {
    fieldRepsRepositoryInstance = new FieldRepsRepository();
  }
  return fieldRepsRepositoryInstance;
}
