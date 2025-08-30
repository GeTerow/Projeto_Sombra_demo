import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { User } from '../types/types';
import { AddUserModal } from '../components/AddUserModal';
import { ShieldCheckIcon, PlusIcon } from '../components/icons';

export const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get<User[]>('/users');
            setUsers(response.data);
        } catch (err) {
            setError('Não foi possível carregar os usuários. O endpoint para listar usuários pode não existir no backend.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUserAdded = () => {
        fetchUsers(); // Re-fetch to get the full updated list
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="flex items-center justify-between my-6">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <ShieldCheckIcon className="w-8 h-8 text-primary-500" />
                    Gerenciar Usuários
                </h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                >
                    <PlusIcon className="w-4 h-4" /> Adicionar Usuário
                </button>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">{error}</div>}

            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-700/50 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nome</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Função</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Criado em</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center p-8 text-slate-500 dark:text-slate-400">Carregando usuários...</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <AddUserModal onClose={() => setIsModalOpen(false)} onUserAdded={handleUserAdded} />}
        </div>
    );
};