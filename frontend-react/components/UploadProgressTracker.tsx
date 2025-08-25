import React, { useState } from 'react';
import { Task } from '../types';
import { TaskProgressItem } from './TaskProgressItem';
import api from '../src/services/api';
import { Spinner } from './Spinner';

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const ListBulletIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>;

interface UploadProgressTrackerProps {
    tasks: Task[];
    isConnected: boolean;
    isAdmin?: boolean;
}

export const UploadProgressTracker: React.FC<UploadProgressTrackerProps> = ({ tasks, isConnected, isAdmin }) => {
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanupMessage, setCleanupMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleClearStaleTasks = async () => {
        if (!window.confirm('Tem a certeza de que pretende forçar a limpeza de tarefas obsoletas? Esta ação irá marcar como "FALHADAS" as tarefas que estão em processamento há mais de uma hora.')) {
            return;
        }
        setIsCleaning(true);
        setCleanupMessage(null);
        try {
            const response = await api.post('/tasks/clear-stale');
            setCleanupMessage({ type: 'success', text: response.data.message });
        } catch (error: any) {
            const message = error.response?.data?.error || 'Ocorreu um erro desconhecido.';
            setCleanupMessage({ type: 'error', text: message });
        } finally {
            setIsCleaning(false);
        }
    };

    return (
        <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    Progresso dos Envios
                </h3>
                {isAdmin && (
                    <button
                        onClick={handleClearStaleTasks}
                        disabled={isCleaning}
                        className="p-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        title="Forçar limpeza de tarefas obsoletas"
                    >
                        {isCleaning ? <Spinner className="w-4 h-4" /> : <TrashIcon className="w-4 h-4" />}
                        <span>Limpar</span>
                    </button>
                )}
            </div>
            {cleanupMessage && (
                <div className={`p-2 mb-4 text-sm rounded-md ${cleanupMessage.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'}`}>
                    {cleanupMessage.text}
                </div>
            )}
            {tasks.length > 0 ? (
                <div className="pr-2 -mr-4">
                    <ul className="space-y-3">
                        {tasks.map(task => (
                            <TaskProgressItem key={task.id} task={task} />
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-center py-8 px-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-lg h-full flex flex-col justify-center">
                    <ListBulletIcon className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Os envios em andamento aparecerão aqui.
                    </p>
                </div>
            )}
            {!isConnected && tasks.length > 0 && (
                <p className="text-xs text-center mt-4 text-amber-600 dark:text-amber-400">
                    Conexão perdida. As atualizações estão pausadas.
                </p>
            )}
        </div>
    );
};