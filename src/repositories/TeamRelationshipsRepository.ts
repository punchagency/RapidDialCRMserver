import { DataSource, Repository, In } from "typeorm";
import { TeamRelationship } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Team Relationships Repository Interface
 */
export interface ITeamRelationshipsRepository {
 getRelationshipsByInsideRep(insideRepId: string): Promise<TeamRelationship[]>;
 saveRelationships(
  insideRepId: string,
  fieldRepIds: string[],
  managerIds: string[]
 ): Promise<void>;
 deleteRelationshipsByInsideRep(insideRepId: string): Promise<void>;
 getAllRelationships(): Promise<TeamRelationship[]>;
}

/**
 * Team Relationships Repository Implementation
 */
export class TeamRelationshipsRepository implements ITeamRelationshipsRepository {
 private dataSource: DataSource;
 private teamRelRepo: Repository<TeamRelationship>;

 constructor() {
  this.dataSource = getDatabaseManager().getDataSource();
  this.teamRelRepo = this.dataSource.getRepository(TeamRelationship);
 }

 async getRelationshipsByInsideRep(
  insideRepId: string
 ): Promise<TeamRelationship[]> {
  return await this.teamRelRepo.find({
   where: { insideRepId },
  });
 }

 async saveRelationships(
  insideRepId: string,
  fieldRepIds: string[],
  managerIds: string[]
 ): Promise<void> {
  // Delete existing relationships for this inside rep
  await this.deleteRelationshipsByInsideRep(insideRepId);

  // Create new relationships
  const relationships: Partial<TeamRelationship>[] = [];

  // Add field rep relationships
  for (const fieldRepId of fieldRepIds) {
   relationships.push({
    insideRepId,
    fieldRepId,
    managerId: undefined,
   });
  }

  // Add manager relationships
  for (const managerId of managerIds) {
   relationships.push({
    insideRepId,
    fieldRepId: undefined,
    managerId,
   });
  }

  if (relationships.length > 0) {
   const newRelationships = this.teamRelRepo.create(relationships);
   await this.teamRelRepo.save(newRelationships);
  }
 }

 async deleteRelationshipsByInsideRep(insideRepId: string): Promise<void> {
  await this.teamRelRepo.delete({ insideRepId });
 }

 async getAllRelationships(): Promise<TeamRelationship[]> {
  return await this.teamRelRepo.find({
   relations: ["insideRep", "fieldRep", "manager"],
  });
 }
}

// Singleton instance
let teamRelationshipsRepositoryInstance: TeamRelationshipsRepository | null = null;

/**
 * Get singleton instance of TeamRelationshipsRepository
 */
export function getTeamRelationshipsRepository(): TeamRelationshipsRepository {
 if (!teamRelationshipsRepositoryInstance) {
  teamRelationshipsRepositoryInstance = new TeamRelationshipsRepository();
 }
 return teamRelationshipsRepositoryInstance;
}

