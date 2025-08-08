import { PrismaClient, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Dados das vendedoras
const saleswomenData = [
  {
    name: 'Beatriz Costa',
    summaryPdfPath: 'path/to/summary-beatriz.pdf', // Exemplo de PDF
    summaryLastGeneratedAt: new Date(new Date().setDate(new Date().getDate() - 1)), // Ontem
  },
  {
    name: 'Carla Dias',
    summaryPdfPath: null, // Sem PDF gerado
    summaryLastGeneratedAt: null,
  },
  {
    name: 'Mariana Lima',
    summaryPdfPath: 'path/to/summary-mariana.pdf',
    summaryLastGeneratedAt: new Date(), // Hoje
    summaryGenerationsToday: 1,
    summaryLastGenerationDate: new Date(),
  },
];

// Dados das tarefas de exemplo
const tasksBySaleswoman: { [key: string]: any[] } = {
  'Beatriz Costa': [
    {
      clientName: 'Alpha Tech',
      status: TaskStatus.COMPLETED,
      audioFilePath: 'mock/audio1.mp3',
      transcription: 'WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nBeatriz: Olá, falo da Super Vendas, como posso ajudar o time da Alpha Tech hoje?',
      analysis: '### Análise Detalhada\n\nA vendedora **Beatriz Costa** foi proativa e personalizou a abordagem inicial. \n\n**Pontos Fortes:**\n- Excelente rapport.\n- Comunicação clara.\n\n**Pontos de Melhoria:**\n- Poderia explorar mais as dores do cliente.',
    },
    {
      clientName: 'Inova Soluções',
      status: TaskStatus.PROCESSING,
      audioFilePath: 'mock/audio2.mp3',
    },
  ],
  'Carla Dias': [
    {
      clientName: 'Beta Company',
      status: TaskStatus.PENDING,
      audioFilePath: 'mock/audio3.mp3',
    },
    {
      clientName: 'Gama Corp',
      status: TaskStatus.FAILED,
      audioFilePath: 'mock/audio4.mp3',
      analysis: 'Falha na análise: Áudio com ruído excessivo.',
    },
     {
      clientName: 'Ômega Inc.',
      status: TaskStatus.COMPLETED,
      audioFilePath: 'mock/audio5.mp3',
      transcription: 'WEBVTT\n\n00:00:02.000 --> 00:00:06.000\nCarla: Bom dia! Recebemos seu contato sobre a plataforma.',
      analysis: '### Análise Detalhada\n\nCarla foi direta e respondeu bem às perguntas do cliente. \n\n**Pontos Fortes:**\n- Conhecimento do produto.\n\n**Pontos de Melhoria:**\n- Aumentar o tempo de escuta ativa.',
    },
  ],
  'Mariana Lima': [
     {
      clientName: 'Delta Systems',
      status: TaskStatus.COMPLETED,
      audioFilePath: 'mock/audio6.mp3',
      transcription: 'WEBVTT\n\n00:00:00.500 --> 00:00:04.500\nMariana: Olá, da Delta Systems? Meu nome é Mariana.',
      analysis: '### Análise da Chamada\n\nMariana estabeleceu uma boa conexão inicial, usando uma abordagem amigável e profissional.\n\n**Pontos Fortes:**\n- Tom de voz positivo.\n- Habilidade em criar um ambiente confortável para o cliente.',
    },
  ]
};


async function main() {
  console.log('Iniciando o processo de seeding...');

  // 1. Limpa o banco de dados para evitar registros duplicados
  console.log('Limpando dados antigos...');
  await prisma.task.deleteMany();
  await prisma.saleswoman.deleteMany();

  // 2. Cria as vendedoras e suas tarefas associadas
  console.log('Criando novos dados...');
  for (const swData of saleswomenData) {
    const saleswoman = await prisma.saleswoman.create({
      data: {
        name: swData.name,
        summaryPdfPath: swData.summaryPdfPath,
        summaryLastGeneratedAt: swData.summaryLastGeneratedAt,
        summaryGenerationsToday: swData.summaryGenerationsToday,
        summaryLastGenerationDate: swData.summaryLastGenerationDate,
      },
    });
    console.log(`- Vendedora criada: ${saleswoman.name} (ID: ${saleswoman.id})`);

    const tasks = tasksBySaleswoman[saleswoman.name] || [];
    for (const taskData of tasks) {
      await prisma.task.create({
        data: {
          ...taskData,
          saleswomanId: saleswoman.id,
        },
      });
      console.log(`  - Tarefa criada para o cliente: ${taskData.clientName}`);
    }
  }

  console.log('Seeding finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('Ocorreu um erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });