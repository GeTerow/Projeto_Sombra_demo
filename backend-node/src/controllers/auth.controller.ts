import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const result = await authService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('Credenciais inválidas')) {
      return res.status(401).json({ error: error.message });
    }
    
    console.error('[AuthController] Erro no login:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno.' });
  }
};