import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Spinner } from './Spinner';
import { UploadIcon } from './icons/UploadIcon';
import type { Task, Saleswoman } from '../types';
import { API_URL } from '../config';

export const AudioUploadForm: React.FC = () => {
    const [saleswomen, setSaleswomen] = useState<Saleswoman[]>([]);
    const [selectedSaleswomanId, setSelectedSaleswomanId] = useState<string>('');
    const [clientName, setClientName] = useState<string>('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Efeito para buscar a lista de vendedoras quando o componente montar
    useEffect(() => {
        axios.get<Saleswoman[]>(`${API_URL}/saleswomen`)
            .then(response => {
                setSaleswomen(response.data);
            })
            .catch(error => {
                console.error("Erro ao buscar vendedoras:", error);
                setErrorMessage("Não foi possível carregar a lista de vendedoras.");
            });
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
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
            const response = await axios.post< { task: Task } >(`${API_URL}/tasks`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setStatusMessage(`Sucesso! A tarefa para o cliente ${response.data.task.clientName} foi criada e está em processamento.`);
            
            // Limpa o formulário
            setSelectedSaleswomanId('');
            setClientName('');
            setAudioFile(null);
            (document.getElementById('audio-file-input') as HTMLInputElement).value = "";

        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Ocorreu um erro desconhecido.';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedSaleswomanId, clientName, audioFile]);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                <div className="text-center mb-8">
                    <UploadIcon className="h-12 w-12 mx-auto text-primary-500" />
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mt-4">Analisar Nova Chamada</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Selecione a vendedora, o cliente e anexe o arquivo de áudio para iniciar a análise.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="saleswoman" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendedora</label>
                            <select
                                id="saleswoman"
                                value={selectedSaleswomanId}
                                onChange={(e) => setSelectedSaleswomanId(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-slate-800 dark:text-slate-200"
                            >
                                <option value="" disabled>Selecione uma vendedora</option>
                                {saleswomen.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="client" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Cliente</label>
                            <input type="text" id="client" value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-slate-800 dark:text-slate-200" placeholder="Ex: Cliente X" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="audio-file-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Arquivo de Áudio (.wav, .mp3, .m4a)</label>
                        <input id="audio-file-input" type="file" onChange={handleFileChange} accept="audio/wav, audio/mpeg, audio/mp4" className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-slate-700 dark:file:text-slate-200 dark:hover:file:bg-slate-600"/>
                    </div>

                    {errorMessage && <p className="text-sm text-red-600 dark:text-red-400 text-center">{errorMessage}</p>}
                    {statusMessage && <p className="text-sm text-green-600 dark:text-green-400 text-center">{statusMessage}</p>}

                    <div className="text-center pt-2">
                        <button type="submit" disabled={isLoading} className="inline-flex justify-center items-center gap-3 w-full md:w-auto py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                            {isLoading ? ( <> <Spinner /> <span>Enviando...</span> </> ) : 'Enviar para Análise'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};