import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@/components/icons';

type ToastType = 'success' | 'error' | 'info';

export const Toast: React.FC<{ open: boolean; type?: ToastType; message: string; onClose: () => void }> = ({ open, type = 'info', message, onClose }) => {
    if (!open) return null;

    const colorMap: Record<ToastType, string> = {
        success: 'bg-emerald-600 text-white',
        error: 'bg-rose-600 text-white',
        info: 'bg-slate-800 text-white',
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[60]">
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
                <div className={`${colorMap[type]} shadow-xl rounded-lg px-4 py-3 flex items-center gap-3 min-w-[280px]`}>
                    {type === 'success' && <CheckCircleIcon className="w-5 h-5" />}
                    {type === 'error' && <ExclamationTriangleIcon className="w-5 h-5" />}
                    <span className="text-sm">{message}</span>
                    <button onClick={onClose} className="ml-auto text-white/80 hover:text-white transition-colors">Fechar</button>
                </div>
            </div>
        </div>
    );
};