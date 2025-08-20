import { Request, Response, NextFunction } from 'express';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export const authenticateWorker = (req: Request, res: Response, next: NextFunction) => {
  if (!INTERNAL_API_KEY) {
    console.error('INTERNAL_API_KEY não está definido nas variáveis de ambiente.');
    return res.status(500).json({ error: 'Erro de configuração interna do servidor.' });
  }

  const apiKey = req.headers['x-internal-api-key'];

  if (!apiKey || apiKey !== INTERNAL_API_KEY) {
    return res.status(403).json({ error: 'Acesso negado. Chave de API interna inválida.' });
  }

  next();
};