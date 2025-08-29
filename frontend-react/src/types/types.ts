export type TaskStatus = 'PENDING' | 'TRANSCRIBING' | 'ALIGNING' | 'DIARIZING' | 'TRANSCRIBED' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
export type StageKey = 'opening' | 'discovery' | 'qualification' | 'closing';

// Sub-tipo para cada estágio da performance
export interface StageAnalysis {
  score: number;
  feedback: string;
  improvementSuggestion: string;
}

// Sub-tipo para o perfil do cliente
export interface CustomerProfile {
  name: string;
  profile: string;
  communicationStyle: string;
}

// Sub-tipo para os pontos de melhoria
export interface ImprovementPoint {
  salespersonLine: string;
  context: string;
  suggestion: string;
}

// Interface principal e completa da Análise da IA
export interface Analysis {
  summary: string;
  customerProfile: CustomerProfile;
  performance: {
    overallScore: number;
    stages: {
      opening: StageAnalysis;
      discovery: StageAnalysis;
      qualification: StageAnalysis;
      closing: StageAnalysis;
    };
  };
  improvementPoints: ImprovementPoint[];
}

export interface Saleswoman {
  id: string;
  name: string;
  email?: string | null;
  summaryPdfPath?: string | null;
  summaryLastGeneratedAt?: string | null;
  summaryGenerationsToday?: number | string;
  summaryLastGenerationDate?: string | null;
}

export interface Task {
  subject: any;
  id: string;
  saleswomanId: string;
  saleswoman?: Saleswoman;
  clientName: string;
  status: TaskStatus;
  audioFilePath: string;
  transcription: string | null;
  analysis: Analysis | null;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}