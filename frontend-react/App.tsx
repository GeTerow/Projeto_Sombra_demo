// frontend-react/App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { AudioUploadForm } from './components/AudioUploadForm';
import { SaleswomenDashboard } from './components/SaleswomenDashboard';
import { AnalysisDetailPage } from './components/AnalysisDetailPage';
import { AddSaleswomanModal } from './components/AddSaleswomanModal';
import { UploadProgressTracker } from './components/UploadProgressTracker';
import type { Task } from './types';
import { API_URL } from './config';


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

    // Estado para o UploadProgressTracker (estado elevado)
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    // Efeito para o SSE (movido de UploadProgressTracker para App)
    useEffect(() => {
        const eventSource = new EventSource(`${API_URL}/tasks/stream`);

        eventSource.onopen = () => {
            console.log("SSE Connection opened in App!");
            setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.message) {
                    console.log("SSE Status:", data.message);
                    return;
                }

                const updatedTask = data as Task;

                setTasks(prevTasks => {
                    const existingTaskIndex = prevTasks.findIndex(t => t.id === updatedTask.id);
                    if (existingTaskIndex !== -1) {
                        const newTasks = [...prevTasks];
                        newTasks[existingTaskIndex] = updatedTask;
                        return newTasks;
                    } else {
                        const latestTasks = [updatedTask, ...prevTasks];
                        return latestTasks.slice(0, 20); // Mantém apenas os últimos 20
                    }
                });
            } catch (error) {
                console.error("Failed to parse SSE event data:", error);
            }
        };

        eventSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            setIsConnected(false);
            eventSource.close();
        };
        
        return () => {
            console.log("Closing SSE connection.");
            eventSource.close();
        };

    }, []);


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
                return (
                    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="lg:col-span-3">
                                <AudioUploadForm key={`form-${version}`} />
                            </div>
                            <div className="lg:col-span-2">
                                <UploadProgressTracker tasks={tasks} isConnected={isConnected} />
                            </div>
                        </div>
                    </div>
                );
            case 'dashboard':
                return <SaleswomenDashboard
                            key={`dashboard-${version}`}
                            onSelectCall={navigateToAnalysis}
                            onAddSaleswoman={() => setIsAddModalOpen(true)}
                        />;
            case 'analysis':
                return <AnalysisDetailPage
                            callId={currentView.callId}
                            onBack={() => navigateTo('dashboard')}
                        />;
            default:
                return <SaleswomenDashboard
                            key={`dashboard-default-${version}`}
                            onSelectCall={navigateToAnalysis}
                            onAddSaleswoman={() => setIsAddModalOpen(true)}
                        />;
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