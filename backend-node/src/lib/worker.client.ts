import axios from 'axios';
import { IAppConfig } from '../common/interfaces/IAppConfig';
import { getAllConfigs } from '../services/config.service';

const WORKER_URL = process.env.PYTHON_WORKER_URL || 'http://localhost:8000';

export const notifyWorkerToProcessTask = async (taskId: string, filePath: string, config: Partial<IAppConfig>) => {
  try {
    const workerEndpoint = `${WORKER_URL}/process-task`;
    console.log(`[Node Backend] Notificando worker em ${workerEndpoint} para a tarefa ${taskId}`);
    
    await axios.post(workerEndpoint, {
      task_id: taskId,
      file_path: filePath,
      config: config,
    });

  } catch (err: any) {
    console.error(`[Node Backend] ERRO ao notificar o worker para a tarefa ${taskId}:`, err.message);
    throw new Error(`Falha ao comunicar com o worker Python: ${err.message}`);
  }
};

export const generateConsolidatedSummary = async (name: string, transcriptions: string[]): Promise<string> => {
  try {
    const workerEndpoint = `${WORKER_URL}/generate-summary`;
    console.log(`[Node Backend] Solicitando resumo para ${name} ao worker.`);
    
    const configs = await getAllConfigs();
    const openaiApiKey = configs.OPENAI_API_KEY;

    if (!openaiApiKey) {
      throw new Error('A chave da API da OpenAI não está configurada no backend.');
    }

    const response = await axios.post<{ summary: string }>(workerEndpoint, {
      name,
      transcriptions,
      openai_api_key: openaiApiKey,
    });

    return response.data.summary;
  } catch (err: any) {
    console.error(`[Node Backend] ERRO ao gerar resumo consolidado para ${name}:`, err.message);
    throw new Error(`Falha ao gerar resumo no worker: ${err.message}`);
  }
};

export const notifyWorkerToAnalyzeTask = async (taskId: string, transcription: string, config: Partial<IAppConfig>) => {
  try {
    const workerEndpoint = `${WORKER_URL}/analyze-task`;
    console.log(`[Node Backend] Notificando worker em ${workerEndpoint} para analisar a tarefa ${taskId}`);
    
    await axios.post(workerEndpoint, {
      task_id: taskId,
      transcription: transcription,
      config: config,
    });

  } catch (err: any) {
    console.error(`[Node Backend] ERRO ao notificar o worker para analisar a tarefa ${taskId}:`, err.message);
    throw new Error(`Falha ao comunicar com o worker Python: ${err.message}`);
  }
};