import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/services/api';
import type { Task, Saleswoman } from '@/types/types';

type ToastType = 'success' | 'error' | 'info';

export const useSaleswomenDashboard = (onDataChanged: () => void) => {
    const [saleswomen, setSaleswomen] = useState<Saleswoman[]>([]);
    const [selectedSaleswoman, setSelectedSaleswoman] = useState<Saleswoman | null>(null);
    const [calls, setCalls] = useState<Task[]>([]);
    const [isLoadingCalls, setIsLoadingCalls] = useState(false);
    const [isLoadingSaleswomen, setIsLoadingSaleswomen] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');


    const [modalState, setModalState] = useState<'add' | 'edit' | 'delete' | null>(null);
    const [saleswomanToEdit, setSaleswomanToEdit] = useState<Saleswoman | null>(null);
    const [saleswomanToDelete, setSaleswomanToDelete] = useState<Saleswoman | null>(null);
    const [toast, setToast] = useState<{ open: boolean; type: ToastType; message: string }>({ open: false, type: 'info', message: '' });
    const [confirm, setConfirm] = useState<{ open: boolean; message: string; onConfirm: null | (() => void) }>({ open: false, message: '', onConfirm: null });

    const showToast = useCallback((type: ToastType, message: string) => {
        setToast({ open: true, type, message });
        window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 3500);
    }, []);

    const fetchSaleswomen = useCallback(async () => {
        setIsLoadingSaleswomen(true);
        try {
            const response = await api.get<Saleswoman[]>('/saleswomen');
            const fetched = response.data;
            setSaleswomen(fetched);
            if (fetched.length > 0) {
                // Mantém a vendedora selecionada se ela ainda existir na lista atualizada
                const currentSelectedId = selectedSaleswoman?.id;
                const currentSelected = currentSelectedId ? fetched.find(s => s.id === currentSelectedId) : null;
                setSelectedSaleswoman(currentSelected || fetched[0]);
            } else {
                setSelectedSaleswoman(null);
            }
        } catch (err) {
            setError('Não foi possível carregar os dados das vendedoras.');
        } finally {
            setIsLoadingSaleswomen(false);
        }
    }, [selectedSaleswoman?.id]);

    useEffect(() => {
        fetchSaleswomen();
    }, []);

    useEffect(() => {
        if (!selectedSaleswoman) {
            setCalls([]);
            return;
        }
        const controller = new AbortController();
        setIsLoadingCalls(true);
        api.get<Task[]>(`/tasks/saleswomen/${selectedSaleswoman.id}`, { signal: controller.signal })
            .then(res => setCalls(res.data))
            .catch(err => { if (err.name !== 'CanceledError') setError('Não foi possível carregar as chamadas.'); })
            .finally(() => setIsLoadingCalls(false));
        return () => controller.abort();
    }, [selectedSaleswoman?.id]);

    const handleGenerateSummary = useCallback(async (force = false) => {
        if (!selectedSaleswoman) return;
        setIsGenerating(true);
        setError(null);
        try {
            await api.post(`/saleswomen/${selectedSaleswoman.id}/generate-summary-pdf`, { force });
            showToast('success', 'Resumo gerado com sucesso!');
            await fetchSaleswomen(); // Re-busca para atualizar os dados
        } catch (err: any) {
            if (err?.response?.status === 409) {
                setConfirm({ 
                    open: true, 
                    message: err.response.data.message, 
                    onConfirm: () => { 
                        setConfirm({ open: false, message: '', onConfirm: null }); 
                        handleGenerateSummary(true); 
                    }, 
                });
            } else {
                const msg = err?.response?.data?.error || 'Falha ao gerar o resumo.';
                setError(msg);
                showToast('error', msg);
            }
        } finally {
            setIsGenerating(false);
        }
    }, [selectedSaleswoman, fetchSaleswomen, showToast]);

    const handleSendEmail = useCallback(async () => {
        if (!selectedSaleswoman) return;
        setIsSendingEmail(true);
        try {
            const response = await api.post(`/saleswomen/${selectedSaleswoman.id}/send-summary-email`);
            showToast('success', response.data.message || 'E-mail enviado com sucesso!');
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Falha ao enviar e-mail.';
            showToast('error', msg);
        } finally {
            setIsSendingEmail(false);
        }
    }, [selectedSaleswoman, showToast]);

    const handleDelete = useCallback(async () => {
        if (!saleswomanToDelete) return;
        try {
            await api.delete(`/saleswomen/${saleswomanToDelete.id}`);
            showToast('success', `Vendedora "${saleswomanToDelete.name}" excluída.`);
            setModalState(null);
            onDataChanged(); // Notifica o componente pai sobre a mudança
            await fetchSaleswomen(); // Re-busca para atualizar a lista
        } catch (err) {
            showToast('error', 'Falha ao excluir vendedora.');
        }
    }, [saleswomanToDelete, onDataChanged, fetchSaleswomen, showToast]);

    const filteredSaleswomen = useMemo(() => 
        saleswomen.filter(s => s.name.toLowerCase().includes(query.toLowerCase())), 
        [saleswomen, query]
    );

    const canDownload = !!selectedSaleswoman?.summaryPdfPath;

    return {
        states: {
            saleswomen: filteredSaleswomen,
            selectedSaleswoman,
            calls,
            isLoadingCalls,
            isLoadingSaleswomen,
            isGenerating,
            isSendingEmail,
            error,
            query,
            modalState,
            saleswomanToEdit,
            saleswomanToDelete,
            toast,
            confirm,
            canDownload,
        },
        actions: {
            setSelectedSaleswoman,
            setQuery,
            setModalState,
            setSaleswomanToEdit,
            setSaleswomanToDelete,
            setToast,
            setConfirm,
            handleGenerateSummary,
            handleSendEmail,
            handleDelete,
            fetchSaleswomen,
            onDataChanged
        }
    };
};