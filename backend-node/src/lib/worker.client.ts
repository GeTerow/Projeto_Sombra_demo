import axios from 'axios';
import { AppConfig } from '../services/config.service';

const WORKER_URL = process.env.PYTHON_WORKER_URL || 'http://localhost:8000';

export const notifyWorkerToProcessTask = async (taskId: string, filePath: string, config: Partial<AppConfig>) => {
  try {
    const workerEndpoint = `${WORKER_URL}/process-task`;
    console.log(`[Node Backend] Notificando worker em ${workerEndpoint} para a tarefa ${taskId}`);
    
    // O objeto de configuração é enviado no corpo da requisição
    await axios.post(workerEndpoint, {
      task_id: taskId,
      file_path: filePath,
      config: config, // Adiciona o objeto de configuração ao payload
    });

  } catch (err: any) {
    console.error(`[Node Backend] ERRO ao notificar o worker para a tarefa ${taskId}:`, err.message);
    throw new Error(`Falha ao comunicar com o worker Python: ${err.message}`);
  }
};

// Solicita a geração de um resumo
export const generateConsolidatedSummary = async (name: string, transcriptions: string[]): Promise<string> => {
  try {
    const workerEndpoint = `${WORKER_URL}/generate-summary`;
    console.log(`[Node Backend] Solicitando resumo para ${name} ao worker.`);
    
    const response = await axios.post<{ summary: string }>(workerEndpoint, {
      name,
      transcriptions,
    });

    return response.data.summary;
  } catch (err: any) {
    console.error(`[Node Backend] ERRO ao gerar resumo consolidado para ${name}:`, err.message);
    throw new Error(`Falha ao gerar resumo no worker: ${err.message}`);
  }
};