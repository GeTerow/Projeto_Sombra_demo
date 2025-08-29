import React, { useState } from 'react';
import api from '../services/api';
import { Spinner } from './Spinner';
import type { User, UserRole } from '../types/types';

interface Props {
  onClose: () => void;
  onUserAdded: (newUser: User) => void;
}

export const AddUserModal: React.FC<Props> = ({ onClose, onUserAdded }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('USER');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Todos os campos são obrigatórios.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await api.post<User>('/users', { name, email, password, role });
            onUserAdded(response.data); 
            onClose(); 
        } catch (err: any) {
            setError(err.response?.data?.error || 'Ocorreu um erro desconhecido ao adicionar o usuário.');
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
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Adicionar Novo Usuário</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="user-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                        <input id="user-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="user-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                        <input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="user-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                        <input id="user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="user-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Função</label>
                        <select id="user-role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md">
                            <option value="USER">Usuário</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                    </div>

                    {error && <p className="text-red-500 text-sm pt-2">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 rounded-md text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="px-5 py-2 bg-primary-600 text-white font-semibold rounded-md flex items-center gap-2 hover:bg-primary-700 disabled:bg-slate-400">
                            {isLoading && <Spinner />}
                            Adicionar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};