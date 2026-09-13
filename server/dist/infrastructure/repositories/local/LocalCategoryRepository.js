import { v4 as uuidv4 } from 'uuid';
import { LocalJsonDb } from '../../db/localJsonDb.js';
export class LocalCategoryRepository {
    db = LocalJsonDb.getInstance();
    async getAll() {
        const list = await this.db.getCollection('categories');
        return list.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    async getById(id) {
        return this.db.getDocument('categories', id);
    }
    async create(categoryData) {
        const category = {
            id: uuidv4(),
            ...categoryData
        };
        return this.db.setDocument('categories', category);
    }
    async update(id, category) {
        return this.db.updateDocument('categories', id, category);
    }
}
