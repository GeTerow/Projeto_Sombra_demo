import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { PrismaClient, Prisma, Task } from '@prisma/client';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import { Request, Response } from 'express';

export interface SpeakerIdentification {
  salesperson: string;
  customer: string;
  reasoning: string;
}

export interface CrucialMoment {
  momentTitle: string;
  salespersonLine: string;
  problem: string;
  improvement: string;
  suggestedLine: string;
}

export interface OverallFeedback {
  summary: string;
}

export interface Analysis {
  speakerIdentification: SpeakerIdentification;
  crucialMoments: CrucialMoment[];
  overallFeedback: OverallFeedback;
}

export const tasksRouter = Router();
const prisma = new PrismaClient();
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// --- LÓGICA PARA SERVER-SENT EVENTS (SSE) ---
let clients: { id: number; response: any }[] = [];

const sendEventToClients = (data: Task) => {
  console.log(`[SSE] Enviando atualização para ${clients.length} cliente(s):`, data);
  clients.forEach(client => 
    client.response.write(`data: ${JSON.stringify(data)}\n\n`)
  );
}

tasksRouter.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, response: res };
    clients.push(newClient);
    console.log(`[SSE] Cliente ${clientId} conectado. Total de clientes: ${clients.length}`);

    res.write(`data: ${JSON.stringify({ message: "Conectado ao stream de status." })}\n\n`);

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
        console.log(`[SSE] Cliente ${clientId} desconectado. Total de clientes: ${clients.length}`);
    });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

tasksRouter.get('/saleswomen/:saleswomanId', async (req, res) => {
    const { saleswomanId } = req.params;
    try {
        const tasks = await prisma.task.findMany({
            where: { saleswomanId, status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(tasks);
    } catch (error) {
        console.error(`Erro ao buscar tarefas para a vendedora ${saleswomanId}:`, error);
        res.status(500).json({ error: `Falha ao buscar tarefas.` });
    }
});

tasksRouter.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const task = await prisma.task.findUnique({
            where: { id },
            include: { saleswoman: { select: { name: true } } }
        });
        if (!task) {
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar detalhes da tarefa.' });
    }
});

tasksRouter.post('/', upload.single('audio'), async (req, res) => {
    const { clientName, saleswomanId } = req.body;
    
    if (!req.file || !clientName || !saleswomanId) {
        return res.status(400).json({ error: 'Os campos "saleswomanId", "clientName" e o arquivo "audio" são obrigatórios.' });
    }

    try {
        const newTask = await prisma.task.create({
            data: { clientName, saleswomanId, audioFilePath: req.file.path, status: 'PENDING' },
            include: { saleswoman: true }
        });
        sendEventToClients(newTask);

        const workerUrl = `${process.env.PYTHON_WORKER_URL}/process-task`;
        axios.post(workerUrl, { task_id: newTask.id, file_path: req.file.path })
            .catch(err => {
                console.error(`[Node Backend] ERRO ao notificar o worker para a tarefa ${newTask.id}:`, err.message);
                prisma.task.update({ where: { id: newTask.id }, data: { status: 'FAILED' } })
                    .then(sendEventToClients);
            });

        res.status(202).json({ message: 'Tarefa recebida.', task: newTask });
    } catch (error) {
        console.error("[Node Backend] Erro ao criar a tarefa:", error);
        res.status(500).json({ error: 'Falha ao iniciar o processo de análise.' });
    }
});

tasksRouter.patch('/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { status, transcription, analysis } = req.body;

  if (!status) return res.status(400).json({ error: 'O campo "status" é obrigatório.' });

  try {
    const taskToUpdate = await prisma.task.findUnique({ where: { id } });
    if (!taskToUpdate) return res.status(404).json({ error: "Tarefa não encontrada." });

    const data: Prisma.TaskUpdateInput = { status };
    if (transcription !== undefined) data.transcription = transcription;
    if (analysis !== undefined) {
       try {
         data.analysis = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
       } catch (e) {
         data.analysis = { error: "Falha ao fazer parse do JSON.", raw: analysis };
       }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data,
      include: { saleswoman: true }
    });

    sendEventToClients(updatedTask);

    // LINHAS REMOVIDAS: O bloco abaixo, que apagava o áudio, foi removido.
    /*
    if ((status === 'COMPLETED' || status === 'FAILED') && fs.existsSync(taskToUpdate.audioFilePath)) {
      fs.unlinkSync(taskToUpdate.audioFilePath);
    }
    */

    res.status(200).json({ message: 'Tarefa atualizada.', task: updatedTask });
  } catch (error) {
    console.error(`[Node Backend] Erro no webhook da tarefa ${id}:`, error);
    res.status(500).json({ error: 'Falha ao atualizar a tarefa.' });
  }
});


// -PDF

const COLORS = {
    primary: '#4f46e5', // Indigo-600
    text: '#334155',    // Slate-700
    lightText: '#64748b',// Slate-500
    heading: '#1e293b', // Slate-800
    line: '#e2e8f0',      // Slate-200
    cardBg: '#f8fafc'   // Slate-50
};

const FONTS = {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique'
};

const drawLine = (doc: PDFKit.PDFDocument, y: number) => {
    doc.strokeColor(COLORS.line)
       .lineWidth(0.5)
       .moveTo(72, y)
       .lineTo(523, y)
       .stroke();
};

const THEME = {
  primary: '#0b63d6',
  muted: '#6b7280',
  bgCard: '#f3f4f6',
  heading: '#111827'
};

// Helpers
function mmToPt(mm: number) { return (mm / 25.4) * 72; }

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) doc.addPage();
}

function drawHeading(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(THEME.heading).text(text);
  doc.moveDown(0.25);
}

function drawLabelValue(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.muted).text(label);
  doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(value, { continued: false });
}

function drawWrappedQuote(doc: PDFKit.PDFDocument, quote: string) {
  const startX = doc.x;
  const boxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - 10;
  
  // 1. DEFINIR FONTE E TAMANHO ANTES DE MEDIR
  // O estado do 'doc' está configurado para a medição e para o desenho do texto.
  doc.font('Helvetica-Oblique', 10);

  // 2. CALCULAR ALTURA com base no estado atual do doc.
  const textHeight = doc.heightOfString(`"${quote.trim()}"`, { width: boxWidth });
  const boxHeight = textHeight + 8; // Padding vertical

  const beforeY = doc.y;

  // 3. DESENHAR RETÂNGULO com a altura dinâmica
  doc.rect(startX - 6, beforeY - 4, boxWidth + 12, boxHeight).fillOpacity(0.03).fillAndStroke(THEME.bgCard, THEME.bgCard);
  
  // 4. DESENHAR TEXTO
  // A fonte e o tamanho já estão corretos, só precisamos garantir a cor.
  doc.fillOpacity(1);
  doc.fillColor(THEME.heading) // Garante o contraste
     .text(`"${quote.trim()}"`, startX, beforeY, { width: boxWidth, align: 'left' });
  
  // Adiciona um espaçamento extra depois.
  doc.moveDown(0.7); 
}


tasksRouter.get('/:id/pdf', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { saleswoman: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }
    if (!task.analysis || typeof task.analysis !== 'object') {
      return res.status(400).json({ error: 'Análise inválida ou não disponível.' });
    }

    const analysis = task.analysis as unknown as {
      speakerIdentification: { salesperson: string; customer: string; reasoning: string; };
      crucialMoments: { momentTitle: string; salespersonLine: string; problem: string; improvement: string; suggestedLine: string; }[];
      overallFeedback: { summary: string; };
    };

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true
    });

    const filename = `Analise_${(task.saleswoman?.name || 'vendedora').replace(/\s+/g, '_')}_${task.clientName.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    // --- Conteúdo do PDF ---
    doc.fillColor(THEME.primary).font('Helvetica-Bold').fontSize(18).text('Relatório de Análise de Chamada', { align: 'left' });
    doc.moveDown(0.25);
    doc.font('Helvetica').fontSize(10).fillColor(THEME.muted).text('Relatório gerado automaticamente — Análise de Vendas com IA', { align: 'left' });
    doc.moveDown(1);
    const leftX = doc.x;
    const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2 - 10;
    ensureSpace(doc, 90);
    const startY = doc.y;
    doc.roundedRect(leftX - 6, startY - 6, colWidth + 12, 80, 6).fillOpacity(0.03).fillAndStroke(THEME.bgCard, THEME.bgCard);
    doc.fillOpacity(1);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(THEME.primary).text('Chamada', leftX, startY);
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.muted).text('Cliente');
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(task.clientName);
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.muted).text('Vendedora');
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(task.saleswoman?.name || '—');
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.muted).text('Data');
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(new Date(task.createdAt).toLocaleString('pt-BR'));
    const rightColumnX = leftX + colWidth + 30;
    doc.x = rightColumnX;
    doc.y = startY;
    doc.roundedRect(rightColumnX - 6, startY - 6, colWidth + 12, 80, 6).fillOpacity(0.03).fillAndStroke(THEME.bgCard, THEME.bgCard);
    doc.fillOpacity(1);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(THEME.primary).text('Resumo Rápido', { continued: false });
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.muted).text('Status');
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(task.status);
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.muted).text('Transcrição');
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(task.transcription ? 'Disponível' : 'Não disponível');
    doc.x = leftX;
    doc.y = startY + 90;
    doc.moveDown(0.5);
    drawHeading(doc, 'Identificação dos Locutores');
    ensureSpace(doc, 70);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(THEME.muted).text('Vendedor: ', { continued: true });
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(analysis.speakerIdentification.salesperson || '—');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(THEME.muted).text('Cliente: ', { continued: true });
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(analysis.speakerIdentification.customer || '—');
    doc.moveDown(0.4);
    doc.font('Helvetica-Oblique').fontSize(10).fillColor(THEME.muted).text(analysis.speakerIdentification.reasoning || '—', { align: 'justify' });
    drawHeading(doc, 'Feedback Geral');
    ensureSpace(doc, 60);
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(analysis.overallFeedback.summary || '—', { align: 'justify' });
    doc.moveDown(0.6);

    if (analysis.crucialMoments && analysis.crucialMoments.length > 0) {
      drawHeading(doc, 'Momentos Cruciais (oportunidades de melhoria)');
      for (const m of analysis.crucialMoments) {
        ensureSpace(doc, 140);
        doc.rect(doc.x - 8, doc.y - 4, doc.page.width - doc.page.margins.left - doc.page.margins.right + 16, 6).fillOpacity(1).fill(THEME.primary);
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(12).fillColor(THEME.primary).text(m.momentTitle || 'Momento Crucial');
        doc.moveDown(0.3);
        
        drawWrappedQuote(doc, m.salespersonLine || '—');
        
        doc.font('Helvetica-Bold').fontSize(10).fillColor(THEME.muted).text('Problema');
        doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(m.problem || '—', { align: 'justify' });
        doc.moveDown(0.2);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(THEME.muted).text('Melhoria sugerida');
        doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(m.improvement || '—', { align: 'justify' });
        doc.moveDown(0.2);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(THEME.muted).text('Exemplo de fala');
        doc.font('Helvetica-Oblique').fontSize(11).fillColor(THEME.heading).text(m.suggestedLine || '—', { align: 'justify' });
        doc.moveDown(0.8);
      }
    }

    // Rodapé com a correção de página em branco
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const oldBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.font('Helvetica').fontSize(9).fillColor(THEME.muted).text(
        `Página ${i + 1} / ${range.count}`,
        0,
        doc.page.height - 40,
        { align: 'center' }
      );
      doc.page.margins.bottom = oldBottomMargin;
    }

    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).send('Não foi possível gerar o PDF.');
  }
});

tasksRouter.get('/:id/audio', async (req, res) => {
    const { id } = req.params;
    try {
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task || !task.audioFilePath) {
            return res.status(404).json({ error: 'Arquivo de áudio não encontrado.' });
        }
        res.sendFile(task.audioFilePath);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar o arquivo de áudio.' });
    }
});