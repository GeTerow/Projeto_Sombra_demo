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

export interface TaskAnalysis {
  speakerIdentification: SpeakerIdentification;
  crucialMoments: CrucialMoment[];
  overallFeedback: OverallFeedback;
}