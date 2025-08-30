import { Request, Response } from 'express';
import * as saleswomanService from '../services/saleswoman.service';

const DEMO_ERROR_RESPONSE = {
  error: 'Funcionalidade desabilitada na versão de demonstração pública.',
};

export const listSaleswomen = async (req: Request, res: Response) => {
  try {
    const saleswomen = await saleswomanService.getAllSaleswomen();
    res.status(200).json(saleswomen);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar a lista de vendedoras.' });
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
        res.status(500).send('Não foi possível carregar o PDF no modo de demonstração.');
    }
};

export const createNewSaleswoman = async (req: Request, res: Response) => {
  res.status(403).json(DEMO_ERROR_RESPONSE);
  /*
  // --- LÓGICA ORIGINAL ---
  const { name, email } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'O campo "name" é obrigatório.' });
  }
  try {
    const newSaleswoman = await saleswomanService.createSaleswoman(name, email);
    res.status(201).json(newSaleswoman);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Uma vendedora com este nome ou e-mail já existe.' });
    }
    res.status(500).json({ error: 'Falha ao criar vendedora.' });
  }
  */
};

export const updateSaleswoman = async (req: Request, res: Response) => {
  res.status(403).json(DEMO_ERROR_RESPONSE);
};

export const deleteSaleswoman = async (req: Request, res: Response) => {
  res.status(403).json(DEMO_ERROR_RESPONSE);
};

export const generateSummaryPdf = async (req: Request, res: Response) => {
  res.status(403).json(DEMO_ERROR_RESPONSE);
};

export const sendSummaryEmail = async (req: Request, res: Response) => {
  res.status(403).json(DEMO_ERROR_RESPONSE);
};