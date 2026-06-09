'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

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

interface ResetPasswordFormProps {
  token: string | null;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async ({ password }: ResetFormData) => {
    if (!token) {
      setErrorMsg('Lien invalide ou expiré.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await api.post('/auth/reset-password', { token, password });
      router.push('/login?reset=success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setErrorMsg(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm',
      'focus:outline-none focus:ring-1 transition-colors',
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          {...register('password')}
          type="password"
          autoComplete="new-password"
          className={inputClass(!!errors.password)}
        />
        {errors.password && (
          <p role="alert" className="text-red-400 text-xs mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-gray-300 mb-1.5">
          Confirmer le mot de passe
        </label>
        <input
          id="confirm"
          {...register('confirm')}
          type="password"
          autoComplete="new-password"
          className={inputClass(!!errors.confirm)}
        />
        {errors.confirm && (
          <p role="alert" className="text-red-400 text-xs mt-1">
            {errors.confirm.message}
          </p>
        )}
      </div>

      {errorMsg && (
        <div role="alert" className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !token}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {loading ? 'Enregistrement...' : 'Réinitialiser le mot de passe'}
      </button>
    </form>
  );
}
