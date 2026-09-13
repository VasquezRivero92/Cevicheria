export type Role = 'admin_general' | 'admin_local' | 'mozo' | 'cocina' | 'cajero';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export type SpiceLevel = 'SIN_AJI' | 'MEDIO' | 'BRAVO' | 'FUEGO';

export type PaymentMethod = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA';

export interface Branch {
  id: string;
  name: string;
  code: string; // e.g. "MIRAFLORES", "SAN_ISIDRO"
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
  password?: string;
  name: string;
  role: Role;
  branchIds: string[]; // Lista de sedes asignadas (e.g. ['branch_principal', 'branch_sur'] o ['all'])
  branchId?: string; // Para compatibilidad hacia atrás
  pin: string; // PIN rápido de 4 dígitos para agilizar turnos en pantalla táctil
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
  sidesAllowed: string[]; // e.g. ["Camote glaseado", "Choclo tierno", "Canchita chulpi", "Chifle piurano", "Yuca frita"]
  active: boolean;
}

export interface BranchProductConfig {
  id: string; // compuesto: `${branchId}_${productId}`
  branchId: string;
  productId: string;
  isAvailable: boolean; // Si está disponible para vender en este local
  customPrice?: number; // Precio diferenciado para este local si aplica
  outOfStockReason?: string; // e.g. "Pesca fresca agotada", "En reposición"
  updatedAt: string;
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

// DTOs para creación y actualización
export interface CreateOrderDTO {
  branchId: string;
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  customerName?: string;
  items: Array<{
    productId: string;
    quantity: number;
    spiceLevel?: SpiceLevel;
    selectedSides?: string[];
    notes?: string;
  }>;
  notes?: string;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
}

export interface UpdateBranchProductAvailabilityDTO {
  branchId: string;
  productId: string;
  isAvailable: boolean;
  customPrice?: number;
  outOfStockReason?: string;
}
