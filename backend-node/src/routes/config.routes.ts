import { Router } from 'express';
import * as configController from '../controllers/config.controller';

const router = Router();

router.get('/', configController.getConfigurations);
router.put('/', configController.updateConfigurations);

export { router as configRouter };