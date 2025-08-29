import React from 'react';
import { Task } from '../types/types';
import { CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon, BeakerIcon } from '../components/icons';



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

  if (status === 'TRANSCRIBED') {
    return (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
            <BeakerIcon className="w-4 h-4" />
            <span>Ainda não analisado</span>
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

  if (status === 'PENDING' || status === 'TRANSCRIBING' || status === 'ANALYZING' || status === 'ALIGNING' || status === 'DIARIZING') {
    return (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-sky-600 dark:text-sky-400">
            <ClockIcon className="w-4 h-4" />
            <span>Em progresso</span>
        </div>
    );
  }


  return null;
};


const cardBaseClasses = "w-full text-left bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50";
const cardInteractionClasses = "transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50";

const detailsBadgeBaseClasses = "text-xs font-semibold px-2.5 py-1 rounded-full";
const detailsBadgeDefaultClasses = "bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400";
const detailsBadgeCompletedClasses = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";


interface CallSummaryCardProps {
  call: Task;
  onClick: () => void;
}

export const CallSummaryCard: React.FC<CallSummaryCardProps> = ({ call, onClick }) => {
  const hasAnalysis = call.status === 'COMPLETED' && !!call.analysis;

  const detailsBadgeClasses = `${detailsBadgeBaseClasses} ${hasAnalysis ? detailsBadgeCompletedClasses : detailsBadgeDefaultClasses}`;

  return (
    <button
      onClick={onClick}
      className={`${cardBaseClasses} ${cardInteractionClasses}`}
      aria-label={`Ver detalhes da análise com ${call.clientName}`}
    >
      <div className="flex flex-col justify-between h-full">
        <div>
          <h4
            className="font-bold text-slate-800 dark:text-white text-base truncate"
            title={call.clientName}
          >
            {call.clientName}
          </h4>
          <StatusIndicator status={call.status} hasAnalysis={hasAnalysis} />
        </div>

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