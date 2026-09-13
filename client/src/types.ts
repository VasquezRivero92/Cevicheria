export type Role = 'admin_general' | 'admin_local' | 'mozo' | 'cocina' | 'cajero';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export type SpiceLevel = 'SIN_AJI' | 'MEDIO' | 'BRAVO' | 'FUEGO';

export type PaymentMethod = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  tableCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  branchIds: string[]; // Sedes asignadas
  branchId?: string; // Para compatibilidad
  pin: string;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  displayOrder: number;
  active: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  image?: string;
  spiceAllowed: boolean;
  sidesAllowed: string[];
  active: boolean;
}

export interface BranchProductView extends Product {
  isAvailableInBranch: boolean;
  effectivePrice: number;
  outOfStockReason?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  spiceLevel?: SpiceLevel;
  selectedSides?: string[];
  notes?: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED';
}

export interface Order {
  id: string;
  branchId: string;
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface BranchStats {
  branchId: string;
  branchName: string;
  activeOrdersCount: number;
  completedOrdersCount: number;
  totalSales: number;
  tablesOccupied: number;
  tableCapacity: number;
}
