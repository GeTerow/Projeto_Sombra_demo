import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import type { Task, Saleswoman } from '../types/types';

export const useAudioUploadForm = () => {
    const [saleswomen, setSaleswomen] = useState<Saleswoman[]>([]);
    const [selectedSaleswomanId, setSelectedSaleswomanId] = useState<string>('');
    const [clientName, setClientName] = useState<string>('');
    const [audioFiles, setAudioFiles] = useState<File[]>([]);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
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

    const handleFileSelect = (files: FileList | File[]) => {
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        Array.from(files).forEach(file => {
            if (file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.type === 'audio/mp4' || file.type === 'audio/x-m4a') {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        });

        if (invalidFiles.length > 0) {
            setErrorMessage(`Formato inválido para: ${invalidFiles.join(', ')}. Use .mp3, .wav ou .m4a.`);
        }

        if (validFiles.length > 0) {
            setAudioFiles(prev => [...prev, ...validFiles]);
            setErrorMessage(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files);
        }
    };

    const handleClearFile = (fileName?: string) => {
        if (fileName) {
            setAudioFiles(prev => prev.filter(file => file.name !== fileName));
        } else {
            setAudioFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const uploadSingleFile = async (file: File, index: number): Promise<Task> => {
        const formData = new FormData();
        formData.append('saleswomanId', selectedSaleswomanId);
        
        // Gera nome único com autoincrement: Cliente X_001, Cliente X_002, etc.
        const paddedIndex = String(index + 1).padStart(3, '0');
        const uniqueClientName = `${clientName}_${paddedIndex}`;
        
        formData.append('clientName', uniqueClientName);
        formData.append('audio', file);

        const response = await api.post<{ task: Task }>('/tasks', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return response.data.task;
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSaleswomanId || !clientName || audioFiles.length === 0) {
            setErrorMessage('Todos os campos são obrigatórios e pelo menos um arquivo deve ser selecionado.');
            return;
        }

        setErrorMessage(null);
        setStatusMessage(null);
        setIsLoading(true);
        setUploadProgress({});

        try {
            const results: Task[] = [];
            const totalFiles = audioFiles.length;

            for (let i = 0; i < audioFiles.length; i++) {
                const file = audioFiles[i];
                setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

                try {
                    const task = await uploadSingleFile(file, i);
                    results.push(task);
                    setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
                } catch (error) {
                    console.error(`Erro ao enviar ${file.name}:`, error);
                    setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // -1 indica erro
                }
            }

            const successCount = results.length;
            const errorCount = totalFiles - successCount;

            if (successCount > 0) {
                setStatusMessage(
                    `Upload concluído! ${successCount} arquivo(s) enviado(s) com sucesso.` +
                    (errorCount > 0 ? ` ${errorCount} arquivo(s) falharam.` : '')
                );
            }

            if (successCount === totalFiles) {
                // Limpar formulário apenas se todos os uploads foram bem-sucedidos
                setSelectedSaleswomanId('');
                setClientName('');
                setAudioFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }

        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Ocorreu um erro desconhecido.';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedSaleswomanId, clientName, audioFiles]);

    return {
        states: {
            saleswomen,
            selectedSaleswomanId,
            clientName,
            audioFiles,
            statusMessage,
            errorMessage,
            isLoading,
            isDragging,
            fileInputRef,
            uploadProgress
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