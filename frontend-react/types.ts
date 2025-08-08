export type TaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Saleswoman {
  id: string;
  name: string;
  // Novos campos adicionados
  summaryPdfPath?: string | null;
  summaryLastGeneratedAt?: string | null;
  summaryGenerationsToday?: number;
  summaryLastGenerationDate?: string | null;
}

export interface Task {
  id: string;
  saleswomanId: string;
  saleswoman?: Saleswoman;
  clientName: string;
  status: TaskStatus;
  audioFilePath: string;
  transcription: string | null;
  analysis: string | null;
  createdAt: string;
  updatedAt: string;
}