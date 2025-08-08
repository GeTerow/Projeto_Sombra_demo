import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { AudioUploadForm } from './components/AudioUploadForm';
import { SaleswomenDashboard } from './components/SaleswomenDashboard';
import { AnalysisDetailPage } from './components/AnalysisDetailPage';
import { AddSaleswomanModal } from './components/AddSaleswomanModal'; // Certifique-se que o modal está importado

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
        // AQUI ESTÁ A CORREÇÃO: Adicionamos "as View" para dizer ao TypeScript
        // que este objeto é de um tipo compatível com o estado 'currentView'.
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
                            // AQUI PASSAMOS A FUNÇÃO QUE ABRE O MODAL
                            onAddSaleswoman={() => setIsAddModalOpen(true)}
                        />;
            case 'analysis':
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
            <main>
                {renderContent()}
            </main>
            
            {/* AQUI O MODAL É RENDERIZADO CONDICIONALMENTE */}
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