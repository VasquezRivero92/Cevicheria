import { v4 as uuidv4 } from 'uuid';
import { LocalJsonDb } from '../../db/localJsonDb.js';
export class LocalBranchRepository {
    db = LocalJsonDb.getInstance();
    async getAll() {
        return this.db.getCollection('branches');
    }
    async getById(id) {
        return this.db.getDocument('branches', id);
    }
    async create(branchData) {
        const now = new Date().toISOString();
        const branch = {
            id: uuidv4(),
            ...branchData,
            createdAt: now,
            updatedAt: now
        };
        return this.db.setDocument('branches', branch);
    }
    async update(id, updates) {
        return this.db.updateDocument('branches', id, updates);
    }
    async delete(id) {
        return this.db.deleteDocument('branches', id);
    }
}
