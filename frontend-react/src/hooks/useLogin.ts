import { useState } from 'react';
import api from '@/services/api';

interface UseLoginProps {
    onLoginSuccess: (token: string, user: any) => void;
}

export const useLogin = ({ onLoginSuccess }: UseLoginProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Por favor, preencha o e-mail e a senha.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            onLoginSuccess(token, user);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Ocorreu um erro. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        error,
        isLoading,
        handleSubmit,
    };
};