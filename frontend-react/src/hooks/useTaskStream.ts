import { useState, useEffect, useRef } from 'react';
import type { Task } from '@/types/types';
import { API_URL } from '@/config';

export const useTaskStream = (isAuthenticated: boolean) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const removalTimers = useRef(new Map<string, number>());

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        const eventSource = new EventSource(`${API_URL}/tasks/stream?token=${localStorage.getItem('authToken')}`);

        eventSource.onopen = () => setIsConnected(true);

        eventSource.onmessage = (event) => {
            try {
                const updatedTask = JSON.parse(event.data) as Task;
                if (updatedTask.id) {
                    // Limpa timer de remoção se uma nova atualização chegar
                    if (removalTimers.current.has(updatedTask.id)) {
                        clearTimeout(removalTimers.current.get(updatedTask.id));
                        removalTimers.current.delete(updatedTask.id);
                    }

                    setTasks(prevTasks => {
                        const existingTaskIndex = prevTasks.findIndex(t => t.id === updatedTask.id);
                        if (existingTaskIndex !== -1) {
                            const newTasks = [...prevTasks];
                            newTasks[existingTaskIndex] = updatedTask;
                            return newTasks;
                        } else {
                            return [...prevTasks, updatedTask];
                        }
                    });

                    // Agenda a remoção da tarefa da lista após um tempo se ela estiver concluída
                    if (updatedTask.status === 'COMPLETED' || updatedTask.status === 'TRANSCRIBED') {
                        const timerId = window.setTimeout(() => {
                            setTasks(currentTasks => currentTasks.filter(t => t.id !== updatedTask.id));
                            removalTimers.current.delete(updatedTask.id);
                        }, 60000); // 1 minuto
                        removalTimers.current.set(updatedTask.id, timerId);
                    }
                }
            } catch (error) {
                console.error("Failed to parse SSE event data:", error);
            }
        };

        eventSource.onerror = () => {
            setIsConnected(false);
            eventSource.close();
        };

        return () => {
            eventSource.close();
            removalTimers.current.forEach(timerId => clearTimeout(timerId));
            removalTimers.current.clear();
        };
    }, [isAuthenticated]);

    return { tasks, isConnected, setTasks };
};