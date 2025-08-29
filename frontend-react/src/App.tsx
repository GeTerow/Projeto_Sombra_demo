import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/SideBar';
import { AudioUploadForm } from './components/AudioUploadForm';
import { SaleswomenDashboard } from './features/SaleswomenDashboard';
import { AnalysisDetailPage } from './components/AnalysisDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { LoginPage } from './pages/LoginPage';
import { UploadProgressTracker } from './components/UploadProgressTracker';
import { useAuth } from '@/hooks/useAuth';
import { useTaskStream } from '@/hooks/useTaskStream';

export type View =
    | { name: 'upload' }
    | { name: 'dashboard' }
    | { name: 'analysis', callId: string }
    | { name: 'settings' }
    | { name: 'users' };

export type Theme = 'light' | 'dark';

const App: React.FC = () => {
    const { isAuthenticated, user, handleLoginSuccess, handleLogout } = useAuth();
    const { tasks, isConnected, setTasks } = useTaskStream(isAuthenticated);

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
        setTasks(prev => prev.filter(task => task.status !== 'FAILED'));
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
            <main className="relative pl-64 min-h-screen">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900" />
                <div className="relative z-0">{renderContent()}</div>
            </main>
        </div>
    );
};

export default App;