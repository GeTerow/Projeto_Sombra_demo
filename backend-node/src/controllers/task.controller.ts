import { Request, Response } from 'express';
import * as taskService from '../services/task.service';
import * as sseService from '../services/sse.service';
import fs from 'node:fs';

const DEMO_ERROR_RESPONSE = {
  error: 'Funcionalidade desabilitada na versão de demonstração pública.',
};

export const getTasksBySaleswoman = async (req: Request, res: Response) => {
  const { saleswomanId } = req.params;
  try {
    const tasks = await taskService.getTasksBySaleswoman(saleswomanId);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar tarefas.' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const task = await taskService.getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar detalhes da tarefa.' });
  }
};

export const streamTaskEvents = async (req: Request, res: Response) => {
  const clientId = await sseService.addSseClient(res);
  req.on('close', () => {
    sseService.removeSseClient(clientId);
  });
};


export const createTask = async (req: Request, res: Response) => {
  if (req.file) {
    fs.unlinkSync(req.file.path);
  }
  res.status(403).json(DEMO_ERROR_RESPONSE);
  /*
  // --- LÓGICA ORIGINAL ---
  const { clientName, saleswomanId } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'O ficheiro de áudio é obrigatório.' });
  }
  if (!clientName || !saleswomanId) {
    fs.unlinkSync(req.file.path); 
    return res.status(400).json({ error: 'Os campos "saleswomanId" e "clientName" são obrigatórios.' });
  }
  try {
    const newTask = await taskService.createTask(clientName, saleswomanId, req.file.path);
    res.status(202).json({ message: 'Tarefa recebida e em processamento.', task: newTask });
  } catch (error) {
    console.error("[TaskController] Erro ao criar a tarefa:", error);
    res.status(500).json({ error: 'Falha ao iniciar o processo da tarefa.' });
  }
  */
};

export const analyzeTask = async (req: Request, res: Response) => {
  res.status(403).json(DEMO_ERROR_RESPONSE);
  /*
  // --- LÓGICA ORIGINAL ---
  const { id } = req.params;
  try {
    const task = await taskService.requestAnalysis(id);
    res.status(202).json({ message: 'Solicitação de análise recebida.', task });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || 'Falha ao solicitar a análise da tarefa.' });
  }
  */
};

export const updateTask = async (req: Request, res: Response) => {
  res.status(403).json(DEMO_ERROR_RESPONSE);
};

export const clearStaleTasks = async (req: Request, res: Response) => {
  res.status(403).json(DEMO_ERROR_RESPONSE);
};

export const deleteFailedTasks = async (req: Request, res: Response) => {
  res.status(403).json(DEMO_ERROR_RESPONSE);
};

export const getTaskAudio = async (req: Request, res: Response) => {
    res.status(404).json({ error: 'Ficheiro de áudio não disponível no modo de demonstração.' });
};

export const getTaskPdf = async (req: Request, res: Response) => {
    res.status(403).json(DEMO_ERROR_RESPONSE);
};