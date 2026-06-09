'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { LoginResponse } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Mot de passe requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
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

      // Stocker le token dans un cookie lisible par le middleware Next.js
      document.cookie = `access_token=${res.data.accessToken}; path=/; SameSite=Lax`;

      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setErrorMsg(Array.isArray(msg) ? msg[0] : msg || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Logo / Titre */}
          <div className="mb-8 text-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">E</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Connexion ERP</h1>
            <p className="text-gray-400 text-sm mt-1">Accédez à votre espace de gestion</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Adresse email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="prenom.nom@entreprise.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Mot de passe
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Message d'erreur API */}
            {errorMsg && (
              <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          {/* Lien mot de passe oublié */}
          <div className="mt-6 text-center">
            <a
              href="/forgot-password"
              className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
            >
              Mot de passe oublié ?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
