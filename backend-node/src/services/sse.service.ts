import { Response } from 'express';
import { Task } from '@prisma/client';
import { getActiveTasks } from './task.service';

// Interface para os clientes SSE
interface SseClient {
  id: number;
  response: Response;
}

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
  console.log(`[SSE] Cliente ${clientId} conectado. Total de clientes: ${clients.length}`);

  // Envia uma mensagem inicial de conexão
  res.write(`data: ${JSON.stringify({ message: "Conectado. A enviar tarefas ativas..." })}\n\n`);

  try {
    const activeTasks = await getActiveTasks();
    console.log(`[SSE] Enviando ${activeTasks.length} tarefas ativas para o cliente ${clientId}.`);
    activeTasks.forEach(task => {
      res.write(`data: ${JSON.stringify(task)}\n\n`);
    });
  } catch (error) {
    console.error(`[SSE] Falha ao buscar ou enviar tarefas ativas para ${clientId}:`, error);
  }

  // Retorna o ID do cliente para que possa ser removido ao desconectar
  return clientId;
};


export const removeSseClient = (clientId: number) => {
  clients = clients.filter(client => client.id !== clientId);
  console.log(`[SSE] Cliente ${clientId} desconectado. Total de clientes: ${clients.length}`);
};


export const sendSseEvent = (data: Task) => {
  console.log(`[SSE] Enviando atualização para ${clients.length} cliente(s):`, data.id, data.status);
  clients.forEach(client => 
    client.response.write(`data: ${JSON.stringify(data)}\n\n`)
  );
};