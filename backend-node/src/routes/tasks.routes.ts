import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import PDFDocument from 'pdfkit'; 

export const tasksRouter = Router();
const prisma = new PrismaClient();
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });


// ROTA PARA LISTAR TAREFAS DE UMA VENDEDORA ESPECÍFICA
tasksRouter.get('/saleswomen/:saleswomanId', async (req, res) => {
    const { saleswomanId } = req.params;
    try {
        const tasks = await prisma.task.findMany({
            where: {
                saleswomanId: saleswomanId, // CORREÇÃO: Usa o ID da vendedora
                status: 'COMPLETED'
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(tasks);
    } catch (error) {
        console.error(`Erro ao buscar tarefas para a vendedora ${saleswomanId}:`, error);
        res.status(500).json({ error: `Falha ao buscar tarefas.` });
    }
});

// ROTA PARA OBTER DETALHES DE UMA TAREFA
tasksRouter.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                saleswoman: { select: { name: true } } // Inclui o nome da vendedora no resultado
            }
        });
        if (!task) {
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar detalhes da tarefa.' });
    }
});


// ROTA PARA CRIAR UMA NOVA TAREFA (UPLOAD)
tasksRouter.post('/', upload.single('audio'), async (req, res) => {
    const { clientName, saleswomanId } = req.body; // CORREÇÃO: Usa saleswomanId
    
    if (!req.file || !clientName || !saleswomanId) {
        return res.status(400).json({ error: 'Os campos "saleswomanId", "clientName" e o arquivo "audio" são obrigatórios.' });
    }

    try {
        const newTask = await prisma.task.create({
            data: {
                clientName,
                saleswomanId, // CORREÇÃO: Salva o ID
                audioFilePath: req.file.path,
                status: 'PENDING'
            }
        });
        // CORREÇÃO: Log ajustado para usar o ID
        console.log(`[Node Backend] Tarefa ${newTask.id} criada para Vendedora ID: ${saleswomanId}, Cliente: ${clientName}`);

        const workerUrl = `${process.env.PYTHON_WORKER_URL}/process-task`;
        axios.post(workerUrl, {
            task_id: newTask.id,
            file_path: req.file.path
        }).catch(err => {
            console.error(`[Node Backend] ERRO ao notificar o worker Python para a tarefa ${newTask.id}:`, err.message);
            prisma.task.update({ where: { id: newTask.id }, data: { status: 'FAILED' }});
        });

        res.status(202).json({ 
            message: 'Tarefa de análise recebida e em processamento.',
            task: newTask 
        });
    } catch (error) {
        console.error("[Node Backend] Erro ao criar a tarefa:", error);
        res.status(500).json({ error: 'Falha ao iniciar o processo de análise.' });
    }
});

/**
 * @route   PATCH /api/v1/tasks/:id/complete
 * @desc    Webhook para o worker Python notificar a conclusão.
 */
tasksRouter.patch('/:id/complete', async (req, res) => {
    const { id } = req.params;
    const { status, transcription, analysis } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'O campo "status" é obrigatório.' });
    }

    try {
        const taskToUpdate = await prisma.task.findUnique({ where: { id }});
        if (!taskToUpdate) {
            return res.status(404).json({ error: "Tarefa não encontrada para atualização."});
        }
        
        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                status: status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
                transcription,
                analysis
            }
        });
        console.log(`[Node Backend] Webhook recebido! Tarefa ${id} finalizada com status: ${status}`);
        
        // Deleta o arquivo de áudio original para economizar espaço
        if (fs.existsSync(taskToUpdate.audioFilePath)) {
            fs.unlinkSync(taskToUpdate.audioFilePath);
            console.log(` -> Arquivo de áudio ${taskToUpdate.audioFilePath} deletado.`);
        }

        res.status(200).json({ message: 'Tarefa atualizada com sucesso.', task: updatedTask });
    } catch (error) {
        console.error(`[Node Backend] Erro ao atualizar a tarefa ${id} via webhook:`, error);
        res.status(500).json({ error: 'Falha ao atualizar a tarefa.' });
    }
});

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

        // Pega o texto restante após a última ocorrência de negrito
        const remainingText = paragraph.substring(lastIndex);

        // Finaliza a linha com o texto restante e aplica a justificação
        doc.font('Helvetica').text(remainingText, { align: 'justify' });
    }
};



// --- ROTA DO EXPRESS ---

tasksRouter.get('/:id/pdf', async (req, res) => {
    const { id } = req.params;
    try {
        const task = await prisma.task.findUnique({
            where: { id },
            include: { saleswoman: true }
        });

        if (!task) {
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 72, bottom: 72, left: 72, right: 72 },
            font: 'Helvetica'
        });

        const filename = `Analise-${task.saleswoman.name.replace(/\s/g, '_')}-${task.clientName.replace(/\s/g, '_')}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // --- CONTEÚDO DO PDF ---

        doc.fillColor('black'); // Define a cor padrão para preto

        // Título Principal
        doc.fontSize(18).font('Helvetica-Bold').text(`Análise da Chamada`, { align: 'center' });
        doc.moveDown();

        // Informações da Chamada
        doc.fontSize(12).font('Helvetica-Bold').text('Cliente: ', { continued: true }).font('Helvetica').text(task.clientName);
        doc.font('Helvetica-Bold').text('Vendedora: ', { continued: true }).font('Helvetica').text(task.saleswoman.name);
        doc.font('Helvetica-Bold').text('Data: ', { continued: true }).font('Helvetica').text(new Date(task.createdAt).toLocaleDateString('pt-BR'));
        doc.moveDown(2);


        // --- SEÇÃO DE ANÁLISE DA IA (CORRIGIDA) ---
        doc.fontSize(16).font('Helvetica-Bold').text('Análise da Chamada');
        doc.rect(doc.x, doc.y, 470, 1).fill('#cccccc'); // Linha divisória cinza
        doc.moveDown();
        
        // >>> CORREÇÃO AQUI <<<
        // Restaura a cor do texto para preto após desenhar a linha
        doc.fillColor('black'); 
        
        doc.fontSize(11);
        const analysisText = task.analysis || 'Análise não disponível.';
        renderTextWithBold(doc, analysisText);
        
        doc.moveDown(2);


        // --- SEÇÃO DE TRANSCRIÇÃO (CORRIGIDA) ---

        // >>> CORREÇÃO AQUI <<<
        // Restaura a cor do texto para preto também para esta seção
        doc.fillColor('black'); 
        

        // Finaliza o PDF
        doc.end();

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        res.status(500).send('Não foi possível gerar o PDF.');
    }
});