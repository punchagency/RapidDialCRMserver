import { DataSource, Repository } from "typeorm";
import { SpecialtyColor } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Specialty Colors Repository Interface
 */
export interface ISpecialtyColorsRepository {
  getSpecialtyColor(specialty: string): Promise<SpecialtyColor | null>;
  listSpecialtyColors(): Promise<SpecialtyColor[]>;
  updateSpecialtyColor(
    specialty: string,
    color: Partial<SpecialtyColor>
  ): Promise<SpecialtyColor | null>;
  initializeSpecialtyColors(specialties: string[]): Promise<void>;
}

/**
 * Specialty Colors Repository Implementation
 */
export class SpecialtyColorsRepository implements ISpecialtyColorsRepository {
  private dataSource: DataSource;
  private specialtyColorRepo: Repository<SpecialtyColor>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.specialtyColorRepo = this.dataSource.getRepository(SpecialtyColor);
  }

  async getSpecialtyColor(specialty: string): Promise<SpecialtyColor | null> {
    return await this.specialtyColorRepo.findOne({ where: { specialty } });
  }

  async listSpecialtyColors(): Promise<SpecialtyColor[]> {
    return await this.specialtyColorRepo.find();
  }

  async updateSpecialtyColor(
    specialty: string,
    color: Partial<SpecialtyColor>
  ): Promise<SpecialtyColor | null> {
    await this.specialtyColorRepo.update(
      { specialty },
      { ...color, updatedAt: new Date() }
    );
    return await this.getSpecialtyColor(specialty);
  }

  async initializeSpecialtyColors(specialtiesList: string[]): Promise<void> {
    const defaultColors = [
      {
        specialty: "Dental",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
      },
      {
        specialty: "Chiropractor",
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-700",
      },
      {
        specialty: "Optometry",
        bgColor: "bg-purple-100",
        textColor: "text-purple-700",
      },
      {
        specialty: "Physical Therapy",
        bgColor: "bg-orange-100",
        textColor: "text-orange-700",
      },
      {
        specialty: "Orthodontics",
        bgColor: "bg-pink-100",
        textColor: "text-pink-700",
      },
    ];

    for (const color of defaultColors) {
      const existing = await this.getSpecialtyColor(color.specialty);
      if (!existing) {
        await this.specialtyColorRepo.save(color);
      }
    }
  }
}

// Singleton instance
let specialtyColorsRepositoryInstance: SpecialtyColorsRepository | null = null;

/**
 * Get singleton instance of SpecialtyColorsRepository
 */
export function getSpecialtyColorsRepository(): SpecialtyColorsRepository {
  if (!specialtyColorsRepositoryInstance) {
    specialtyColorsRepositoryInstance = new SpecialtyColorsRepository();
  }
  return specialtyColorsRepositoryInstance;
}
