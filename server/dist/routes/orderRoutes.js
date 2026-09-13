import { Router } from 'express';
import { OrderService } from '../services/OrderService.js';
import { getSocketServer } from '../sockets/socketServer.js';
const router = Router();
const orderService = new OrderService();
// Listar órdenes con filtros opcionales (branchId, status, date)
router.get('/', async (req, res) => {
    try {
        const { branchId, status, date } = req.query;
        const orders = await orderService.getOrders({
            branchId: branchId,
            status: status,
            date: date
        });
        return res.json(orders);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// Obtener pedidos activos para el panel de cocina (KDS) y mesas
router.get('/active/:branchId', async (req, res) => {
    try {
        const orders = await orderService.getActiveOrders(req.params.branchId);
        return res.json(orders);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// Detalle de un pedido
router.get('/:id', async (req, res) => {
    try {
        const order = await orderService.getOrderById(req.params.id);
        if (!order)
            return res.status(404).json({ error: 'Pedido no encontrado' });
        return res.json(order);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// Crear nuevo pedido o agregar ronda a la mesa (desde el móvil del mozo)
router.post('/', async (req, res) => {
    try {
        const order = await orderService.createOrder(req.body);
        // Emitir por WebSocket a la cocina, barra y administradores
        const io = getSocketServer();
        if (io) {
            io.to(`branch_${order.branchId}`).emit('order:created', order);
            io.to('admin_room').emit('order:created', order);
        }
        return res.status(201).json(order);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
// Cambiar estado del pedido (PENDING -> PREPARING -> READY -> DELIVERED -> PAID)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, paymentMethod } = req.body;
        const order = await orderService.updateOrderStatus(req.params.id, status, paymentMethod);
        if (!order)
            return res.status(404).json({ error: 'Pedido no encontrado' });
        // Notificar en tiempo real a mozos, cocina y caja
        const io = getSocketServer();
        if (io) {
            io.to(`branch_${order.branchId}`).emit('order:status_updated', order);
            io.to('admin_room').emit('order:status_updated', order);
        }
        return res.json(order);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
// Cambiar estado de un plato individual en la comanda (ej. Cebiche Listo en Barra Marina)
router.patch('/:id/items/:itemId/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await orderService.updateItemStatus(req.params.id, req.params.itemId, status);
        if (!order)
            return res.status(404).json({ error: 'Pedido o plato no encontrado' });
        const io = getSocketServer();
        if (io) {
            io.to(`branch_${order.branchId}`).emit('order:item_status_updated', {
                orderId: order.id,
                itemId: req.params.itemId,
                status,
                order
            });
            io.to('admin_room').emit('order:item_status_updated', {
                orderId: order.id,
                itemId: req.params.itemId,
                status,
                order
            });
        }
        return res.json(order);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
export default router;
