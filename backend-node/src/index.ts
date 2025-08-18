import { Router } from 'express';
import { saleswomenRouter } from './routes/saleswomen.routes';
import { tasksRouter } from './routes/task.routes';
import { configRouter } from './routes/config.routes';
import { usersRouter } from './routes/user.routes';
import { authRouter } from './routes/auth.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/saleswomen', saleswomenRouter);
router.use('/tasks', tasksRouter);
router.use('/config', configRouter);
router.use('/users', usersRouter);
export { router };