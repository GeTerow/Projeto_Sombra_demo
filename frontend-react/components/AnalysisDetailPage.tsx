import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Task } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { Spinner } from './Spinner';
import { API_URL } from '../config';

/* Ícones inline (Heroicons) para evitar dependências extras */
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
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm14.03-2.03a.75.75 0 00-1.06-1.06l-4.72 4.72-1.69-1.69a.75.75 0 10-1.06 1.06l2.22 2.22a.75.75 0 001.06 0l5.25-5.25z" clipRule="evenodd" />
  </svg>
);
const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H9a3 3 0 000 6h4.5M10.5 18H15a3 3 0 000-6h-4.5" />
  </svg>
);
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v11.25M3 18.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75M3 9h18" />
  </svg>
);
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" />
    <path fillRule="evenodd" d="M2.457 20.042A10 10 0 1121.543 20.04 8 8 0 0012 16a8 8 0 00-9.543 4.042z" clipRule="evenodd" />
  </svg>
);
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const WaveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.5 12a1 1 0 011-1h.5a1 1 0 011 1v1a1 1 0 01-1 1H5.5a1 1 0 01-1-1v-1zM8.5 8a1 1 0 011-1h.5a1 1 0 011 1v9a1 1 0 01-1 1H9.5a1 1 0 01-1-1V8zM12.5 10a1 1 0 011-1h.5a1 1 0 011 1v5a1 1 0 01-1 1H13.5a1 1 0 01-1-1v-5zM16.5 6a1 1 0 011-1h.5a1 1 0 011 1v13a1 1 0 01-1 1H17.5a1 1 0 01-1-1V6z" />
  </svg>
);

interface AnalysisDetailPageProps {
  callId: string;
  onBack: () => void;
}

type TabKey = 'analise' | 'transcricao' | 'metadados';

/* Utils visuais */
const getInitials = (name?: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
};
const stringToHsl = (str?: string, s = 70, l = 55) => {
  if (!str) return `hsl(210, ${s}%, ${l}%)`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

export const AnalysisDetailPage: React.FC<AnalysisDetailPageProps> = ({ callId, onBack }) => {
  const [call, setCall] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('analise');
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);
  const [copiedTranscription, setCopiedTranscription] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    axios
      .get<Task>(`${API_URL}/tasks/${callId}`, { signal: controller.signal })
      .then((response) => {
        setCall(response.data);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Erro ao buscar detalhes da chamada:', err);
        setError('Não foi possível carregar os detalhes da análise.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [callId, reloadKey]);

  const handleRetry = () => setReloadKey((k) => k + 1);

  const handleCopy = useCallback(async (text: string, setFlag: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      setTimeout(() => setFlag(false), 1500);
    } catch {
      // noop
    }
  }, []);

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/tasks/${callId}`;
    await handleCopy(link, setCopiedLink);
  };

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

  const dateFormatted = useMemo(() => {
    if (!call?.createdAt) return 'Data não informada';
    try {
      return new Date(call.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Data inválida';
    }
  }, [call?.createdAt]);

  const avatarGradient = useMemo(() => {
    const c1 = stringToHsl(call?.clientName, 75, 55);
    const c2 = stringToHsl((call?.clientName || '') + 'x', 70, 45);
    return { backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})` };
  }, [call?.clientName]);

  /* Loading com Skeleton */
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="mb-6 flex justify-between items-center">
          <div className="h-10 w-44 bg-slate-200/70 dark:bg-slate-700/50 rounded-lg animate-pulse" />
          <div className="h-10 w-40 bg-slate-200/70 dark:bg-slate-700/50 rounded-lg animate-pulse" />
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-primary-500/20 via-fuchsia-500/10 to-cyan-500/20" />
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
              </div>
            </div>

            <div className="mt-8">
              <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
              <div className="mt-6 space-y-3">
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                <div className="h-4 w-11/12 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                <div className="h-4 w-10/12 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-lg text-red-600 dark:text-red-400 font-medium">{error || 'Análise não encontrada.'}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 dark:text-slate-200 ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Top actions */}
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
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="Copiar link"
          >
            {copiedLink ? <CheckIcon className="w-5 h-5 text-emerald-500" /> : <LinkIcon className="w-5 h-5" />}
            {copiedLink ? 'Link copiado!' : 'Copiar link'}
          </button>

          <a
            href={`${API_URL}/tasks/${callId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 text-white hover:opacity-95 transition"
            title="Exportar PDF"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Exportar PDF
          </a>
        </div>
      </div>

      {/* Card principal com gradiente no topo */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
        <div className="h-24 bg-gradient-to-r from-primary-500/20 via-fuchsia-500/10 to-cyan-500/20" />

        <div className="p-6 md:p-8 -mt-10">
          {/* Cabeçalho com avatar */}
          <header className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 pb-6 border-b border-slate-200/70 dark:border-slate-700/60">
            <div
              className="w-16 h-16 rounded-2xl text-white grid place-items-center text-xl font-bold shadow-md ring-2 ring-white/70 dark:ring-slate-800"
              style={avatarGradient}
              aria-label={`Cliente ${call.clientName || 'desconhecido'}`}
            >
              {getInitials(call.clientName)}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Análise com Cliente: <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
                  {call.clientName || 'Não informado'}
                </span>
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
                {/* Chips opcionais se existirem nos dados */}
                {Boolean((call as any)?.duration) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200">
                    <ClockIcon className="w-4 h-4" />
                    {(call as any).duration}
                  </span>
                )}
                {Boolean((call as any)?.status) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800">
                    {(call as any).status}
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Tabs */}
          <div className="mt-6">
            <div className="inline-flex p-1 bg-slate-100/80 dark:bg-slate-800/70 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/50">
              {(['analise', 'transcricao', 'metadados'] as TabKey[]).map((tab) => {
                const label =
                  tab === 'analise' ? 'Análise da IA' : tab === 'transcricao' ? 'Transcrição (VTT)' : 'Metadados';
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={[
                      'px-4 py-2 text-sm font-medium rounded-lg transition',
                      active
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/50',
                    ].join(' ')}
                    aria-pressed={active}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Painéis */}
            <div className="mt-6">
              {activeTab === 'analise' && (
                <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 md:p-6 bg-white/70 dark:bg-slate-900/40">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <WaveIcon className="w-5 h-5 text-primary-500" />
                      Análise da IA
                    </h3>
                    <button
                      onClick={() => handleCopy(call.analysis || 'Análise não disponível.', setCopiedAnalysis)}
                      className="inline-flex items-center gap-2 text-xs md:text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Copiar análise"
                    >
                      {copiedAnalysis ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <CopyIcon className="w-4 h-4" />}
                      {copiedAnalysis ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {call.analysis || 'Análise não disponível.'}
                    </ReactMarkdown>
                  </div>
                </section>
              )}

              {activeTab === 'transcricao' && (
                <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 md:p-6 bg-white/70 dark:bg-slate-900/40">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <WaveIcon className="w-5 h-5 text-primary-500" />
                      Transcrição Completa (VTT)
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(call.transcription || 'Transcrição não disponível.', setCopiedTranscription)}
                        className="inline-flex items-center gap-2 text-xs md:text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="Copiar transcrição"
                      >
                        {copiedTranscription ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <CopyIcon className="w-4 h-4" />}
                        {copiedTranscription ? 'Copiado!' : 'Copiar'}
                      </button>
                      <button
                        onClick={handleDownloadVTT}
                        className="inline-flex items-center gap-2 text-xs md:text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="Baixar VTT"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        Baixar .vtt
                      </button>
                    </div>
                  </div>

                  <pre className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/70 p-4 md:p-5 rounded-lg whitespace-pre-wrap overflow-x-auto border border-slate-200 dark:border-slate-700">
                    <code>{call.transcription || 'Transcrição não disponível.'}</code>
                  </pre>
                </section>
              )}

              {activeTab === 'metadados' && (
                <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 md:p-6 bg-white/70 dark:bg-slate-900/40">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-3">Metadados</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg p-4 ring-1 ring-slate-200 dark:ring-slate-700 bg-white/70 dark:bg-slate-900/40">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Cliente</div>
                      <div className="mt-1 font-medium text-slate-900 dark:text-white">{call.clientName || '—'}</div>
                    </div>
                    <div className="rounded-lg p-4 ring-1 ring-slate-200 dark:ring-slate-700 bg-white/70 dark:bg-slate-900/40">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Vendedora</div>
                      <div className="mt-1 font-medium text-slate-900 dark:text-white">{call.saleswoman?.name || '—'}</div>
                    </div>
                    <div className="rounded-lg p-4 ring-1 ring-slate-200 dark:ring-slate-700 bg-white/70 dark:bg-slate-900/40">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Data</div>
                      <div className="mt-1 font-medium text-slate-900 dark:text-white">{dateFormatted}</div>
                    </div>
                    <div className="rounded-lg p-4 ring-1 ring-slate-2 00 dark:ring-slate-700 bg-white/70 dark:bg-slate-900/40">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">ID da Tarefa</div>
                      <div className="mt-1 font-mono text-slate-900 dark:text-white text-sm break-all">{callId}</div>
                    </div>
                    {/* Campos opcionais */}
                    {'score' in (call as any) && (
                      <div className="rounded-lg p-4 ring-1 ring-slate-200 dark:ring-slate-700 bg-white/70 dark:bg-slate-900/40">
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Score</div>
                        <div className="mt-1 font-medium text-slate-900 dark:text-white">{(call as any).score ?? '—'}</div>
                      </div>
                    )}
                    {'sentiment' in (call as any) && (
                      <div className="rounded-lg p-4 ring-1 ring-slate-200 dark:ring-slate-700 bg-white/70 dark:bg-slate-900/40">
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Sentimento</div>
                        <div className="mt-1 font-medium text-slate-900 dark:text-white">{(call as any).sentiment ?? '—'}</div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};