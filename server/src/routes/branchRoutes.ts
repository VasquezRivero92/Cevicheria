import { Router, Request, Response } from 'express';
import { BranchService } from '../services/BranchService.js';

const router = Router();
const branchService = new BranchService();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const branches = await branchService.getAllBranches();
    return res.json(branches);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/stats/global', async (_req: Request, res: Response) => {
  try {
    const stats = await branchService.getGlobalStats();
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const branch = await branchService.getBranchById(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Sede no encontrada' });
    return res.json(branch);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await branchService.getBranchStats(req.params.id);
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const branch = await branchService.createBranch(req.body);
    return res.status(201).json(branch);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await branchService.updateBranch(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Sede no encontrada' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
