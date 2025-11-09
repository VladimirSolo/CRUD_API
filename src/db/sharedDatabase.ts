import { User } from '../types/user';
import * as http from 'http';

class SharedDatabase {
  private users: Map<string, User> = new Map();

  async getAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, user: User): Promise<User | undefined> {
    if (!this.users.has(id)) {
      return undefined;
    }
    this.users.set(id, user);
    return user;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async clear(): Promise<void> {
    this.users.clear();
  }
}

// Экспортируем singleton инстанс
export const sharedDb = new SharedDatabase();