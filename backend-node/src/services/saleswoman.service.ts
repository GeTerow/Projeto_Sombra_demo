import { Prisma, Saleswoman, Task } from '@prisma/client';
import { prisma } from '../lib/prisma';
import fs from 'node:fs';
import path from 'node:path';
import { generateConsolidatedSummary } from '../lib/worker.client';
import { generateSummaryPdf } from './pdf.service';
import { sendSummaryEmail } from './email.service';

const SUMMARIES_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'summaries');
fs.mkdirSync(SUMMARIES_DIR, { recursive: true });

export const getAllSaleswomen = async () => {
  return prisma.saleswoman.findMany({
    orderBy: { name: 'asc' },
  });
};

export const createSaleswoman = async (name: string, email?: string) => {
  if (email) {
    const existingSaleswoman = await prisma.saleswoman.findFirst({
      where: { email },
    });
    if (existingSaleswoman) {
      throw new Error('E-mail já está em uso.');
    }
  }
  return prisma.saleswoman.create({
    data: { name, email },
  });
};

export const updateSaleswoman = async (id: string, data: { name?: string; email?: string }) => {
  if (data.email) {
    const existingSaleswoman = await prisma.saleswoman.findFirst({
      where: { email: data.email, id: { not: id } },
    });
    if (existingSaleswoman) {
      throw new Error('E-mail já está em uso.');
    }
  }
  return prisma.saleswoman.update({
    where: { id },
    data,
  });
};

export const deleteSaleswoman = async (id: string) => {
  const saleswoman = await prisma.saleswoman.findUnique({ where: { id } });
  if (saleswoman?.summaryPdfPath && fs.existsSync(saleswoman.summaryPdfPath)) {
    fs.unlinkSync(saleswoman.summaryPdfPath);
  }
  return prisma.saleswoman.delete({
    where: { id },
  });
};


export const generateOnDemandSummary = async (id: string, force: boolean = false) => {
  let saleswoman = await prisma.saleswoman.findUnique({ where: { id } });
  if (!saleswoman) {
    const err = new Error('Vendedora não encontrada.');
    (err as any).statusCode = 404;
    throw err;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reseta o contador diário se for um novo dia
  if (saleswoman.summaryLastGenerationDate && new Date(saleswoman.summaryLastGenerationDate) < today) {
    saleswoman = await prisma.saleswoman.update({ where: { id }, data: { summaryGenerationsToday: 0 } });
  }

  if (saleswoman.summaryGenerationsToday >= 5 && !force) {
    const err = new Error('Limite de 5 gerações de resumo por dia atingido.');
    (err as any).statusCode = 429;
    throw err;
  }

  if (saleswoman.summaryLastGeneratedAt && !force) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (new Date(saleswoman.summaryLastGeneratedAt) > oneHourAgo) {
      const err = new Error('Um resumo já foi gerado há menos de uma hora. Deseja gerar um novo mesmo assim?');
      (err as any).statusCode = 409;
      (err as any).confirmationRequired = true;
      throw err;
    }
  }

  const tasksToInclude = await prisma.task.findMany({
    where: {
      saleswomanId: id,
      status: 'COMPLETED',
      analysis: { not: Prisma.JsonNull },
    },
    orderBy: { createdAt: 'desc' },
    take: 6, // Pega as 6 últimas chamadas concluídas
  });

  if (tasksToInclude.length < 1) {
    const err = new Error('Não há análises concluídas suficientes para gerar um resumo.');
    (err as any).statusCode = 400;
    throw err;
  }

  const newPdfPath = await generateNewSummaryWithTasks(saleswoman, tasksToInclude);

  // Atualiza as estatísticas de geração
  return prisma.saleswoman.update({
    where: { id },
    data: {
      summaryPdfPath: newPdfPath,
      summaryLastGeneratedAt: new Date(),
      summaryLastGenerationDate: today,
      summaryGenerationsToday: { increment: 1 },
    },
  });
};


export const generateNewSummaryWithTasks = async (saleswoman: Saleswoman, tasksToInclude: Task[]) => {
  if (tasksToInclude.length === 0) {
    throw new Error('Nenhuma tarefa fornecida para gerar o resumo.');
  }

  const transcriptions = tasksToInclude.map(t => t.transcription).filter((t): t is string => t !== null);
  if (transcriptions.length === 0) {
    throw new Error('As tarefas fornecidas não contêm transcrições válidas.');
  }

  const summaryContent = await generateConsolidatedSummary(saleswoman.name, transcriptions);
  const pdfBuffer = await generateSummaryPdf(saleswoman.name, summaryContent);
  const filePath = path.join(SUMMARIES_DIR, `summary-${saleswoman.id}-${Date.now()}.pdf`);
  fs.writeFileSync(filePath, pdfBuffer);

  if (saleswoman.summaryPdfPath && fs.existsSync(saleswoman.summaryPdfPath)) {
    fs.unlinkSync(saleswoman.summaryPdfPath);
  }
  
  // Atualiza o caminho do PDF no registro da vendedora
  await prisma.saleswoman.update({
    where: { id: saleswoman.id },
    data: { summaryPdfPath: filePath },
  });

  return filePath;
};

export const markTasksAsIncludedInSummary = async (taskIds: string[]) => {
  if (taskIds.length === 0) return;
  return prisma.task.updateMany({
    where: { id: { in: taskIds } },
    data: { includedInSummary: true },
  });
};


export const getSummaryPdfPath = async (id: string) => {
  const saleswoman = await prisma.saleswoman.findUnique({ where: { id }, select: { name: true, summaryPdfPath: true } });
  if (!saleswoman || !saleswoman.summaryPdfPath || !fs.existsSync(saleswoman.summaryPdfPath)) {
    return null;
  }
  return {
    path: saleswoman.summaryPdfPath,
    name: `Resumo-${saleswoman.name.replace(/\s/g, '_')}.pdf`,
  };
};

export const sendSummaryEmailToSaleswoman = async (id: string) => {
  const saleswoman = await prisma.saleswoman.findUnique({ where: { id } });

  if (!saleswoman) {
    const err = new Error('Vendedora não encontrada.');
    (err as any).statusCode = 404;
    throw err;
  }

  if (!saleswoman.email) {
    const err = new Error('Vendedora não possui e-mail cadastrado.');
    (err as any).statusCode = 400;
    throw err;
  }

  if (!saleswoman.summaryPdfPath || !fs.existsSync(saleswoman.summaryPdfPath)) {
    const err = new Error('Nenhum resumo em PDF encontrado para esta vendedora.');
    (err as any).statusCode = 404;
    throw err;
  }

  await sendSummaryEmail(saleswoman, saleswoman.summaryPdfPath);

  return { message: `E-mail enviado com sucesso para ${saleswoman.name}.` };
};