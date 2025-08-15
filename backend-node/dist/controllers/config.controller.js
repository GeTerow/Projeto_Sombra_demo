"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConfigurations = exports.getConfigurations = void 0;
const configService = __importStar(require("../services/config.service"));
const getConfigurations = async (req, res) => {
    try {
        const config = await configService.getAllConfigs();
        // Não expor chaves sensíveis, mesmo que o frontend precise delas para salvar.
        // O frontend pode mostrar "••••••••" se a chave já estiver salva.
        if (config.OPENAI_API_KEY)
            config.OPENAI_API_KEY = "********";
        if (config.HF_TOKEN)
            config.HF_TOKEN = "********";
        res.status(200).json(config);
    }
    catch (error) {
        res.status(500).json({ error: 'Falha ao buscar configurações.' });
    }
};
exports.getConfigurations = getConfigurations;
const updateConfigurations = async (req, res) => {
    try {
        const currentConfig = await configService.getAllConfigs();
        const newConfig = req.body;
        // Se as chaves sensíveis não forem alteradas, mantenha os valores antigos.
        if (newConfig.OPENAI_API_KEY === "********") {
            newConfig.OPENAI_API_KEY = currentConfig.OPENAI_API_KEY;
        }
        if (newConfig.HF_TOKEN === "********") {
            newConfig.HF_TOKEN = currentConfig.HF_TOKEN;
        }
        await configService.updateAllConfigs(newConfig);
        res.status(200).json({ message: 'Configurações atualizadas com sucesso.' });
    }
    catch (error) {
        res.status(500).json({ error: 'Falha ao atualizar configurações.' });
    }
};
exports.updateConfigurations = updateConfigurations;
//# sourceMappingURL=config.controller.js.map