import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Spinner } from './Spinner'; // Reutilizaremos o componente Spinner

// Ícones para a UI
const KeyIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;
const CogIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5" /></svg>;
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.06-1.06L10.5 12.94l-1.72-1.72a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.5-4.5z" clipRule="evenodd" /></svg>;

// Tipo para o estado do formulário
type ConfigFormData = {
    OPENAI_API_KEY: string;
    HF_TOKEN: string;
    OPENAI_ASSISTANT_ID: string;
    WHISPERX_MODEL: 'large-v3' | 'large-v2' | 'base' | 'small' | 'medium';
    DIAR_DEVICE: 'cuda' | 'cpu';
    ALIGN_DEVICE: 'cuda' | 'cpu';
};

export const SettingsPage: React.FC = () => {
    const [config, setConfig] = useState<Partial<ConfigFormData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get<ConfigFormData>(`${API_URL}/config`);
            setConfig(response.data);
        } catch (err) {
            setError('Não foi possível carregar as configurações.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await axios.put(`${API_URL}/config`, config);
            setSuccessMessage('Configurações salvas com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('Ocorreu um erro ao salvar as configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="text-center p-10">Carregando configurações...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Configurações do Sistema</h1>
            
            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Seção de Chaves de API */}
                <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                    <h2 className="text-xl font-bold flex items-center gap-3"><KeyIcon className="w-6 h-6 text-amber-500"/> Chaves de API</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">As chaves não são exibidas por segurança. Para alterar, insira um novo valor.</p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="OPENAI_API_KEY" className="block text-sm font-medium mb-1">OpenAI API Key</label>
                            <input type="password" id="OPENAI_API_KEY" name="OPENAI_API_KEY" onChange={handleChange} placeholder="Deixe em branco para não alterar" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"/>
                        </div>
                        <div>
                            <label htmlFor="HF_TOKEN" className="block text-sm font-medium mb-1">Hugging Face Token</label>
                            <input type="password" id="HF_TOKEN" name="HF_TOKEN" onChange={handleChange} placeholder="Deixe em branco para não alterar" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"/>
                        </div>
                         <div>
                            <label htmlFor="OPENAI_ASSISTANT_ID" className="block text-sm font-medium mb-1">OpenAI Assistant ID</label>
                            <input type="text" id="OPENAI_ASSISTANT_ID" name="OPENAI_ASSISTANT_ID" value={config.OPENAI_ASSISTANT_ID || ''} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"/>
                        </div>
                    </div>
                </div>

                {/* Seção de Modelos */}
                <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                    <h2 className="text-xl font-bold flex items-center gap-3"><CogIcon className="w-6 h-6 text-sky-500"/> Modelos e Processamento</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Controle quais modelos e hardware serão usados pelo worker de IA.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="WHISPERX_MODEL" className="block text-sm font-medium mb-1">Modelo WhisperX</label>
                            <select id="WHISPERX_MODEL" name="WHISPERX_MODEL" value={config.WHISPERX_MODEL || 'large-v3'} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md">
                                <option value="large-v3">large-v3</option>
                                <option value="large-v2">large-v2</option>
                                <option value="medium">medium</option>
                                <option value="small">small</option>
                                <option value="base">base</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="DIAR_DEVICE" className="block text-sm font-medium mb-1">Dispositivo de Diarização</label>
                            <select id="DIAR_DEVICE" name="DIAR_DEVICE" value={config.DIAR_DEVICE || 'cpu'} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md">
                                <option value="cpu">CPU</option>
                                <option value="cuda">GPU (CUDA)</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="ALIGN_DEVICE" className="block text-sm font-medium mb-1">Dispositivo de Alinhamento</label>
                            <select id="ALIGN_DEVICE" name="ALIGN_DEVICE" value={config.ALIGN_DEVICE || 'cpu'} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md">
                                <option value="cpu">CPU</option>
                                <option value="cuda">GPU (CUDA)</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* Botão de Salvar e Mensagens */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {successMessage && <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> {successMessage}</p>}
                    <button type="submit" disabled={isSaving} className="inline-flex justify-center items-center gap-3 py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60">
                        {isSaving && <Spinner />}
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};