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
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadSummaryPdf = exports.generateSummaryPdf = exports.deleteSaleswoman = exports.updateSaleswoman = exports.createNewSaleswoman = exports.listSaleswomen = void 0;
const saleswomanService = __importStar(require("../services/saleswoman.service"));
const client_1 = require("@prisma/client");
const listSaleswomen = async (req, res) => {
    try {
        const saleswomen = await saleswomanService.getAllSaleswomen();
        res.status(200).json(saleswomen);
    }
    catch (error) {
        res.status(500).json({ error: 'Falha ao buscar a lista de vendedoras.' });
    }
};
exports.listSaleswomen = listSaleswomen;
const createNewSaleswoman = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O campo "name" é obrigatório.' });
    }
    try {
        const newSaleswoman = await saleswomanService.createSaleswoman(name);
        res.status(201).json(newSaleswoman);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ error: 'Uma vendedora com este nome já existe.' });
        }
        res.status(500).json({ error: 'Falha ao criar vendedora.' });
    }
};
exports.createNewSaleswoman = createNewSaleswoman;
const updateSaleswoman = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O campo "name" é obrigatório.' });
    }
    try {
        const updatedSaleswoman = await saleswomanService.updateSaleswoman(id, name);
        res.status(200).json(updatedSaleswoman);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ error: 'Uma vendedora com este nome já existe.' });
        }
        res.status(500).json({ error: 'Falha ao atualizar vendedora.' });
    }
};
exports.updateSaleswoman = updateSaleswoman;
const deleteSaleswoman = async (req, res) => {
    const { id } = req.params;
    try {
        await saleswomanService.deleteSaleswoman(id);
        res.status(204).send(); // 204 No Content para sucesso na exclusão
    }
    catch (error) {
        res.status(500).json({ error: 'Falha ao deletar vendedora.' });
    }
};
exports.deleteSaleswoman = deleteSaleswoman;
// Gera o PDF
const generateSummaryPdf = async (req, res) => {
    const { id } = req.params;
    const { force } = req.body;
    try {
        const updatedSaleswoman = await saleswomanService.generateNewSummary(id, force);
        res.status(201).json(updatedSaleswoman);
    }
    catch (error) {
        if (error.statusCode) {
            const payload = { error: error.message };
            if (error.confirmationRequired) {
                payload.confirmationRequired = true;
                payload.message = error.message; // O front-end usa 'message' para confirmação
            }
            return res.status(error.statusCode).json(payload);
        }
        res.status(500).json({ error: 'Falha ao gerar o resumo em PDF.' });
    }
};
exports.generateSummaryPdf = generateSummaryPdf;
// Baixar o PDF
const downloadSummaryPdf = async (req, res) => {
    const { id } = req.params;
    try {
        const pdfInfo = await saleswomanService.getSummaryPdfPath(id);
        if (!pdfInfo) {
            return res.status(404).json({ error: 'Nenhum resumo em PDF encontrado para esta vendedora.' });
        }
        res.download(pdfInfo.path, pdfInfo.name);
    }
    catch (error) {
        res.status(500).send('Não foi possível descarregar o PDF.');
    }
};
exports.downloadSummaryPdf = downloadSummaryPdf;
//# sourceMappingURL=saleswoman.controller.js.map