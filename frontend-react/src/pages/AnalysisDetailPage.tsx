import React from 'react';
import type { Analysis, StageKey } from '@/types/types';
import { FormattedTranscription } from '@/components/FormattedTranscription';
import { Spinner } from '@/components/ui/Spinner';
import { API_URL } from '@/config';
import { useAnalysisDetail } from '@/hooks/useAnalysisDetail';
import {
    ArrowLeftIcon, DocumentArrowDownIcon, CopyIcon, CheckIcon, LinkIcon, CalendarIcon,
    UserIcon, LightbulbIcon, ChatBubbleIcon, WrenchIcon, RocketIcon, SadFaceIcon
} from '@/components/icons';
import { AnalysisDetailPageProps } from '@/types/types';

const stageLabels: Record<StageKey, string> = { opening: 'Abertura', discovery: 'Descoberta', qualification: 'Qualificação', closing: 'Fechamento' };

const scoreBadgeColor = (score: number) => {
  if (score < 50) return 'text-rose-600 bg-rose-100/80 dark:bg-rose-500/10';
  if (score < 75) return 'text-amber-600 bg-amber-100/80 dark:bg-amber-500/10';
  return 'text-emerald-600 bg-emerald-100/80 dark:bg-emerald-500/10';
};

const barColor = (score: number) => {
  if (score < 50) return 'from-rose-500 to-rose-400';
  if (score < 75) return 'from-amber-500 to-amber-400';
  return 'from-emerald-500 to-emerald-400';
};

const ratingFromPercent = (p: number) => {
  if (p < 50) return { label: 'A melhorar', Icon: SadFaceIcon, className: 'text-rose-600 bg-rose-100/80 dark:bg-rose-500/10' };
  if (p < 75) return { label: 'Bom', Icon: LightbulbIcon, className: 'text-amber-600 bg-amber-100/80 dark:bg-amber-500/10' };
  return { label: 'Excelente', Icon: RocketIcon, className: 'text-emerald-600 bg-emerald-100/80 dark:bg-emerald-500/10' };
};

const ScoreRing: React.FC<{ scorePercent: number; label?: string; size?: number; stroke?: number }> = ({ scorePercent, label = 'Score Geral', size = 160, stroke = 12 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(scorePercent, 0), 100);
  const offset = circumference * (1 - clamped / 100);
  const ringColor = clamped < 50 ? 'text-rose-500' : clamped < 75 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <div className="absolute inset-0 -z-10 blur-2xl opacity-40 rounded-full bg-gradient-to-tr from-indigo-400/30 via-primary-400/20 to-emerald-400/30" />
      <svg width={size} height={size} className="overflow-visible">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={stroke} className="text-slate-200/90 dark:text-slate-700/80" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={stroke} className={ringColor} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="font-extrabold text-slate-900 dark:text-white" style={{ fontSize: 22, fill: 'currentColor' }}>{Math.round(clamped)}%</text>
      </svg>
      <span className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
    </div>
  );
};

const DetailedAnalysisContent: React.FC<{ analysis: Analysis; onCopy: (text: string, type: string) => void; copied: string | null }> = ({ analysis, onCopy, copied }) => {
  const overallPercent = React.useMemo(() => {
    const s = analysis.performance.overallScore;
    return s <= 10 ? s * 10 : s;
  }, [analysis.performance.overallScore]);

  const rating = React.useMemo(() => ratingFromPercent(overallPercent), [overallPercent]);
  
  // @ts-ignore
  const stageEntries = Object.entries(analysis.performance.stages) as [StageKey, StageData][];
  const lowestStage = React.useMemo(() => stageEntries.reduce((acc, cur) => (cur[1].score < acc[1].score ? cur : acc), stageEntries[0]), [stageEntries]);

  return (
    <div className="space-y-12">
      <section>
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-3">Resumo da Ligação</h3>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white/90 to-slate-50/70 dark:from-slate-900/60 dark:to-slate-800/50 p-5">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 pr-2">{analysis.summary}</p>
        </div>
      </section>

      <section id="detalhes-performance">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-4"><RocketIcon className="w-5 h-5 text-emerald-500" /> Análise de Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 p-6 shadow-sm h-full">
              <div className="flex flex-col items-center justify-center gap-6 text-center h-full">
                <ScoreRing scorePercent={overallPercent} label={`Score (${analysis.performance.overallScore})`} />
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${rating.className}`}>
                      {rating.Icon && <rating.Icon className="w-3.5 h-3.5" />}
                      {rating.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">• {Math.round(overallPercent)}%</span>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white">Foco sugerido:</p>
                    <p className="mt-0.5">{stageLabels[lowestStage[0]]}: {lowestStage[1].improvementSuggestion}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {(Object.keys(analysis.performance.stages) as StageKey[]).map((stageKey) => {
              const s = analysis.performance.stages[stageKey];
              return (
                <div key={stageKey} className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{stageLabels[stageKey]}</h4>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${scoreBadgeColor(s.score)}`} title={`${s.score}%`}>{s.score}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                    <div className={`h-full bg-gradient-to-r ${barColor(s.score)} rounded-full`} style={{ width: `${s.score}%` }} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">Feedback: </strong>{s.feedback}</p>
                    <p className="text-slate-700 dark:text-slate-300 flex items-start gap-2"><LightbulbIcon className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" /><span><strong className="text-slate-900 dark:text-white">Sugestão: </strong>{s.improvementSuggestion}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-3"><UserIcon className="w-5 h-5 text-indigo-500" /> Perfil do Cliente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Nome</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{analysis.customerProfile.name}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Perfil</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{analysis.customerProfile.profile}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Estilo de Comunicação</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{analysis.customerProfile.communicationStyle}</p>
          </div>
        </div>
      </section>

      <section id="pontos-melhoria">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-3"><WrenchIcon className="w-5 h-5 text-rose-500" /> Pontos de Melhoria</h3>
        <div className="space-y-4">
          {analysis.improvementPoints.map((item, idx) => (
            <div key={idx} className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 text-sm flex-1">
                  <p className="italic text-slate-500 dark:text-slate-400 border-l-4 border-slate-300 dark:border-slate-600 pl-3">“{item.salespersonLine}”</p>
                  <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300"><ChatBubbleIcon className="w-4 h-4 mt-0.5 text-sky-500 flex-shrink-0" /><span><strong className="text-slate-900 dark:text-white">Contexto:</strong> {item.context}</span></p>
                  {item.suggestion && (
                    <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300"><LightbulbIcon className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" /><span><strong className="text-slate-900 dark:text-white">Sugestão:</strong> {item.suggestion}</span></p>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button onClick={() => onCopy(item.suggestion, `sug-${idx}`)} className="self-start inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="Copiar sugestão">{copied === `sug-${idx}` ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <CopyIcon className="w-4 h-4" />}{copied === `sug-${idx}` ? 'Copiado!' : 'Copiar'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};


// Componente Principal da Página 

export const AnalysisDetailPage: React.FC<AnalysisDetailPageProps> = ({ callId, onBack }) => {
    const { states, actions } = useAnalysisDetail(callId);
    const {
        call, isLoading, error, copied, activeView, dateFormatted,
        analysisData, canAnalyze, isAnalyzing, showAnalysis
    } = states;
    const { setActiveView, handleRequestAnalysis, handleCopy, handleDownloadVTT } = actions;

    if (isLoading) return <div className="text-center p-8">Carregando análise...</div>;
    if (error || !call) return <div className="text-center p-8 text-red-500">{error || 'Análise não encontrada.'}</div>;

    const TabButton: React.FC<{ view: 'summary' | 'details', children: React.ReactNode, disabled?: boolean }> = ({ view, children, disabled }) => (
        <button
            onClick={() => setActiveView(view)}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${activeView === view
                ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" /> Voltar para o Dashboard
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleCopy(`${window.location.origin}/tasks/${callId}`, 'link')} className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        {copied === 'link' ? <CheckIcon className="w-5 h-5 text-emerald-500" /> : <LinkIcon className="w-5 h-5" />}
                        {copied === 'link' ? 'Link copiado!' : 'Copiar link'}
                    </button>
                    <a href={`${API_URL}/tasks/${callId}/pdf?token=${localStorage.getItem('authToken')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 text-white hover:opacity-95 transition">
                        <DocumentArrowDownIcon className="w-5 h-5" /> Exportar PDF
                    </a>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 shadow-lg overflow-hidden backdrop-blur-md">
                <div className="p-6 md:p-8">
                    <header className="pb-4">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Análise com Cliente: <span className="text-primary-600 dark:text-primary-400">{call.clientName || 'Não informado'}</span></h2>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200"><UserIcon className="w-4 h-4" /> Vendedora: <strong className="font-semibold ml-1">{call.saleswoman?.name || 'Não identificada'}</strong></span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200"><CalendarIcon className="w-4 h-4" /> {dateFormatted}</span>
                        </div>
                    </header>

                    <div className="mt-4 border-b border-slate-200 dark:border-slate-700">
                        <nav className="-mb-px flex space-x-4">
                            <TabButton view="summary">Resumo e Transcrição</TabButton>
                            <TabButton view="details" disabled={!showAnalysis}>Análise Detalhada</TabButton>
                        </nav>
                    </div>

                    <div className="mt-6">
                        {activeView === 'summary' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-3">Áudio da Ligação</h3>
                                    <audio controls className="w-full"><source src={`${API_URL}/tasks/${call.id}/audio?token=${localStorage.getItem('authToken')}`} type="audio/mpeg" />Seu navegador não suporta o elemento de áudio.</audio>
                                    <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">{showAnalysis ? 'Resumo da Ligação' : 'Análise por IA'}</h3>
                                        {canAnalyze && (
                                            <>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{call.status === 'FAILED' ? 'A tentativa anterior de análise falhou.' : 'A transcrição está pronta.'} Clique para gerar a análise de performance.</p>
                                                <button onClick={handleRequestAnalysis} className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"><LightbulbIcon className="w-5 h-5" />{call.status === 'FAILED' ? 'Tentar Análise Novamente' : 'Analisar com IA'}</button>
                                            </>
                                        )}
                                        {isAnalyzing && (<div className="flex items-center gap-3 text-sm text-indigo-600 dark:text-indigo-400"><Spinner /><span>A IA está analisando. A página será atualizada automaticamente.</span></div>)}
                                        {showAnalysis && analysisData && (<div><p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 pr-2">{analysisData.summary}</p></div>)}
                                        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Transcrição</h3>
                                        <button onClick={handleDownloadVTT} className="text-xs md:text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">Baixar .vtt</button>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                                        <FormattedTranscription vttContent={call.transcription} />
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeView === 'details' && showAnalysis && analysisData && (
                            <DetailedAnalysisContent analysis={analysisData} onCopy={handleCopy} copied={copied} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisDetailPage;