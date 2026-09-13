import { v4 as uuidv4 } from 'uuid';
import { User } from '../../../domain/types.js';
import { IUserRepository } from '../../../domain/repositories.js';
import { LocalJsonDb } from '../../db/localJsonDb.js';

export class LocalUserRepository implements IUserRepository {
  private db = LocalJsonDb.getInstance();

  async getAll(): Promise<User[]> {
    return this.db.getCollection<User>('users');
  }

  async getById(id: string): Promise<User | null> {
    return this.db.getDocument<User>('users', id);
  }

  async getByUsername(username: string): Promise<User | null> {
    const users = await this.db.queryCollection<User>(
      'users',
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    return users[0] || null;
  }

  async getByPin(pin: string): Promise<User | null> {
    const users = await this.db.queryCollection<User>(
      'users',
      (u) => u.pin === pin && u.active
    );
    return users[0] || null;
  }

  async getByBranch(branchId: string): Promise<User[]> {
    return this.db.queryCollection<User>(
      'users',
      (u) =>
        (u.branchIds && (u.branchIds.includes(branchId) || u.branchIds.includes('all'))) ||
        u.branchId === branchId ||
        u.branchId === 'all'
    );
  }

  async create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const branchIds = userData.branchIds && userData.branchIds.length > 0 
      ? userData.branchIds 
      : (userData.branchId ? [userData.branchId] : ['all']);

    const user: User = {
      id: uuidv4(),
      ...userData,
      active: userData.active !== undefined ? userData.active : true,
      branchIds,
      branchId: branchIds[0] || 'all',
      createdAt: new Date().toISOString()
    };
    return this.db.setDocument('users', user);
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    return this.db.updateDocument<User>('users', id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.db.deleteDocument('users', id);
  }
}
