import { Prisma, Task, Saleswoman, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { notifyWorkerToProcessTask, notifyWorkerToAnalyzeTask } from '../lib/worker.client';
import { sendSseEvent } from './sse.service';
import { getAllConfigs } from './config.service';
import fs from 'node:fs';

export const createTask = async (clientName: string, saleswomanId: string, filePath: string): Promise<Task> => {
  const newTask = await prisma.task.create({
    data: {
      clientName,
      saleswomanId,
      audioFilePath: filePath,
      status: 'PENDING',
    },
    include: { saleswoman: true },
  });

  sendSseEvent(newTask);

  try {
    const allConfigs = await getAllConfigs();
    
    // Filtra as configurações para enviar apenas o necessário para o worker
    const workerConfig = {
      OPENAI_API_KEY: allConfigs.OPENAI_API_KEY,
      HF_TOKEN: allConfigs.HF_TOKEN,
      OPENAI_ASSISTANT_ID: allConfigs.OPENAI_ASSISTANT_ID,
      WHISPERX_MODEL: allConfigs.WHISPERX_MODEL,
      DIAR_DEVICE: allConfigs.DIAR_DEVICE,
      ALIGN_DEVICE: allConfigs.ALIGN_DEVICE
    };

    console.log(`[TaskService] Enviando para o worker. Task ID: ${newTask.id}, FilePath: ${filePath}`);
    
    await notifyWorkerToProcessTask(newTask.id, filePath, workerConfig);

  } catch (error) {
    console.error(`[TaskService] Falha ao notificar worker, atualizando status da tarefa ${newTask.id} para FAILED.`);
    const failedTask = await prisma.task.update({
      where: { id: newTask.id },
      data: { status: 'FAILED' },
      include: { saleswoman: true },
    });
    sendSseEvent(failedTask);
  }

  return newTask;
};

export const updateTask = async (taskId: string, data: Prisma.TaskUpdateInput): Promise<Task | null> => {
  const taskToUpdate = await prisma.task.findUnique({ where: { id: taskId } });
  if (!taskToUpdate) {
    return null;
  }

  if (data.analysis && typeof data.analysis === 'string') {
    try {
      data.analysis = JSON.parse(data.analysis);
    } catch (e) {
      data.analysis = { 
        error: "Falha ao fazer parse do JSON da análise.", 
        raw: typeof data.analysis === 'string' ? data.analysis : null 
      } as Prisma.InputJsonValue;
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data,
    include: { saleswoman: true },
  });

  sendSseEvent(updatedTask);
  return updatedTask;
};

export const deleteFailedTasks = async (): Promise<number> => {
  const failedTasks = await prisma.task.findMany({
    where: { status: 'FAILED' },
  });

  if (failedTasks.length === 0) {
    console.log('[TaskService] No failed tasks to delete.');
    return 0;
  }

  console.log(`[TaskService] Found ${failedTasks.length} failed tasks. Deleting associated files...`);

  let deletedFiles = 0;
  for (const task of failedTasks) {
    if (task.audioFilePath && fs.existsSync(task.audioFilePath)) {
      try {
        fs.unlinkSync(task.audioFilePath);
        deletedFiles++;
      } catch (error) {
        console.error(`[TaskService] Error deleting file ${task.audioFilePath}:`, error);
      }
    }
  }
  console.log(`[TaskService] Deleted ${deletedFiles} audio files.`);

  const { count } = await prisma.task.deleteMany({
    where: {
      id: {
        in: failedTasks.map((t) => t.id),
      },
    },
  });

  console.log(`[TaskService] Deleted ${count} failed tasks from the database.`);

  // O frontend irá recarregar os dados, mas podemos notificar outros clientes.
  // Como a função `sendSseEvent` espera um objeto Task, vamos enviar um evento genérico.
  // Isso requer uma alteração no frontend para lidar com este tipo de evento.
  // Por simplicidade, vamos pular o evento SSE por agora, já que o cliente que iniciou a ação irá recarregar.

  return count;
};

// Busca os detalhes de uma tarefa
export const getTaskById = async (taskId: string): Promise<(Task & { saleswoman: Saleswoman | null }) | null> => {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: { saleswoman: true },
  });
};

export const getTasksBySaleswoman = async (saleswomanId: string): Promise<Task[]> => {
  return prisma.task.findMany({
    where: {
      saleswomanId,
      status: {
        in: ['TRANSCRIBED', 'ANALYZING', 'COMPLETED', 'FAILED']
      }
    },
    orderBy: { createdAt: 'desc' },
  });
};
export const getTaskAudioPath = async (taskId: string): Promise<string | null> => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { audioFilePath: true }
    });
    return task?.audioFilePath ?? null;
};

export const getActiveTasks = async (): Promise<Task[]> => {
  return prisma.task.findMany({
    where: {
      status: {
        notIn: ['COMPLETED', 'FAILED'],
      },
    },
    include: { saleswoman: true },
    orderBy: { createdAt: 'asc' },
  });
};

export const failStaleTasks = async (timeoutMinutes: number = 60): Promise<void> => {
  const timeout = new Date();
  timeout.setMinutes(timeout.getMinutes() - timeoutMinutes);

  const staleTasks = await prisma.task.findMany({
    where: {
      status: {
        in: ['PENDING', 'TRANSCRIBING', 'ALIGNING', 'DIARIZING', 'ANALYZING'],
      },
      updatedAt: {
        lt: timeout,
      },
    },
  });

  if (staleTasks.length > 0) {
    console.log(`[Scheduler] Encontradas ${staleTasks.length} tarefas obsoletas. A marcá-las como FAILED...`);
    for (const task of staleTasks) {
      const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: { 
          status: 'FAILED',
          analysis: {
            ...(task.analysis as Prisma.JsonObject || {}),
            error: `A tarefa excedeu o tempo limite de ${timeoutMinutes} minutos e foi marcada como falhada.`,
          }
        },
        include: { saleswoman: true },
      });
      sendSseEvent(updatedTask);
    }
    console.log(`[Scheduler] ${staleTasks.length} tarefas obsoletas foram atualizadas para FAILED.`);
  } else {
    console.log('[Scheduler] Nenhuma tarefa obsoleta encontrada.');
  }
};

export const requestAnalysis = async (taskId: string): Promise<Task> => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });

  if (!task) {
    const err = new Error('Tarefa não encontrada.');
    (err as any).statusCode = 404;
    throw err;
  }

  if (task.status !== TaskStatus.TRANSCRIBED) {
    const err = new Error('A tarefa não está no estado correto para iniciar a análise. O status atual é: ' + task.status);
    (err as any).statusCode = 409;
    throw err;
  }

  if (!task.transcription) {
    const err = new Error('Não há transcrição disponível para esta tarefa.');
    (err as any).statusCode = 400;
    throw err;
  }

  // Atualiza o status para ANALYZING e notifica o frontend via SSE
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { status: 'ANALYZING' },
    include: { saleswoman: true },
  });
  sendSseEvent(updatedTask);

  // Notifica o worker para iniciar a análise
  try {
    const allConfigs = await getAllConfigs();
    const workerConfig = {
      OPENAI_API_KEY: allConfigs.OPENAI_API_KEY,
      OPENAI_ASSISTANT_ID: allConfigs.OPENAI_ASSISTANT_ID,
    };
    
    // Passa a transcrição existente para o worker
    await notifyWorkerToAnalyzeTask(taskId, task.transcription, workerConfig);
  } catch (error) {
    console.error(`[TaskService] Falha ao notificar worker para análise, revertendo status para FAILED.`);
    const failedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: 'FAILED' },
      include: { saleswoman: true },
    });
    sendSseEvent(failedTask);
  }

  return updatedTask;
};