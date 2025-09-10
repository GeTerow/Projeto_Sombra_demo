import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/services/api';
import { pad2 } from '@/lib/utils';
import type { ConfigFormData, ScheduleMode } from '@/types/types';

export const useSettingsPage = () => {
    const [config, setConfig] = useState<Partial<ConfigFormData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [testEmail, setTestEmail] = useState('');
    const [isTestingEmail, setIsTestingEmail] = useState(false);
    const [testEmailMessage, setTestEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('weekdays');
    const [time, setTime] = useState<string>('08:00');
    const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [monthlyDay, setMonthlyDay] = useState<number>(1);
    const [customCron, setCustomCron] = useState<string>('');

    const isCronBasicValid = (cron: string) => cron.trim().split(/\s+/).length === 5;

    const buildCronFromBuilder = useCallback(() => {
        const [hh, mm] = time.split(':');
        const hour = parseInt(hh ?? '8', 10);
        const minute = parseInt(mm ?? '0', 10);
        if (isNaN(hour) || isNaN(minute)) return '';

        if (scheduleMode === 'daily') return `${minute} ${hour} * * *`;
        if (scheduleMode === 'weekdays') return `${minute} ${hour} * * 1-5`;
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
        const [minStr, hourStr, dom, , dow] = parts;
        const minute = /^\d+$/.test(minStr) ? parseInt(minStr, 10) : NaN;
        const hour = /^\d+$/.test(hourStr) ? parseInt(hourStr, 10) : NaN;

        if (!isNaN(hour) && !isNaN(minute)) setTime(`${pad2(hour)}:${pad2(minute)}`);
        else setTime('08:00');

        if (dom === '*' && dow === '1-5') {
            setScheduleMode('weekdays'); setWeeklyDays([1, 2, 3, 4, 5]);
        } else if (dom === '*' && dow === '*') {
            setScheduleMode('daily');
        } else if (dom === '*' && /^\d(,\d)*$/.test(dow)) {
            const days = dow.split(',').map(d => parseInt(d, 10)).filter(d => d >= 0 && d <= 6);
            if (days.length) { setScheduleMode('weekly'); setWeeklyDays(days); }
        } else if (dow === '*' && /^\d+$/.test(dom)) {
            setScheduleMode('monthly'); setMonthlyDay(Math.min(31, Math.max(1, parseInt(dom, 10))));
        } else {
            setScheduleMode('custom'); setCustomCron(raw);
        }
    }, []);

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

    useEffect(() => { fetchConfig(); }, [fetchConfig]);

    useEffect(() => {
        const cron = buildCronFromBuilder();
        setConfig((prev) => ({ ...prev, EMAIL_SCHEDULE: cron }));
    }, [buildCronFromBuilder]);

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
            await fetchConfig();
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
        setWeeklyDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b));
    };

    const applyPreset = (preset: 'wk_08' | 'daily_09' | 'mwf_18' | 'm1_08') => {
        if (preset === 'wk_08') { setScheduleMode('weekdays'); setTime('08:00'); setWeeklyDays([1, 2, 3, 4, 5]); }
        if (preset === 'daily_09') { setScheduleMode('daily'); setTime('09:00'); }
        if (preset === 'mwf_18') { setScheduleMode('weekly'); setTime('18:00'); setWeeklyDays([1, 3, 5]); }
        if (preset === 'm1_08') { setScheduleMode('monthly'); setTime('08:00'); setMonthlyDay(1); }
    };

    const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

    const canSave = !isSaving && !scheduleError;

    return {
        states: {
            config, isLoading, isSaving, error, successMessage, testEmail,
            isTestingEmail, testEmailMessage, scheduleMode, time, weeklyDays,
            monthlyDay, customCron, humanizeSchedule, scheduleError, canSave, DAY_LABELS
        },
        actions: {
            setConfig, setTestEmail, setScheduleMode, setTime,
            setWeeklyDays, setMonthlyDay, setCustomCron, handleChange,
            handleSaveSubmit, handleSendTestEmail, toggleWeeklyDay, applyPreset, buildCronFromBuilder
        }
    };
};