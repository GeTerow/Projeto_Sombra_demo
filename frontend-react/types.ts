export type TaskStatus = 'PENDING' | 'TRANSCRIBING' | 'ALIGNING' | 'DIARIZING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

// --- NOVA ESTRUTURA DA ANÁLISE ---

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

// --- FIM DA NOVA ESTRUTURA ---


export interface Saleswoman {
  id: string;
  name: string;
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
  analysis: Analysis | null; // Agora usará a nova estrutura de Análise
  createdAt: string;
  updatedAt: string;
}