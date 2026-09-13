import {
  IBranchRepository,
  IUserRepository,
  ICategoryRepository,
  IProductRepository,
  IBranchProductConfigRepository,
  IOrderRepository
} from '../../../domain/repositories.js';
import { Branch, User, Category, Product, BranchProductConfig, Order, OrderStatus } from '../../../domain/types.js';

/**
 * Adaptador Firestore para cuando se active DATABASE_PROVIDER=firebase
 * Los nombres de colecciones y esquemas de documentos coinciden 1:1 con la BD Local.
 */
export class FirebaseRepositoryFactory {
  // Nota: Al activar 'firebase', se inicializará el cliente de firebase-admin/firestore
  // y estos métodos delegarán directamente a `firestore.collection(...)`.
}
