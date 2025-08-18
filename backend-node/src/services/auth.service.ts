import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export const loginUser = async (email: string, password_plain: string): Promise<{ token: string; user: Omit<User, 'password'> }> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Credenciais inválidas.');
  }

  const isPasswordValid = await bcrypt.compare(password_plain, user.password);

  if (!isPasswordValid) {
    throw new Error('Credenciais inválidas.');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
    throw new Error('Erro de configuração do servidor.');
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: '24h',
  });

  const { password, ...userWithoutPassword } = user;

  return {
    token,
    user: userWithoutPassword,
  };
};