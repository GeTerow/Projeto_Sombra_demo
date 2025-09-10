import { prisma } from '../lib/prisma';
import { Prisma, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (): Promise<Omit<User, 'password'>[]> => {
  const users = await prisma.user.findMany({
    orderBy: {
      name: 'asc',
    },
  });
  return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
};

export const createUser = async (
  data: Prisma.UserCreateInput
): Promise<Omit<User, 'password'>> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('Já existe um usuário com este e-mail.');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });

  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};