import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { Prisma } from '@prisma/client';

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("[UserController] Erro ao listar usuários:", error);
    res.status(500).json({ error: 'Falha ao buscar a lista de usuários.' });
  }
};

export const createNewUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Os campos "name", "email" e "password" são obrigatórios.' });
  }

  try {
    const newUser = await userService.createUser({
      name,
      email,
      password,
      role, // Se o 'role' não for passado, o default 'USER' do schema.prisma será usado
    });
    res.status(201).json(newUser);
  } catch (error: any) {
    // Trata erros conhecidos do Prisma (como e-mail duplicado) e erros do serviço
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Um usuário com este e-mail já existe.' });
    }
    if (error.message.includes('e-mail')) {
        return res.status(409).json({ error: error.message });
    }
    
    console.error("[UserController] Erro ao criar usuário:", error);
    res.status(500).json({ error: 'Falha ao criar usuário.' });
  }
};