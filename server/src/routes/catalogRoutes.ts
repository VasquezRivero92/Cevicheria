import { Router, Request, Response } from 'express';
import { CatalogService } from '../services/CatalogService.js';
import { getSocketServer } from '../sockets/socketServer.js';

const router = Router();
const catalogService = new CatalogService();

// Categorías
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await catalogService.getCategories();
    return res.json(categories);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Productos generales
router.get('/products', async (_req: Request, res: Response) => {
  try {
    const products = await catalogService.getAllProducts();
    return res.json(products);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Catálogo adaptado para una sede específica
router.get('/branch/:branchId', async (req: Request, res: Response) => {
  try {
    const catalog = await catalogService.getCatalogForBranch(req.params.branchId);
    return res.json(catalog);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Administrador modifica disponibilidad de un producto en un local
router.post('/branch-availability', async (req: Request, res: Response) => {
  try {
    const { branchId, productId, isAvailable, outOfStockReason, customPrice } = req.body;
    if (!branchId || !productId || typeof isAvailable !== 'boolean') {
      return res.status(400).json({ error: 'Datos incompletos para actualizar disponibilidad' });
    }

    const updated = await catalogService.setProductAvailabilityInBranch(
      branchId,
      productId,
      isAvailable,
      outOfStockReason,
      customPrice
    );

    // Notificar en tiempo real a los dispositivos conectados a esta sede (mozos, caja, etc.)
    const io = getSocketServer();
    if (io) {
      io.to(`branch_${branchId}`).emit('catalog:availability_changed', {
        branchId,
        productId,
        isAvailable,
        outOfStockReason,
        customPrice
      });
      // Notificar también al room admin
      io.to('admin_room').emit('catalog:availability_changed', {
        branchId,
        productId,
        isAvailable,
        outOfStockReason,
        customPrice
      });
    }

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Crear nuevo producto global
router.post('/products', async (req: Request, res: Response) => {
  try {
    const product = await catalogService.createProduct(req.body);
    return res.status(201).json(product);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Actualizar producto global
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const updated = await catalogService.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
