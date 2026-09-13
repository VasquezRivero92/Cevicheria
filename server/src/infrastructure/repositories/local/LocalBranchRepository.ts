import { v4 as uuidv4 } from 'uuid';
import { Branch } from '../../../domain/types.js';
import { IBranchRepository } from '../../../domain/repositories.js';
import { LocalJsonDb } from '../../db/localJsonDb.js';

export class LocalBranchRepository implements IBranchRepository {
  private db = LocalJsonDb.getInstance();

  async getAll(): Promise<Branch[]> {
    return this.db.getCollection<Branch>('branches');
  }

  async getById(id: string): Promise<Branch | null> {
    return this.db.getDocument<Branch>('branches', id);
  }

  async create(branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<Branch> {
    const now = new Date().toISOString();
    const branch: Branch = {
      id: uuidv4(),
      ...branchData,
      createdAt: now,
      updatedAt: now
    };
    return this.db.setDocument('branches', branch);
  }

  async update(id: string, updates: Partial<Branch>): Promise<Branch | null> {
    return this.db.updateDocument<Branch>('branches', id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.db.deleteDocument('branches', id);
  }
}
