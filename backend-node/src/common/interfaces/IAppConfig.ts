export interface IAppConfig {
  OPENAI_API_KEY: string;
  HF_TOKEN: string;
  OPENAI_ASSISTANT_ID: string;
  WHISPERX_MODEL: 'large-v3' | 'large-v2' | 'base' | 'small' | 'medium';
  DIAR_DEVICE: 'cuda' | 'cpu';
  ALIGN_DEVICE: 'cuda' | 'cpu';
  
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  EMAIL_SCHEDULE: string;

  SUMMARY_TRIGGER_COUNT: string;
}