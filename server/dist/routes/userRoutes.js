import { Router } from 'express';
import { getRepositories } from '../infrastructure/repositories/factory.js';
const router = Router();
const repos = getRepositories();
router.get('/', async (_req, res) => {
    try {
        const users = await repos.userRepo.getAll();
        return res.json(users);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
router.post('/', async (req, res) => {
    try {
        const user = await repos.userRepo.create(req.body);
        return res.status(201).json(user);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const updated = await repos.userRepo.update(req.params.id, req.body);
        if (!updated)
            return res.status(404).json({ error: 'Usuario no encontrado' });
        return res.json(updated);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await repos.userRepo.delete(req.params.id);
        return res.json({ success: deleted });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
export default router;
