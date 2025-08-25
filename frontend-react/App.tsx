import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/SideBar';
import { AudioUploadForm } from './components/AudioUploadForm';
import { SaleswomenDashboard } from './components/SaleswomenDashboard';
import { AnalysisDetailPage } from './components/AnalysisDetailPage';
import { SettingsPage } from './components/SettingsPage';
import { UserManagementPage } from './components/UserManagementPage';
import type { Task } from './types';
import { API_URL } from './config';
import { LoginPage } from './components/LoginPage';
import api from './src/services/api';
import { UploadProgressTracker } from './components/UploadProgressTracker';

export type View =
    | { name: 'upload' }
    | { name: 'dashboard' }
    | { name: 'analysis', callId: string }
    | { name: 'settings' }
    | { name: 'users' };

export type Theme = 'light' | 'dark';

const App: React.FC = () => {
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
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('authToken'));
    const [user, setUser] = useState<any>(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const handleLoginSuccess = (token: string, userData: any) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAuthenticated(true);
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
    };

    useEffect(() => {
        if (isAuthenticated) {
            const eventSource = new EventSource(`${API_URL}/tasks/stream?token=${localStorage.getItem('authToken')}`);
            
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
                                return [...prevTasks, updatedTask];
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
        }
    }, [isAuthenticated]);


    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleThemeToggle = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    const navigateTo = (viewName: 'upload' | 'dashboard' | 'settings' | 'users') => {
        setCurrentView({ name: viewName } as View);
    };

    const navigateToAnalysis = (callId: string) => {
        setCurrentView({ name: 'analysis', callId });
    };

    const handleSaleswomanChange = () => {
        setVersion(v => v + 1);
    };

    const handleTaskDataChange = () => {
        // Refiltra as tarefas para remover as que foram apagadas (status FAILED)
        setTasks(prev => prev.filter(task => task.status !== 'FAILED'));
        // Força a atualização de outros componentes que dependem de dados gerais, se necessário
        setVersion(v => v + 1);
    };
    
    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    const renderContent = () => {
        switch (currentView.name) {
            case 'upload':
                return (
                    <div className="max-w-7xl mx-auto p-4 md:p-8 flex items-center min-h-screen">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full">
                            <div className="lg:col-span-3"><AudioUploadForm key={`form-${version}`} /></div>
                            <div className="lg:col-span-2"><UploadProgressTracker tasks={tasks} isConnected={isConnected} isAdmin={user?.role === 'ADMIN'} onDataChanged={handleTaskDataChange} /></div>
                        </div>
                    </div>
                );
            case 'dashboard':
                return <SaleswomenDashboard key={`dashboard-${version}`} onSelectCall={navigateToAnalysis} onDataChanged={handleSaleswomanChange} />;
            case 'analysis':
                return <AnalysisDetailPage callId={currentView.callId} onBack={() => navigateTo('dashboard')} />;
            case 'settings':
                return <SettingsPage />;
            case 'users':
                return <UserManagementPage />;
            default:
                return <SaleswomenDashboard key={`dashboard-default-${version}`} onSelectCall={navigateToAnalysis} onDataChanged={handleSaleswomanChange} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
            <Sidebar 
                currentView={currentView} 
                onViewChange={navigateTo} 
                theme={theme} 
                onThemeToggle={handleThemeToggle} 
                onLogout={handleLogout}
                user={user}
            />
            <main className="relative pl-64">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900" />
                <div className="relative z-0">{renderContent()}</div>
            </main>
        </div>
    );
};

export default App;