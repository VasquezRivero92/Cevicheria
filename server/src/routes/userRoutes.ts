import { Router, Request, Response } from 'express';
import { getRepositories } from '../infrastructure/repositories/factory.js';

const router = Router();
const repos = getRepositories();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await repos.userRepo.getAll();
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const user = await repos.userRepo.create(req.body);
    return res.status(201).json(user);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await repos.userRepo.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await repos.userRepo.delete(req.params.id);
    return res.json({ success: deleted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
