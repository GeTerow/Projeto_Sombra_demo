import { Prisma, User } from '@prisma/client';
import { mockUsers } from '../lib/mock-data';

export const getAllUsers = async (): Promise<Omit<User, 'password'>[]> => {
  console.log('[DEMO MODE] Retornando lista de usuários mockados.');
  return mockUsers;
  /*
  // --- LÓGICA RIGINAL ---
  const users = await prisma.user.findMany({
    orderBy: {
      name: 'asc',
    },
  });
  return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  */
};

export const createUser = async (
  data: Prisma.UserCreateInput
): Promise<Omit<User, 'password'>> => {
  console.log('[DEMO MODE] Bloqueada tentativa de criar usuário.');
  throw new Error('Funcionalidade desabilitada na versão de demonstração pública.');
  /*
  // --- LÓGICA ORIGINAL ---
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
  */
};