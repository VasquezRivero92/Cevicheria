import { v4 as uuidv4 } from 'uuid';
import { LocalJsonDb } from '../../db/localJsonDb.js';
export class LocalUserRepository {
    db = LocalJsonDb.getInstance();
    async getAll() {
        return this.db.getCollection('users');
    }
    async getById(id) {
        return this.db.getDocument('users', id);
    }
    async getByUsername(username) {
        const users = await this.db.queryCollection('users', (u) => u.username.toLowerCase() === username.toLowerCase());
        return users[0] || null;
    }
    async getByPin(pin) {
        const users = await this.db.queryCollection('users', (u) => u.pin === pin && u.active);
        return users[0] || null;
    }
    async getByBranch(branchId) {
        return this.db.queryCollection('users', (u) => (u.branchIds && (u.branchIds.includes(branchId) || u.branchIds.includes('all'))) ||
            u.branchId === branchId ||
            u.branchId === 'all');
    }
    async create(userData) {
        const branchIds = userData.branchIds && userData.branchIds.length > 0
            ? userData.branchIds
            : (userData.branchId ? [userData.branchId] : ['all']);
        const user = {
            id: uuidv4(),
            ...userData,
            active: userData.active !== undefined ? userData.active : true,
            branchIds,
            branchId: branchIds[0] || 'all',
            createdAt: new Date().toISOString()
        };
        return this.db.setDocument('users', user);
    }
    async update(id, updates) {
        return this.db.updateDocument('users', id, updates);
    }
    async delete(id) {
        return this.db.deleteDocument('users', id);
    }
}
