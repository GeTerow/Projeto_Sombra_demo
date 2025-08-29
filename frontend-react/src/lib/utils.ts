export const getInitials = (name: string): string => {
    return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('');
};

export const colorFromString = (s: string): string => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360} 70% 40%)`;
};

export const formatRelativeTime = (date: string | number | Date): string => {
    try {
        const d = new Date(date).getTime();
        const diff = Date.now() - d;
        const sec = Math.floor(diff / 1000);
        if (sec < 60) return 'há poucos segundos';
        const min = Math.floor(sec / 60);
        if (min < 60) return `há ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `há ${hr} ${hr === 1 ? 'hora' : 'horas'}`;
        const day = Math.floor(hr / 24);
        return `há ${day} ${day === 1 ? 'dia' : 'dias'}`;
    } catch {
        return '';
    }
};

export const pad2 = (n: number): string => {
  return String(n).padStart(2, '0');
}