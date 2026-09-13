import {
  Branch,
  User,
  Category,
  Product,
  BranchProductConfig,
  Order,
  OrderStatus
} from './types.js';

export interface IBranchRepository {
  getAll(): Promise<Branch[]>;
  getById(id: string): Promise<Branch | null>;
  create(branch: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<Branch>;
  update(id: string, branch: Partial<Branch>): Promise<Branch | null>;
  delete(id: string): Promise<boolean>;
}

export interface IUserRepository {
  getAll(): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  getByUsername(username: string): Promise<User | null>;
  getByPin(pin: string): Promise<User | null>;
  getByBranch(branchId: string): Promise<User[]>;
  create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(category: Omit<Category, 'id'>): Promise<Category>;
  update(id: string, category: Partial<Category>): Promise<Category | null>;
}

export interface IProductRepository {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  getByCategory(categoryId: string): Promise<Product[]>;
  create(product: Omit<Product, 'id'>): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
}

export interface IBranchProductConfigRepository {
  getAllByBranch(branchId: string): Promise<BranchProductConfig[]>;
  getConfig(branchId: string, productId: string): Promise<BranchProductConfig | null>;
  upsertConfig(config: Omit<BranchProductConfig, 'id' | 'updatedAt'>): Promise<BranchProductConfig>;
  batchUpdateAvailability(branchId: string, updates: Array<{ productId: string; isAvailable: boolean }>): Promise<void>;
}

export interface IOrderRepository {
  getAll(filters?: { branchId?: string; status?: OrderStatus; date?: string }): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
  getActiveByBranch(branchId: string): Promise<Order[]>;
  getActiveByTable(branchId: string, tableNumber: number): Promise<Order | null>;
  create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  update(id: string, order: Partial<Order>): Promise<Order | null>;
  updateStatus(id: string, status: OrderStatus, paymentMethod?: Order['paymentMethod']): Promise<Order | null>;
}
