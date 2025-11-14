import express from 'express';
import passport from 'passport';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

// --- Ruta de Registro ---
// POST /auth/register
// Es pública
router.post('/register', register);

// --- Ruta de Login ---
// POST /auth/login
// 1. Passport intercepta la request y usa la 'local' strategy.
// 2. Si falla, devuelve un 401 Unauthorized automáticamente.
// 3. Si tiene éxito, adjunta el 'user' a req.user y llama a authController.login.
// { session: false } es clave, le dice a Passport que no cree sesiones (usamos JWT).
router.post('/login', passport.authenticate('local', { session: false }), login);

export default router;