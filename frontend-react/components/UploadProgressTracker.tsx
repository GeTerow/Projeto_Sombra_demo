import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { API_URL } from '../config';
import { TaskProgressItem } from './TaskProgressItem';

// Ícone para o estado vazio
const ListBulletIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>;

export const UploadProgressTracker: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        const eventSource = new EventSource(`${API_URL}/tasks/stream`);

        eventSource.onopen = () => {
            console.log("SSE Connection opened!");
            setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.message) {
                    console.log("SSE Status:", data.message);
                    return; 
                }

                const updatedTask = data as Task;

                setTasks(prevTasks => {
                    const existingTaskIndex = prevTasks.findIndex(t => t.id === updatedTask.id);
                    if (existingTaskIndex !== -1) {
                        const newTasks = [...prevTasks];
                        newTasks[existingTaskIndex] = updatedTask;
                        return newTasks;
                    } else {
                        return [updatedTask, ...prevTasks];
                    }
                });
            } catch (error) {
                console.error("Failed to parse SSE event data:", error);
            }
        };

        eventSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            setIsConnected(false);
            eventSource.close();
        };
        
        return () => {
            console.log("Closing SSE connection.");
            eventSource.close();
        };

    }, []);

    // --- CORREÇÃO APLICADA AQUI ---
    // Agora, em vez de retornar null, o componente tem seu próprio container
    // e mostra uma mensagem se a lista de tarefas estiver vazia.
    return (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                Progresso dos Envios
            </h3>
            {tasks.length > 0 ? (
                <div className="max-h-60 overflow-y-auto pr-2">
                    <ul className="space-y-3">
                        {tasks.map(task => (
                            <TaskProgressItem key={task.id} task={task} />
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-center py-8 px-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-lg">
                    <ListBulletIcon className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Os envios em andamento aparecerão aqui.
                    </p>
                </div>
            )}
            {!isConnected && tasks.length > 0 && (
                <p className="text-xs text-center mt-2 text-amber-600 dark:text-amber-400">
                    Conexão perdida. As atualizações em tempo real estão pausadas.
                </p>
            )}
        </div>
    );
};