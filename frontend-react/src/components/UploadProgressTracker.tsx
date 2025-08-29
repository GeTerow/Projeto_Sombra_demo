import React, { useState } from 'react';
import { Task } from '../types/types';
import { TaskProgressItem } from './TaskProgressItem';
import api from '../services/api';
import { Spinner } from './Spinner';
import { TrashIcon, ListBulletIcon } from './icons';
import { UploadProgressTrackerProps } from '../types/types';

export const UploadProgressTracker: React.FC<UploadProgressTrackerProps> = ({ tasks, isConnected, isAdmin, onDataChanged }) => {
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanupMessage, setCleanupMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleDeleteFailedTasks = async () => {
        if (!window.confirm('Tem a certeza de que pretende apagar permanentemente todos os áudios com falha? Esta ação não pode ser desfeita.')) {
            return;
        }
        setIsCleaning(true);
        setCleanupMessage(null);
        try {
            const response = await api.delete('/tasks/failed');
            setCleanupMessage({ type: 'success', text: response.data.message });
            onDataChanged();
        } catch (error: any) {
            const message = error.response?.data?.error || 'Ocorreu um erro desconhecido ao apagar as tarefas.';
            setCleanupMessage({ type: 'error', text: message });
        } finally {
            setIsCleaning(false);
            setTimeout(() => setCleanupMessage(null), 5000);
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
                        onClick={handleDeleteFailedTasks}
                        disabled={isCleaning}
                        className="p-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        title="Apagar permanentemente todas as tarefas com falha"
                    >
                        {isCleaning ? <Spinner className="w-4 h-4" /> : <TrashIcon className="w-4 h-4" />}
                        <span>Apagar Falhas</span>
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