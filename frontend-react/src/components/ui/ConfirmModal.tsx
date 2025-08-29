import React from 'react';

interface ConfirmModalProps {
    open: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, title = 'Confirmar ação', message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-[92vw] max-w-lg border border-slate-200 dark:border-slate-700 p-5" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">{message}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};