import { Prisma, Task, Saleswoman } from '@prisma/client';
import { mockTasks } from '../lib/mock-data';

const DEMO_ERROR = {
  statusCode: 403,
  message: 'Funcionalidade desabilitada na versão de demonstração pública.',
};

// Busca os detalhes de uma tarefa
export const getTaskById = async (taskId: string): Promise<(Task & { saleswoman: Saleswoman | null }) | null> => {
  console.log(`[DEMO MODE] Retornando tarefa mockada com ID: ${taskId}`);
  return mockTasks.find(t => t.id === taskId) || null;
  /*
  // --- LÓGICA ORIGINAL ---
  return prisma.task.findUnique({
    where: { id: taskId },
    include: { saleswoman: true },
  });
  */
};

export const getTasksBySaleswoman = async (saleswomanId: string): Promise<Task[]> => {
  console.log(`[DEMO MODE] Retornando tarefas mockadas para a vendedora: ${saleswomanId}`);
  return mockTasks.filter(t => t.saleswomanId === saleswomanId);
  /*
  // --- LÓGICA ORIGINAL ---
  return prisma.task.findMany({
    where: {
      saleswomanId,
      status: { in: ['TRANSCRIBED', 'ANALYZING', 'COMPLETED', 'FAILED'] }
    },
    orderBy: { createdAt: 'desc' },
  });
  */
};

export const getActiveTasks = async (): Promise<Task[]> => {
    console.log('[DEMO MODE] Retornando zero tarefas ativas.');
    return [];
    /*
    // --- LÓGICA RIGINAL ---
    return prisma.task.findMany({
        where: { status: { notIn: ['COMPLETED', 'FAILED', 'TRANSCRIBED'] } },
        include: { saleswoman: true },
        orderBy: { createdAt: 'asc' },
    });
    */
};


export const createTask = async (clientName: string, saleswomanId: string, filePath: string): Promise<Task> => {
  throw DEMO_ERROR;
};
export const updateTask = async (taskId: string, data: Prisma.TaskUpdateInput): Promise<Task | null> => {
  console.log(`[DEMO MODE] Bloqueada tentativa de atualizar a tarefa ${taskId}.`);
  return null;
};
export const requestAnalysis = async (taskId: string): Promise<Task> => {
  console.log(`[DEMO MODE] Bloqueada tentativa de solicitar análise para a tarefa ${taskId}.`);
  throw DEMO_ERROR;
};
export const getTaskAudioPath = async (taskId: string): Promise<string | null> => {
    return null;
};
export const deleteFailedTasks = async (): Promise<number> => { return 0; };
export const failStaleTasks = async (timeoutMinutes: number = 60): Promise<void> => {};