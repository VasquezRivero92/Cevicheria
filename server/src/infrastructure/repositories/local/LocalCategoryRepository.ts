import { v4 as uuidv4 } from 'uuid';
import { Category } from '../../../domain/types.js';
import { ICategoryRepository } from '../../../domain/repositories.js';
import { LocalJsonDb } from '../../db/localJsonDb.js';

export class LocalCategoryRepository implements ICategoryRepository {
  private db = LocalJsonDb.getInstance();

  async getAll(): Promise<Category[]> {
    const list = await this.db.getCollection<Category>('categories');
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getById(id: string): Promise<Category | null> {
    return this.db.getDocument<Category>('categories', id);
  }

  async create(categoryData: Omit<Category, 'id'>): Promise<Category> {
    const category: Category = {
      id: uuidv4(),
      ...categoryData
    };
    return this.db.setDocument('categories', category);
  }

  async update(id: string, category: Partial<Category>): Promise<Category | null> {
    return this.db.updateDocument<Category>('categories', id, category);
  }
}
