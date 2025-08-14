// frontend-react/components/SaleswomenDashboard.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import type { Task, Saleswoman } from '../types';
import { CallSummaryCard } from './CallSummaryCard';
import { Spinner } from './Spinner';
import { API_URL } from '../config';

// =====================
// Ícones
// =====================
const DocumentPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
const ArrowDownTrayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
  </svg>
);
const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 1 12.72-5.307M19.5 12a7.5 7.5 0 0 1-12.72 5.307M8.25 7.5H3v5.25" />
  </svg>
);
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
  </svg>
);
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
  </svg>
);

// =====================
// Helpers visuais
// =====================
const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('');

const colorFromString = (s: string) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 40%)`;
};

const formatRelativeTime = (date: string | number | Date) => {
  try {
    const d = new Date(date).getTime();
    const diff = Date.now() - d;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'há poucos segundos';
    const min = Math.floor(sec / 60);
    if (min < 60) return `há ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `há ${hr} ${hr === 1 ? 'hora' : 'horas'}`;
    const day = Math.floor(hr / 24);
    return `há ${day} ${day === 1 ? 'dia' : 'dias'}`;
  } catch {
    return '';
  }
};

// =====================
// Componentes auxiliares (sem libs externas)
// =====================
const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 40 }) => (
  <div
    className="flex items-center justify-center rounded-full text-white font-semibold shadow-inner"
    style={{
      width: size,
      height: size,
      background: `linear-gradient(135deg, ${colorFromString(name)}, #333)`,
    }}
    title={name}
  >
    {getInitials(name)}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: 'slate' | 'green' | 'amber' | 'indigo'; className?: string }> = ({ children, color = 'slate', className }) => {
  const map: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    green: 'bg-green-100 text-green-700 dark:bg-green-600/20 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-300',
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${map[color]} ${className || ''}`}>{children}</span>;
};

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-700/50 ${className}`} />
);

type ToastType = 'success' | 'error' | 'info';
const Toast: React.FC<{ open: boolean; type?: ToastType; message: string; onClose: () => void }> = ({ open, type = 'info', message, onClose }) => {
  if (!open) return null;
  const colorMap: Record<ToastType, string> = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-800 text-white',
  };
  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className={`${colorMap[type]} shadow-xl rounded-lg px-4 py-3 flex items-center gap-3 min-w-[280px]`}>
          {type === 'success' && <CheckCircleIcon className="w-5 h-5" />}
          {type === 'error' && <ExclamationTriangleIcon className="w-5 h-5" />}
          <span className="text-sm">{message}</span>
          <button onClick={onClose} className="ml-auto text-white/80 hover:text-white transition-colors">Fechar</button>
        </div>
      </div>
    </div>
  );
};

const ConfirmModal: React.FC<{ open: boolean; title?: string; message: string; confirmText?: string; cancelText?: string; onConfirm: () => void; onCancel: () => void }> = ({
  open, title = 'Confirmar ação', message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-[92vw] max-w-lg border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"> {cancelText} </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm"> {confirmText} </button>
        </div>
      </div>
    </div>
  );
};

// =====================
// Props
// =====================
interface SaleswomenDashboardProps {
  onSelectCall: (callId: string) => void;
  onAddSaleswoman: () => void;
}

// =====================
// Componente principal
// =====================
export const SaleswomenDashboard: React.FC<SaleswomenDashboardProps> = ({ onSelectCall, onAddSaleswoman }) => {
  const [saleswomen, setSaleswomen] = useState<Saleswoman[]>([]);
  const [selectedSaleswoman, setSelectedSaleswoman] = useState<Saleswoman | null>(null);
  const [calls, setCalls] = useState<Task[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [isLoadingSaleswomen, setIsLoadingSaleswomen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI extras
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<{ open: boolean; type: ToastType; message: string }>({ open: false, type: 'info', message: '' });
  const [confirm, setConfirm] = useState<{ open: boolean; message: string; onConfirm: null | (() => void) }>({ open: false, message: '', onConfirm: null });

  const listRef = useRef<HTMLUListElement | null>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ open: true, type, message });
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 3500);
  };

  // Buscar vendedoras
  const fetchSaleswomen = () => {
    setIsLoadingSaleswomen(true);
    setError(null);
    axios.get<Saleswoman[]>(`${API_URL}/saleswomen`)
      .then(response => {
        const fetched = response.data;
        setSaleswomen(fetched);
        if (fetched.length > 0) {
          const currentSelected = selectedSaleswoman ? fetched.find(s => s.id === selectedSaleswoman.id) : null;
          setSelectedSaleswoman(currentSelected || fetched[0]);
        } else {
          setSelectedSaleswoman(null);
        }
      })
      .catch(err => {
        console.error('Erro ao buscar vendedoras:', err);
        setError('Não foi possível carregar os dados das vendedoras.');
      })
      .finally(() => setIsLoadingSaleswomen(false));
  };

  useEffect(() => {
    fetchSaleswomen();
  }, []);

  // Buscar chamadas quando seleciona vendedora (com cancelamento)
  useEffect(() => {
    if (!selectedSaleswoman) {
      setCalls([]);
      return;
    }
    const controller = new AbortController();
    setIsLoadingCalls(true);
    setError(null);
    setCalls([]);
    axios.get<Task[]>(`${API_URL}/tasks/saleswomen/${selectedSaleswoman.id}`, { signal: controller.signal as any })
      .then(res => setCalls(res.data))
      .catch(err => {
        if (axios.isCancel(err)) return;
        console.error(`Erro ao buscar chamadas para ${selectedSaleswoman.name}:`, err);
        setError('Não foi possível carregar as chamadas desta vendedora.');
      })
      .finally(() => setIsLoadingCalls(false));
    return () => controller.abort();
  }, [selectedSaleswoman?.id]);

  // Geração de resumo com confirmação elegante
  const handleGenerateSummary = async (force = false) => {
    if (!selectedSaleswoman) return;
    setIsGenerating(true);
    setError(null);

    try {
      await axios.post(`${API_URL}/saleswomen/${selectedSaleswoman.id}/generate-summary-pdf`, { force });
      showToast('success', 'Resumo gerado com sucesso! O novo PDF já está disponível para download.');
      fetchSaleswomen();
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 409 && data?.confirmationRequired) {
        setConfirm({
          open: true,
          message: data.message || 'Já existe um PDF recente. Deseja sobrescrever?',
          onConfirm: () => {
            setConfirm({ open: false, message: '', onConfirm: null });
            handleGenerateSummary(true);
          },
        });
      } else {
        const errorMessage = data?.error || 'Ocorreu uma falha desconhecida ao gerar o resumo.';
        setError(errorMessage);
        showToast('error', errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Filtragem de vendedoras
  const filteredSaleswomen = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return saleswomen;
    return saleswomen.filter(s => s.name.toLowerCase().includes(q));
  }, [saleswomen, query]);

  // Navegação por teclado na lista de vendedoras
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!filteredSaleswomen.length) return;
      const idx = selectedSaleswoman ? filteredSaleswomen.findIndex(s => s.id === selectedSaleswoman.id) : -1;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = filteredSaleswomen[(idx + 1) % filteredSaleswomen.length];
        if (next) setSelectedSaleswoman(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = filteredSaleswomen[(idx - 1 + filteredSaleswomen.length) % filteredSaleswomen.length];
        if (prev) setSelectedSaleswoman(prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filteredSaleswomen, selectedSaleswoman]);

  const canDownload = !!selectedSaleswoman?.summaryPdfPath;

  return (
    <div className="relative">
      {/* Fundo com gradiente suave */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900" />

      {/* Conteúdo */}
      <div className="relative flex flex-col md:flex-row max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 gap-8 min-h-[calc(100vh-80px)]">
        {/* ASIDE */}
        <aside className="w-full md:w-1/3 lg:w-1/4">
          <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-700/50 p-4 sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Vendedoras</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSaleswomen}
                  title="Atualizar lista"
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <RefreshIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={onAddSaleswoman}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                  title="Adicionar nova vendedora"
                >
                  <PlusIcon className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>

            {/* Busca */}
            <div className="relative mb-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome..."
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/60 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              <SearchIcon className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 text-slate-400" />
            </div>

            {/* Lista */}
            {isLoadingSaleswomen ? (
              <ul className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className="p-3 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-3 w-2/3 mb-2" />
                        <Skeleton className="h-2 w-1/3" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : filteredSaleswomen.length > 0 ? (
              <ul ref={listRef} className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {filteredSaleswomen.map(s => {
                  const selected = selectedSaleswoman?.id === s.id;
                  const lastGen = s.summaryLastGeneratedAt ? formatRelativeTime(s.summaryLastGeneratedAt) : null;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setSelectedSaleswoman(s)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 border ${
                          selected
                            ? 'bg-primary-600 text-white shadow-md border-primary-600'
                            : 'bg-white/70 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200/60 dark:border-slate-700/60'
                        }`}
                      >
                        <Avatar name={s.name} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold truncate ${selected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{s.name}</div>
                          <div className={`text-xs ${selected ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'}`}>
                            {lastGen ? `Resumo ${lastGen}` : 'Sem resumo gerado'}
                          </div>
                        </div>
                        {s.summaryPdfPath ? (
                          <Badge color={selected ? 'indigo' : 'green'}>{selected ? 'Pronto' : 'PDF'}</Badge>
                        ) : (
                          <Badge color="amber">Pendente</Badge>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-10 px-3 bg-white/50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 rounded-xl">
                <p className="text-slate-500 dark:text-slate-400">Nenhuma vendedora encontrada.</p>
                {saleswomen.length > 0 && <p className="text-xs mt-1 text-slate-400">Tente outro termo na busca.</p>}
              </div>
            )}
          </div>
        </aside>

        {/* MAIN */}
        <main className="w-full md:w-2/3 lg:w-3/4">
          {selectedSaleswoman ? (
            <div className="animate-[fadeIn_0.25s_ease]">
              {/* Header da vendedora */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-xl bg-gradient-to-br from-white/90 to-white/60 dark:from-slate-800/80 dark:to-slate-800/50 mb-4">
                <div className="absolute inset-0 pointer-events-none opacity-30">
                  <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary-500/20 blur-3xl" />
                  <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />
                </div>

                <div className="relative p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar name={selectedSaleswoman.name} size={56} />
                      <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                          {selectedSaleswoman.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedSaleswoman.summaryLastGeneratedAt ? (
                            <Badge color="slate">
                              Último resumo: {new Date(selectedSaleswoman.summaryLastGeneratedAt).toLocaleString('pt-BR')}
                            </Badge>
                          ) : (
                            <Badge color="amber">Sem resumo ainda</Badge>
                          )}
                          {canDownload && <Badge color="green">PDF disponível</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateSummary(false)}
                        disabled={isGenerating}
                        className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                      >
                        {isGenerating ? <Spinner /> : <DocumentPlusIcon className="w-5 h-5" />}
                        {isGenerating ? 'Gerando...' : 'Gerar Resumo'}
                      </button>
                      <a
                        href={`${API_URL}/saleswomen/${selectedSaleswoman.id}/download-summary-pdf`}
                        className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ${!canDownload ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                        aria-disabled={!canDownload}
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Baixar PDF
                      </a>
                      <button
                        onClick={() => {
                          if (selectedSaleswoman) {
                            // Apenas recarrega as chamadas da vendedora atual
                            const current = { ...selectedSaleswoman };
                            setSelectedSaleswoman(null);
                            setTimeout(() => setSelectedSaleswoman(current), 0);
                          }
                        }}
                        title="Atualizar chamadas"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <RefreshIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-500/30 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Chamadas */}
              {isLoadingCalls ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/50 shadow-md">
                      <Skeleton className="h-28 w-full mb-3" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : calls.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {calls.length} {calls.length === 1 ? 'chamada analisada' : 'chamadas analisadas'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {calls.map(call => (
                      <CallSummaryCard key={call.id} call={call} onClick={() => onSelectCall(call.id)} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/50 shadow-xl">
                  <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-primary-500/30 to-indigo-500/30 flex items-center justify-center">
                    <SearchIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">Nenhuma chamada analisada para esta vendedora ainda.</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Assim que houver chamadas, elas aparecerão aqui com o resumo.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/50 shadow-xl">
              <div className="text-center p-10">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-slate-300/50 to-slate-200/50 dark:from-slate-700/50 dark:to-slate-600/50 flex items-center justify-center">
                  <PlusIcon className="w-7 h-7 text-slate-500 dark:text-slate-300" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  {isLoadingSaleswomen ? 'Carregando vendedoras...' : 'Nenhuma vendedora selecionada. Adicione ou selecione uma para começar.'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de confirmação */}
      <ConfirmModal
        open={confirm.open}
        message={confirm.message}
        onCancel={() => setConfirm({ open: false, message: '', onConfirm: null })}
        onConfirm={() => confirm.onConfirm?.()}
      />

      {/* Toast */}
      <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast(t => ({ ...t, open: false }))} />
    </div>
  );
};