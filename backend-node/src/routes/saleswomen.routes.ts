import { Router } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import path from 'node:path';
import fs from 'node:fs';

export const saleswomenRouter = Router();
const prisma = new PrismaClient();

// Garante que o diretório para salvar os resumos exista
const SUMMARIES_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'summaries');
fs.mkdirSync(SUMMARIES_DIR, { recursive: true });


const renderTextWithBold = (doc: PDFKit.PDFDocument, text: string) => {
    // Garante que o texto de entrada seja uma string
    const safeText = String(text || '');

    // 1. Divide o texto em parágrafos
    const paragraphs = safeText.split('\n');

    for (const paragraph of paragraphs) {
        // Se a linha estiver vazia, apenas adiciona um espaço vertical
        if (paragraph.trim() === '') {
            doc.moveDown();
            continue;
        }

        const boldRegex = /\*\*(.*?)\*\*/g;
        let lastIndex = 0;
        let match;

        // Itera sobre as ocorrências de negrito no parágrafo
        while ((match = boldRegex.exec(paragraph)) !== null) {
            // Adiciona o texto normal antes do negrito
            const normalText = paragraph.substring(lastIndex, match.index);
            if (normalText) {
                doc.font('Helvetica').text(normalText, { continued: true });
            }

            // Adiciona o texto em negrito
            const boldText = match[1];
            if (boldText) {
                doc.font('Helvetica-Bold').text(boldText, { continued: true });
                doc.font('Helvetica').text(' ', { continued: true });
            }

            lastIndex = match.index + match[0].length;
        }

        const remainingText = paragraph.substring(lastIndex);

        doc.font('Helvetica').text(remainingText, { align: 'justify' });
    }
};

// ROTA POST PARA GERAR UM NOVO PDF
saleswomenRouter.post('/:id/generate-summary-pdf', async (req, res) => {
    const { id } = req.params;
    const { force } = req.body;

    try {
        let saleswoman = await prisma.saleswoman.findUnique({ where: { id } });
        if (!saleswoman) {
            return res.status(404).json({ error: 'Vendedora não encontrada.' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Reseta o contador se for um novo dia
        if (saleswoman.summaryLastGenerationDate && new Date(saleswoman.summaryLastGenerationDate) < today) {
            saleswoman = await prisma.saleswoman.update({
                where: { id },
                data: { summaryGenerationsToday: 0 }
            });
        }

        // Verifica o limite diário de gerações
        if (saleswoman.summaryGenerationsToday >= 3) {
            return res.status(429).json({ error: 'Limite de 3 gerações de resumo por dia atingido.' });
        }

        // Verifica se um resumo foi gerado há menos de uma semana
        if (saleswoman.summaryLastGeneratedAt) {
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            if (new Date(saleswoman.summaryLastGeneratedAt) > oneWeekAgo && !force) {
                // Se não for forçado, pede confirmação
                return res.status(409).json({
                    message: 'Um resumo já foi gerado para esta vendedora há menos de uma semana. Deseja gerar um novo mesmo assim?',
                    confirmationRequired: true
                });
            }
        }
        
        // Busca as tarefas para a análise
        const tasks = await prisma.task.findMany({
            where: { 
                saleswomanId: id, 
                status: 'COMPLETED', 
                analysis: { not: Prisma.JsonNull }
            },
            orderBy: { createdAt: 'desc' },
            take: 6
        });

        if (tasks.length === 0) {
            return res.status(400).json({ error: 'Não há análises suficientes para gerar um resumo.' });
        }

        // Gera o resumo com a IA
        const transcriptions = tasks.map(task => task.transcription).filter((t): t is string => t !== null);
        const workerUrl = `${process.env.PYTHON_WORKER_URL}/generate-summary`;
        const summaryResponse = await axios.post<{ summary: string }>(workerUrl, {
            name: saleswoman.name,
            transcriptions: transcriptions 
        });
        const summary = summaryResponse.data.summary;

        // Salva o PDF no servidor
        const doc = new PDFDocument({ size: 'A4', margins: { top: 72, bottom: 72, left: 72, right: 72 } });
        const filePath = path.join(SUMMARIES_DIR, `summary-${id}-${Date.now()}.pdf`);
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        doc.fontSize(20).font('Helvetica-Bold').text(`Resumo de Desempenho: ${saleswoman.name}`, { align: 'center' });
        doc.moveDown(2);
        
        doc.fontSize(12).lineGap(4);
        renderTextWithBold(doc, summary);
        doc.end();

        // Atualiza o banco de dados com as novas informações
        const updatedSaleswoman = await prisma.saleswoman.update({
            where: { id },
            data: {
                summaryPdfPath: filePath,
                summaryLastGeneratedAt: new Date(),
                summaryLastGenerationDate: today,
                summaryGenerationsToday: { increment: 1 }
            }
        });

        //  Deleta o PDF antigo se existir
        if (saleswoman.summaryPdfPath && fs.existsSync(saleswoman.summaryPdfPath)) {
            fs.unlinkSync(saleswoman.summaryPdfPath);
        }

        res.status(201).json(updatedSaleswoman);

    } catch (error) {
        console.error("Erro ao gerar resumo em PDF:", error);
        res.status(500).json({ error: 'Falha ao gerar o resumo em PDF.' });
    }
});

// ROTA GET PARA BAIXAR O ÚLTIMO PDF GERADO
saleswomenRouter.get('/:id/download-summary-pdf', async (req, res) => {
    try {
        const { id } = req.params;
        const saleswoman = await prisma.saleswoman.findUnique({ where: { id } });

        if (!saleswoman || !saleswoman.summaryPdfPath) {
            return res.status(404).json({ error: 'Nenhum resumo em PDF encontrado para esta vendedora.' });
        }
        
        if (!fs.existsSync(saleswoman.summaryPdfPath)) {
            return res.status(404).json({ error: 'Arquivo PDF não encontrado no servidor.' });
        }

        const filename = `Resumo-${saleswoman.name.replace(/\s/g, '_')}.pdf`;
        res.download(saleswoman.summaryPdfPath, filename);

    } catch (error) {
        console.error("Erro ao baixar PDF:", error);
        res.status(500).send('Não foi possível baixar o PDF.');
    }
});


// ROTA PARA LISTAR TODAS AS VENDEDORAS 
saleswomenRouter.get('/', async (req, res) => {
    try {
        const saleswomen = await prisma.saleswoman.findMany({
            orderBy: { name: 'asc' }
        });
        res.status(200).json(saleswomen);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar lista de vendedoras.' });
    }
});

// ROTA PARA CRIAR UMA NOVA VENDEDORA
saleswomenRouter.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O campo "name" é obrigatório.' });
    }
    try {
        const newSaleswoman = await prisma.saleswoman.create({ data: { name } });
        res.status(201).json(newSaleswoman);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ error: 'Uma vendedora com este nome já existe.' });
        }
        res.status(500).json({ error: 'Falha ao criar vendedora.' });
    }
});