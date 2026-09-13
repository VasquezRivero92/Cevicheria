import { Router } from 'express';
import { AuthService } from '../services/AuthService.js';
const router = Router();
const authService = new AuthService();
router.post('/login', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Nombre de usuario requerido' });
        }
        const user = await authService.loginWithUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
        }
        return res.json({ user });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
router.post('/pin', async (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin) {
            return res.status(400).json({ error: 'PIN requerido' });
        }
        const user = await authService.loginWithPin(pin);
        if (!user) {
            return res.status(401).json({ error: 'PIN incorrecto o usuario inactivo' });
        }
        return res.json({ user });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
export default router;
