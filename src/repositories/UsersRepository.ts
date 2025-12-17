import { DataSource, Repository } from "typeorm";
import { User } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Users Repository Interface
 */
export interface IUsersRepository {
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<void>;
}

/**
 * Users Repository Implementation
 */
export class UsersRepository implements IUsersRepository {
  private dataSource: DataSource;
  private userRepo: Repository<User>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.userRepo = this.dataSource.getRepository(User);
  }

  async getUser(id: string): Promise<User | null> {
    return await this.userRepo.findOne({ where: { id } });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepo.findOne({ where: { email } });
  }

  async listUsers(): Promise<User[]> {
    return await this.userRepo.find();
  }

  async createUser(user: Partial<User>): Promise<User> {
    const newUser = this.userRepo.create(user);
    return await this.userRepo.save(newUser);
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | null> {
    await this.userRepo.update(id, { ...user, updatedAt: new Date() });
    return await this.getUser(id);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }
}

// Singleton instance
let usersRepositoryInstance: UsersRepository | null = null;

/**
 * Get singleton instance of UsersRepository
 */
export function getUsersRepository(): UsersRepository {
  if (!usersRepositoryInstance) {
    usersRepositoryInstance = new UsersRepository();
  }
  return usersRepositoryInstance;
}
