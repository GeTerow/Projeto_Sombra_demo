import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../src/services/api';
import { Spinner } from './Spinner';

const KeyIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;
const CogIcon: React.FC<{ className?: string }> = ({ className }) => <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}><path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12.9046 3.06005C12.6988 3 12.4659 3 12 3C11.5341 3 11.3012 3 11.0954 3.06005C10.7942 3.14794 10.5281 3.32808 10.3346 3.57511C10.2024 3.74388 10.1159 3.96016 9.94291 4.39272C9.69419 5.01452 9.00393 5.33471 8.36857 5.123L7.79779 4.93281C7.3929 4.79785 7.19045 4.73036 6.99196 4.7188C6.70039 4.70181 6.4102 4.77032 6.15701 4.9159C5.98465 5.01501 5.83376 5.16591 5.53197 5.4677C5.21122 5.78845 5.05084 5.94882 4.94896 6.13189C4.79927 6.40084 4.73595 6.70934 4.76759 7.01551C4.78912 7.2239 4.87335 7.43449 5.04182 7.85566C5.30565 8.51523 5.05184 9.26878 4.44272 9.63433L4.16521 9.80087C3.74031 10.0558 3.52786 10.1833 3.37354 10.3588C3.23698 10.5141 3.13401 10.696 3.07109 10.893C3 11.1156 3 11.3658 3 11.8663C3 12.4589 3 12.7551 3.09462 13.0088C3.17823 13.2329 3.31422 13.4337 3.49124 13.5946C3.69158 13.7766 3.96395 13.8856 4.50866 14.1035C5.06534 14.3261 5.35196 14.9441 5.16236 15.5129L4.94721 16.1584C4.79819 16.6054 4.72367 16.829 4.7169 17.0486C4.70875 17.3127 4.77049 17.5742 4.89587 17.8067C5.00015 18.0002 5.16678 18.1668 5.5 18.5C5.83323 18.8332 5.99985 18.9998 6.19325 19.1041C6.4258 19.2295 6.68733 19.2913 6.9514 19.2831C7.17102 19.2763 7.39456 19.2018 7.84164 19.0528L8.36862 18.8771C9.00393 18.6654 9.6942 18.9855 9.94291 19.6073C10.1159 20.0398 10.2024 20.2561 10.3346 20.4249C10.5281 20.6719 10.7942 20.8521 11.0954 20.94C11.3012 21 11.5341 21 12 21C12.4659 21 12.6988 21 12.9046 20.94C13.2058 20.8521 13.4719 20.6719 13.6654 20.4249C13.7976 20.2561 13.8841 20.0398 14.0571 19.6073C14.3058 18.9855 14.9961 18.6654 15.6313 18.8773L16.1579 19.0529C16.605 19.2019 16.8286 19.2764 17.0482 19.2832C17.3123 19.2913 17.5738 19.2296 17.8063 19.1042C17.9997 18.9999 18.1664 18.8333 18.4996 18.5001C18.8328 18.1669 18.9994 18.0002 19.1037 17.8068C19.2291 17.5743 19.2908 17.3127 19.2827 17.0487C19.2759 16.8291 19.2014 16.6055 19.0524 16.1584L18.8374 15.5134C18.6477 14.9444 18.9344 14.3262 19.4913 14.1035C20.036 13.8856 20.3084 13.7766 20.5088 13.5946C20.6858 13.4337 20.8218 13.2329 20.9054 13.0088C21 12.7551 21 12.4589 21 11.8663C21 11.3658 21 11.1156 20.9289 10.893C20.866 10.696 20.763 10.5141 20.6265 10.3588C20.4721 10.1833 20.2597 10.0558 19.8348 9.80087L19.5569 9.63416C18.9478 9.26867 18.6939 8.51514 18.9578 7.85558C19.1262 7.43443 19.2105 7.22383 19.232 7.01543C19.2636 6.70926 19.2003 6.40077 19.0506 6.13181C18.9487 5.94875 18.7884 5.78837 18.4676 5.46762C18.1658 5.16584 18.0149 5.01494 17.8426 4.91583C17.5894 4.77024 17.2992 4.70174 17.0076 4.71872C16.8091 4.73029 16.6067 4.79777 16.2018 4.93273L15.6314 5.12287C14.9961 5.33464 14.3058 5.0145 14.0571 4.39272C13.8841 3.96016 13.7976 3.74388 13.6654 3.57511C13.4719 3.32808 13.2058 3.14794 12.9046 3.06005Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>;
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.06-1.06L10.5 12.94l-1.72-1.72a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.5-4.5z" clipRule="evenodd" /></svg>;
const EnvelopeIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// Tipo para o estado do formulário
type ConfigFormData = {
  OPENAI_API_KEY: string;
  HF_TOKEN: string;
  OPENAI_ASSISTANT_ID: string;
  WHISPERX_MODEL: 'large-v3' | 'large-v2' | 'base' | 'small' | 'medium';
  DIAR_DEVICE: 'cuda' | 'cpu';
  ALIGN_DEVICE: 'cuda' | 'cpu';
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  EMAIL_SCHEDULE: string;
  SUMMARY_TRIGGER_COUNT: string;
};

// Tipos/constantes para o agendamento
type ScheduleMode = 'weekdays' | 'daily' | 'weekly' | 'monthly' | 'custom';
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<Partial<ConfigFormData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado para o teste de e-mail
  const [testEmail, setTestEmail] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailMessage, setTestEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado da UI de Agendamento
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('weekdays');
  const [time, setTime] = useState<string>('08:00'); // HH:mm
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 2, 3, 4, 5]); // 0=Dom, 6=Sáb
  const [monthlyDay, setMonthlyDay] = useState<number>(1);
  const [customCron, setCustomCron] = useState<string>('');

  const isCronBasicValid = (cron: string) => cron.trim().split(/\s+/).length === 5;

  const buildCronFromBuilder = useCallback(() => {
    const [hh, mm] = time.split(':');
    const hour = parseInt(hh ?? '8', 10);
    const minute = parseInt(mm ?? '0', 10);
    if (isNaN(hour) || isNaN(minute)) return '';

    if (scheduleMode === 'daily') {
      return `${minute} ${hour} * * *`;
    }
    if (scheduleMode === 'weekdays') {
      return `${minute} ${hour} * * 1-5`;
    }
    if (scheduleMode === 'weekly') {
      if (!weeklyDays.length) return '';
      return `${minute} ${hour} * * ${weeklyDays.sort((a, b) => a - b).join(',')}`;
    }
    if (scheduleMode === 'monthly') {
      if (monthlyDay < 1 || monthlyDay > 31) return '';
      return `${minute} ${hour} ${monthlyDay} * *`;
    }
    return customCron.trim();
  }, [scheduleMode, time, weeklyDays, monthlyDay, customCron]);

  const parseCronToBuilder = useCallback((cron?: string) => {
    if (!cron) return;
    const raw = cron.trim();
    const parts = raw.split(/\s+/);
    if (parts.length !== 5) {
      setScheduleMode('custom');
      setCustomCron(raw);
      return;
    }
    const [minStr, hourStr, dom, month, dow] = parts;
    const minute = /^\d+$/.test(minStr) ? parseInt(minStr, 10) : NaN;
    const hour = /^\d+$/.test(hourStr) ? parseInt(hourStr, 10) : NaN;

    // default time fallback
    if (!isNaN(hour) && !isNaN(minute)) {
      setTime(`${pad2(hour)}:${pad2(minute)}`);
    } else {
      setTime('08:00');
    }

    // Reconhece padrões comuns e cai para "custom" se não bater
    if (dom === '*' && month === '*') {
      if (dow === '1-5' && !isNaN(hour) && !isNaN(minute)) {
        setScheduleMode('weekdays');
        setWeeklyDays([1, 2, 3, 4, 5]);
        return;
      }
      if (dow === '*' && !isNaN(hour) && !isNaN(minute)) {
        setScheduleMode('daily');
        return;
      }
      if (/^\d(,\d)*$/.test(dow) && !isNaN(hour) && !isNaN(minute)) {
        const days = dow.split(',').map((d) => parseInt(d, 10)).filter((d) => d >= 0 && d <= 6);
        if (days.length) {
          setScheduleMode('weekly');
          setWeeklyDays(days);
          return;
        }
      }
    }
    if (month === '*' && dow === '*' && /^\d+$/.test(dom) && !isNaN(hour) && !isNaN(minute)) {
      setScheduleMode('monthly');
      setMonthlyDay(Math.min(31, Math.max(1, parseInt(dom, 10))));
      return;
    }
    // fallback
    setScheduleMode('custom');
    setCustomCron(raw);
  }, []);

  const humanizeSchedule = useMemo(() => {
    const [hh, mm] = time.split(':');
    const h = pad2(parseInt(hh || '8', 10));
    const m = pad2(parseInt(mm || '0', 10));
    if (scheduleMode === 'daily') return `Todos os dias às ${h}:${m}`;
    if (scheduleMode === 'weekdays') return `De segunda a sexta às ${h}:${m}`;
    if (scheduleMode === 'weekly') {
      if (!weeklyDays.length) return 'Selecione pelo menos um dia da semana';
      const names = weeklyDays.sort((a, b) => a - b).map((d) => DAY_LABELS[d]);
      const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} e ${names.slice(-1)}` : names[0];
      return `Às ${h}:${m} em: ${list}`;
    }
    if (scheduleMode === 'monthly') return `Todo dia ${monthlyDay} do mês às ${h}:${m}`;
    if (scheduleMode === 'custom') return customCron ? `Cron personalizado: ${customCron}` : 'Informe um cron válido';
    return '';
  }, [scheduleMode, time, weeklyDays, monthlyDay, customCron]);

  const scheduleError = useMemo(() => {
    if (scheduleMode === 'weekly' && weeklyDays.length === 0) return 'Selecione pelo menos um dia da semana.';
    if (scheduleMode === 'monthly' && (monthlyDay < 1 || monthlyDay > 31)) return 'O dia do mês precisa estar entre 1 e 31.';
    if (scheduleMode === 'custom') {
      if (!customCron.trim()) return 'Informe um cron.';
      if (!isCronBasicValid(customCron)) return 'Cron inválido. Use 5 campos (min hora dia-mês mês dia-semana).';
    }
    const cron = buildCronFromBuilder();
    if (!cron) return 'Configuração de agendamento incompleta.';
    return null;
  }, [scheduleMode, weeklyDays, monthlyDay, customCron, buildCronFromBuilder]);

  useEffect(() => {
    const cron = buildCronFromBuilder();
    setConfig((prev) => ({ ...prev, EMAIL_SCHEDULE: cron }));
  }, [buildCronFromBuilder]);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<ConfigFormData>('/config');
      setConfig(response.data);
      parseCronToBuilder(response.data.EMAIL_SCHEDULE);
    } catch (err) {
      setError('Não foi possível carregar as configurações.');
    } finally {
      setIsLoading(false);
    }
  }, [parseCronToBuilder]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleError) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await api.put('/config', config);
      setSuccessMessage('Configurações salvas com sucesso! O agendador foi atualizado.');
      fetchConfig();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError('Ocorreu um erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setTestEmailMessage({ type: 'error', text: 'Por favor, insira um e-mail.' });
      return;
    }
    setIsTestingEmail(true);
    setTestEmailMessage(null);
    try {
      await api.post('/config/test-email', { testEmail });
      setTestEmailMessage({ type: 'success', text: `E-mail enviado para ${testEmail}!` });
    } catch (err) {
      setTestEmailMessage({ type: 'error', text: 'Falha ao enviar. Verifique os logs e as configurações.' });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const toggleWeeklyDay = (d: number) => {
    setWeeklyDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  };

  const applyPreset = (preset: 'wk_08' | 'daily_09' | 'mwf_18' | 'm1_08') => {
    if (preset === 'wk_08') {
      setScheduleMode('weekdays');
      setTime('08:00');
      setWeeklyDays([1, 2, 3, 4, 5]);
    }
    if (preset === 'daily_09') {
      setScheduleMode('daily');
      setTime('09:00');
    }
    if (preset === 'mwf_18') {
      setScheduleMode('weekly');
      setTime('18:00');
      setWeeklyDays([1, 3, 5]);
    }
    if (preset === 'm1_08') {
      setScheduleMode('monthly');
      setTime('08:00');
      setMonthlyDay(1);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Carregando configurações...</div>;
  }

  const canSave = !isSaving && !scheduleError;

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

        {/* --- Agendamento de E-mails (UI intuitiva) --- */}
        <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <ClockIcon className="w-6 h-6 text-teal-500" /> Agendamento de Resumos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Defina quando e como os resumos automáticos serão enviados.
          </p>

          {/* Gatilho por Volume */}
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
            {/* Presets rápidos */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-slate-500 self-center">Sugestões:</span>
              <button type="button" onClick={() => applyPreset('wk_08')} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                08:00 Seg–Sex
              </button>
              <button type="button" onClick={() => applyPreset('daily_09')} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                09:00 Todos os dias
              </button>
              <button type="button" onClick={() => applyPreset('mwf_18')} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                Seg, Qua, Sex às 18:00
              </button>
              <button type="button" onClick={() => applyPreset('m1_08')} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                Dia 1 às 08:00
              </button>
            </div>

            {/* Modo/Frequência */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Frequência</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'weekdays', label: 'Seg–Sex' },
                  { key: 'daily', label: 'Todos os dias' },
                  { key: 'weekly', label: 'Semanal (escolher dias)' },
                  { key: 'monthly', label: 'Mensal (dia do mês)' },
                  { key: 'custom', label: 'Avançado (Cron)' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setScheduleMode(opt.key as ScheduleMode)}
                    className={`px-3 py-2 rounded-md text-sm border transition ${
                      scheduleMode === opt.key
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Horário - exceto no modo custom */}
            {scheduleMode !== 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Horário</label>
                <input
                  type="time"
                  step={60}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-40 px-3 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"
                />
              </div>
            )}

            {/* Dias da semana (modo semanal) */}
            {scheduleMode === 'weekly' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Dias da semana</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_LABELS.map((d, idx) => {
                    const active = weeklyDays.includes(idx);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleWeeklyDay(idx)}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          active
                            ? 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-700'
                            : 'bg-slate-50 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dia do mês (modo mensal) */}
            {scheduleMode === 'monthly' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Dia do mês</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={monthlyDay}
                  onChange={(e) => setMonthlyDay(Number(e.target.value))}
                  className="w-28 px-3 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"
                />
              </div>
            )}

            {/* Modo Avançado (Cron) */}
            {scheduleMode === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Padrão de Agendamento (Formato Cron)</label>
                <input
                  type="text"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="Ex.: 0 8 * * 1-5"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Formato: Minuto Hora DiaMês Mês DiaSemana. Exemplos: "0 8 * * 1-5" (8h Seg–Sex), "30 9 * * *" (9:30 todos os dias).
                </p>
              </div>
            )}

            {/* Preview do cron e resumo humano */}
            <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
              <div className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Cron gerado:</span>
                  <code className="px-2 py-1 rounded bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-600">
                    {buildCronFromBuilder() || '—'}
                  </code>
                </div>
                <div className="mt-2 text-slate-600 dark:text-slate-300">{humanizeSchedule}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Observação: o agendamento usa o fuso horário do servidor.
                </div>
                {scheduleError && (
                  <div className="mt-2 text-sm text-red-500">{scheduleError}</div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* --- Modelos e Processamento --- */}
        <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <CogIcon className="w-6 h-6 text-sky-500" /> Modelos e Processamento
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Controle quais modelos e hardware serão usados pelo worker de IA.</p>
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
            <div>
              <label htmlFor="DIAR_DEVICE" className="block text-sm font-medium mb-1">Dispositivo de Diarização</label>
              <select id="DIAR_DEVICE" name="DIAR_DEVICE" value={config.DIAR_DEVICE || 'cpu'} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md">
                <option value="cpu">CPU</option>
                <option value="cuda">GPU (CUDA)</option>
              </select>
            </div>
            <div>
              <label htmlFor="ALIGN_DEVICE" className="block text-sm font-medium mb-1">Dispositivo de Alinhamento</label>
              <select id="ALIGN_DEVICE" name="ALIGN_DEVICE" value={config.ALIGN_DEVICE || 'cpu'} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md">
                <option value="cpu">CPU</option>
                <option value="cuda">GPU (CUDA)</option>
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