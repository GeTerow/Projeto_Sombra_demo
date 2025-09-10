import { Response } from 'express';
import { Task } from '@prisma/client';
import { getActiveTasks } from './task.service';
import { SseClient } from '../common/interfaces/ISseClient';

// Lista que armazena todos os clientes SSE ativos.
let clients: SseClient[] = [];

export const addSseClient = async (res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, response: res };
  clients.push(newClient);

  try {
    const activeTasks = await getActiveTasks();
    activeTasks.forEach(task => {
      res.write(`data: ${JSON.stringify(task)}\n\n`);
    });
  } catch (error) {
    console.error(`[SSE] Falha ao buscar ou enviar tarefas ativas para ${clientId}:`, error);
  }

  // Retorna o ID do cliente para que possa ser removido ao desconectar
  return clientId;
};
