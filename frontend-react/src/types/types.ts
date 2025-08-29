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

export type ToastType = 'success' | 'error' | 'info';

export type BadgeColor = 'slate' | 'green' | 'amber' | 'indigo';


export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type ConfigFormData = {
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
};

export type ScheduleMode = 'weekdays' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface StatusIndicatorProps {
  status: Task['status'];
  hasAnalysis: boolean;
}

export interface CallSummaryCardProps {
  call: Task;
  onClick: () => void;
}

export interface SaleswomenDashboardProps {
  onSelectCall: (callId: string) => void;
  onDataChanged: () => void;
}

export interface AddSaleswomanModalProps {
  onClose: () => void;
  onSaleswomanAdded: (newSaleswoman: Saleswoman) => void;
}

export interface EditSaleswomanModalProps {
  saleswoman: Saleswoman;
  onClose: () => void;
  onSaleswomanUpdated: (updatedSaleswoman: Saleswoman) => void;
}

export interface TranscriptionCue {
  speaker: string;
  timestamp: string;
  text: string;
}

export interface FormattedTranscriptionProps {
  vttContent: string | null;
}

export interface UploadProgressTrackerProps {
    tasks: Task[];
    isConnected: boolean;
    isAdmin?: boolean;
    onDataChanged: () => void;
}

export interface TaskProgressItemProps {
  task: Task;
}

export interface LoginPageProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export type View =
    | { name: 'upload' }
    | { name: 'dashboard' }
    | { name: 'analysis', callId: string }
    | { name: 'settings' }
    | { name: 'users' };

export type Theme = 'light' | 'dark';

export interface AddUserModalProps {
  onClose: () => void;
  onUserAdded: (newUser: User) => void;
}

export interface AnalysisDetailPageProps {
  callId: string;
  onBack: () => void;
}

export interface ConfirmModalProps {
    open: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export interface Props {
  saleswoman: Saleswoman;
  onClose: () => void;
  onSaleswomanUpdated: (updatedSaleswoman: Saleswoman) => void;
}

export interface SidebarProps {
  currentView: View;
  onViewChange: (view: 'upload' | 'dashboard' | 'settings' | 'users') => void;
  onLogout: () => void;
  user: any;
  theme: Theme;
  onThemeToggle: () => void;
}