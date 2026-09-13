import { v4 as uuidv4 } from 'uuid';
import { LocalJsonDb } from '../../db/localJsonDb.js';
export class LocalOrderRepository {
    db = LocalJsonDb.getInstance();
    async getAll(filters) {
        let orders = await this.db.getCollection('orders');
        if (filters) {
            if (filters.branchId && filters.branchId !== 'all') {
                orders = orders.filter((o) => o.branchId === filters.branchId);
            }
            if (filters.status) {
                orders = orders.filter((o) => o.status === filters.status);
            }
            if (filters.date) {
                orders = orders.filter((o) => o.createdAt.startsWith(filters.date));
            }
        }
        // Ordenar descendente por fecha de creación (más recientes primero)
        return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async getById(id) {
        return this.db.getDocument('orders', id);
    }
    async getActiveByBranch(branchId) {
        const activeStatuses = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'PAID'];
        const orders = await this.db.queryCollection('orders', (o) => (branchId === 'all' || o.branchId === branchId) && activeStatuses.includes(o.status));
        return orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    async getActiveByTable(branchId, tableNumber) {
        const activeStatuses = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'PAID'];
        const orders = await this.db.queryCollection('orders', (o) => o.branchId === branchId && o.tableNumber === tableNumber && activeStatuses.includes(o.status));
        return orders[0] || null;
    }
    async create(orderData) {
        const now = new Date().toISOString();
        const order = {
            id: uuidv4(),
            ...orderData,
            createdAt: now,
            updatedAt: now
        };
        return this.db.setDocument('orders', order);
    }
    async update(id, updates) {
        return this.db.updateDocument('orders', id, updates);
    }
    async updateStatus(id, status, paymentMethod) {
        const updates = { status };
        if (paymentMethod)
            updates.paymentMethod = paymentMethod;
        if (status === 'PAID')
            updates.paidAt = new Date().toISOString();
        return this.db.updateDocument('orders', id, updates);
    }
}
