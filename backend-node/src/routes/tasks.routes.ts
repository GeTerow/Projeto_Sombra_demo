import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { PrismaClient, Prisma } from '@prisma/client';
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
                saleswomanId: saleswomanId,
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
                saleswoman: { select: { name: true } }
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
    const { clientName, saleswomanId } = req.body;
    
    if (!req.file || !clientName || !saleswomanId) {
        return res.status(400).json({ error: 'Os campos "saleswomanId", "clientName" e o arquivo "audio" são obrigatórios.' });
    }

    try {
        const newTask = await prisma.task.create({
            data: {
                clientName,
                saleswomanId,
                audioFilePath: req.file.path,
                status: 'PENDING'
            }
        });
        console.log(`[Node Backend] Tarefa ${newTask.id} criada para Vendedora ID: ${saleswomanId}, Cliente: ${clientName}`);

        const workerUrl = `${process.env.PYTHON_WORKER_URL}/process-task`;
        axios.post(workerUrl, {
            task_id: newTask.id,
            file_path: req.file.path
        }).catch(err => {
            console.error(`[Node Backend] ERRO ao notificar o worker Python para a tarefa ${newTask.id}:`, err.message);
            prisma.task.update({ where: { id: newTask.id }, data: { status: 'FAILED' } });
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
    const taskToUpdate = await prisma.task.findUnique({ where: { id } });
    if (!taskToUpdate) {
      return res.status(404).json({ error: "Tarefa não encontrada para atualização." });
    }

    // Use sentinelas do Prisma para JSON/DB null
    let analysisData: Prisma.InputJsonValue | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull = Prisma.DbNull;

    // Atualize somente se analysis veio no payload
    if (Object.prototype.hasOwnProperty.call(req.body, 'analysis')) {
      try {
        if (analysis === null) {
          // Caso queira armazenar JSON null (e não DB NULL):
          analysisData = Prisma.JsonNull;
        } else {
          analysisData = typeof analysis === 'string'
            ? JSON.parse(analysis)
            : (analysis as Prisma.InputJsonValue);
        }
      } catch (parseError) {
        console.error(`[Node Backend] Erro ao fazer parse do JSON da análise para a tarefa ${id}:`, parseError);
        analysisData = {
          error: "Falha ao fazer parse do JSON.",
          raw: analysis
        } as Prisma.InputJsonValue;
      }
    }

    const data: Prisma.TaskUpdateInput = {
      status: status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
      transcription
    };

    // Só inclui 'analysis' no update se veio no body
    if (Object.prototype.hasOwnProperty.call(req.body, 'analysis')) {
      data.analysis = analysisData;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data
    });

    console.log(`[Node Backend] Webhook recebido! Tarefa ${id} finalizada com status: ${status}`);

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


// --- PDF ---
const renderTextWithBold = (doc: PDFKit.PDFDocument, text: string) => {
    const safeText = String(text || '');
    const paragraphs = safeText.split('\n');
    for (const paragraph of paragraphs) {
        if (paragraph.trim() === '') {
            doc.moveDown();
            continue;
        }
        const boldRegex = /\*\*(.*?)\*\*/g;
        let lastIndex = 0;
        let match;
        while ((match = boldRegex.exec(paragraph)) !== null) {
            const normalText = paragraph.substring(lastIndex, match.index);
            if (normalText) {
                doc.font('Helvetica').text(normalText, { continued: true });
            }
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

        doc.fillColor('black');
        doc.fontSize(18).font('Helvetica-Bold').text(`Análise da Chamada`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('Cliente: ', { continued: true }).font('Helvetica').text(task.clientName);
        doc.font('Helvetica-Bold').text('Vendedora: ', { continued: true }).font('Helvetica').text(task.saleswoman.name);
        doc.font('Helvetica-Bold').text('Data: ', { continued: true }).font('Helvetica').text(new Date(task.createdAt).toLocaleDateString('pt-BR'));
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text('Análise da Chamada');
        doc.rect(doc.x, doc.y, 470, 1).fill('#cccccc');
        doc.moveDown();
        
        doc.fillColor('black'); 
        doc.fontSize(11);
        
        const analysisText = task.analysis 
            ? JSON.stringify(task.analysis, null, 2)
            : 'Análise não disponível.';
        renderTextWithBold(doc, analysisText);
        
        doc.moveDown(2);
        doc.fillColor('black'); 
        doc.end();

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        res.status(500).send('Não foi possível gerar o PDF.');
    }
});
