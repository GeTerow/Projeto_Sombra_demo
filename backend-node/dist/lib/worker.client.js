"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateConsolidatedSummary = exports.notifyWorkerToProcessTask = void 0;
const axios_1 = __importDefault(require("axios"));
const WORKER_URL = process.env.PYTHON_WORKER_URL || 'http://localhost:8000';
const notifyWorkerToProcessTask = async (taskId, filePath, config) => {
    try {
        const workerEndpoint = `${WORKER_URL}/process-task`;
        console.log(`[Node Backend] Notificando worker em ${workerEndpoint} para a tarefa ${taskId}`);
        // O objeto de configuração é enviado no corpo da requisição
        await axios_1.default.post(workerEndpoint, {
            task_id: taskId,
            file_path: filePath,
            config: config, // Adiciona o objeto de configuração ao payload
        });
    }
    catch (err) {
        console.error(`[Node Backend] ERRO ao notificar o worker para a tarefa ${taskId}:`, err.message);
        throw new Error(`Falha ao comunicar com o worker Python: ${err.message}`);
    }
};
exports.notifyWorkerToProcessTask = notifyWorkerToProcessTask;
// Solicita a geração de um resumo
const generateConsolidatedSummary = async (name, transcriptions) => {
    try {
        const workerEndpoint = `${WORKER_URL}/generate-summary`;
        console.log(`[Node Backend] Solicitando resumo para ${name} ao worker.`);
        const response = await axios_1.default.post(workerEndpoint, {
            name,
            transcriptions,
        });
        return response.data.summary;
    }
    catch (err) {
        console.error(`[Node Backend] ERRO ao gerar resumo consolidado para ${name}:`, err.message);
        throw new Error(`Falha ao gerar resumo no worker: ${err.message}`);
    }
};
exports.generateConsolidatedSummary = generateConsolidatedSummary;
//# sourceMappingURL=worker.client.js.map