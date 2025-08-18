// backend-node/src/common/middlewares/auth.middleware.ts

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IAuthRequest, ITokenPayload } from '../interfaces/IAuth';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticateToken = (req: IAuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

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