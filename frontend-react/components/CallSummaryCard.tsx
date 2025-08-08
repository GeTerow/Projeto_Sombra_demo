import React from 'react';
import type { Task } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';

interface CallSummaryCardProps {
  call: Task;
  onClick: () => void;
}

export const CallSummaryCard: React.FC<CallSummaryCardProps> = ({ call, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-500 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
      aria-label={`Ver detalhes da análise com ${call.clientName}`}
    >
      <div className="flex flex-col justify-between h-full">
        {/* Nome do Cliente */}
        <h4 className="font-bold text-slate-800 dark:text-white text-base truncate" title={call.clientName}>
          {call.clientName}
        </h4>

        {/* Informações inferiores */}
        <div className="flex justify-between items-center mt-4">
           {/* Data da Chamada */}
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span>
              {new Date(call.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
          
           {/* Botão de Ação */}
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-500/20 px-2.5 py-1 rounded-full">
            Detalhes
          </span>
        </div>
      </div>
    </button>
  );
};