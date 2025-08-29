import React from 'react';
import { Spinner } from './ui/Spinner';
import { UploadIcon, DocumentArrowDownIcon, CheckCircleIcon } from './icons';
import { useAudioUploadForm } from '@/hooks/useAudioUploadForm';

export const AudioUploadForm: React.FC = () => {
    const { states, handlers } = useAudioUploadForm();
    const {
        saleswomen,
        selectedSaleswomanId,
        clientName,
        audioFile,
        statusMessage,
        errorMessage,
        isLoading,
        isDragging,
        fileInputRef
    } = states;
    const {
        setSelectedSaleswomanId,
        setClientName,
        handleFileChange,
        handleClearFile,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        handleSubmit
    } = handlers;

    return (
        <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 h-full">
            <div className="text-center mb-8">
                <UploadIcon className="h-12 w-12 mx-auto text-primary-500" />
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mt-4">Analisar Nova Chamada</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Preencha os dados e anexe o áudio da ligação para iniciar a análise.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="saleswoman" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendedora</label>
                        <select
                            id="saleswoman"
                            value={selectedSaleswomanId}
                            onChange={(e) => setSelectedSaleswomanId(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-slate-800 dark:text-slate-200"
                        >
                            <option value="" disabled>Selecione uma vendedora</option>
                            {saleswomen.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="client" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Cliente</label>
                        <input type="text" id="client" value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-slate-800 dark:text-slate-200" placeholder="Ex: Cliente X" />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Arquivo de Áudio
                    </label>
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`mt-1 flex flex-col justify-center items-center p-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-xl cursor-pointer transition-colors duration-200 ${
                            isDragging 
                            ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-400 dark:border-primary-500 ring-2 ring-primary-300' 
                            : 'hover:bg-slate-50/70 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        {audioFile ? (
                            <div className="text-center">
                                <CheckCircleIcon className="w-10 h-10 mx-auto text-emerald-500" />
                                <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200 break-all">{audioFile.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Tamanho: {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <button 
                                    type="button"
                                    onClick={handleClearFile}
                                    className="mt-2 text-xs font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
                                >
                                    Remover
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1 text-center">
                                <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
                                <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                    <p>
                                        <span className="font-semibold text-primary-600 dark:text-primary-400">Clique para enviar</span> ou arraste e solte
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-500">Áudio em .WAV, .MP3, ou .M4A</p>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        id="audio-file-input"
                        type="file"
                        onChange={handleFileChange}
                        accept="audio/wav,audio/mpeg,audio/mp4,audio/x-m4a"
                        className="hidden"
                    />
                </div>

                {errorMessage && <p className="text-sm text-red-600 dark:text-red-400 text-center">{errorMessage}</p>}
                {statusMessage && <p className="text-sm text-green-600 dark:text-green-400 text-center">{statusMessage}</p>}

                <div className="text-center pt-2">
                    <button type="submit" disabled={isLoading || !audioFile} className="inline-flex justify-center items-center gap-3 w-full md:w-auto py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                        {isLoading ? ( <> <Spinner /> <span>Enviando...</span> </> ) : 'Enviar para Análise'}
                    </button>
                </div>
            </form>
        </div>
    );
};