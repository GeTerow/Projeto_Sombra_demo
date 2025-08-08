import React, { useEffect } from 'react';
import type { CallRecord } from '../types';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface AnalysisDetailModalProps {
  call: CallRecord;
  onClose: () => void;
}

export const AnalysisDetailModal: React.FC<AnalysisDetailModalProps> = ({ call, onClose }) => {
    const [talk, listen] = call.analysis.talkToListenRatio.split('/');
    const talkPercentage = parseInt(talk, 10);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-overlay-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-slate-50 dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] m-4 p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-modal-in flex flex-col"
                onClick={handleContentClick}
                role="document"
            >
                <header className="pb-4 border-b border-slate-200 dark:border-slate-700 mb-6 flex-shrink-0">
                    <div className="flex justify-between items-center gap-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                            Análise com Cliente: {call.clientName}
                        </h3>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <CloseIcon className="w-6 h-6" />
                            <span className="sr-only">Fechar</span>
                        </button>
                    </div>
                     <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Data: {new Date(call.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                </header>

                <div className="overflow-y-auto pr-2 -mr-4 space-y-8">
                    <div>
                        <h4 className="font-semibold text-lg text-slate-800 dark:text-white mb-3">Análise Detalhada da Chamada</h4>
                        <p className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 p-4 rounded-lg whitespace-pre-wrap">{call.analysis.summary}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold text-lg text-green-600 dark:text-green-400 mb-3">Pontos Fortes</h4>
                            <ul className="space-y-3">
                                {call.analysis.strengths.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="text-green-500 mt-1 flex-shrink-0">✔</span>
                                        <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg text-amber-600 dark:text-amber-400 mb-3">Pontos de Melhoria</h4>
                            <ul className="space-y-3">
                                {call.analysis.areasForImprovement.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="text-amber-500 mt-1 flex-shrink-0">☞</span>
                                        <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold text-lg text-slate-800 dark:text-white mb-3">Proporção Fala/Escuta</h4>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div className="bg-gradient-to-r from-primary-400 to-primary-600 h-4 rounded-full" style={{ width: `${talkPercentage}%` }} />
                        </div>
                        <div className="flex justify-between text-sm mt-2 text-slate-600 dark:text-slate-400">
                            <span>Vendedora: {talk}%</span>
                            <span>Cliente: {listen}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};