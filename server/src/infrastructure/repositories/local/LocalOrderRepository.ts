import { v4 as uuidv4 } from 'uuid';
import { Order, OrderStatus } from '../../../domain/types.js';
import { IOrderRepository } from '../../../domain/repositories.js';
import { LocalJsonDb } from '../../db/localJsonDb.js';

export class LocalOrderRepository implements IOrderRepository {
  private db = LocalJsonDb.getInstance();

  async getAll(filters?: { branchId?: string; status?: OrderStatus; date?: string }): Promise<Order[]> {
    let orders = await this.db.getCollection<Order>('orders');

    if (filters) {
      if (filters.branchId && filters.branchId !== 'all') {
        orders = orders.filter((o) => o.branchId === filters.branchId);
      }
      if (filters.status) {
        orders = orders.filter((o) => o.status === filters.status);
      }
      if (filters.date) {
        orders = orders.filter((o) => o.createdAt.startsWith(filters.date!));
      }
    }

    // Ordenar descendente por fecha de creación (más recientes primero)
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getById(id: string): Promise<Order | null> {
    return this.db.getDocument<Order>('orders', id);
  }

  async getActiveByBranch(branchId: string): Promise<Order[]> {
    const activeStatuses: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'PAID'];
    const orders = await this.db.queryCollection<Order>(
      'orders',
      (o) => (branchId === 'all' || o.branchId === branchId) && activeStatuses.includes(o.status)
    );
    return orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getActiveByTable(branchId: string, tableNumber: number): Promise<Order | null> {
    const activeStatuses: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'PAID'];
    const orders = await this.db.queryCollection<Order>(
      'orders',
      (o) => o.branchId === branchId && o.tableNumber === tableNumber && activeStatuses.includes(o.status)
    );
    return orders[0] || null;
  }

  async create(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const now = new Date().toISOString();
    const order: Order = {
      id: uuidv4(),
      ...orderData,
      createdAt: now,
      updatedAt: now
    };
    return this.db.setDocument('orders', order);
  }

  async update(id: string, updates: Partial<Order>): Promise<Order | null> {
    return this.db.updateDocument<Order>('orders', id, updates);
  }

  async updateStatus(id: string, status: OrderStatus, paymentMethod?: Order['paymentMethod']): Promise<Order | null> {
    const updates: Partial<Order> = { status };
    if (paymentMethod) updates.paymentMethod = paymentMethod;
    if (status === 'PAID') updates.paidAt = new Date().toISOString();

    return this.db.updateDocument<Order>('orders', id, updates);
  }
}
