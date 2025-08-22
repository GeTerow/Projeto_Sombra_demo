import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('ADVERTÊNCIA: Esta ação é irreversível e removerá TODAS as análises de tarefas do banco de dados.');
  await new Promise(resolve => setTimeout(resolve, 3000)); 
  console.log('Iniciando o processo para limpar todas as análises...');

  try {
    const { count } = await prisma.task.updateMany({
      where: {
        analysis: {
          not: Prisma.JsonNull, 
        },
      },
      data: {
        analysis: Prisma.DbNull,
      },
    });

    console.log(`Operação concluída com sucesso!`);
    console.log(`${count} análises foram removidas.`);

  } catch (error) {
    console.error('Ocorreu um erro ao tentar limpar as análises:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();