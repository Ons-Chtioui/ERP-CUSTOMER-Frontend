'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2, User, ShieldCheck, Key } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

// ─── Schéma changement de mot de passe ───────────────────────────────────────
const pwdSchema = z
  .object({
    oldPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Doit contenir une majuscule')
      .regex(/[0-9]/, 'Doit contenir un chiffre'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });

type PwdFormData = z.infer<typeof pwdSchema>;

interface ProfileData {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  permissions: string[];
  lastLoginAt: string | null;
}

export default function ProfilePage() {
  const storeUser = useAuthStore((s) => s.user);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Charger le profil complet depuis le backend
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: () => api.get('/auth/me').then((r) => r.data),
  });

  const user = profile ?? storeUser;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PwdFormData>({ resolver: zodResolver(pwdSchema) });

  const onChangePwd = async (data: PwdFormData) => {
    setPwdLoading(true);
    setPwdError('');
    setPwdSuccess('');
    try {
      await api.patch('/auth/password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      setPwdSuccess('Mot de passe modifié avec succès.');
      reset();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setPwdError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors du changement');
    } finally {
      setPwdLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm',
      'focus:outline-none focus:ring-1 transition-colors',
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
    );

  // Grouper les permissions par module
  const permsByModule = (profile?.permissions ?? []).reduce<Record<string, string[]>>(
    (acc, p) => {
      const [module] = p.split('.');
      (acc[module] ??= []).push(p);
      return acc;
    },
    {},
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-white">Mon profil</h1>

      {/* ── Carte infos ────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-indigo-700 rounded-full flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
          <span className="ml-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-900 text-indigo-300">
            {user?.role}
          </span>
        </div>

        <div className="divide-y divide-gray-800">
          {[
            { label: 'Prénom', value: user?.prenom },
            { label: 'Nom', value: user?.nom },
            { label: 'Email', value: user?.email },
            { label: 'Rôle', value: user?.role },
            {
              label: 'Dernière connexion',
              value: profile?.lastLoginAt
                ? new Date(profile.lastLoginAt).toLocaleString('fr-FR')
                : '—',
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-3 text-sm">
              <span className="text-gray-400">{label}</span>
              <span className="text-white font-medium">{value ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Permissions ────────────────────────────────────────── */}
      {Object.keys(permsByModule).length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-white font-semibold">Mes permissions</h2>
            <span className="ml-auto text-xs text-gray-500">{profile?.permissions.length} au total</span>
          </div>
          <div className="space-y-3">
            {Object.entries(permsByModule).map(([module, perms]) => (
              <div key={module}>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">{module}</p>
                <div className="flex flex-wrap gap-1.5">
                  {perms.map((p) => (
                    <span key={p} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs">
                      {p.split('.')[1]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Changer mot de passe ───────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Key className="w-5 h-5 text-indigo-400" />
          <h2 className="text-white font-semibold">Changer le mot de passe</h2>
        </div>

        {pwdSuccess && (
          <div className="mb-4 bg-green-950 border border-green-800 rounded-lg px-4 py-3 text-green-400 text-sm">
            {pwdSuccess}
          </div>
        )}
        {pwdError && (
          <div className="mb-4 bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
            {pwdError}
          </div>
        )}

        <form onSubmit={handleSubmit(onChangePwd)} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Mot de passe actuel</label>
            <input {...register('oldPassword')} type="password" autoComplete="current-password" className={inputClass(!!errors.oldPassword)} />
            {errors.oldPassword && <p role="alert" className="text-red-400 text-xs mt-1">{errors.oldPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nouveau mot de passe</label>
            <input {...register('newPassword')} type="password" autoComplete="new-password" className={inputClass(!!errors.newPassword)} />
            {errors.newPassword && <p role="alert" className="text-red-400 text-xs mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirmer</label>
            <input {...register('confirm')} type="password" autoComplete="new-password" className={inputClass(!!errors.confirm)} />
            {errors.confirm && <p role="alert" className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
          </div>
          <button
            type="submit"
            disabled={pwdLoading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
          >
            {pwdLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {pwdLoading ? 'Enregistrement...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
