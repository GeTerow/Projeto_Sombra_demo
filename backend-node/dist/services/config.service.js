"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAllConfigs = exports.getAllConfigs = void 0;
const prisma_1 = require("../lib/prisma");
const node_crypto_1 = __importDefault(require("node:crypto"));
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    throw new Error('A variável de ambiente ENCRYPTION_KEY não foi definida.');
}
if (ENCRYPTION_KEY.length !== 32) {
    throw new Error('A ENCRYPTION_KEY deve ter exatamente 32 caracteres.');
}
const IV_LENGTH = 16;
function encrypt(text) {
    const iv = node_crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = node_crypto_1.default.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + authTag.toString('hex');
}
function decrypt(text) {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':').split(':')[0], 'hex');
        const authTag = Buffer.from(textParts.join(':').split(':')[1], 'hex');
        const decipher = node_crypto_1.default.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
    catch (error) {
        console.error("Falha ao descriptografar:", error);
        return ""; // Retorna vazio se a descriptografia falhar
    }
}
const encryptedKeys = ['OPENAI_API_KEY', 'HF_TOKEN'];
// Função para buscar todas as configs e formatar como um objeto
const getAllConfigs = async () => {
    const configs = await prisma_1.prisma.configuration.findMany();
    const configObject = {};
    for (const config of configs) {
        let value = config.value;
        if (encryptedKeys.includes(config.key) && value) {
            value = decrypt(value);
        }
        configObject[config.key] = value;
    }
    return configObject;
};
exports.getAllConfigs = getAllConfigs;
// Função para salvar múltiplas configurações
const updateAllConfigs = async (newConfigs) => {
    const transactions = Object.entries(newConfigs).map(([key, value]) => {
        let valueToStore = String(value);
        if (encryptedKeys.includes(key) && value) {
            valueToStore = encrypt(valueToStore);
        }
        return prisma_1.prisma.configuration.upsert({
            where: { key },
            update: { value: valueToStore },
            create: { key, value: valueToStore },
        });
    });
    await prisma_1.prisma.$transaction(transactions);
};
exports.updateAllConfigs = updateAllConfigs;
//# sourceMappingURL=config.service.js.map