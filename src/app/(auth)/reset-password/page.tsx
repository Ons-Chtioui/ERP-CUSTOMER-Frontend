'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Doit contenir une majuscule')
      .regex(/[0-9]/, 'Doit contenir un chiffre'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
 const resetId = searchParams.get('id'); 
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async ({ password }: ResetFormData) => {
    if (!token || !resetId) {
      setErrorMsg('Lien invalide ou expiré.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await api.post('/auth/reset-password', {  resetId: parseInt(resetId), token, password });
      router.push('/login?reset=success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setErrorMsg(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-white mb-2">Nouveau mot de passe</h1>
        <p className="text-gray-400 text-sm mb-6">
          Choisissez un mot de passe sécurisé pour votre compte.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nouveau mot de passe
            </label>
            <input
              {...register('password')}
              type="password"
              autoComplete="new-password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Confirmer le mot de passe
            </label>
            <input
              {...register('confirm')}
              type="password"
              autoComplete="new-password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {errors.confirm && (
              <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>
            )}
          </div>

          {errorMsg && (
            <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            {loading ? 'Enregistrement...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>

        <a
          href="/login"
          className="block text-center text-gray-500 text-sm mt-4 hover:text-gray-400"
        >
          ← Retour à la connexion
        </a>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
