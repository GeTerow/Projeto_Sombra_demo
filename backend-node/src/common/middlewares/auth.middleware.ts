import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IAuthRequest, ITokenPayload } from '../interfaces/IAuth';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req: IAuthRequest, res: Response, next: NextFunction) => {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
    return res.status(500).json({ error: 'Erro de configuração interna do servidor.' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Nenhum token fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = user as ITokenPayload;
    next();
  });
};

export const authorizeAdmin = (req: IAuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Acesso negado. Requer permissão de administrador.' });
  }
  next();
};