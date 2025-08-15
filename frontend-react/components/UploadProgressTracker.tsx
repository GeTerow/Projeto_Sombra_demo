// frontend-react/components/UploadProgressTracker.tsx

import React from 'react';
import { Task } from '../types';
import { TaskProgressItem } from './TaskProgressItem';

// Ícone para o estado vazio
const ListBulletIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>;

interface UploadProgressTrackerProps {
    tasks: Task[];
    isConnected: boolean;
}

export const UploadProgressTracker: React.FC<UploadProgressTrackerProps> = ({ tasks, isConnected }) => {

    return (
        <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 h-full">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                Progresso dos Envios
            </h3>
            {tasks.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-4">
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