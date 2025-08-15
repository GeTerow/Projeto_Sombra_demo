import React from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import type { View, Theme } from '../App';

// Ícone para a nova página de configurações
const CogIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5" /></svg>;

interface HeaderProps {
  currentView: View;
  onViewChange: (view: 'upload' | 'dashboard' | 'settings') => void; // Adicionado 'settings'
  theme: Theme;
  onThemeToggle: () => void;
}

const NavButton: React.FC<{
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-primary-500 text-white shadow-md'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`}
  >
    {children}
  </button>
);

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, theme, onThemeToggle }) => {
  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-primary-500" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              Projeto Sombra
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <NavButton onClick={() => onViewChange('upload')} isActive={currentView.name === 'upload'}>
                <UploadIcon className="h-5 w-5" /> Enviar Áudio
              </NavButton>
              <NavButton onClick={() => onViewChange('dashboard')} isActive={currentView.name === 'dashboard' || currentView.name === 'analysis'}>
                <UsersIcon className="h-5 w-5" /> Vendedoras
              </NavButton>
              <NavButton onClick={() => onViewChange('settings')} isActive={currentView.name === 'settings'}>
                <CogIcon className="h-5 w-5" /> Configurações
              </NavButton>
            </nav>
            <button
              onClick={onThemeToggle}
              className="p-2 rounded-full text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};