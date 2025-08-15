import React from 'react';
import type { Task, TaskStatus } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon'; // CORREÇÃO: Importado do local correto

// Ícones para os diferentes status
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ExclamationCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
const ProcessingSpinner: React.FC = () => <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>;


interface TaskProgressItemProps {
  task: Task;
}

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
                return { icon: <ProcessingSpinner />, label: 'Identificando falantes', progress: '75%', bgColor: 'bg-sky-500' };
            case 'ANALYZING':
                return { icon: <ProcessingSpinner />, label: 'Análise com IA', progress: '90%', bgColor: 'bg-indigo-500' };
            case 'COMPLETED':
                return { icon: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />, label: 'Concluído', progress: '100%', bgColor: 'bg-emerald-500' };
            case 'FAILED':
                return { icon: <ExclamationCircleIcon className="w-5 h-5 text-rose-500" />, label: 'Falhou', progress: '100%', bgColor: 'bg-rose-500' };
            default:
                const exhaustiveCheck: never = task.status;
                return { icon: <ExclamationCircleIcon className="w-5 h-5 text-rose-500" />, label: 'Status Desconhecido', progress: '100%', bgColor: 'bg-rose-500' };
        }
    };

    const { icon, label, progress, bgColor } = getStatusInfo();
    
    const statusColor = task.status === 'COMPLETED' ? 'text-emerald-600 dark:text-emerald-400' :
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
                    className={`h-1.5 rounded-full ${bgColor} transition-all duration-500 ease-out ${!['COMPLETED', 'FAILED'].includes(task.status) ? 'animate-pulse' : ''}`} 
                    style={{ width: progress }}
                ></div>
            </div>
        </li>
    );
};