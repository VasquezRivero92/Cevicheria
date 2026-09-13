import { getRepositories } from '../infrastructure/repositories/factory.js';
export class CatalogService {
    repos = getRepositories();
    async getCategories() {
        return this.repos.categoryRepo.getAll();
    }
    async getAllProducts() {
        return this.repos.productRepo.getAll();
    }
    async getCatalogForBranch(branchId) {
        const products = await this.repos.productRepo.getAll();
        const branchConfigs = await this.repos.branchConfigRepo.getAllByBranch(branchId);
        const configMap = new Map();
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
    async setProductAvailabilityInBranch(branchId, productId, isAvailable, outOfStockReason, customPrice) {
        return this.repos.branchConfigRepo.upsertConfig({
            branchId,
            productId,
            isAvailable,
            outOfStockReason: !isAvailable ? (outOfStockReason || 'No disponible temporalmente') : undefined,
            customPrice
        });
    }
    async createProduct(productData) {
        return this.repos.productRepo.create(productData);
    }
    async updateProduct(id, updates) {
        return this.repos.productRepo.update(id, updates);
    }
}
