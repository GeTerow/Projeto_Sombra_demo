import * as cron from 'node-cron';
import { Prisma } from '@prisma/client';
import { prisma } from './lib/prisma';
import { sendSummaryEmail } from './services/email.service';
import * as saleswomanService from './services/saleswoman.service';
import { getAllConfigs } from './services/config.service';
import { failStaleTasks } from './services/task.service';

let scheduledTask: cron.ScheduledTask;

async function processSummariesByVolume() {
  console.log('[Scheduler] Iniciando verificação de resumo por volume de tarefas...');
  const configs = await getAllConfigs();
  
  const triggerCount = parseInt(configs.SUMMARY_TRIGGER_COUNT || '5', 10);

  const saleswomen = await prisma.saleswoman.findMany({
    where: { email: { not: null, contains: '@' } },
  });

  for (const saleswoman of saleswomen) {
    const newTasks = await prisma.task.findMany({
      where: {
        saleswomanId: saleswoman.id,
        status: 'COMPLETED',
        includedInSummary: false,
        analysis: { not: Prisma.JsonNull }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Verifica se o número de novas tarefas atingiu o limiar
    if (newTasks.length >= triggerCount) {
      const tasksForSummary = newTasks.slice(0, triggerCount);
      console.log(`[Scheduler] Gerando resumo para ${saleswoman.name} via gatilho de ${triggerCount} novas tarefas.`);
      
      try {
        const newPdfPath = await saleswomanService.generateNewSummaryWithTasks(saleswoman, tasksForSummary);
        await saleswomanService.markTasksAsIncludedInSummary(tasksForSummary.map(t => t.id));
        await sendSummaryEmail(saleswoman, newPdfPath);
      } catch (error) {
        console.error(`[Scheduler] Falha ao processar resumo para ${saleswoman.name}:`, error);
      }
    }
  }
  console.log('[Scheduler] Verificação por volume concluída.');
}

export const startOrRestartScheduler = async () => {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  const config = await getAllConfigs();
  const schedulePattern = config.EMAIL_SCHEDULE || '0 8 * * *'; // 8h da manhã, todo dia

  if (cron.validate(schedulePattern)) {
    scheduledTask = cron.schedule(schedulePattern, processSummariesByVolume, { timezone: "America/Sao_Paulo" });
    console.log(`[Scheduler] Agendador configurado para rodar com o padrão: "${schedulePattern}".`);
  } else {
    // Se o padrão for inválido, usa o default
    scheduledTask = cron.schedule('0 8 * * *', processSummariesByVolume, { timezone: "America/Sao_Paulo" });
    console.error(`[Scheduler] Padrão de agendamento inválido: "${schedulePattern}". Usando o padrão '0 8 * * *'.`);
  }
};

export const startStaleTaskCleanupJob = () => {
  const schedulePattern = '*/30 * * * *'; // A cada 30 minutos
  cron.schedule(schedulePattern, () => {
    console.log('[Scheduler] Executando a verificação de tarefas obsoletas...');
    failStaleTasks();
  }, { timezone: "America/Sao_Paulo" });

  console.log(`[Scheduler] Verificação de tarefas obsoletas agendada para rodar a cada 30 minutos.`);
};