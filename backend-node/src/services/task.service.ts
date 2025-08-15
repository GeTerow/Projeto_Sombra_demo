import { Prisma, Task, Saleswoman } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { notifyWorkerToProcessTask } from '../lib/worker.client';
import { sendSseEvent } from './sse.service';

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
    await notifyWorkerToProcessTask(newTask.id, filePath);
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

// Busca os detalhes de uma tarefa
export const getTaskById = async (taskId: string): Promise<(Task & { saleswoman: Saleswoman | null }) | null> => {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: { saleswoman: true },
  });
};

export const getTasksBySaleswoman = async (saleswomanId: string): Promise<Task[]> => {
  return prisma.task.findMany({
    where: { saleswomanId, status: 'COMPLETED' },
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