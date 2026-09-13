import { getRepositories } from '../infrastructure/repositories/factory.js';
import { Product, Category, BranchProductConfig } from '../domain/types.js';

export interface BranchProductView extends Product {
  isAvailableInBranch: boolean;
  effectivePrice: number;
  outOfStockReason?: string;
}

export class CatalogService {
  private repos = getRepositories();

  async getCategories(): Promise<Category[]> {
    return this.repos.categoryRepo.getAll();
  }

  async getAllProducts(): Promise<Product[]> {
    return this.repos.productRepo.getAll();
  }

  async getCatalogForBranch(branchId: string): Promise<BranchProductView[]> {
    const products = await this.repos.productRepo.getAll();
    const branchConfigs = await this.repos.branchConfigRepo.getAllByBranch(branchId);
    const configMap = new Map<string, BranchProductConfig>();

    for (const cfg of branchConfigs) {
      configMap.set(cfg.productId, cfg);
    }

    return products.map((prod) => {
      const cfg = configMap.get(prod.id);
      const isAvailableInBranch = cfg !== undefined ? cfg.isAvailable : prod.active;
      const effectivePrice = (cfg && cfg.customPrice !== undefined) ? cfg.customPrice : prod.basePrice;

      return {
        ...prod,
        isAvailableInBranch: prod.active && isAvailableInBranch,
        effectivePrice,
        outOfStockReason: cfg?.outOfStockReason
      };
    });
  }

  async setProductAvailabilityInBranch(
    branchId: string,
    productId: string,
    isAvailable: boolean,
    outOfStockReason?: string,
    customPrice?: number
  ): Promise<BranchProductConfig> {
    return this.repos.branchConfigRepo.upsertConfig({
      branchId,
      productId,
      isAvailable,
      outOfStockReason: !isAvailable ? (outOfStockReason || 'No disponible temporalmente') : undefined,
      customPrice
    });
  }

  async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    return this.repos.productRepo.create(productData);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    return this.repos.productRepo.update(id, updates);
  }
}
