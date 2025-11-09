import { User } from '../types/user';
import cluster from 'cluster';

class Database {
  private users: Map<string, User> = new Map();

  async getAll(): Promise<User[]> {
    if (cluster.isWorker) {
      return this.sendToMaster('getAll', {});
    }
    return Array.from(this.users.values());
  }

  async getById(id: string): Promise<User | undefined> {
    if (cluster.isWorker) {
      return this.sendToMaster('getById', { id });
    }
    return this.users.get(id);
  }

  async create(user: User): Promise<User> {
    if (cluster.isWorker) {
      return this.sendToMaster('create', { user });
    }
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, user: User): Promise<User | undefined> {
    if (cluster.isWorker) {
      return this.sendToMaster('update', { id, user });
    }
    if (!this.users.has(id)) {
      return undefined;
    }
    this.users.set(id, user);
    return user;
  }

  async delete(id: string): Promise<boolean> {
    if (cluster.isWorker) {
      return this.sendToMaster('delete', { id });
    }
    return this.users.delete(id);
  }

  async clear(): Promise<void> {
    if (cluster.isWorker) {
      return this.sendToMaster('clear', {});
    }
    this.users.clear();
  }

  private sendToMaster(action: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageId = Math.random().toString(36);

      const timeout = setTimeout(() => {
        reject(new Error('Database operation timeout'));
      }, 5000);

      const handler = (message: any) => {
        if (message.messageId === messageId) {
          clearTimeout(timeout);
          process.off('message', handler);
          if (message.error) {
            reject(new Error(message.error));
          } else {
            resolve(message.result);
          }
        }
      };

      process.on('message', handler);

      if (process.send) {
        process.send({
          type: 'db-operation',
          action,
          data,
          messageId
        });
      } else {
        clearTimeout(timeout);
        reject(new Error('Cannot send message to master'));
      }
    });
  }

  // Методы для мастер-процесса
  handleOperation(action: string, data: any): any {
    switch (action) {
      case 'getAll':
        return Array.from(this.users.values());
      case 'getById':
        return this.users.get(data.id);
      case 'create':
        this.users.set(data.user.id, data.user);
        return data.user;
      case 'update':
        if (!this.users.has(data.id)) {
          return undefined;
        }
        this.users.set(data.id, data.user);
        return data.user;
      case 'delete':
        return this.users.delete(data.id);
      case 'clear':
        this.users.clear();
        return undefined;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

export const db = new Database();