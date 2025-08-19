import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import fs from 'node:fs';
import path from 'node:path';
import { generateConsolidatedSummary } from '../lib/worker.client';
import { generateSummaryPdf } from './pdf.service';

// Pasta que guarda os resumos em PDF.
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
    data: {
      name,
      email
    },
  });
};

export const updateSaleswoman = async (id: string, data: { name?: string; email?: string }) => {
  if (data.email) {
    const existingSaleswoman = await prisma.saleswoman.findFirst({
      where: {
        email: data.email,
        id: { not: id },
      },
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

// Gera um novo PDF de resumo
export const generateNewSummary = async (id: string, force: boolean = false) => {
  let saleswoman = await prisma.saleswoman.findUnique({ where: { id } });
  if (!saleswoman) throw new Error('Vendedora não encontrada.');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (saleswoman.summaryLastGenerationDate && new Date(saleswoman.summaryLastGenerationDate) < today) {
    saleswoman = await prisma.saleswoman.update({ where: { id }, data: { summaryGenerationsToday: 0 } });
  }

  if (saleswoman.summaryGenerationsToday >= 5) {
    const err = new Error('Limite de 5 gerações de resumo por dia atingido.');
    (err as any).statusCode = 429;
    throw err;
  }

  if (saleswoman.summaryLastGeneratedAt && !force) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (new Date(saleswoman.summaryLastGeneratedAt) > oneWeekAgo) {
      const err = new Error('Um resumo já foi gerado há menos de uma semana. Deseja gerar um novo mesmo assim?');
      (err as any).statusCode = 409;
      (err as any).confirmationRequired = true;
      throw err;
    }
  }

  const tasks = await prisma.task.findMany({
    where: { saleswomanId: id, status: 'COMPLETED', analysis: { not: Prisma.JsonNull } },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  if (tasks.length < 1) {
    const err = new Error('Não há análises suficientes para gerar um resumo.');
    (err as any).statusCode = 400;
    throw err;
  }

  const transcriptions = tasks.map(t => t.transcription).filter((t): t is string => t !== null);
  const summaryContent = await generateConsolidatedSummary(saleswoman.name, transcriptions);
  const pdfBuffer = await generateSummaryPdf(saleswoman.name, summaryContent);

  const filePath = path.join(SUMMARIES_DIR, `summary-${id}-${Date.now()}.pdf`);
  fs.writeFileSync(filePath, pdfBuffer);

  if (saleswoman.summaryPdfPath && fs.existsSync(saleswoman.summaryPdfPath)) {
    fs.unlinkSync(saleswoman.summaryPdfPath);
  }

  return prisma.saleswoman.update({
    where: { id },
    data: {
      summaryPdfPath: filePath,
      summaryLastGeneratedAt: new Date(),
      summaryLastGenerationDate: today,
      summaryGenerationsToday: { increment: 1 },
    },
  });
};

// Pega o caminho do PDF de uma vendedora
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