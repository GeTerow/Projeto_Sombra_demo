import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { AudioUploadForm } from './components/AudioUploadForm';
import { SaleswomenDashboard } from './components/SaleswomenDashboard';
import { AnalysisDetailPage } from './components/AnalysisDetailPage';
import { AddSaleswomanModal } from './components/AddSaleswomanModal';
import { UploadProgressTracker } from './components/UploadProgressTracker';
import { SettingsPage } from './components/SettingsPage'; // Importa a nova página
import type { Task } from './types';
import { API_URL } from './config';

export type View =
    | { name: 'upload' }
    | { name: 'dashboard' }
    | { name: 'analysis', callId: string }
    | { name: 'settings' }; // Adiciona a nova view

export type Theme = 'light' | 'dark';

const App: React.FC = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [version, setVersion] = useState(0);
    const [currentView, setCurrentView] = useState<View>({ name: 'dashboard' });
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = window.localStorage.getItem('theme') as Theme;
            if (storedTheme) return storedTheme;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    });

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        const eventSource = new EventSource(`${API_URL}/tasks/stream`);
        eventSource.onopen = () => setIsConnected(true);
        eventSource.onmessage = (event) => {
            try {
                const updatedTask = JSON.parse(event.data) as Task;
                if (updatedTask.id) {
                    setTasks(prevTasks => {
                        const existingTaskIndex = prevTasks.findIndex(t => t.id === updatedTask.id);
                        if (existingTaskIndex !== -1) {
                            const newTasks = [...prevTasks];
                            newTasks[existingTaskIndex] = updatedTask;
                            return newTasks;
                        } else {
                            return [updatedTask, ...prevTasks].slice(0, 20);
                        }
                    });
                }
            } catch (error) {
                console.error("Failed to parse SSE event data:", error);
            }
        };
        eventSource.onerror = () => {
            setIsConnected(false);
            eventSource.close();
        };
        return () => eventSource.close();
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleThemeToggle = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    const navigateTo = (viewName: 'upload' | 'dashboard' | 'settings') => {
        setCurrentView({ name: viewName } as View);
    };

    const navigateToAnalysis = (callId: string) => {
        setCurrentView({ name: 'analysis', callId });
    };

    const handleSaleswomanChange = () => {
        setVersion(v => v + 1); // Força a atualização do dashboard
    };

    const renderContent = () => {
        switch (currentView.name) {
            case 'upload':
                return (
                    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="lg:col-span-3"><AudioUploadForm key={`form-${version}`} /></div>
                            <div className="lg:col-span-2"><UploadProgressTracker tasks={tasks} isConnected={isConnected} /></div>
                        </div>
                    </div>
                );
            case 'dashboard':
                return <SaleswomenDashboard key={`dashboard-${version}`} onSelectCall={navigateToAnalysis} onDataChanged={handleSaleswomanChange} />;
            case 'analysis':
                return <AnalysisDetailPage callId={currentView.callId} onBack={() => navigateTo('dashboard')} />;
            case 'settings':
                return <SettingsPage />;
            default:
                return <SaleswomenDashboard key={`dashboard-default-${version}`} onSelectCall={navigateToAnalysis} onDataChanged={handleSaleswomanChange} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
            <Header currentView={currentView} onViewChange={navigateTo} theme={theme} onThemeToggle={handleThemeToggle} />
            <main className="relative">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900" />
                <div className="relative">{renderContent()}</div>
            </main>
        </div>
    );
};

export default App;