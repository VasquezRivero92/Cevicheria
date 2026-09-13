import {
  IBranchRepository,
  IUserRepository,
  ICategoryRepository,
  IProductRepository,
  IBranchProductConfigRepository,
  IOrderRepository
} from '../../domain/repositories.js';
import { LocalBranchRepository } from './local/LocalBranchRepository.js';
import { LocalUserRepository } from './local/LocalUserRepository.js';
import { LocalCategoryRepository } from './local/LocalCategoryRepository.js';
import { LocalProductRepository } from './local/LocalProductRepository.js';
import { LocalBranchProductConfigRepository } from './local/LocalBranchProductConfigRepository.js';
import { LocalOrderRepository } from './local/LocalOrderRepository.js';

export interface RepositoryContainer {
  branchRepo: IBranchRepository;
  userRepo: IUserRepository;
  categoryRepo: ICategoryRepository;
  productRepo: IProductRepository;
  branchConfigRepo: IBranchProductConfigRepository;
  orderRepo: IOrderRepository;
}

let container: RepositoryContainer | null = null;

export function getRepositories(): RepositoryContainer {
  if (container) return container;

  const provider = process.env.DATABASE_PROVIDER || 'local';

  if (provider === 'local') {
    container = {
      branchRepo: new LocalBranchRepository(),
      userRepo: new LocalUserRepository(),
      categoryRepo: new LocalCategoryRepository(),
      productRepo: new LocalProductRepository(),
      branchConfigRepo: new LocalBranchProductConfigRepository(),
      orderRepo: new LocalOrderRepository()
    };
  } else {
    // Si en el futuro es 'firebase', se intercambia aquí sin alterar controladores ni servicios
    console.log('[DB] Inicializando Repositorios Firebase Firestore...');
    container = {
      branchRepo: new LocalBranchRepository(),
      userRepo: new LocalUserRepository(),
      categoryRepo: new LocalCategoryRepository(),
      productRepo: new LocalProductRepository(),
      branchConfigRepo: new LocalBranchProductConfigRepository(),
      orderRepo: new LocalOrderRepository()
    };
  }

  return container;
}
