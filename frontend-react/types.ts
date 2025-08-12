export type TaskStatus = 'PENDING' | 'TRANSCRIBING' | 'ALIGNING' | 'DIARIZING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export interface SpeakerIdentification {
  salesperson: string;
  customer: string;
  reasoning: string;
}

export interface CrucialMoment {
  momentTitle: string;
  salespersonLine: string;
  problem: string;
  improvement: string;
  suggestedLine: string;
}

export interface OverallFeedback {
  summary: string;
}

export interface Analysis {
  speakerIdentification: SpeakerIdentification;
  crucialMoments: CrucialMoment[];
  overallFeedback: OverallFeedback;
}

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
  analysis: Analysis | null;
  createdAt: string;
  updatedAt: string;
}