import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticateToken, authorizeAdmin } from '../common/middlewares/auth.middleware';


const router = Router();

// Rota para criar um novo usuário
router.post('/', authenticateToken, authorizeAdmin, userController.createNewUser);

export { router as usersRouter };