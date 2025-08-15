import { Request, Response } from 'express';
import * as saleswomanService from '../services/saleswoman.service';
import { Prisma } from '@prisma/client';

export const listSaleswomen = async (req: Request, res: Response) => {
  try {
    const saleswomen = await saleswomanService.getAllSaleswomen();
    res.status(200).json(saleswomen);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar a lista de vendedoras.' });
  }
};

export const createNewSaleswoman = async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'O campo "name" é obrigatório.' });
  }

  try {
    const newSaleswoman = await saleswomanService.createSaleswoman(name);
    res.status(201).json(newSaleswoman);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Uma vendedora com este nome já existe.' });
    }
    res.status(500).json({ error: 'Falha ao criar vendedora.' });
  }
};

export const updateSaleswoman = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'O campo "name" é obrigatório.' });
  }

  try {
    const updatedSaleswoman = await saleswomanService.updateSaleswoman(id, name);
    res.status(200).json(updatedSaleswoman);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Uma vendedora com este nome já existe.' });
    }
    res.status(500).json({ error: 'Falha ao atualizar vendedora.' });
  }
};

export const deleteSaleswoman = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await saleswomanService.deleteSaleswoman(id);
    res.status(204).send(); // 204 No Content para sucesso na exclusão
  } catch (error) {
    res.status(500).json({ error: 'Falha ao deletar vendedora.' });
  }
};

// Gera o PDF
export const generateSummaryPdf = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { force } = req.body;

    try {
        const updatedSaleswoman = await saleswomanService.generateNewSummary(id, force);
        res.status(201).json(updatedSaleswoman);
    } catch (error: any) {
        if (error.statusCode) {
            const payload: any = { error: error.message };
            if (error.confirmationRequired) {
                payload.confirmationRequired = true;
                payload.message = error.message; // O front-end usa 'message' para confirmação
            }
            return res.status(error.statusCode).json(payload);
        }
        res.status(500).json({ error: 'Falha ao gerar o resumo em PDF.' });
    }
};

// Baixar o PDF
export const downloadSummaryPdf = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const pdfInfo = await saleswomanService.getSummaryPdfPath(id);
        if (!pdfInfo) {
            return res.status(404).json({ error: 'Nenhum resumo em PDF encontrado para esta vendedora.' });
        }
        res.download(pdfInfo.path, pdfInfo.name);
    } catch (error) {
        res.status(500).send('Não foi possível descarregar o PDF.');
    }
};