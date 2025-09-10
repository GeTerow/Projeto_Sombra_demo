import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/services/api';
import type { Task, Analysis } from '@/types/types';
import { API_URL } from '@/config';

// Helper para garantir que a análise tem o formato novo e completo (não é mais usado, mas mantido para compatibilidade)
const isNewAnalysis = (a: any): a is Analysis => {
  return (
    a && typeof a === 'object' &&
    'summary' in a &&
    'customerProfile' in a &&
    a.customerProfile && 'name' in a.customerProfile &&
    'performance' in a &&
    a.performance && 'overallScore' in a.performance &&
    'improvementPoints' in a && Array.isArray(a.improvementPoints)
  );
};

export const useAnalysisDetail = (callId: string) => {
    const [call, setCall] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'summary' | 'details'>('summary');

    useEffect(() => {
        const fetchTask = () => {
            api
                .get<Task>(`/tasks/${callId}`)
                .then((response) => setCall(response.data))
                .catch(() => setError('Não foi possível carregar os detalhes da análise.'))
                .finally(() => setIsLoading(false));
        };

        fetchTask();

        const eventSource = new EventSource(`${API_URL}/tasks/stream?token=${localStorage.getItem('authToken')}`);
        eventSource.onmessage = (event) => {
            try {
                const updatedTask = JSON.parse(event.data) as Task;
                if (updatedTask.id === callId) {
                    setCall(updatedTask);
                }
            } catch (e) {
                console.error("Falha ao processar evento SSE:", e);
            }
        };

        return () => eventSource.close();
    }, [callId]);

    const handleRequestAnalysis = useCallback(async () => {
        if (!call) return;
        setError(null);
        try {
            await api.post(`/tasks/${call.id}/analyze`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Falha ao iniciar a análise.');
        }
    }, [call]);

    const handleCopy = useCallback(async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Falha ao copiar:', err);
        }
    }, []);

    const handleDownloadVTT = useCallback(() => {
        if (!call?.transcription) return;
        const blob = new Blob([call.transcription], { type: 'text/vtt;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `transcricao-${call.clientName?.replace(/\s+/g, '-').toLowerCase() || callId}.vtt`;
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }, [call]);

    const dateFormatted = useMemo(() => call?.createdAt ? new Date(call.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '', [call?.createdAt]);

    const analysisData: Analysis | null = useMemo(() => {
        const raw = call?.analysis;
        return isNewAnalysis(raw) ? raw : null;
    }, [call]);

    const canAnalyze = call?.status === 'TRANSCRIBED' || call?.status === 'FAILED';
    const isAnalyzing = call?.status === 'ANALYZING';
    const showAnalysis = call?.status === 'COMPLETED' && analysisData;

    return {
        states: {
            call,
            isLoading,
            error,
            copied,
            activeView,
            dateFormatted,
            analysisData,
            canAnalyze,
            isAnalyzing,
            showAnalysis
        },
        actions: {
            setActiveView,
            handleRequestAnalysis,
            handleCopy,
            handleDownloadVTT
        }
    };
};