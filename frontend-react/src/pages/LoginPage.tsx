// src/pages/LoginPage.tsx

import React from 'react';
import { Spinner } from '@/components/Spinner';
import { LockClosedIcon } from '@/components/icons';
import { useLogin } from '@/hooks/useLogin'; // Importando nosso novo hook

interface Props {
  onLoginSuccess: (token: string, user: any) => void;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  // A lógica e o estado agora vêm do hook
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleSubmit,
  } = useLogin({ onLoginSuccess });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white/80 p-8 shadow-xl ring-1 ring-slate-900/5 backdrop-blur-sm dark:bg-slate-800/80 dark:ring-white/10">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:ring-primary-500/20">
            <LockClosedIcon className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Acessar o Painel</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Entre com suas credenciais para continuar.</p>
        </div>

        <form className="mt-2 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              E-mail
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="seu@email.com"
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/60 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Senha
            </label>
            <input
              id="password-input"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Sua senha"
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/60 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="relative inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-70"
          >
            {isLoading ? <Spinner /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};