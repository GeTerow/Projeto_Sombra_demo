import React from 'react';
import { CallSummaryCard } from './CallSummaryCard';
import { AddSaleswomanModal } from '../saleswoman/AddSaleswomanModal';
import { EditSaleswomanModal } from '../saleswoman/EditSalesWomanModal';
import { DocumentPlusIcon, ArrowDownTrayIcon, PaperAirplaneIcon, PlusIcon, SearchIcon, PencilIcon, TrashIcon } from '../../components/icons';
import { Avatar, Badge, Skeleton, Toast, ConfirmModal } from '../../components/ui';
import { useSaleswomenDashboard } from '@/hooks/useSaleswomenDashboard';
import { API_URL } from '@/config';
import { SaleswomenDashboardProps } from '@/types/types';

export const SaleswomenDashboard: React.FC<SaleswomenDashboardProps> = ({ onSelectCall, onDataChanged }) => {
    const { states, actions } = useSaleswomenDashboard(onDataChanged);
    const {
        saleswomen, selectedSaleswoman, calls, isLoadingCalls, isLoadingSaleswomen,
        isGenerating, isSendingEmail, error, query, modalState, saleswomanToEdit,
        saleswomanToDelete, toast, confirm, canDownload
    } = states;
    const {
        setSelectedSaleswoman, setQuery, setModalState, setSaleswomanToEdit,
        setSaleswomanToDelete, handleGenerateSummary, handleSendEmail, handleDelete,
        fetchSaleswomen, onDataChanged: onSaleswomanDataChanged
    } = actions;

    return (
        <div className="relative">
            <div className="relative flex flex-col md:flex-row max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 gap-8 min-h-screen">
                <aside className="w-full md:w-1/3 lg:w-1/4">
                    <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-700/50 p-4 sticky top-6">
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
                            <ul className="space-y-2 max-h-[calc(100vh-12rem)] overflow-auto pr-1">
                                {saleswomen.map(s => {
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

                <main className="w-full md:w-2/3 lg:w-3/4 py-2">
                    {selectedSaleswoman ? (
                        <div className="animate-[fadeIn_0.25s_ease]">
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-xl bg-gradient-to-br from-white/90 to-white/60 dark:from-slate-800/80 dark:to-slate-800/50 mb-4 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar name={selectedSaleswoman.name} size={56} />
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{selectedSaleswoman.name}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                {selectedSaleswoman.summaryLastGeneratedAt && <Badge color="slate">Último resumo: {states.selectedSaleswoman && states.selectedSaleswoman.summaryLastGeneratedAt ? new Date(states.selectedSaleswoman.summaryLastGeneratedAt).toLocaleDateString('pt-BR') : ''}</Badge>}
                                                {canDownload && <Badge color="green">PDF disponível</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleGenerateSummary(false)} disabled={isGenerating} className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"><DocumentPlusIcon className="w-5 h-5" /> {isGenerating ? 'Gerando...' : 'Gerar Resumo'}</button>
                                        <a href={`${API_URL}/saleswomen/${selectedSaleswoman.id}/download-summary-pdf?token=${localStorage.getItem('authToken')}`} className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 ${!canDownload && 'opacity-50 cursor-not-allowed'}`}><ArrowDownTrayIcon className="w-5 h-5" /> Baixar PDF</a>
                                        <button onClick={handleSendEmail} disabled={isSendingEmail || !canDownload} className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><PaperAirplaneIcon className="w-5 h-5" /> {isSendingEmail ? 'Enviando...' : 'Enviar Email'}</button>
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
            
            {modalState === 'add' && <AddSaleswomanModal onClose={() => setModalState(null)} onSaleswomanAdded={() => { setModalState(null); onSaleswomanDataChanged(); fetchSaleswomen(); }} />}
            {modalState === 'edit' && saleswomanToEdit && <EditSaleswomanModal saleswoman={saleswomanToEdit} onClose={() => setModalState(null)} onSaleswomanUpdated={() => { setModalState(null); onSaleswomanDataChanged(); fetchSaleswomen(); }} />}
            {modalState === 'delete' && saleswomanToDelete && <ConfirmModal open={true} title="Confirmar Exclusão" message={`Tem certeza de que deseja excluir "${saleswomanToDelete.name}"? Todas as suas análises serão removidas.`} confirmText="Excluir" onConfirm={handleDelete} onCancel={() => setModalState(null)} />}
            {toast.open && <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => actions.setToast(t => ({ ...t, open: false }))} />}
            {confirm.open && <ConfirmModal open={confirm.open} message={confirm.message} onConfirm={confirm.onConfirm!} onCancel={() => actions.setConfirm({ open: false, message: '', onConfirm: null })} />}
        </div>
    );
};