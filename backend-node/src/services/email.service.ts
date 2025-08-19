import nodemailer from 'nodemailer';
import { Saleswoman } from '@prisma/client';
import { getAllConfigs } from './config.service';
import { IEmailOptions } from '../common/interfaces/IEmailOptions'; 

async function sendEmail(options: IEmailOptions) {
  const config = await getAllConfigs();

  if (
    !config.SMTP_HOST ||
    !config.SMTP_PORT ||
    !config.SMTP_USER ||
    !config.SMTP_PASS ||
    !config.SMTP_FROM
  ) {
    console.error('[EmailService] As configurações de SMTP não estão completas. O e-mail não será enviado.');
    throw new Error('Configuração de SMTP incompleta no servidor.');
  }
  
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: parseInt(config.SMTP_PORT, 10),
    secure: parseInt(config.SMTP_PORT, 10) === 465,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `Projeto Sombra <${config.SMTP_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] E-mail enviado com sucesso para ${options.to}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[EmailService] Falha ao enviar e-mail para ${options.to}:`, error);
    throw error;
  }
}

export const sendSummaryEmail = async (saleswoman: Saleswoman, pdfPath: string) => {
  if (!saleswoman.email) {
    console.warn(`[EmailService] Vendedora ${saleswoman.name} não possui e-mail cadastrado. E-mail não enviado.`);
    return;
  }

  const emailHtml = `
    <h1>Olá, ${saleswoman.name}!</h1>
    <p>Seu resumo de desempenho semanal está pronto!</p>
    <p>Anexamos o relatório em PDF para sua análise. Continue com o excelente trabalho!</p>
    <br>
    <p>Atenciosamente,</p>
    <p><b>Equipe Projeto Sombra</b></p>
  `;

  await sendEmail({
    to: saleswoman.email,
    subject: 'Seu Resumo de Desempenho Semanal - Projeto Sombra',
    html: emailHtml,
    attachments: [
      {
        filename: `Resumo_Desempenho_${saleswoman.name.replace(/\s+/g, '_')}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf',
      },
    ],
  });
};

export const sendTestEmail = async (testEmail: string) => {
  const emailHtml = `
    <h1>Teste de Envio de E-mail</h1>
    <p>Olá!</p>
    <p>Este é um e-mail de teste enviado a partir da sua configuração no Projeto Sombra.</p>
    <p>Se você recebeu esta mensagem, suas configurações de SMTP estão funcionando corretamente.</p>
    <br>
    <p>Atenciosamente,</p>
    <p><b>Equipe Projeto Sombra</b></p>
  `;

  await sendEmail({
    to: testEmail,
    subject: '✅ Teste de Configuração de E-mail - Projeto Sombra',
    html: emailHtml,
    attachments: [], // Sem anexos para o e-mail de teste
  });
};