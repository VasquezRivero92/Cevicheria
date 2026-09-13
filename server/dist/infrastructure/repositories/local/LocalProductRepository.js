import { v4 as uuidv4 } from 'uuid';
import { LocalJsonDb } from '../../db/localJsonDb.js';
export class LocalProductRepository {
    db = LocalJsonDb.getInstance();
    async getAll() {
        return this.db.getCollection('products');
    }
    async getById(id) {
        return this.db.getDocument('products', id);
    }
    async getByCategory(categoryId) {
        return this.db.queryCollection('products', (p) => p.categoryId === categoryId && p.active);
    }
    async create(productData) {
        const product = {
            id: uuidv4(),
            ...productData
        };
        return this.db.setDocument('products', product);
    }
    async update(id, updates) {
        return this.db.updateDocument('products', id, updates);
    }
    async delete(id) {
        return this.db.deleteDocument('products', id);
    }
}
