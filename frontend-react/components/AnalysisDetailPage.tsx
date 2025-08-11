import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import type { Task, Analysis } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { API_URL } from '../config';

interface AnalysisDetailPageProps {
  callId: string;
  onBack: () => void;
}

/* Ícones (sem alterações) */
const DocumentArrowDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5A2.25 2.25 0 005.25 10.5v8.25A2.25 2.25 0 007.5 21h8.25A2.25 2.25 0 0018 18.75V17M9.75 15h6A2.25 2.25 0 0018 12.75v-6A2.25 2.25 0 0015.75 4.5h-6A2.25 2.25 0 007.5 6.75v6A2.25 2.25 0 009.75 15z" />
  </svg>
);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm14.03-2.03a.75.75 0 00-1.06-1.06l-4.72 4.72-1.69-1.69a.75.75 0 10-1.06 1.06l2.22 2.22a.75.75 0 001.06 0l5.25-5.25z" clipRule="evenodd" /></svg>
);
const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H9a3 3 0 000 6h4.5M10.5 18H15a3 3 0 000-6h-4.5" /></svg>
);
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v11.25M3 18.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75M3 9h18" /></svg>
);
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 100-10 5 5 0 000 10z" /><path fillRule="evenodd" d="M2.457 20.042A10 10 0 1121.543 20.04 8 8 0 0012 16a8 8 0 00-9.543 4.042z" clipRule="evenodd" /></svg>
);

// ÍCONES NOVOS PARA A ANÁLISE
const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a12.062 12.062 0 01-4.5 0m1.5-18a3 3 0 10-3 3h3a3 3 0 100-6h-3a3 3 0 103 3zm-3.75 6.113a11.986 11.986 0 01-1.536 2.67M16.5 11.636a11.986 11.986 0 00-1.536 2.67" /></svg>;
const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>;
const WrenchIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.375 3.375 0 000-4.773L6.75 2.25 2.25 6.75l4.773 4.773a3.375 3.375 0 004.773 0z" /></svg>;
const RocketIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a14.98 14.98 0 00-5.84-2.56m0 0a14.98 14.98 0 00-2.56-5.84m2.56 5.84V21M11.03 7.03v2.88m2.88-2.88h-2.88m-3.449 2.56a14.98 14.98 0 00-2.56 5.84m2.56-5.84V4.5a14.982 14.982 0 00-5.84 2.56M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-1.125 0-2.062.914-2.062 2.063v7.625c0 1.148.937 2.063 2.063 2.063h8.25c1.125 0 2.063-.914 2.063-2.063v-7.625a2.063 2.063 0 00-2.063-2.063H8.25z" /></svg>;

// Componente para a seção de Análise
const AnalysisContent: React.FC<{ analysis: Analysis }> = ({ analysis }) => {
    return (
        <div className="space-y-8">
            {/* Identificação dos Locutores */}
            <section>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <UserIcon className="w-5 h-5 text-indigo-500" />
                    Identificação dos Locutores
                </h3>
                <div className="bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3 text-sm">
                    <p><strong className="font-semibold text-slate-800 dark:text-slate-100">Vendedor:</strong> <span className="text-slate-600 dark:text-slate-300">{analysis.speakerIdentification.salesperson}</span></p>
                    <p><strong className="font-semibold text-slate-800 dark:text-slate-100">Cliente:</strong> <span className="text-slate-600 dark:text-slate-300">{analysis.speakerIdentification.customer}</span></p>
                    <p className="pt-2 border-t border-slate-200 dark:border-slate-700"><strong className="font-semibold text-slate-800 dark:text-slate-100">Justificativa:</strong> <span className="text-slate-600 dark:text-slate-300">{analysis.speakerIdentification.reasoning}</span></p>
                </div>
            </section>

            {/* Momentos Cruciais */}
            <section>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <LightbulbIcon className="w-5 h-5 text-amber-500" />
                    Momentos Cruciais para Melhoria
                </h3>
                <div className="space-y-4">
                    {analysis.crucialMoments.map((moment, index) => (
                        <div key={index} className="bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <h4 className="font-semibold text-primary-600 dark:text-primary-400 mb-3">{moment.momentTitle}</h4>
                            <div className="space-y-3 text-sm">
                                <p className="italic text-slate-500 dark:text-slate-400 border-l-4 border-slate-300 dark:border-slate-600 pl-3">"{moment.salespersonLine}"</p>
                                <div className="flex items-start gap-2"><WrenchIcon className="w-4 h-4 mt-0.5 text-rose-500 flex-shrink-0" /><p><strong className="font-semibold text-slate-800 dark:text-slate-100">Problema:</strong> {moment.problem}</p></div>
                                <div className="flex items-start gap-2"><RocketIcon className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" /><p><strong className="font-semibold text-slate-800 dark:text-slate-100">Sugestão:</strong> {moment.improvement}</p></div>
                                <div className="flex items-start gap-2"><ChatBubbleIcon className="w-4 h-4 mt-0.5 text-sky-500 flex-shrink-0" /><p><strong className="font-semibold text-slate-800 dark:text-slate-100">Exemplo de Fala:</strong> {moment.suggestedLine}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            {/* Feedback Geral */}
            <section>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <ClipboardIcon className="w-5 h-5 text-cyan-500" />
                    Feedback Geral
                </h3>
                <div className="bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300">
                    <p>{analysis.overallFeedback.summary}</p>
                </div>
            </section>
        </div>
    );
};


// Componente principal da página
export const AnalysisDetailPage: React.FC<AnalysisDetailPageProps> = ({ callId, onBack }) => {
    const [call, setCall] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'analise' | 'transcricao'>('analise');
    const [copied, setCopied] = useState<string | null>(null);

    // Lógica para buscar os dados (sem mudanças)
    useEffect(() => {
        setIsLoading(true);
        axios.get<Task>(`${API_URL}/tasks/${callId}`)
            .then(response => setCall(response.data))
            .catch(() => setError('Não foi possível carregar os detalhes da análise.'))
            .finally(() => setIsLoading(false));
    }, [callId]);

    // Lógica para copiar texto
    const handleCopy = useCallback(async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Falha ao copiar:', err);
        }
    }, []);
    
    // Lógica para baixar o VTT (sem mudanças)
    const handleDownloadVTT = () => {
        if (!call?.transcription) return;
        const blob = new Blob([call.transcription], { type: 'text/vtt;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `transcricao-${call.clientName?.replace(/\s+/g, '-').toLowerCase() || callId}.vtt`;
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const dateFormatted = useMemo(() => call?.createdAt ? new Date(call.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '', [call?.createdAt]);
    
    // UI de Loading e Erro (sem mudanças)
    if (isLoading) return <div className="text-center p-8">Carregando análise...</div>;
    if (error || !call) return <div className="text-center p-8 text-red-500">{error || 'Análise não encontrada.'}</div>;

    return (
         <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Voltar para o Dashboard
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleCopy(`${window.location.origin}/tasks/${callId}`, 'link')}
                        className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        {copied === 'link' ? <CheckIcon className="w-5 h-5 text-emerald-500" /> : <LinkIcon className="w-5 h-5" />}
                        {copied === 'link' ? 'Link copiado!' : 'Copiar link'}
                    </button>
                    <a
                        href={`${API_URL}/tasks/${callId}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 text-white hover:opacity-95 transition"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        Exportar PDF
                    </a>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 shadow-lg overflow-hidden backdrop-blur-md">
                <div className="p-6 md:p-8">
                    <header className="pb-6 border-b border-slate-200/70 dark:border-slate-700/60">
                         <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Análise com Cliente: <span className="text-primary-600 dark:text-primary-400">{call.clientName || 'Não informado'}</span>
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200">
                                <UserIcon className="w-4 h-4" />
                                Vendedora: <strong className="font-semibold ml-1">{call.saleswoman?.name || 'Não identificada'}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200">
                                <CalendarIcon className="w-4 h-4" />
                                {dateFormatted}
                            </span>
                        </div>
                    </header>

                    <div className="mt-6">
                        <div className="inline-flex p-1 bg-slate-100/80 dark:bg-slate-800/70 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/50">
                            {(['analise', 'transcricao'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                                >
                                    {tab === 'analise' ? 'Análise da IA' : 'Transcrição'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        {activeTab === 'analise' && (
                            call.analysis ? <AnalysisContent analysis={call.analysis} /> : <p>Análise não disponível.</p>
                        )}

                        {activeTab === 'transcricao' && (
                           <section>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Transcrição Completa (VTT)</h3>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleCopy(call.transcription || '', 'transcription')} className="text-xs md:text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                                            {copied === 'transcription' ? 'Copiado!' : 'Copiar'}
                                        </button>
                                        <button onClick={handleDownloadVTT} className="text-xs md:text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                                            Baixar .vtt
                                        </button>
                                    </div>
                                </div>
                                <pre className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/70 p-4 rounded-lg whitespace-pre-wrap overflow-x-auto border border-slate-200 dark:border-slate-700">
                                    <code>{call.transcription || 'Transcrição não disponível.'}</code>
                                </pre>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisDetailPage;