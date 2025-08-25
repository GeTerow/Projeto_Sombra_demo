import React from 'react';
import type { Task } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon'; // Importar o ícone

interface CallSummaryCardProps {
  call: Task;
  onClick: () => void;
}

export const CallSummaryCard: React.FC<CallSummaryCardProps> = ({ call, onClick }) => {
  const hasAnalysis = call.status === 'COMPLETED' && call.analysis;
  const hasFailed = call.status === 'FAILED';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-500 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
      aria-label={`Ver detalhes da análise com ${call.clientName}`}
    >
      <div className="flex flex-col justify-between h-full">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white text-base truncate" title={call.clientName}>
            {call.clientName}
          </h4>
          {/* AVISO DE ANÁLISE CONCLUÍDA OU FALHA */}
          {hasAnalysis && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="w-4 h-4" />
              <span>Análise concluída</span>
            </div>
          )}
          {hasFailed && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600 dark:text-rose-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
              <span>Falha na análise</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span>{new Date(call.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
          
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${hasAnalysis ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400'}`}>
            Ver Detalhes
          </span>
        </div>
      </div>
    </button>
  );
};