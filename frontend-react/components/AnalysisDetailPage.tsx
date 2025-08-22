import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../src/services/api';
import type { Task } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { API_URL } from '../config';
import { FormattedTranscription } from './FormattedTranscription';

interface AnalysisDetailPageProps {
  callId: string;
  onBack: () => void;
}

/* Ícones (reutilizados do seu código) */
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
const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a12.062 12.062 0 01-4.5 0m1.5-18a3 3 0 10-3 3h3a3 3 0 100-6h-3a3 3 0 103 3zm-3.75 6.113a11.986 11.986 0 01-1.536 2.67M16.5 11.636a11.986 11.986 0 00-1.536 2.67" /></svg>;
const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>;
const WrenchIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.375 3.375 0 000-4.773L6.75 2.25 2.25 6.75l4.773 4.773a3.375 3.375 0 004.773 0z" /></svg>;
const RocketIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a14.98 14.98 0 00-5.84-2.56m0 0a14.98 14.98 0 00-2.56-5.84m2.56 5.84V21M11.03 7.03v2.88m2.88-2.88h-2.88m-3.449 2.56a14.98 14.98 0 00-2.56 5.84m2.56-5.84V4.5a14.982 14.982 0 00-5.84 2.56M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-1.125 0-2.062.914-2.062 2.063v7.625c0 1.148.937 2.063 2.063 2.063h8.25c1.125 0 2.063-.914 2.063-2.063v-7.625a2.063 2.063 0 00-2.063-2.063H8.25z" /></svg>;

/* Tipos atualizados para cobrir todo o JSON fornecido */
type StageKey = 'opening' | 'discovery' | 'qualification' | 'closing';
interface StageData { score: number; feedback: string; improvementSuggestion: string; }
interface Performance { overallScore: number; stages: Record<StageKey, StageData>; }
interface ImprovementPoint { salespersonLine: string; context: string; whatWentWrong?: string; impact?: string; suggestion: string; }
// ALTERADO: Adicionado speakerMapping à interface NewAnalysis
interface NewAnalysis {
  summary: string;
  speakerMapping: Record<string, string>;
  customerProfile: { name: string; profile: string; communicationStyle: string; };
  performance: Performance;
  improvementPoints: ImprovementPoint[];
}

// ALTERADO: Adicionado a verificação de speakerMapping
const isNewAnalysis = (a: any): a is NewAnalysis => {
  return (
    a && typeof a === 'object' &&
    'summary' in a &&
    'speakerMapping' in a && // Verificação adicionada
    'customerProfile' in a &&
    a.customerProfile && 'name' in a.customerProfile &&
    'performance' in a &&
    a.performance && 'overallScore' in a.performance &&
    'improvementPoints' in a && Array.isArray(a.improvementPoints)
  );
};

/* MOCK atualizado para desenvolvimento */
// ALTERADO: Adicionado speakerMapping ao mock
const MOCK_ANALYSIS: NewAnalysis = {
  summary: "A chamada consistiu em um atendimento de venda recorrente, onde a cliente solicitou um novo pedido de papel toalha. A vendedora conduziu o processo de forma organizada, confirmou dados cadastrais, valores, condições de pagamento e entrega. O pedido foi finalizado conforme solicitado, demonstrando cordialidade, mas sem explorar oportunidades de venda adicional.",
  speakerMapping: {
    "SPEAKER_01": "Vendedora",
    "SPEAKER_02": "Cliente"
  },
  customerProfile: { name: "Não informado", profile: "Compradora recorrente, provavelmente responsável por compras de suprimentos.", communicationStyle: "Direto e objetivo" },
  performance: {
    overallScore: 74,
    stages: {
      opening: { score: 70, feedback: "A vendedora cumprimentou a cliente de forma cordial e confirmou prontamente se era cliente cadastrada. Demonstrou cordialidade, porém faltou personalização, não se apresentou nem utilizou o nome do cliente.", improvementSuggestion: "Apresentar-se no início da ligação e, caso possível, utilizar o nome do cliente para maior proximidade." },
      discovery: { score: 65, feedback: "A vendedora ouviu a solicitação do produto, confirmou se era o mesmo usualmente comprado e foi ágil na busca de informações. Contudo, não explorou as necessidades atuais, satisfação ou interesse por outros produtos.", improvementSuggestion: "Fazer perguntas abertas sobre a satisfação com o produto ou identificar necessidades adicionais, demonstrando proatividade e interesse genuíno." },
      qualification: { score: 80, feedback: "Foi eficiente na confirmação de dados como CNPJ, endereço de entrega, quantidade do pedido, histórico e condições de pagamento. Demonstrou atenção ao histórico e facilitou o processo para a cliente.", improvementSuggestion: "Manter a conferência de dados, mas aprofundar-se, por exemplo, oferecendo alternativas de pagamento ou condições especiais pautadas no histórico de compras." },
      closing: { score: 80, feedback: "Finalizou com clareza o processo do pedido, confirmou informações, antecipou a possibilidade de entrega rápida e manteve cordialidade durante o fechamento. Respondeu perguntas de forma objetiva.", improvementSuggestion: "Reforçar agradecimento pela preferência e sugerir contato futuro para novas demandas, buscando fidelizar ainda mais o relacionamento." }
    }
  },
  improvementPoints: [
    { salespersonLine: "Está abrindo aqui já.", context: "Momento inicial em que a vendedora busca o cadastro do cliente após confirmação de CNPJ.", whatWentWrong: "A resposta foi objetiva, porém pouco engajadora e transmitiu certa impessoalidade.", impact: "Passa uma imagem de atendimento rotineiro sem personalização, o que pode não fortalecer o relacionamento.", suggestion: "Utilizar frases acolhedoras como: \"Perfeito, só um momento que já estou localizando o seu cadastro, tudo bem?\"." },
    { salespersonLine: "20 pacotinhos. O que mais?", context: "Após confirmar o pedido principal, a vendedora apenas pergunta de forma direta se há mais itens desejados.", whatWentWrong: "Faltou iniciativa para sugerir produtos complementares ou promoção de vantagens, limitando-se à mera tomada do pedido.", impact: "Perde-se oportunidade de aumentar o ticket médio e oferecer soluções completas ao cliente.", suggestion: "Exemplo: \"Além dos papel toalha, temos promoção em álcool gel e saboneteira nesta semana. Posso te enviar informações ou incluir algum desses itens no seu pedido?\"" },
    { salespersonLine: "Só o papel toalha, né?", context: "No fechamento do pedido, a vendedora confirma se a cliente não deseja outro item.", whatWentWrong: "Novamente, faltou proatividade para sugerir vendas adicionais baseadas em histórico ou complementaridade de produtos.", impact: "A ausência de abordagem consultiva pode limitar a percepção de valor do atendimento, tornando-o apenas operacional.", suggestion: "Sugestão prática: \"Você costuma adquirir também guardanapos ou produtos de limpeza. Gostaria de aproveitar alguma oferta desses itens hoje?\"" }
  ]
};

/* Helpers visuais (mantidos) */
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
  if (p < 50) return { label: 'A melhorar', className: 'text-rose-600 bg-rose-100/80 dark:bg-rose-500/10' };
  if (p < 75) return { label: 'Bom', className: 'text-amber-600 bg-amber-100/80 dark:bg-amber-500/10' };
  return { label: 'Excelente', className: 'text-emerald-600 bg-emerald-100/80 dark:bg-emerald-500/10' };
};

/* Score Ring */
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

// =====================================================================================
// COMPONENTE PRINCIPAL REESTRUTURADO (exibe todos os campos do JSON)
// =====================================================================================
const NewAnalysisContent: React.FC<{ analysis: NewAnalysis; onCopy: (text: string, type: string) => void; copied: string | null }> = ({ analysis, onCopy, copied }) => {
  const overallPercent = useMemo(() => {
    const s = analysis.performance.overallScore;
    return s <= 10 ? s * 10 : s;
  }, [analysis.performance.overallScore]);

  const rating = useMemo(() => ratingFromPercent(overallPercent), [overallPercent]);

  const stageEntries = Object.entries(analysis.performance.stages) as [StageKey, StageData][];
  const lowestStage = useMemo(() => stageEntries.reduce((acc, cur) => (cur[1].score < acc[1].score ? cur : acc), stageEntries[0]), [stageEntries]);

  return (
    <div className="space-y-12">
      {/* Resumo */}
      <section>
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-3"><ClipboardIcon className="w-5 h-5 text-cyan-500" /> Resumo da Ligação</h3>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white/90 to-slate-50/70 dark:from-slate-900/60 dark:to-slate-800/50 p-5">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 pr-2">{analysis.summary}</p>
          <div className="mt-4 flex items-center gap-2">
            <button onClick={() => onCopy(analysis.summary, 'resumo')} className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">{copied === 'resumo' ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <CopyIcon className="w-4 h-4" />}{copied === 'resumo' ? 'Copiado!' : 'Copiar resumo'}</button>
            <a href="#pontos-melhoria" className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition"><LightbulbIcon className="w-4 h-4" /> Ver dicas práticas</a>
          </div>
        </div>
      </section>

      {/* Performance */}
      <section id="detalhes-performance">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-4"><RocketIcon className="w-5 h-5 text-emerald-500" /> Análise de Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 p-6 shadow-sm h-full">
              <div className="flex flex-col items-center justify-center gap-6 text-center h-full">
                <ScoreRing scorePercent={overallPercent} label={`Score (${analysis.performance.overallScore})`} />
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${rating.className}`}>{rating.label}</span>
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
      
      {/* ADICIONADO: Seção para exibir o speakerMapping */}
      <section>
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-3"><ChatBubbleIcon className="w-5 h-5 text-sky-500" /> Identificação dos Participantes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(analysis.speakerMapping).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{key}</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white capitalize">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Perfil do Cliente */}
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

      {/* Pontos de Melhoria (com detalhes adicionais do JSON) */}
      <section id="pontos-melhoria">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-3"><WrenchIcon className="w-5 h-5 text-rose-500" /> Pontos de Melhoria</h3>
        <div className="space-y-4">
          {analysis.improvementPoints.map((item, idx) => (
            <div key={idx} className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 text-sm flex-1">
                  <p className="italic text-slate-500 dark:text-slate-400 border-l-4 border-slate-300 dark:border-slate-600 pl-3">“{item.salespersonLine}”</p>
                  <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300"><ChatBubbleIcon className="w-4 h-4 mt-0.5 text-sky-500 flex-shrink-0" /><span><strong className="text-slate-900 dark:text-white">Contexto:</strong> {item.context}</span></p>

                  {item.whatWentWrong && (
                    <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300"><svg className="w-4 h-4 mt-0.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01" /></svg><span><strong className="text-slate-900 dark:text-white">O que deu errado:</strong> {item.whatWentWrong}</span></p>
                  )}

                  {item.impact && (
                    <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Impacto:</strong> {item.impact}</p>
                  )}

                  <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300"><LightbulbIcon className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" /><span><strong className="text-slate-900 dark:text-white">Sugestão (o que deveria ter sido feito):</strong> {item.suggestion}</span></p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <button onClick={() => onCopy(item.suggestion, `sug-${idx}`)} className="self-start inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="Copiar sugestão">{copied === `sug-${idx}` ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <CopyIcon className="w-4 h-4" />}{copied === `sug-${idx}` ? 'Copiado!' : 'Copiar'}</button>
                  <button onClick={() => onCopy(`${item.salespersonLine}\nContexto: ${item.context}\nO que deu errado: ${item.whatWentWrong || '-'}\nImpacto: ${item.impact || '-'}\nSugestão: ${item.suggestion}`, `card-${idx}`)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition">Copiar card</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// =====================================================================================
// PÁGINA PRINCIPAL (consome a analysis retornada pela API)
// =====================================================================================
export const AnalysisDetailPage: React.FC<AnalysisDetailPageProps> = ({ callId, onBack }) => {
  const [call, setCall] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumo' | 'analiseDetalhada'>('resumo');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    api 
      .get<Task>(`/tasks/${callId}`)
      .then((response) => setCall(response.data))
      .catch(() => setError('Não foi possível carregar os detalhes da análise.'))
      .finally(() => setIsLoading(false));
  }, [callId]);

  const handleCopy = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  }, []);

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

  const analysisData: NewAnalysis = useMemo(() => {
    const raw = (call as any)?.analysis;
    return isNewAnalysis(raw) ? raw : MOCK_ANALYSIS;
  }, [call]);

  if (isLoading) return <div className="text-center p-8">Carregando análise...</div>;
  if (error || !call) return <div className="text-center p-8 text-red-500">{error || 'Análise não encontrada.'}</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"><ArrowLeftIcon className="w-5 h-5" /> Voltar para o Dashboard</button>
        <div className="flex items-center gap-2">
          <button onClick={() => handleCopy(`${window.location.origin}/tasks/${callId}`, 'link')} className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">{copied === 'link' ? <CheckIcon className="w-5 h-5 text-emerald-500" /> : <LinkIcon className="w-5 h-5" />}{copied === 'link' ? 'Link copiado!' : 'Copiar link'}</button>
          <a href={`${API_URL}/tasks/${callId}/pdf?token=${localStorage.getItem('authToken')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 text-white hover:opacity-95 transition"><DocumentArrowDownIcon className="w-5 h-5" /> Exportar PDF</a>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 shadow-lg overflow-hidden backdrop-blur-md">
        <div className="p-6 md:p-8">
          <header className="pb-6 border-b border-slate-200/70 dark:border-slate-700/60">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Análise com Cliente: <span className="text-primary-600 dark:text-primary-400">{call.clientName || 'Não informado'}</span></h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200"><UserIcon className="w-4 h-4" /> Vendedora: <strong className="font-semibold ml-1">{call.saleswoman?.name || 'Não identificada'}</strong></span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200"><CalendarIcon className="w-4 h-4" /> {dateFormatted}</span>
            </div>
          </header>

          <div className="mt-6">
            <div className="inline-flex p-1 bg-slate-100/80 dark:bg-slate-800/70 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/50">
              {(['resumo', 'analiseDetalhada'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                  {tab === 'resumo' ? 'Resumo e Transcrição' : 'Análise Detalhada'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {activeTab === 'analiseDetalhada' && (<NewAnalysisContent analysis={analysisData} onCopy={handleCopy} copied={copied} />)}

            {activeTab === 'resumo' && (
              <section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-3">Áudio da Ligação</h3>
                    <audio controls className="w-full"><source src={`${API_URL}/tasks/${call.id}/audio?token=${localStorage.getItem('authToken')}`} type="audio/mpeg" />Seu navegador não suporta o elemento de áudio.</audio>
                    <div className="mt-4">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-3">Resumo da Conversa</h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-4 rounded-lg border border-slate-200 dark:border-slate-700">{analysisData.summary}</p>
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
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDetailPage;