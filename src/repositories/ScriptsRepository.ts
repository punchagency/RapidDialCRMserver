import { DataSource, Repository } from "typeorm";
import { Script } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Scripts Repository Interface
 */
export interface IScriptsRepository {
 getScript(id: string): Promise<Script | null>;
 listScripts(profession?: string): Promise<Script[]>;
 createScript(script: Partial<Script>): Promise<Script>;
 updateScript(id: string, script: Partial<Script>): Promise<Script | null>;
 deleteScript(id: string): Promise<void>;
 getDefaultScript(profession: string): Promise<Script | null>;
}

/**
 * Scripts Repository Implementation
 */
export class ScriptsRepository implements IScriptsRepository {
 private dataSource: DataSource;
 private scriptRepo: Repository<Script>;

 constructor() {
  this.dataSource = getDatabaseManager().getDataSource();
  this.scriptRepo = this.dataSource.getRepository(Script);
 }

 async getScript(id: string): Promise<Script | null> {
  return await this.scriptRepo.findOne({ where: { id } });
 }

 async listScripts(profession?: string): Promise<Script[]> {
  if (profession) {
   return await this.scriptRepo.find({
    where: { profession },
    order: { createdAt: "DESC" },
   });
  }
  return await this.scriptRepo.find({
   order: { createdAt: "DESC" },
  });
 }

 async createScript(script: Partial<Script>): Promise<Script> {
  const newScript = this.scriptRepo.create({
   ...script,
   version: 1,
   isPublished: script.isPublished ?? false,
   isDefault: script.isDefault ?? false,
  });
  return await this.scriptRepo.save(newScript);
 }

 async updateScript(id: string, script: Partial<Script>): Promise<Script | null> {
  const existing = await this.getScript(id);
  if (!existing) return null;

  // Increment version if content or other significant fields changed
  const versionIncrement =
   script.content !== undefined && script.content !== existing.content ? 1 : 0;

  await this.scriptRepo.update(id, {
   ...script,
   version: existing.version + versionIncrement,
   updatedAt: new Date(),
  });
  return await this.getScript(id);
 }

 async deleteScript(id: string): Promise<void> {
  await this.scriptRepo.delete(id);
 }

 async getDefaultScript(profession: string): Promise<Script | null> {
  return await this.scriptRepo.findOne({
   where: { profession, isDefault: true },
  });
 }
}

// Singleton instance
let scriptsRepositoryInstance: ScriptsRepository | null = null;

export function getScriptsRepository(): ScriptsRepository {
 if (!scriptsRepositoryInstance) {
  scriptsRepositoryInstance = new ScriptsRepository();
 }
 return scriptsRepositoryInstance;
}

