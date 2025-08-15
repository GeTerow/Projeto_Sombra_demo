"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskAudioPath = exports.getTasksBySaleswoman = exports.getTaskById = exports.updateTask = exports.createTask = void 0;
const prisma_1 = require("../lib/prisma");
const worker_client_1 = require("../lib/worker.client");
const sse_service_1 = require("./sse.service");
const config_service_1 = require("./config.service");
const createTask = async (clientName, saleswomanId, filePath) => {
    const newTask = await prisma_1.prisma.task.create({
        data: {
            clientName,
            saleswomanId,
            audioFilePath: filePath,
            status: 'PENDING',
        },
        include: { saleswoman: true },
    });
    (0, sse_service_1.sendSseEvent)(newTask);
    try {
        const config = await (0, config_service_1.getAllConfigs)();
        await (0, worker_client_1.notifyWorkerToProcessTask)(newTask.id, filePath, config);
    }
    catch (error) {
        console.error(`[TaskService] Falha ao notificar worker, atualizando status da tarefa ${newTask.id} para FAILED.`);
        const failedTask = await prisma_1.prisma.task.update({
            where: { id: newTask.id },
            data: { status: 'FAILED' },
            include: { saleswoman: true },
        });
        (0, sse_service_1.sendSseEvent)(failedTask);
    }
    return newTask;
};
exports.createTask = createTask;
const updateTask = async (taskId, data) => {
    const taskToUpdate = await prisma_1.prisma.task.findUnique({ where: { id: taskId } });
    if (!taskToUpdate) {
        return null;
    }
    if (data.analysis && typeof data.analysis === 'string') {
        try {
            data.analysis = JSON.parse(data.analysis);
        }
        catch (e) {
            data.analysis = {
                error: "Falha ao fazer parse do JSON da análise.",
                raw: typeof data.analysis === 'string' ? data.analysis : null
            };
        }
    }
    const updatedTask = await prisma_1.prisma.task.update({
        where: { id: taskId },
        data,
        include: { saleswoman: true },
    });
    (0, sse_service_1.sendSseEvent)(updatedTask);
    return updatedTask;
};
exports.updateTask = updateTask;
// Busca os detalhes de uma tarefa
const getTaskById = async (taskId) => {
    return prisma_1.prisma.task.findUnique({
        where: { id: taskId },
        include: { saleswoman: true },
    });
};
exports.getTaskById = getTaskById;
const getTasksBySaleswoman = async (saleswomanId) => {
    return prisma_1.prisma.task.findMany({
        where: { saleswomanId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getTasksBySaleswoman = getTasksBySaleswoman;
const getTaskAudioPath = async (taskId) => {
    const task = await prisma_1.prisma.task.findUnique({
        where: { id: taskId },
        select: { audioFilePath: true }
    });
    return task?.audioFilePath ?? null;
};
exports.getTaskAudioPath = getTaskAudioPath;
//# sourceMappingURL=task.service.js.map