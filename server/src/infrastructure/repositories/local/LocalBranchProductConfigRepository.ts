import { BranchProductConfig } from '../../../domain/types.js';
import { IBranchProductConfigRepository } from '../../../domain/repositories.js';
import { LocalJsonDb } from '../../db/localJsonDb.js';

export class LocalBranchProductConfigRepository implements IBranchProductConfigRepository {
  private db = LocalJsonDb.getInstance();

  async getAllByBranch(branchId: string): Promise<BranchProductConfig[]> {
    return this.db.queryCollection<BranchProductConfig>(
      'branch_configs',
      (c) => c.branchId === branchId
    );
  }

  async getConfig(branchId: string, productId: string): Promise<BranchProductConfig | null> {
    const docId = `${branchId}_${productId}`;
    return this.db.getDocument<BranchProductConfig>('branch_configs', docId);
  }

  async upsertConfig(configData: Omit<BranchProductConfig, 'id' | 'updatedAt'>): Promise<BranchProductConfig> {
    const docId = `${configData.branchId}_${configData.productId}`;
    const now = new Date().toISOString();
    const config: BranchProductConfig = {
      id: docId,
      ...configData,
      updatedAt: now
    };
    return this.db.setDocument('branch_configs', config);
  }

  async batchUpdateAvailability(branchId: string, updates: Array<{ productId: string; isAvailable: boolean }>): Promise<void> {
    const now = new Date().toISOString();
    for (const item of updates) {
      const docId = `${branchId}_${item.productId}`;
      const existing = await this.db.getDocument<BranchProductConfig>('branch_configs', docId);
      const config: BranchProductConfig = {
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
