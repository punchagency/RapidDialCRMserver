import { DataSource, Repository } from "typeorm";
import { CallOutcome } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Call Outcomes Repository Interface
 */
export interface ICallOutcomesRepository {
  getCallOutcome(label: string): Promise<CallOutcome | null>;
  listCallOutcomes(): Promise<CallOutcome[]>;
  createCallOutcome(outcome: Partial<CallOutcome>): Promise<CallOutcome>;
  updateCallOutcome(
    label: string,
    outcome: Partial<CallOutcome>
  ): Promise<CallOutcome | null>;
  deleteCallOutcome(label: string): Promise<void>;
  initializeCallOutcomes(outcomes: string[]): Promise<void>;
}

/**
 * Call Outcomes Repository Implementation
 */
export class CallOutcomesRepository implements ICallOutcomesRepository {
  private dataSource: DataSource;
  private callOutcomeRepo: Repository<CallOutcome>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.callOutcomeRepo = this.dataSource.getRepository(CallOutcome);
  }

  async getCallOutcome(label: string): Promise<CallOutcome | null> {
    return await this.callOutcomeRepo.findOne({ where: { label } });
  }

  async listCallOutcomes(): Promise<CallOutcome[]> {
    return await this.callOutcomeRepo.find({ order: { sortOrder: "ASC" } });
  }

  async createCallOutcome(outcome: Partial<CallOutcome>): Promise<CallOutcome> {
    const newOutcome = this.callOutcomeRepo.create(outcome);
    return await this.callOutcomeRepo.save(newOutcome);
  }

  async updateCallOutcome(
    id: string,
    outcome: Partial<CallOutcome>
  ): Promise<CallOutcome | null> {
    await this.callOutcomeRepo.update(id, {
      ...outcome,
      updatedAt: new Date(),
    });
    return await this.callOutcomeRepo.findOne({ where: { id } });
  }

  async deleteCallOutcome(id: string): Promise<void> {
    await this.callOutcomeRepo.delete(id);
  }

  async initializeCallOutcomes(): Promise<void> {
    const defaultOutcomes = [
      {
        label: "Booked",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        hoverColor: "hover:bg-green-200",
        sortOrder: 1,
      },
      {
        label: "Call back",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-700",
        borderColor: "border-yellow-200",
        hoverColor: "hover:bg-yellow-200",
        sortOrder: 2,
      },
      {
        label: "Don't Call",
        bgColor: "bg-gray-700",
        textColor: "text-white",
        borderColor: "border-gray-700",
        hoverColor: "hover:bg-gray-800",
        sortOrder: 3,
      },
      {
        label: "Send an email",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        hoverColor: "hover:bg-blue-200",
        sortOrder: 4,
      },
      {
        label: "Not Interested",
        bgColor: "bg-red-600",
        textColor: "text-white",
        borderColor: "border-red-600",
        hoverColor: "hover:bg-red-700",
        sortOrder: 5,
      },
      {
        label: "Hang up",
        bgColor: "bg-pink-100",
        textColor: "text-pink-700",
        borderColor: "border-pink-200",
        hoverColor: "hover:bg-pink-200",
        sortOrder: 6,
      },
      {
        label: "Get back to you",
        bgColor: "bg-purple-300",
        textColor: "text-purple-700",
        borderColor: "border-purple-300",
        hoverColor: "hover:bg-purple-400",
        sortOrder: 7,
      },
    ];

    for (const outcome of defaultOutcomes) {
      const existing = await this.getCallOutcome(outcome.label);
      if (!existing) {
        await this.callOutcomeRepo.save(outcome);
      }
    }
  }
}

// Singleton instance
let callOutcomesRepositoryInstance: CallOutcomesRepository | null = null;

/**
 * Get singleton instance of CallOutcomesRepository
 */
export function getCallOutcomesRepository(): CallOutcomesRepository {
  if (!callOutcomesRepositoryInstance) {
    callOutcomesRepositoryInstance = new CallOutcomesRepository();
  }
  return callOutcomesRepositoryInstance;
}
