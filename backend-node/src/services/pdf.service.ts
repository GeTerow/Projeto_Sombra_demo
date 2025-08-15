import PDFDocument from 'pdfkit';
import { Task, Saleswoman } from '@prisma/client';
import { TaskAnalysis } from '../utils/types';

// Tema de cores para o PDF.
const THEME = {
  primary: '#0b63d6',
  muted: '#6b7280',
  bgCard: '#f3f4f6',
  heading: '#111827'
};

// Função de formatação do PDF
const renderTextWithBold = (doc: PDFKit.PDFDocument, text: string) => {
  const safeText = String(text || '');
  const paragraphs = safeText.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      doc.moveDown();
      continue;
    }
    
    const parts = paragraph.split(/(\*\*.*?\*\*)/g).filter(p => p);
    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;
      if (part.startsWith('**') && part.endsWith('**')) {
        doc.font('Helvetica-Bold').text(part.slice(2, -2), { continued: !isLastPart });
      } else {
        doc.font('Helvetica').text(part, { continued: !isLastPart });
      }
    });
     doc.moveDown(0.7);
  }
};

// Gera o PDF de análise de uma conversa

export const generateTaskAnalysisPdf = (task: Task & { saleswoman: Saleswoman | null }): Promise<Buffer> => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true
    });

    const buffers: any[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    const analysis = task.analysis as unknown as TaskAnalysis;

    doc.fillColor(THEME.primary).font('Helvetica-Bold').fontSize(18).text('Relatório de Análise de Chamada');
    doc.moveDown(0.25);
    doc.font('Helvetica').fontSize(10).fillColor(THEME.muted).text('Relatório gerado por Sombra IA');
    doc.moveDown(1.5);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(THEME.primary).text('Detalhes da Chamada');
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.muted).text('Cliente:');
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(task.clientName);
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.muted).text('Vendedora:');
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(task.saleswoman?.name || 'N/A');
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.muted).text('Data:');
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(new Date(task.createdAt).toLocaleString('pt-BR'));
    doc.moveDown(1.5);

    doc.font('Helvetica-Bold').fontSize(14).fillColor(THEME.heading).text('Feedback Geral');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(analysis.overallFeedback.summary || 'N/A', { align: 'justify' });
    doc.moveDown(1.5);

    if (analysis.crucialMoments && analysis.crucialMoments.length > 0) {
      doc.font('Helvetica-Bold').fontSize(14).fillColor(THEME.heading).text('Momentos Cruciais para Melhoria');
      doc.moveDown(0.7);

      for (const moment of analysis.crucialMoments) {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(THEME.primary).text(moment.momentTitle || 'Momento Crucial');
        doc.moveDown(0.3);
        doc.font('Helvetica-Oblique').fontSize(10).fillColor(THEME.muted).text(`"${moment.salespersonLine || '—'}"`);
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(THEME.muted).text('Problema Identificado:');
        doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(moment.problem || '—', { align: 'justify' });
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(THEME.muted).text('Sugestão de Melhoria:');
        doc.font('Helvetica').fontSize(11).fillColor(THEME.heading).text(moment.improvement || '—', { align: 'justify' });
        doc.moveDown(0.8);
      }
    }
    
    doc.end();
  });
};

// Gera o resumo em um PDF para a vendedora
export const generateSummaryPdf = (saleswomanName: string, summaryContent: string): Promise<Buffer> => {
    return new Promise((resolve) => {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 72, bottom: 72, left: 72, right: 72 },
            bufferPages: true
        });

        const buffers: any[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        doc.fontSize(20).font('Helvetica-Bold').text(`Resumo de Desempenho: ${saleswomanName}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(11).lineGap(4);
        renderTextWithBold(doc, summaryContent);

        doc.end();
    });
};