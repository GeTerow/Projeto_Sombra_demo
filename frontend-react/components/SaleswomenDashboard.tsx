import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../src/services/api';
import type { Task, Saleswoman } from '../types';
import { CallSummaryCard } from './CallSummaryCard';
import { Spinner } from './Spinner';
import { API_URL } from '../config';
import { AddSaleswomanModal } from './AddSaleswomanModal';
import { EditSaleswomanModal } from './EditSalesWomanModal';

// --- ÍCONES ---
const DocumentPlusIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
const ArrowDownTrayIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" /></svg>;
const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 1 12.72-5.307M19.5 12a7.5 7.5 0 0 1-12.72 5.307M8.25 7.5H3v5.25" /></svg>;
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" /></svg>;
const PencilIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.06-1.06L10.5 12.94l-1.72-1.72a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.5-4.5z" clipRule="evenodd" /></svg>;
const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 011.06 0L12 9.94l.72-.72a.75.75 0 111.06 1.06L13.06 11l.72.72a.75.75 0 11-1.06 1.06L12 12.06l-.72.72a.75.75 0 01-1.06-1.06L10.94 11l-.72-.72a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>;

// --- HELPERS E COMPONENTES AUXILIARES ---
const getInitials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('');
const colorFromString = (s: string) => { let hash = 0; for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash); return `hsl(${Math.abs(hash) % 360} 70% 40%)`; };
const formatRelativeTime = (date: string | number | Date) => { try { const d = new Date(date).getTime(); const diff = Date.now() - d; const sec = Math.floor(diff / 1000); if (sec < 60) return 'há poucos segundos'; const min = Math.floor(sec / 60); if (min < 60) return `há ${min} ${min === 1 ? 'minuto' : 'minutos'}`; const hr = Math.floor(min / 60); if (hr < 24) return `há ${hr} ${hr === 1 ? 'hora' : 'horas'}`; const day = Math.floor(hr / 24); return `há ${day} ${day === 1 ? 'dia' : 'dias'}`; } catch { return ''; } };

const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 40 }) => ( <div className="flex items-center justify-center rounded-full text-white font-semibold shadow-inner" style={{ width: size, height: size, background: `linear-gradient(135deg, ${colorFromString(name)}, #333)` }} title={name}>{getInitials(name)}</div> );
const Badge: React.FC<{ children: React.ReactNode; color?: 'slate' | 'green' | 'amber' | 'indigo'; className?: string }> = ({ children, color = 'slate', className }) => { const map: Record<string, string> = { slate: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200', green: 'bg-green-100 text-green-700 dark:bg-green-600/20 dark:text-green-300', amber: 'bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-300', indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-300', }; return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${map[color]} ${className || ''}`}>{children}</span>; };
const Skeleton: React.FC<{ className?: string }> = ({ className }) => <div className={`animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-700/50 ${className}`} />;
type ToastType = 'success' | 'error' | 'info';
const Toast: React.FC<{ open: boolean; type?: ToastType; message: string; onClose: () => void }> = ({ open, type = 'info', message, onClose }) => { if (!open) return null; const colorMap: Record<ToastType, string> = { success: 'bg-emerald-600 text-white', error: 'bg-rose-600 text-white', info: 'bg-slate-800 text-white', }; return ( <div className="fixed inset-0 pointer-events-none z-[60]"><div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto"><div className={`${colorMap[type]} shadow-xl rounded-lg px-4 py-3 flex items-center gap-3 min-w-[280px]`}>{type === 'success' && <CheckCircleIcon className="w-5 h-5" />}{type === 'error' && <ExclamationTriangleIcon className="w-5 h-5" />}<span className="text-sm">{message}</span><button onClick={onClose} className="ml-auto text-white/80 hover:text-white transition-colors">Fechar</button></div></div></div> ); };
const ConfirmModal: React.FC<{ open: boolean; title?: string; message: string; confirmText?: string; cancelText?: string; onConfirm: () => void; onCancel: () => void }> = ({ open, title = 'Confirmar ação', message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel }) => { if (!open) return null; return ( <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}><div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" /><div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-[92vw] max-w-lg border border-slate-200 dark:border-slate-700 p-5" onClick={(e) => e.stopPropagation()}><h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3><p className="text-sm text-slate-600 dark:text-slate-300 mb-5">{message}</p><div className="flex justify-end gap-2"><button onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"> {cancelText} </button><button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm"> {confirmText} </button></div></div></div> ); };

// --- PROPS ---
interface SaleswomenDashboardProps {
  onSelectCall: (callId: string) => void;
  onDataChanged: () => void;
}

// --- COMPONENTE PRINCIPAL ---
export const SaleswomenDashboard: React.FC<SaleswomenDashboardProps> = ({ onSelectCall, onDataChanged }) => {
    const [saleswomen, setSaleswomen] = useState<Saleswoman[]>([]);
    const [selectedSaleswoman, setSelectedSaleswoman] = useState<Saleswoman | null>(null);
    const [calls, setCalls] = useState<Task[]>([]);
    const [isLoadingCalls, setIsLoadingCalls] = useState(false);
    const [isLoadingSaleswomen, setIsLoadingSaleswomen] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const [modalState, setModalState] = useState<'add' | 'edit' | 'delete' | null>(null);
    const [saleswomanToEdit, setSaleswomanToEdit] = useState<Saleswoman | null>(null);
    const [saleswomanToDelete, setSaleswomanToDelete] = useState<Saleswoman | null>(null);
    const [toast, setToast] = useState<{ open: boolean; type: ToastType; message: string }>({ open: false, type: 'info', message: '' });
    const [confirm, setConfirm] = useState<{ open: boolean; message: string; onConfirm: null | (() => void) }>({ open: false, message: '', onConfirm: null });

    const showToast = (type: ToastType, message: string) => {
        setToast({ open: true, type, message });
        window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 3500);
    };

    const fetchSaleswomen = async () => {
        setIsLoadingSaleswomen(true);
        try {
            const response = await api.get<Saleswoman[]>('/saleswomen');
            const fetched = response.data;
            setSaleswomen(fetched);
            if (fetched.length > 0) {
              const currentSelected = selectedSaleswoman ? fetched.find(s => s.id === selectedSaleswoman.id) : null;
              setSelectedSaleswoman(currentSelected || fetched[0]);
            } else {
              setSelectedSaleswoman(null);
            }
        } catch (err) { setError('Não foi possível carregar os dados das vendedoras.');
        } finally { setIsLoadingSaleswomen(false); }
    };

    useEffect(() => { fetchSaleswomen(); }, []);

    useEffect(() => {
        if (!selectedSaleswoman) { setCalls([]); return; }
        const controller = new AbortController();
        setIsLoadingCalls(true);
        api.get<Task[]>(`/tasks/saleswomen/${selectedSaleswoman.id}`, { signal: controller.signal })
            .then(res => setCalls(res.data))
            .catch(err => { if (err.name !== 'CanceledError') setError('Não foi possível carregar as chamadas.'); })
            .finally(() => setIsLoadingCalls(false));
        return () => controller.abort();
    }, [selectedSaleswoman?.id]);

    const handleGenerateSummary = async (force = false) => {
        if (!selectedSaleswoman) return;
        setIsGenerating(true);
        setError(null);
        try {
            await api.post(`/saleswomen/${selectedSaleswoman.id}/generate-summary-pdf`, { force });
            showToast('success', 'Resumo gerado com sucesso!');
            fetchSaleswomen();
        } catch (err: any) {
            if (err?.response?.status === 409) {
                setConfirm({ open: true, message: err.response.data.message, onConfirm: () => { setConfirm({ open: false, message: '', onConfirm: null }); handleGenerateSummary(true); }, });
            } else {
                const msg = err?.response?.data?.error || 'Falha ao gerar o resumo.';
                setError(msg);
                showToast('error', msg);
            }
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleDelete = async () => {
        if (!saleswomanToDelete) return;
        try {
            await api.delete(`/saleswomen/${saleswomanToDelete.id}`);
            showToast('success', `Vendedora "${saleswomanToDelete.name}" excluída.`);
            setModalState(null);
            onDataChanged();
            // Após deletar, busca a lista novamente para refletir a mudança
            fetchSaleswomen();
        } catch (err) {
            showToast('error', 'Falha ao excluir vendedora.');
        }
    };

    const filteredSaleswomen = useMemo(() => saleswomen.filter(s => s.name.toLowerCase().includes(query.toLowerCase())), [saleswomen, query]);
    const canDownload = !!selectedSaleswoman?.summaryPdfPath;

    return (
        <div className="relative">
            <div className="relative flex flex-col md:flex-row max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 gap-8 min-h-[calc(100vh-80px)]">
                <aside className="w-full md:w-1/3 lg:w-1/4">
                    <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-700/50 p-4 sticky top-24">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Vendedoras</h2>
                            <button onClick={() => setModalState('add')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
                                <PlusIcon className="w-4 h-4" /> Adicionar
                            </button>
                        </div>
                        <div className="relative mb-3">
                            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome..." className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600"/>
                            <SearchIcon className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 text-slate-400" />
                        </div>
                        {isLoadingSaleswomen ? (
                            <ul className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <li key={i}><Skeleton className="h-14 w-full" /></li>)}</ul>
                        ) : (
                            <ul className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                                {filteredSaleswomen.map(s => {
                                    const isSelected = selectedSaleswoman?.id === s.id;
                                    return (
                                        <li key={s.id} className="group relative">
                                            <button onClick={() => setSelectedSaleswoman(s)} className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 border ${isSelected ? 'bg-primary-600 text-white shadow-md border-primary-600' : 'bg-white/70 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200/60 dark:border-slate-700/60'}`}>
                                                <Avatar name={s.name} size={36} />
                                                <div className="flex-1 min-w-0"><div className="font-semibold truncate">{s.name}</div></div>
                                            </button>
                                            <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setSaleswomanToEdit(s); setModalState('edit'); }} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10"><PencilIcon className={`w-4 h-4 ${isSelected ? 'text-white/80' : 'text-slate-500'}`} /></button>
                                                <button onClick={() => { setSaleswomanToDelete(s); setModalState('delete'); }} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10"><TrashIcon className={`w-4 h-4 ${isSelected ? 'text-rose-300' : 'text-rose-500'}`} /></button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </aside>

                <main className="w-full md:w-2/3 lg:w-3/4">
                    {selectedSaleswoman ? (
                        <div className="animate-[fadeIn_0.25s_ease]">
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-xl bg-gradient-to-br from-white/90 to-white/60 dark:from-slate-800/80 dark:to-slate-800/50 mb-4 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar name={selectedSaleswoman.name} size={56} />
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{selectedSaleswoman.name}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                {selectedSaleswoman.summaryLastGeneratedAt && <Badge color="slate">Último resumo: {formatRelativeTime(selectedSaleswoman.summaryLastGeneratedAt)}</Badge>}
                                                {canDownload && <Badge color="green">PDF disponível</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleGenerateSummary(false)} disabled={isGenerating} className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"><DocumentPlusIcon className="w-5 h-5" /> {isGenerating ? 'Gerando...' : 'Gerar Resumo'}</button>
                                        <a href={`${API_URL}/saleswomen/${selectedSaleswoman.id}/download-summary-pdf?token=${localStorage.getItem('authToken')}`} className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 ${!canDownload && 'opacity-50 cursor-not-allowed'}`}><ArrowDownTrayIcon className="w-5 h-5" /> Baixar PDF</a>
                                    </div>
                                </div>
                                {error && <div className="mt-4 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 p-3 rounded-lg text-sm">{error}</div>}
                            </div>
                            {isLoadingCalls ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"><> {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</></div>
                            ) : calls.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {calls.map(call => <CallSummaryCard key={call.id} call={call} onClick={() => onSelectCall(call.id)} />)}
                                </div>
                            ) : (
                                <div className="text-center py-16 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/50"><p>Nenhuma chamada analisada para esta vendedora.</p></div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/50">
                            <div className="text-center p-10">
                                <PlusIcon className="w-12 h-12 mx-auto text-slate-400" />
                                <p className="mt-4 text-slate-600 dark:text-slate-300">{isLoadingSaleswomen ? 'Carregando vendedoras...' : 'Adicione ou selecione uma vendedora para começar.'}</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            
            {modalState === 'add' && <AddSaleswomanModal onClose={() => setModalState(null)} onSaleswomanAdded={() => { setModalState(null); onDataChanged(); fetchSaleswomen(); }} />}
            {modalState === 'edit' && saleswomanToEdit && <EditSaleswomanModal saleswoman={saleswomanToEdit} onClose={() => setModalState(null)} onSaleswomanUpdated={() => { setModalState(null); onDataChanged(); fetchSaleswomen(); }} />}
            {modalState === 'delete' && saleswomanToDelete && <ConfirmModal open={true} title="Confirmar Exclusão" message={`Tem certeza de que deseja excluir "${saleswomanToDelete.name}"? Todas as suas análises serão removidas.`} confirmText="Excluir" onConfirm={handleDelete} onCancel={() => setModalState(null)} />}
            {toast.open && <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast(t => ({ ...t, open: false }))} />}
            {confirm.open && <ConfirmModal open={confirm.open} message={confirm.message} onConfirm={confirm.onConfirm!} onCancel={() => setConfirm({ open: false, message: '', onConfirm: null })} />}
        </div>
    );
};