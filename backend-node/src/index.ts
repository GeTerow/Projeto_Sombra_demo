import { Router } from 'express';
import { saleswomenRouter } from './routes/saleswomen.routes';
import { tasksRouter } from './routes/task.routes';

const router = Router();

router.use('/saleswomen', saleswomenRouter);
router.use('/tasks', tasksRouter);

export { router };