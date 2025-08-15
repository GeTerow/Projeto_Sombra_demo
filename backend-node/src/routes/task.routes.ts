import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { upload } from '../common/middlewares/upload.middleware';

const router = Router();

// Rota para o stream de Server-Sent Events
router.get('/stream', taskController.streamTaskEvents);

// Rota para buscar tarefas de uma vendedora específica
router.get('/saleswomen/:saleswomanId', taskController.getTasksBySaleswoman);

// Rota para buscar uma tarefa específica por ID
router.get('/:id', taskController.getTaskById);

// Rota para buscar o ficheiro de áudio de uma tarefa
router.get('/:id/audio', taskController.getTaskAudio);

// Rota para criar uma nova tarefa (com upload de áudio)
router.post('/', upload.single('audio'), taskController.createTask);

// Rota para o webhook de atualização de tarefa (usada pelo worker)
router.patch('/:id/complete', taskController.updateTask);

// Rota para o PDF de análise da tarefa
router.get('/:id/pdf', taskController.getTaskPdf);

export { router as tasksRouter };