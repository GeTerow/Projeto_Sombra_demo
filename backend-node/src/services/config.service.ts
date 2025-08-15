import { prisma } from '../lib/prisma';
import crypto from 'node:crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_encryption_key_must_be_32_bytes';
if (ENCRYPTION_KEY.length !== 32) {
    throw new Error('A ENCRYPTION_KEY deve ter exatamente 32 caracteres.');
}

const IV_LENGTH = 16;

function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + authTag.toString('hex');
}

function decrypt(text: string): string {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':').split(':')[0], 'hex');
        const authTag = Buffer.from(textParts.join(':').split(':')[1], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Falha ao descriptografar:", error);
        return ""; // Retorna vazio se a descriptografia falhar
    }
}

const encryptedKeys = ['OPENAI_API_KEY', 'HF_TOKEN'];

// Tipos para as configurações esperadas
export interface AppConfig {
  OPENAI_API_KEY: string;
  HF_TOKEN: string;
  OPENAI_ASSISTANT_ID: string;
  WHISPERX_MODEL: 'large-v3' | 'large-v2' | 'base' | 'small' | 'medium';
  DIAR_DEVICE: 'cuda' | 'cpu';
  ALIGN_DEVICE: 'cuda' | 'cpu';
}

// Função para buscar todas as configs e formatar como um objeto
export const getAllConfigs = async (): Promise<Partial<AppConfig>> => {
  const configs = await prisma.configuration.findMany();
  const configObject: Partial<AppConfig> = {};
  
  for (const config of configs) {
    let value = config.value;
    if (encryptedKeys.includes(config.key) && value) {
      value = decrypt(value);
    }
    configObject[config.key as keyof AppConfig] = value as any;
  }
  return configObject;
};

// Função para salvar múltiplas configurações
export const updateAllConfigs = async (newConfigs: Partial<AppConfig>): Promise<void> => {
  const transactions = Object.entries(newConfigs).map(([key, value]) => {
    let valueToStore = String(value);
    if (encryptedKeys.includes(key) && value) {
        valueToStore = encrypt(valueToStore);
    }
    return prisma.configuration.upsert({
      where: { key },
      update: { value: valueToStore },
      create: { key, value: valueToStore },
    });
  });

  await prisma.$transaction(transactions);
};