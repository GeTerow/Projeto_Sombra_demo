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
  const { name, email } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'O campo "name" é obrigatório.' });
  }

  try {
    const newSaleswoman = await saleswomanService.createSaleswoman(name, email);
    res.status(201).json(newSaleswoman);
  } catch (error) {
    if (error instanceof Error && error.message.includes('E-mail já está em uso')) {
      return res.status(409).json({ error: error.message });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Uma vendedora com este nome já existe.' });
    }
    res.status(500).json({ error: 'Falha ao criar vendedora.' });
  }
};

export const updateSaleswoman = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email } = req.body;

  const updateData: { name?: string; email?: string } = {};
  if (name) updateData.name = name;
  if (email !== undefined) updateData.email = email;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'Nenhum dado para atualizar foi fornecido.' });
  }

  try {
    const updatedSaleswoman = await saleswomanService.updateSaleswoman(id, updateData);
    res.status(200).json(updatedSaleswoman);
  } catch (error) {
    if (error instanceof Error && error.message.includes('E-mail já está em uso')) {
      return res.status(409).json({ error: error.message });
    }
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
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Falha ao deletar vendedora.' });
  }
};

export const generateSummaryPdf = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { force } = req.body;

    try {
        const updatedSaleswoman = await saleswomanService.generateOnDemandSummary(id, force);
        res.status(201).json(updatedSaleswoman);
    } catch (error: any) {
        if (error.statusCode) {
            const payload: any = { error: error.message };
            if (error.confirmationRequired) {
                payload.confirmationRequired = true;
                payload.message = error.message;
            }
            return res.status(error.statusCode).json(payload);
        }
        res.status(500).json({ error: 'Falha ao gerar o resumo em PDF.' });
    }
};

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