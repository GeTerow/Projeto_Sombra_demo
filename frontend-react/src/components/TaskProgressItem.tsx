import React from 'react';
import type { TaskProgressItemProps } from '../types/types';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from './icons';
import { ProcessingSpinner } from './ui';

export const TaskProgressItem: React.FC<TaskProgressItemProps> = ({ task }) => {
    
    const getStatusInfo = () => {
        switch (task.status) {
            case 'PENDING':
                return { icon: <ClockIcon className="w-5 h-5 text-slate-400" />, label: 'Na fila', progress: '5%', bgColor: 'bg-slate-400' };
            case 'TRANSCRIBING':
                return { icon: <ProcessingSpinner />, label: 'Transcrevendo', progress: '25%', bgColor: 'bg-sky-500' };
            case 'ALIGNING':
                return { icon: <ProcessingSpinner />, label: 'Alinhando', progress: '50%', bgColor: 'bg-sky-500' };
            case 'DIARIZING':
                return { icon: <ProcessingSpinner />, label: 'Identificando', progress: '75%', bgColor: 'bg-sky-500' };
            case 'TRANSCRIBED':
                return { icon: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />, label: 'Concluído', progress: '100%', bgColor: 'bg-emerald-500' };
            case 'ANALYZING':
                return { icon: <ProcessingSpinner />, label: 'Análise com IA', progress: '90%', bgColor: 'bg-indigo-500' };
            case 'COMPLETED':
                return { icon: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />, label: 'Concluído', progress: '100%', bgColor: 'bg-emerald-500' };
            case 'FAILED':
                return { icon: <ExclamationTriangleIcon className="w-5 h-5 text-rose-500" />, label: 'Falhou', progress: '100%', bgColor: 'bg-rose-500' };
            default:
                return { icon: <ExclamationTriangleIcon className="w-5 h-5 text-rose-500" />, label: 'Desconhecido', progress: '100%', bgColor: 'bg-rose-500' };
        }
    };

    const { icon, label, progress, bgColor } = getStatusInfo();
    
    const statusColor = ['COMPLETED', 'TRANSCRIBED'].includes(task.status) ? 'text-emerald-600 dark:text-emerald-400' :
                        task.status === 'FAILED' ? 'text-rose-600 dark:text-rose-400' :
                        'text-slate-500 dark:text-slate-400';

    return (
        <li className="p-3 bg-white/50 dark:bg-slate-800/30 rounded-lg border border-slate-200/80 dark:border-slate-700/50">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate" title={task.clientName}>
                        {task.clientName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Vendedora: {task.saleswoman?.name || '...'}
                    </p>
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium ${statusColor}`}>
                    {icon}
                    <span>{label}</span>
                </div>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div 
                    className={`h-1.5 rounded-full ${bgColor} transition-all duration-500 ease-out ${!['COMPLETED', 'FAILED', 'TRANSCRIBED'].includes(task.status) ? 'animate-pulse' : ''}`} 
                    style={{ width: progress }}
                ></div>
            </div>
        </li>
    );
};