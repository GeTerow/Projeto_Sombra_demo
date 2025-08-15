// Tipos para as configurações
export interface IAppConfig {
  OPENAI_API_KEY: string;
  HF_TOKEN: string;
  OPENAI_ASSISTANT_ID: string;
  WHISPERX_MODEL: 'large-v3' | 'large-v2' | 'base' | 'small' | 'medium';
  DIAR_DEVICE: 'cuda' | 'cpu';
  ALIGN_DEVICE: 'cuda' | 'cpu';
}