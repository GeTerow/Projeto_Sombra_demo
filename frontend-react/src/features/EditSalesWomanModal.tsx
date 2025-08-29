import React, { useState } from 'react';
import api from '../services/api';
import { Spinner } from '../components/Spinner';
import type { Saleswoman } from '../types/types';

interface Props {
  saleswoman: Saleswoman;
  onClose: () => void;
  onSaleswomanUpdated: (updatedSaleswoman: Saleswoman) => void;
}

export const EditSaleswomanModal: React.FC<Props> = ({ saleswoman, onClose, onSaleswomanUpdated }) => {
    const [name, setName] = useState(saleswoman.name);
    const [email, setEmail] = useState(saleswoman.email || ''); // Estado para o e-mail
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('O nome não pode estar vazio.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            // Envia 'name' e 'email' para a API
            const response = await api.put<Saleswoman>(`/saleswomen/${saleswoman.id}`, { name, email });
            onSaleswomanUpdated(response.data);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Ocorreu um erro ao atualizar a vendedora.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-overlay-in"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-md animate-modal-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Editar Vendedora</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo Nome */}
                    <div>
                        <label htmlFor="saleswoman-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nome da Vendedora
                        </label>
                        <input
                            id="saleswoman-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"
                            required
                            autoFocus
                        />
                    </div>
                    {/* Novo Campo E-mail */}
                    <div>
                        <label htmlFor="saleswoman-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            E-mail
                        </label>
                        <input
                            id="saleswoman-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm pt-2">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 rounded-md text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isLoading} className="px-5 py-2 bg-primary-600 text-white font-semibold rounded-md flex items-center gap-2 hover:bg-primary-700 disabled:bg-slate-400">
                            {isLoading && <Spinner />}
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};