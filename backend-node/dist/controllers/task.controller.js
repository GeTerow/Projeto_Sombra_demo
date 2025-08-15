"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskPdf = exports.streamTaskEvents = exports.getTaskAudio = exports.getTaskById = exports.getTasksBySaleswoman = exports.updateTask = exports.createTask = void 0;
const taskService = __importStar(require("../services/task.service"));
const sseService = __importStar(require("../services/sse.service"));
const pdfService = __importStar(require("../services/pdf.service"));
const node_fs_1 = __importDefault(require("node:fs"));
// Controller para criar uma nova tarefa
const createTask = async (req, res) => {
    const { clientName, saleswomanId } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'O ficheiro de áudio é obrigatório.' });
    }
    if (!clientName || !saleswomanId) {
        node_fs_1.default.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Os campos "saleswomanId" e "clientName" são obrigatórios.' });
    }
    try {
        const newTask = await taskService.createTask(clientName, saleswomanId, req.file.path);
        res.status(202).json({ message: 'Tarefa recebida e em processamento.', task: newTask });
    }
    catch (error) {
        console.error("[TaskController] Erro ao criar a tarefa:", error);
        res.status(500).json({ error: 'Falha ao iniciar o processo da tarefa.' });
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
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
    }
    catch (error) {
        console.error(`[TaskController] Erro no webhook da tarefa ${id}:`, error);
        res.status(500).json({ error: 'Falha ao atualizar a tarefa.' });
    }
};
exports.updateTask = updateTask;
const getTasksBySaleswoman = async (req, res) => {
    const { saleswomanId } = req.params;
    try {
        const tasks = await taskService.getTasksBySaleswoman(saleswomanId);
        res.status(200).json(tasks);
    }
    catch (error) {
        console.error(`Erro ao buscar tarefas para a vendedora ${saleswomanId}:`, error);
        res.status(500).json({ error: 'Falha ao buscar tarefas.' });
    }
};
exports.getTasksBySaleswoman = getTasksBySaleswoman;
const getTaskById = async (req, res) => {
    const { id } = req.params;
    try {
        const task = await taskService.getTaskById(id);
        if (!task) {
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }
        res.status(200).json(task);
    }
    catch (error) {
        res.status(500).json({ error: 'Falha ao buscar detalhes da tarefa.' });
    }
};
exports.getTaskById = getTaskById;
const getTaskAudio = async (req, res) => {
    const { id } = req.params;
    try {
        const audioPath = await taskService.getTaskAudioPath(id);
        if (!audioPath || !node_fs_1.default.existsSync(audioPath)) {
            return res.status(404).json({ error: 'Ficheiro de áudio não encontrado.' });
        }
        res.sendFile(audioPath);
    }
    catch (error) {
        res.status(500).json({ error: 'Falha ao buscar o ficheiro de áudio.' });
    }
};
exports.getTaskAudio = getTaskAudio;
const streamTaskEvents = (req, res) => {
    const clientId = sseService.addSseClient(res);
    req.on('close', () => {
        sseService.removeSseClient(clientId);
    });
};
exports.streamTaskEvents = streamTaskEvents;
// Controlador para gerar o PDF de análise da tarefa
const getTaskPdf = async (req, res) => {
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
    }
    catch (error) {
        console.error('Erro ao gerar PDF da tarefa:', error);
        res.status(500).send('Não foi possível gerar o PDF.');
    }
};
exports.getTaskPdf = getTaskPdf;
//# sourceMappingURL=task.controller.js.map