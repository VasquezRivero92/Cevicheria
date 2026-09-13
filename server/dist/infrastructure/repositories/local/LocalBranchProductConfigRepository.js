import { LocalJsonDb } from '../../db/localJsonDb.js';
export class LocalBranchProductConfigRepository {
    db = LocalJsonDb.getInstance();
    async getAllByBranch(branchId) {
        return this.db.queryCollection('branch_configs', (c) => c.branchId === branchId);
    }
    async getConfig(branchId, productId) {
        const docId = `${branchId}_${productId}`;
        return this.db.getDocument('branch_configs', docId);
    }
    async upsertConfig(configData) {
        const docId = `${configData.branchId}_${configData.productId}`;
        const now = new Date().toISOString();
        const config = {
            id: docId,
            ...configData,
            updatedAt: now
        };
        return this.db.setDocument('branch_configs', config);
    }
    async batchUpdateAvailability(branchId, updates) {
        const now = new Date().toISOString();
        for (const item of updates) {
            const docId = `${branchId}_${item.productId}`;
            const existing = await this.db.getDocument('branch_configs', docId);
            const config = {
                id: docId,
                branchId,
                productId: item.productId,
                isAvailable: item.isAvailable,
                customPrice: existing?.customPrice,
                outOfStockReason: existing?.outOfStockReason,
                updatedAt: now
            };
            await this.db.setDocument('branch_configs', config);
        }
    }
}
