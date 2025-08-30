import { Request, Response } from 'express';
import * as configService from '../services/config.service';
import * as emailService from '../services/email.service';
import { startOrRestartScheduler } from '../scheduler';

export const getConfigurations = async (req: Request, res: Response) => {
  try {
    const config = await configService.getAllConfigs();
    // Não expor chaves sensíveis, mesmo que o frontend precise delas para salvar.
    // O frontend pode mostrar "••••••••" se a chave já estiver salva.
    if (config.OPENAI_API_KEY) config.OPENAI_API_KEY = "********";
    if (config.HF_TOKEN) config.HF_TOKEN = "********";
    
    res.status(200).json(config);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar configurações.' });
  }
};

export const updateConfigurations = async (req: Request, res: Response) => {
  try {
    const currentConfig = await configService.getAllConfigs();
    const newConfig = req.body;

    if (newConfig.OPENAI_API_KEY === "********") {
      newConfig.OPENAI_API_KEY = currentConfig.OPENAI_API_KEY;
    }
    if (newConfig.HF_TOKEN === "********") {
      newConfig.HF_TOKEN = currentConfig.HF_TOKEN;
    }
    
    await configService.updateAllConfigs(newConfig);

    await startOrRestartScheduler(); 
    
    res.status(200).json({ message: 'Configurações atualizadas com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao atualizar configurações.' });
  }
};

export const sendTestEmail = async (req: Request, res: Response) => {
  const { testEmail } = req.body;

  if (!testEmail) {
    return res.status(400).json({ error: 'O campo "testEmail" é obrigatório.' });
  }

  try {
    await emailService.sendTestEmail(testEmail);
    res.status(200).json({ message: `E-mail de teste enviado com sucesso para ${testEmail}.` });
  } catch (error: any) {
    console.error('[ConfigController] Falha ao enviar e-mail de teste:', error);
    res.status(500).json({ error: 'Falha ao enviar e-mail de teste. Verifique as configurações de SMTP e os logs do servidor.' });
  }
};