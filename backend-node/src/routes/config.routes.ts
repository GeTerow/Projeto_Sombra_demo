import { Router } from 'express';
import * as configController from '../controllers/config.controller';
import { authenticateToken, authorizeAdmin } from '../common/middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateToken, authorizeAdmin, configController.getConfigurations);
router.put('/', authenticateToken, authorizeAdmin, configController.updateConfigurations);

export { router as configRouter };