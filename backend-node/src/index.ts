import { Router } from 'express';
import { saleswomenRouter } from './routes/saleswomen.routes';
import { tasksRouter } from './routes/task.routes';
import { configRouter } from './routes/config.routes';

const router = Router();

router.use('/saleswomen', saleswomenRouter);
router.use('/tasks', tasksRouter);
router.use('/config', configRouter);

export { router };