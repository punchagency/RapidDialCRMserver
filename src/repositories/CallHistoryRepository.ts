import { Brackets, DataSource, Repository } from "typeorm";
import { CallHistory, Prospect } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Call History Repository Interface
 */
export interface ICallHistoryRepository {
  recordCallOutcome(
    prospectId: string,
    callerId: string,
    outcome: string,
    notes?: string
  ): Promise<void>;

  /**
   * Upsert call history - creates or updates a call record
   * Handles status, recording URL, duration, prospectId, and callerId updates
   */
  upsertCallHistory(params: {
    callSid: string;
    status?: string;
    recordingUrl?: string;
    duration?: number;
    prospectId?: string;
    outcome?: string;
    callerId?: string;
  }): Promise<CallHistory>;

  getAllCallHistory(
    limit: number,
    offset: number,
    callerId?: string,
    search?: string
  ): Promise<[CallHistory[], number]>;
  getCallByCallSid(callSid: string): Promise<CallHistory | null>;
}

/**
 * Call History Repository Implementation
 */
export class CallHistoryRepository implements ICallHistoryRepository {
  private dataSource: DataSource;
  private callHistoryRepo: Repository<CallHistory>;
  private prospectRepo: Repository<Prospect>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.callHistoryRepo = this.dataSource.getRepository(CallHistory);
    this.prospectRepo = this.dataSource.getRepository(Prospect);
  }

  async recordCallOutcome(
    prospectId: string,
    callerId: string,
    outcome: string,
    notes?: string
  ): Promise<void> {
    // Find the most recent call record for this prospect
    const recentCall = await this.callHistoryRepo.findOne({
      where: { prospectId, callerId },
      order: { attemptDate: "DESC" },
    });

    if (!recentCall || !recentCall.callSid) {
      throw new Error(
        `No call history found for prospect ${prospectId}. Call must be made before recording outcome.`
      );
    }

    // Update the most recent call record with outcome
    await this.callHistoryRepo.update(
      { callSid: recentCall.callSid },
      { outcome, notes }
    );

    // Update prospect's lastContactDate
    await this.prospectRepo.update(
      { id: prospectId },
      {
        lastCallOutcome: outcome,
        lastContactDate: new Date(),
      }
    );
  }

  /**
   * Robust upsert method for call history
   * Creates new record or updates existing one with any combination of fields
   */
  async upsertCallHistory(params: {
    callSid: string;
    status?: string;
    recordingUrl?: string;
    duration?: number;
    prospectId?: string;
    outcome?: string;
    callerId?: string;
  }): Promise<CallHistory> {
    const {
      callSid,
      status,
      recordingUrl,
      duration,
      prospectId,
      outcome,
      callerId,
    } = params;

    console.log(`Upserting call history for callSid: ${callSid}`, params);

    // Try to find existing record
    const existing = await this.callHistoryRepo.findOne({ where: { callSid } });

    if (existing) {
      // Update existing record with provided fields only
      if (status !== undefined) existing.status = status;
      if (recordingUrl !== undefined) existing.recordingUrl = recordingUrl;
      if (duration !== undefined) existing.callDuration = duration;
      if (prospectId !== undefined) {
        existing.prospectId = prospectId;
      }
      if (outcome !== undefined) existing.outcome = outcome;
      if (callerId !== undefined) existing.callerId = callerId;

      console.log(`Updating existing call history:`, existing);
      return await this.callHistoryRepo.save(existing);
    }

    // Create new record with provided fields
    const newRecord = this.callHistoryRepo.create({
      callSid,
      status: status || "pending",
      recordingUrl,
      callDuration: duration,
      prospectId,
      outcome: outcome || "Call in progress",
      callerId,
      attemptDate: new Date(),
    });

    console.log(`Creating new call history:`, newRecord);
    return await this.callHistoryRepo.save(newRecord);
  }

  async getCallHistory(): Promise<CallHistory[]> {
    return await this.callHistoryRepo.find({
      relations: ["prospect"],
      order: { attemptDate: "DESC" },
    });
  }

  async getAllCallHistory(
    limit: number,
    offset: number,
    callerId?: string,
    search?: string
  ): Promise<[CallHistory[], number]> {
    // console.log("getAllCallHistory", limit, offset, search, callerId);
    const query = this.callHistoryRepo
      .createQueryBuilder("callHistory")
      .leftJoinAndSelect("callHistory.prospect", "prospect")
      .leftJoinAndSelect("callHistory.caller", "caller")
      .orderBy("callHistory.attemptDate", "DESC")
      .take(limit || 100)
      .skip(offset || 0);

    if (callerId) {
      query.andWhere("callHistory.callerId = :callerId", { callerId });
    }
    if (search) {
      const searchTerm = `%${search}%`;

      query.andWhere(
        new Brackets((qb) => {
          qb.where("prospect.businessName ILIKE :search", {
            search: searchTerm,
          }).orWhere("caller.name ILIKE :search", { search: searchTerm });
        })
      );
    }

    return await query.getManyAndCount();
  }

  async getCallByCallSid(callSid: string): Promise<CallHistory | null> {
    return await this.callHistoryRepo.findOne({
      where: { callSid },
      relations: ["prospect"],
    });
  }
}

// Singleton instance
let callHistoryRepositoryInstance: CallHistoryRepository | null = null;

/**
 * Get singleton instance of CallHistoryRepository
 */
export function getCallHistoryRepository(): CallHistoryRepository {
  if (!callHistoryRepositoryInstance) {
    callHistoryRepositoryInstance = new CallHistoryRepository();
  }
  return callHistoryRepositoryInstance;
}
