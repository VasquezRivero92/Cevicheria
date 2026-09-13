import { getRepositories } from '../infrastructure/repositories/factory.js';
import { Branch } from '../domain/types.js';

export interface BranchStats {
  branchId: string;
  branchName: string;
  activeOrdersCount: number;
  completedOrdersCount: number;
  totalSales: number;
  tablesOccupied: number;
  tableCapacity: number;
}

export class BranchService {
  private repos = getRepositories();

  async getAllBranches(): Promise<Branch[]> {
    return this.repos.branchRepo.getAll();
  }

  async getBranchById(id: string): Promise<Branch | null> {
    return this.repos.branchRepo.getById(id);
  }

  async createBranch(branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<Branch> {
    return this.repos.branchRepo.create(branchData);
  }

  async updateBranch(id: string, updates: Partial<Branch>): Promise<Branch | null> {
    return this.repos.branchRepo.update(id, updates);
  }

  async getBranchStats(branchId: string): Promise<BranchStats> {
    const branch = await this.repos.branchRepo.getById(branchId);
    if (!branch) {
      throw new Error('Sede no encontrada');
    }

    const allOrders = await this.repos.orderRepo.getAll({ branchId });
    const activeOrders = allOrders.filter((o) => ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'PAID'].includes(o.status));
    const paidOrCompletedOrders = allOrders.filter((o) => o.status === 'PAID' || o.status === 'COMPLETED');
    const totalSales = paidOrCompletedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const occupiedTableSet = new Set(activeOrders.map((o) => o.tableNumber));

    return {
      branchId: branch.id,
      branchName: branch.name,
      activeOrdersCount: activeOrders.length,
      completedOrdersCount: paidOrCompletedOrders.length,
      totalSales,
      tablesOccupied: occupiedTableSet.size,
      tableCapacity: branch.tableCount
    };
  }

  async getGlobalStats(): Promise<{
    branchesCount: number;
    activeOrdersCount: number;
    totalSalesToday: number;
    topBranches: BranchStats[];
  }> {
    const branches = await this.repos.branchRepo.getAll();
    const branchStats: BranchStats[] = [];

    let totalSales = 0;
    let totalActiveOrders = 0;

    for (const b of branches) {
      const stats = await this.getBranchStats(b.id);
      branchStats.push(stats);
      totalSales += stats.totalSales;
      totalActiveOrders += stats.activeOrdersCount;
    }

    return {
      branchesCount: branches.length,
      activeOrdersCount: totalActiveOrders,
      totalSalesToday: totalSales,
      topBranches: branchStats
    };
  }
}
