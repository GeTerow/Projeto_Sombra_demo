import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Rota para login de usuário
router.post('/login', authController.login);

export { router as authRouter };