import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import type { Task, Saleswoman } from '../types/types';

export const useAudioUploadForm = () => {
    const [saleswomen, setSaleswomen] = useState<Saleswoman[]>([]);
    const [selectedSaleswomanId, setSelectedSaleswomanId] = useState<string>('');
    const [clientName, setClientName] = useState<string>('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api.get<Saleswoman[]>('/saleswomen')
            .then(response => {
                setSaleswomen(response.data);
            })
            .catch(error => {
                console.error("Erro ao buscar vendedoras:", error);
                setErrorMessage("Não foi possível carregar a lista de vendedoras.");
            });
    }, []);

    const handleFileSelect = (file: File | null) => {
        if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.type === 'audio/mp4' || file.type === 'audio/x-m4a')) {
            setAudioFile(file);
            setErrorMessage(null);
        } else {
            setErrorMessage('Formato de arquivo inválido. Use .mp3, .wav ou .m4a.');
            setAudioFile(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleClearFile = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setAudioFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSaleswomanId || !clientName || !audioFile) {
            setErrorMessage('Todos os campos são obrigatórios.');
            return;
        }

        setErrorMessage(null);
        setStatusMessage(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('saleswomanId', selectedSaleswomanId);
        formData.append('clientName', clientName);
        formData.append('audio', audioFile);

        try {
            const response = await api.post<{ task: Task }>('/tasks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setStatusMessage(`Sucesso! A análise para ${response.data.task.clientName} foi iniciada.`);
            
            setSelectedSaleswomanId('');
            setClientName('');
            setAudioFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Ocorreu um erro desconhecido.';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedSaleswomanId, clientName, audioFile]);

    return {
        states: {
            saleswomen,
            selectedSaleswomanId,
            clientName,
            audioFile,
            statusMessage,
            errorMessage,
            isLoading,
            isDragging,
            fileInputRef
        },
        handlers: {
            setSelectedSaleswomanId,
            setClientName,
            handleFileChange,
            handleClearFile,
            handleDragEnter,
            handleDragLeave,
            handleDragOver,
            handleDrop,
            handleSubmit
        }
    };
};