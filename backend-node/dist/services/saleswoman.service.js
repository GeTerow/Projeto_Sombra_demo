"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummaryPdfPath = exports.generateNewSummary = exports.deleteSaleswoman = exports.updateSaleswoman = exports.createSaleswoman = exports.getAllSaleswomen = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const worker_client_1 = require("../lib/worker.client");
const pdf_service_1 = require("./pdf.service");
// Pasta que guarda os resumos em PDF.
const SUMMARIES_DIR = node_path_1.default.resolve(__dirname, '..', '..', 'uploads', 'summaries');
node_fs_1.default.mkdirSync(SUMMARIES_DIR, { recursive: true });
const getAllSaleswomen = async () => {
    return prisma_1.prisma.saleswoman.findMany({
        orderBy: { name: 'asc' },
    });
};
exports.getAllSaleswomen = getAllSaleswomen;
const createSaleswoman = async (name) => {
    return prisma_1.prisma.saleswoman.create({
        data: { name },
    });
};
exports.createSaleswoman = createSaleswoman;
const updateSaleswoman = async (id, name) => {
    return prisma_1.prisma.saleswoman.update({
        where: { id },
        data: { name },
    });
};
exports.updateSaleswoman = updateSaleswoman;
const deleteSaleswoman = async (id) => {
    const saleswoman = await prisma_1.prisma.saleswoman.findUnique({ where: { id } });
    if (saleswoman?.summaryPdfPath && node_fs_1.default.existsSync(saleswoman.summaryPdfPath)) {
        node_fs_1.default.unlinkSync(saleswoman.summaryPdfPath);
    }
    return prisma_1.prisma.saleswoman.delete({
        where: { id },
    });
};
exports.deleteSaleswoman = deleteSaleswoman;
// Gera um novo PDF de resumo
const generateNewSummary = async (id, force = false) => {
    let saleswoman = await prisma_1.prisma.saleswoman.findUnique({ where: { id } });
    if (!saleswoman)
        throw new Error('Vendedora não encontrada.');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (saleswoman.summaryLastGenerationDate && new Date(saleswoman.summaryLastGenerationDate) < today) {
        saleswoman = await prisma_1.prisma.saleswoman.update({ where: { id }, data: { summaryGenerationsToday: 0 } });
    }
    if (saleswoman.summaryGenerationsToday >= 5) {
        const err = new Error('Limite de 5 gerações de resumo por dia atingido.');
        err.statusCode = 429;
        throw err;
    }
    if (saleswoman.summaryLastGeneratedAt && !force) {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (new Date(saleswoman.summaryLastGeneratedAt) > oneWeekAgo) {
            const err = new Error('Um resumo já foi gerado há menos de uma semana. Deseja gerar um novo mesmo assim?');
            err.statusCode = 409;
            err.confirmationRequired = true;
            throw err;
        }
    }
    const tasks = await prisma_1.prisma.task.findMany({
        where: { saleswomanId: id, status: 'COMPLETED', analysis: { not: client_1.Prisma.JsonNull } },
        orderBy: { createdAt: 'desc' },
        take: 6
    });
    if (tasks.length < 1) {
        const err = new Error('Não há análises suficientes para gerar um resumo.');
        err.statusCode = 400;
        throw err;
    }
    const transcriptions = tasks.map(t => t.transcription).filter((t) => t !== null);
    const summaryContent = await (0, worker_client_1.generateConsolidatedSummary)(saleswoman.name, transcriptions);
    const pdfBuffer = await (0, pdf_service_1.generateSummaryPdf)(saleswoman.name, summaryContent);
    const filePath = node_path_1.default.join(SUMMARIES_DIR, `summary-${id}-${Date.now()}.pdf`);
    node_fs_1.default.writeFileSync(filePath, pdfBuffer);
    if (saleswoman.summaryPdfPath && node_fs_1.default.existsSync(saleswoman.summaryPdfPath)) {
        node_fs_1.default.unlinkSync(saleswoman.summaryPdfPath);
    }
    return prisma_1.prisma.saleswoman.update({
        where: { id },
        data: {
            summaryPdfPath: filePath,
            summaryLastGeneratedAt: new Date(),
            summaryLastGenerationDate: today,
            summaryGenerationsToday: { increment: 1 }
        }
    });
};
exports.generateNewSummary = generateNewSummary;
// Pega o caminho do PDF de uma vendedora
const getSummaryPdfPath = async (id) => {
    const saleswoman = await prisma_1.prisma.saleswoman.findUnique({ where: { id }, select: { name: true, summaryPdfPath: true } });
    if (!saleswoman || !saleswoman.summaryPdfPath || !node_fs_1.default.existsSync(saleswoman.summaryPdfPath)) {
        return null;
    }
    return {
        path: saleswoman.summaryPdfPath,
        name: `Resumo-${saleswoman.name.replace(/\s/g, '_')}.pdf`
    };
};
exports.getSummaryPdfPath = getSummaryPdfPath;
//# sourceMappingURL=saleswoman.service.js.map