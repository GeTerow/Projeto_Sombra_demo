// frontend-react/App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { AudioUploadForm } from './components/AudioUploadForm';
import { SaleswomenDashboard } from './components/SaleswomenDashboard';
import { AnalysisDetailPage } from './components/AnalysisDetailPage';
import { AddSaleswomanModal } from './components/AddSaleswomanModal';

export type View =
    | { name: 'upload' }
    | { name: 'dashboard' }
    | { name: 'analysis', callId: string };

export type Theme = 'light' | 'dark';

const App: React.FC = () => {
    // ESTADO QUE CONTROLA SE O MODAL ESTÁ VISÍVEL
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Estado para forçar a atualização dos componentes filhos
    const [version, setVersion] = useState(0);
    
    const [currentView, setCurrentView] = useState<View>({ name: 'dashboard' });
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = window.localStorage.getItem('theme') as Theme;
            if (storedTheme) return storedTheme;
            return window.matchMedia('(prefers-color-scheme: light)').matches ? 'dark' : 'light';
        }
        return 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleThemeToggle = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    const navigateTo = (viewName: 'upload' | 'dashboard') => {
        setCurrentView({ name: viewName } as View);
    };

    const navigateToAnalysis = (callId: string) => {
        setCurrentView({ name: 'analysis', callId });
    };
    
    // Função chamada quando uma vendedora é adicionada com sucesso
    const handleSaleswomanAdded = () => {
        setIsAddModalOpen(false); // Fecha o modal
        setVersion(v => v + 1); // Altera a "versão", forçando o dashboard a recarregar
    };

    const renderContent = () => {
        switch (currentView.name) {
            case 'upload':
                return <AudioUploadForm key={`form-${version}`} />;
            case 'dashboard':
                return <SaleswomenDashboard
                            key={`dashboard-${version}`}
                            onSelectCall={navigateToAnalysis}
                            onAddSaleswoman={() => setIsAddModalOpen(true)}
                        />;
            case 'analysis':
                // CORREÇÃO APLICADA AQUI:
                // As props 'callId' e 'onBack' estão sendo passadas corretamente.
                return <AnalysisDetailPage
                            callId={currentView.callId}
                            onBack={() => navigateTo('dashboard')}
                        />;
            default:
                return <AudioUploadForm />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
            <Header
                currentView={currentView}
                onViewChange={navigateTo}
                theme={theme}
                onThemeToggle={handleThemeToggle}
            />
            <main className="relative">
                {/* FUNDO COM GRADIENTE APLICADO GLOBALMENTE */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900" />
                
                <div className="relative">
                    {renderContent()}
                </div>
            </main>
            
            {isAddModalOpen && (
                <AddSaleswomanModal 
                    onClose={() => setIsAddModalOpen(false)} 
                    onSaleswomanAdded={handleSaleswomanAdded} 
                />
            )}
        </div>
    );
};

export default App;