'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import type { LoginResponse } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Mot de passe requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  /** Redirige vers cette URL après login. Par défaut "/" */
  redirectTo?: string;
}

export function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post<LoginResponse>('/auth/login', data);
      setAuth(res.data.user, res.data.accessToken);
      router.push(redirectTo);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setErrorMsg(Array.isArray(msg) ? msg[0] : msg || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
          Adresse email
        </label>
        <input
          id="email"
          {...register('email')}
          type="email"
          autoComplete="email"
          placeholder="prenom.nom@entreprise.com"
          className={cn(
            'w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500',
            'focus:outline-none focus:ring-1 transition-colors',
            errors.email
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
          )}
        />
        {errors.email && (
          <p role="alert" className="text-red-400 text-xs mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Mot de passe */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
          Mot de passe
        </label>
        <input
          id="password"
          {...register('password')}
          type="password"
          autoComplete="current-password"
          className={cn(
            'w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500',
            'focus:outline-none focus:ring-1 transition-colors',
            errors.password
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
          )}
        />
        {errors.password && (
          <p role="alert" className="text-red-400 text-xs mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Erreur API */}
      {errorMsg && (
        <div role="alert" className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {loading ? 'Connexion en cours...' : 'Se connecter'}
      </button>

      <div className="text-center">
        <a
          href="/forgot-password"
          className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
        >
          Mot de passe oublié ?
        </a>
      </div>
    </form>
  );
}
