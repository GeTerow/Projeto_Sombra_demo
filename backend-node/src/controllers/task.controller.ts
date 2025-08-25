import { Request, Response } from 'express';
import * as taskService from '../services/task.service';
import * as sseService from '../services/sse.service';
import * as pdfService from '../services/pdf.service';
import fs from 'node:fs';

// Controller para criar uma nova tarefa
export const createTask = async (req: Request, res: Response) => {
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
};

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, transcription, analysis } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'O campo "status" é obrigatório.' });
  }

  try {
    const updatedTask = await taskService.updateTask(id, { status, transcription, analysis });

    if (!updatedTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    res.status(200).json({ message: 'Tarefa atualizada com sucesso.', task: updatedTask });
  } catch (error) {
    console.error(`[TaskController] Erro no webhook da tarefa ${id}:`, error);
    res.status(500).json({ error: 'Falha ao atualizar a tarefa.' });
  }
};

export const getTasksBySaleswoman = async (req: Request, res: Response) => {
  const { saleswomanId } = req.params;
  try {
    const tasks = await taskService.getTasksBySaleswoman(saleswomanId);
    res.status(200).json(tasks);
  } catch (error) {
    console.error(`Erro ao buscar tarefas para a vendedora ${saleswomanId}:`, error);
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

export const getTaskAudio = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const audioPath = await taskService.getTaskAudioPath(id);
        if (!audioPath || !fs.existsSync(audioPath)) {
            return res.status(404).json({ error: 'Ficheiro de áudio não encontrado.' });
        }
        res.sendFile(audioPath);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar o ficheiro de áudio.' });
    }
};

export const streamTaskEvents = async (req: Request, res: Response) => {
  const clientId = await sseService.addSseClient(res);
  
  req.on('close', () => {
    sseService.removeSseClient(clientId);
  });
};

export const clearStaleTasks = async (req: Request, res: Response) => {
  try {
    await taskService.failStaleTasks();
    res.status(200).json({ message: 'A limpeza de tarefas obsoletas foi concluída.' });
  } catch (error) {
    console.error("[TaskController] Erro ao limpar tarefas obsoletas:", error);
    res.status(500).json({ error: 'Falha ao limpar tarefas obsoletas.' });
  }
};

// Controlador para gerar o PDF de análise da tarefa
export const getTaskPdf = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const task = await taskService.getTaskById(id);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }
    if (!task.analysis || typeof task.analysis !== 'object') {
      return res.status(400).json({ error: 'Análise inválida ou não disponível para gerar PDF.' });
    }

    const pdfBuffer = await pdfService.generateTaskAnalysisPdf(task);
    
    const filename = `Analise_${task.saleswoman?.name || 'vendedora'}_${task.clientName}.pdf`.replace(/\s+/g, '_');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar PDF da tarefa:', error);
    res.status(500).send('Não foi possível gerar o PDF.');
  }
};

export const analyzeTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const task = await taskService.requestAnalysis(id);
    res.status(202).json({ message: 'Solicitação de análise recebida.', task });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || 'Falha ao solicitar a análise da tarefa.' });
  }
};