import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { upload } from '../configs/multer';
import { authenticateToken } from '../common/middlewares/auth.middleware';

const router = Router();

// Rota para o stream de Server-Sent Events
router.get('/stream', authenticateToken, taskController.streamTaskEvents);

// Rota para buscar tarefas de uma vendedora específica
router.get('/saleswomen/:saleswomanId', authenticateToken,  taskController.getTasksBySaleswoman);

// Rota para buscar uma tarefa específica por ID
router.get('/:id', authenticateToken, taskController.getTaskById);

// Rota para buscar o ficheiro de áudio de uma tarefa
router.get('/:id/audio', authenticateToken, taskController.getTaskAudio);

// Rota para criar uma nova tarefa (com upload de áudio)
router.post('/', upload.single('audio'), authenticateToken, taskController.createTask);

// Rota para o webhook de atualização de tarefa (usada pelo worker)
router.patch('/:id/complete', authenticateToken, taskController.updateTask);

// Rota para o PDF de análise da tarefa
router.get('/:id/pdf', authenticateToken, taskController.getTaskPdf);

export { router as tasksRouter };