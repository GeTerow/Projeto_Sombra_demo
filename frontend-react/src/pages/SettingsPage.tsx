import React from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useSettingsPage } from '@/hooks/useSettingsPage';
import { KeyIcon, CogIcon, CheckCircleIcon, EnvelopeIcon, ClockIcon } from '@/components/icons';

export const SettingsPage: React.FC = () => {
    const { states, actions } = useSettingsPage();
    const {
        config, isLoading, isSaving, error, successMessage, testEmail,
        isTestingEmail, testEmailMessage, scheduleMode, time, weeklyDays,
        monthlyDay, customCron, humanizeSchedule, scheduleError, canSave, DAY_LABELS
    } = states;
    const {
        setTestEmail, setScheduleMode, setTime,
        setMonthlyDay, setCustomCron, handleChange,
        handleSaveSubmit, handleSendTestEmail, toggleWeeklyDay, applyPreset
    } = actions;

    if (isLoading) {
        return <div className="text-center p-10">Carregando configurações...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Configurações do Sistema</h1>

            <form onSubmit={handleSaveSubmit} className="space-y-10">
                {/* --- Chaves de API --- */}
                <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <KeyIcon className="w-6 h-6 text-amber-500" /> Chaves de API
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                        As chaves não são exibidas por segurança. Para alterar, insira um novo valor.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="OPENAI_API_KEY" className="block text-sm font-medium mb-1">OpenAI API Key</label>
                            <input type="password" id="OPENAI_API_KEY" name="OPENAI_API_KEY" onChange={handleChange} placeholder="Deixe em branco para não alterar" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="HF_TOKEN" className="block text-sm font-medium mb-1">Hugging Face Token</label>
                            <input type="password" id="HF_TOKEN" name="HF_TOKEN" onChange={handleChange} placeholder="Deixe em branco para não alterar" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="OPENAI_ASSISTANT_ID" className="block text-sm font-medium mb-1">OpenAI Assistant ID</label>
                            <input type="text" id="OPENAI_ASSISTANT_ID" name="OPENAI_ASSISTANT_ID" value={config.OPENAI_ASSISTANT_ID || ''} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md" />
                        </div>
                    </div>
                </div>

                {/* --- Servidor de E-mail (SMTP) --- */}
                <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <EnvelopeIcon className="w-6 h-6 text-rose-500" /> Servidor de E-mail (SMTP)
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Configurações para o envio diário dos resumos por e-mail.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="SMTP_HOST" className="block text-sm font-medium mb-1">Host SMTP</label>
                            <input type="text" id="SMTP_HOST" name="SMTP_HOST" value={config.SMTP_HOST || ''} onChange={handleChange} placeholder="smtp.example.com" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="SMTP_PORT" className="block text-sm font-medium mb-1">Porta</label>
                            <input type="text" id="SMTP_PORT" name="SMTP_PORT" value={config.SMTP_PORT || ''} onChange={handleChange} placeholder="587" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="SMTP_USER" className="block text-sm font-medium mb-1">Usuário</label>
                            <input type="text" id="SMTP_USER" name="SMTP_USER" value={config.SMTP_USER || ''} onChange={handleChange} placeholder="user@example.com" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="SMTP_PASS" className="block text-sm font-medium mb-1">Senha</label>
                            <input type="password" id="SMTP_PASS" name="SMTP_PASS" onChange={handleChange} placeholder="Deixe em branco para não alterar" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="SMTP_FROM" className="block text-sm font-medium mb-1">E-mail Remetente</label>
                            <input type="email" id="SMTP_FROM" name="SMTP_FROM" value={config.SMTP_FROM || ''} onChange={handleChange} placeholder="noreply@example.com" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md" />
                        </div>
                    </div>
                    {/* --- Seção de Teste --- */}
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                        <label htmlFor="test-email" className="block text-sm font-medium mb-1">Verificar configuração</label>
                        <div className="flex items-stretch gap-2">
                            <input
                                id="test-email"
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="Digite um e-mail para teste"
                                className="flex-grow w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"
                            />
                            <button
                                type="button"
                                onClick={handleSendTestEmail}
                                disabled={isTestingEmail}
                                className="inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {isTestingEmail ? <Spinner /> : 'Enviar Teste'}
                            </button>
                        </div>
                        {testEmailMessage && (
                            <p className={`text-sm mt-2 ${testEmailMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                {testEmailMessage.text}
                            </p>
                        )}
                    </div>
                </div>

                {/* --- Agendamento de E-mails --- */}
                <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <ClockIcon className="w-6 h-6 text-teal-500" /> Agendamento de Resumos
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                        Defina quando e como os resumos automáticos serão enviados.
                    </p>
                    <div className="mb-6">
                        <label htmlFor="SUMMARY_TRIGGER_COUNT" className="block text-sm font-medium mb-1">Gatilho por Volume de Tarefas</label>
                        <input
                            type="number"
                            id="SUMMARY_TRIGGER_COUNT"
                            name="SUMMARY_TRIGGER_COUNT"
                            value={config.SUMMARY_TRIGGER_COUNT || ''}
                            onChange={handleChange}
                            min={1}
                            placeholder="Ex: 5"
                            className="w-full md:w-1/2 px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Quando o agendador rodar, um resumo será gerado se a vendedora tiver atingido este número de novas análises desde o último resumo.
                        </p>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <h3 className="text-lg font-semibold mb-4">Agendamento por Tempo</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-xs text-slate-500 self-center">Sugestões:</span>
                            <button type="button" onClick={() => applyPreset('wk_08')} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">08:00 Seg–Sex</button>
                            <button type="button" onClick={() => applyPreset('daily_09')} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">09:00 Todos os dias</button>
                            <button type="button" onClick={() => applyPreset('mwf_18')} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">Seg, Qua, Sex às 18:00</button>
                            <button type="button" onClick={() => applyPreset('m1_08')} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">Dia 1 às 08:00</button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Frequência</label>
                            <div className="flex flex-wrap gap-2">
                                {['weekdays', 'daily', 'weekly', 'monthly', 'custom'].map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setScheduleMode(mode as any)}
                                        className={`px-3 py-2 rounded-md text-sm border transition ${scheduleMode === mode ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                    >
                                        { { weekdays: 'Seg–Sex', daily: 'Todos os dias', weekly: 'Semanal', monthly: 'Mensal', custom: 'Avançado (Cron)' }[mode] }
                                    </button>
                                ))}
                            </div>
                        </div>
                        {scheduleMode !== 'custom' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Horário</label>
                                <input type="time" step={60} value={time} onChange={(e) => setTime(e.target.value)} className="w-40 px-3 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md" />
                            </div>
                        )}
                        {scheduleMode === 'weekly' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Dias da semana</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAY_LABELS.map((d, idx) => (
                                        <button key={d} type="button" onClick={() => toggleWeeklyDay(idx)} className={`px-3 py-1 rounded-full text-sm border ${weeklyDays.includes(idx) ? 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-700' : 'bg-slate-50 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'}`}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {scheduleMode === 'monthly' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Dia do mês</label>
                                <input type="number" min={1} max={31} value={monthlyDay} onChange={(e) => setMonthlyDay(Number(e.target.value))} className="w-28 px-3 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md" />
                            </div>
                        )}
                        {scheduleMode === 'custom' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Padrão de Agendamento (Formato Cron)</label>
                                <input type="text" value={customCron} onChange={(e) => setCustomCron(e.target.value)} placeholder="Ex.: 0 8 * * 1-5" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md" />
                            </div>
                        )}
                        <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                            <div className="text-sm">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-slate-500 dark:text-slate-400">Cron gerado:</span>
                                    <code className="px-2 py-1 rounded bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-600">{actions.buildCronFromBuilder() || '—'}</code>
                                </div>
                                <div className="mt-2 text-slate-600 dark:text-slate-300">{humanizeSchedule}</div>
                                {scheduleError && <div className="mt-2 text-sm text-red-500">{scheduleError}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Modelos e Processamento --- */}
                <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <CogIcon className="w-6 h-6 text-sky-500" /> Modelos e Processamento
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Controle quais modelos serão usados pelo worker de IA.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="WHISPERX_MODEL" className="block text-sm font-medium mb-1">Modelo WhisperX</label>
                            <select id="WHISPERX_MODEL" name="WHISPERX_MODEL" value={config.WHISPERX_MODEL || 'large-v3'} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md">
                                <option value="large-v3">large-v3</option>
                                <option value="large-v2">large-v2</option>
                                <option value="medium">medium</option>
                                <option value="small">small</option>
                                <option value="base">base</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {successMessage && <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5" /> {successMessage}</p>}
                    <button
                        type="submit"
                        disabled={!canSave}
                        className="inline-flex justify-center items-center gap-3 py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60"
                        title={scheduleError ? scheduleError : 'Salvar alterações'}
                    >
                        {isSaving && <Spinner />}
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;