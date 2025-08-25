// src/components/CallSummaryCard.tsx

import React from 'react';
// Para este exemplo, vou definir o tipo 'Task' aqui.
// No seu projeto, você continuaria a importá-lo de '../types'.
export type Task = {
  id: string;
  clientName: string;
  createdAt: string; // ou Date
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  analysis?: any; // Defina um tipo mais específico se tiver
};

// --- Ícones ---
// É uma boa prática manter os ícones como componentes para consistência.
// Se eles não forem usados em outros lugares, podem ficar aqui.

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-7.5 12h13.5" />
  </svg>
);

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);

const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
  </svg>
);


// --- Componente Interno para Lógica de Status ---
// Este componente isola a responsabilidade de renderizar o status.
// Fica mais fácil de ler e modificar a lógica de status aqui.

interface StatusIndicatorProps {
  status: Task['status'];
  hasAnalysis: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, hasAnalysis }) => {
  if (status === 'COMPLETED' && hasAnalysis) {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircleIcon className="w-4 h-4" />
        <span>Análise concluída</span>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
        <XCircleIcon className="w-4 h-4" />
        <span>Falha na análise</span>
      </div>
    );
  }

  return null; // Não renderiza nada para outros status
};


// --- Constantes de Estilo ---
// Extrair classes longas do Tailwind para constantes melhora a legibilidade do JSX.

const cardBaseClasses = "w-full text-left bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50";
const cardInteractionClasses = "transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50";

const detailsBadgeBaseClasses = "text-xs font-semibold px-2.5 py-1 rounded-full";
const detailsBadgeDefaultClasses = "bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400";
const detailsBadgeCompletedClasses = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";


// --- Componente Principal Exportado ---

interface CallSummaryCardProps {
  call: Task;
  onClick: () => void;
}

export const CallSummaryCard: React.FC<CallSummaryCardProps> = ({ call, onClick }) => {
  const hasAnalysis = call.status === 'COMPLETED' && !!call.analysis;

  // Lógica para determinar qual estilo de "badge" usar
  const detailsBadgeClasses = `${detailsBadgeBaseClasses} ${hasAnalysis ? detailsBadgeCompletedClasses : detailsBadgeDefaultClasses}`;

  return (
    <button
      onClick={onClick}
      className={`${cardBaseClasses} ${cardInteractionClasses}`}
      aria-label={`Ver detalhes da análise com ${call.clientName}`}
    >
      <div className="flex flex-col justify-between h-full">
        {/* Seção Superior: Nome e Status */}
        <div>
          <h4
            className="font-bold text-slate-800 dark:text-white text-base truncate"
            title={call.clientName}
          >
            {call.clientName}
          </h4>
          <StatusIndicator status={call.status} hasAnalysis={hasAnalysis} />
        </div>

        {/* Seção Inferior: Data e Ação */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span>{new Date(call.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>

          <span className={detailsBadgeClasses}>
            Detalhes
          </span>
        </div>
      </div>
    </button>
  );
};