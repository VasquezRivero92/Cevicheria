import { v4 as uuidv4 } from 'uuid';
import { Product } from '../../../domain/types.js';
import { IProductRepository } from '../../../domain/repositories.js';
import { LocalJsonDb } from '../../db/localJsonDb.js';

export class LocalProductRepository implements IProductRepository {
  private db = LocalJsonDb.getInstance();

  async getAll(): Promise<Product[]> {
    return this.db.getCollection<Product>('products');
  }

  async getById(id: string): Promise<Product | null> {
    return this.db.getDocument<Product>('products', id);
  }

  async getByCategory(categoryId: string): Promise<Product[]> {
    return this.db.queryCollection<Product>('products', (p) => p.categoryId === categoryId && p.active);
  }

  async create(productData: Omit<Product, 'id'>): Promise<Product> {
    const product: Product = {
      id: uuidv4(),
      ...productData
    };
    return this.db.setDocument('products', product);
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    return this.db.updateDocument<Product>('products', id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.db.deleteDocument('products', id);
  }
}
