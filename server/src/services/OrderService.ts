import { v4 as uuidv4 } from 'uuid';
import { getRepositories } from '../infrastructure/repositories/factory.js';
import { Order, OrderItem, CreateOrderDTO, OrderStatus, PaymentMethod } from '../domain/types.js';

export class OrderService {
  private repos = getRepositories();

  async getOrders(filters?: { branchId?: string; status?: OrderStatus; date?: string }): Promise<Order[]> {
    return this.repos.orderRepo.getAll(filters);
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.repos.orderRepo.getById(id);
  }

  async getActiveOrders(branchId: string): Promise<Order[]> {
    return this.repos.orderRepo.getActiveByBranch(branchId);
  }

  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    const products = await this.repos.productRepo.getAll();
    const branchConfigs = await this.repos.branchConfigRepo.getAllByBranch(dto.branchId);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const configMap = new Map(branchConfigs.map((c) => [c.productId, c]));

    const orderItems: OrderItem[] = [];
    let total = 0;

    for (const itemDto of dto.items) {
      const product = productMap.get(itemDto.productId);
      if (!product) continue;

      const cfg = configMap.get(itemDto.productId);
      // Validar si está disponible en la sede
      const isAvailable = cfg !== undefined ? cfg.isAvailable : product.active;
      if (!isAvailable) {
        throw new Error(`El producto "${product.name}" no está disponible en esta sede actualmente.`);
      }

      const unitPrice = (cfg && cfg.customPrice !== undefined) ? cfg.customPrice : product.basePrice;
      const subtotal = unitPrice * itemDto.quantity;
      total += subtotal;

      orderItems.push({
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        quantity: itemDto.quantity,
        unitPrice,
        subtotal,
        spiceLevel: itemDto.spiceLevel,
        selectedSides: itemDto.selectedSides || [],
        notes: itemDto.notes || '',
        status: 'PENDING'
      });
    }

    if (orderItems.length === 0) {
      throw new Error('La comanda debe contener al menos un producto válido.');
    }

    // Verificar si ya existe una orden activa para esta mesa en la sede
    const existingOrder = await this.repos.orderRepo.getActiveByTable(dto.branchId, dto.tableNumber);

    if (existingOrder) {
      // Si ya existe una orden activa para la mesa, anexamos los nuevos items (típico en cevicherías al pedir rondas adicionales)
      const combinedItems = [...existingOrder.items, ...orderItems];
      const newTotal = existingOrder.totalAmount + total;
      const updated = await this.repos.orderRepo.update(existingOrder.id, {
        items: combinedItems,
        totalAmount: newTotal,
        status: 'PENDING', // Pasa a pendiente para que cocina prepare los nuevos platos
        notes: dto.notes ? (existingOrder.notes ? `${existingOrder.notes} | ${dto.notes}` : dto.notes) : existingOrder.notes
      });
      return updated!;
    }

    // Si es una orden nueva
    return this.repos.orderRepo.create({
      branchId: dto.branchId,
      tableNumber: dto.tableNumber,
      waiterId: dto.waiterId,
      waiterName: dto.waiterName,
      customerName: dto.customerName,
      items: orderItems,
      totalAmount: total,
      status: 'PENDING',
      notes: dto.notes
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus, paymentMethod?: PaymentMethod): Promise<Order | null> {
    if (status === 'DELIVERED') {
      const order = await this.repos.orderRepo.getById(id);
      if (order) {
        const deliveredItems = order.items.map((it) => ({ ...it, status: 'DELIVERED' as const }));
        await this.repos.orderRepo.update(id, { items: deliveredItems });
      }
    }
    return this.repos.orderRepo.updateStatus(id, status, paymentMethod);
  }

  async updateItemStatus(orderId: string, itemId: string, itemStatus: OrderItem['status']): Promise<Order | null> {
    const order = await this.repos.orderRepo.getById(orderId);
    if (!order) return null;

    const updatedItems = order.items.map((it) => {
      if (it.id === itemId) {
        return { ...it, status: itemStatus };
      }
      return it;
    });

    // Si todos los items están listos, actualizamos el estado de la orden completa a READY
    const allReady = updatedItems.every((it) => it.status === 'READY' || it.status === 'DELIVERED');
    const newOrderStatus: OrderStatus = allReady ? 'READY' : order.status === 'PENDING' ? 'PREPARING' : order.status;

    return this.repos.orderRepo.update(orderId, {
      items: updatedItems,
      status: newOrderStatus
    });
  }
}
