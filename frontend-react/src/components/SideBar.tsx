import React from 'react';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { CogIcon } from './icons/CogIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { SunIcon } from './icons/SunIcon';
import { UploadIcon } from './icons/UploadIcon';
import { UsersIcon } from './icons/UsersIcon';
import { SidebarProps } from '@/types/types';

const NavButton: React.FC<{
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${
      isActive
        ? 'bg-primary-600 text-white shadow-md'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
    }`}
  >
    {children}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout, user, theme, onThemeToggle }) => {
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex h-full w-64 flex-col border-r border-slate-200/80 bg-white/70 p-4 backdrop-blur-lg dark:border-slate-700/50 dark:bg-slate-800/60">
      <div className="flex items-center gap-3 p-2 mb-4">
        <ChartBarIcon className="h-9 w-9 text-primary-500" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
          Projeto Sombra
        </h1>
      </div>
      
      <nav className="flex flex-1 flex-col gap-2">
        <NavButton onClick={() => onViewChange('dashboard')} isActive={currentView.name === 'dashboard' || currentView.name === 'analysis'}>
          <UsersIcon className="h-5 w-5" /> Vendedoras
        </NavButton>
        <NavButton onClick={() => onViewChange('upload')} isActive={currentView.name === 'upload'}>
          <UploadIcon className="h-5 w-5" /> Enviar Áudio
        </NavButton>

        {isAdmin && (
          <>
            <div className="my-2 border-t border-slate-200 dark:border-slate-700/50" />
            <span className="px-3 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Admin</span>
            <NavButton onClick={() => onViewChange('users')} isActive={currentView.name === 'users'}>
              <ShieldCheckIcon className="h-5 w-5" /> Usuários
            </NavButton>
            <NavButton onClick={() => onViewChange('settings')} isActive={currentView.name === 'settings'}>
              <CogIcon className="h-5 w-5" /> Configurações
            </NavButton>
          </>
        )}
      </nav>

      <div className="mt-auto space-y-2">
        <button
            onClick={onThemeToggle}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
        >
            {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
            <span>Mudar Tema</span>
        </button>

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          <LogoutIcon className="h-5 w-5" /> Sair
        </button>
      </div>
    </aside>
  );
};