'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRow } from './UserTable';
import type { Role } from './CreateUserModal';

const editUserSchema = z.object({
  prenom: z.string().min(2, 'Prénom requis'),
  nom: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  roleId: z.coerce.number({ invalid_type_error: 'Rôle requis' }).min(1, 'Rôle requis'),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  open: boolean;
  user: UserRow | null;
  roles: Role[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: EditUserFormData) => Promise<void>;
}

export function EditUserModal({ open, user, roles, loading, onClose, onSubmit }: EditUserModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormData>({ resolver: zodResolver(editUserSchema) });

  // Pré-remplir le formulaire quand l'utilisateur change
  useEffect(() => {
    if (open && user) {
      reset({
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        roleId: typeof user.role === 'string' ? 0 : user.role?.id ?? 0,
      });
    }
  }, [open, user, reset]);

  if (!open || !user) return null;

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500',
      'focus:outline-none focus:ring-1 transition-colors',
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
    );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 id="edit-modal-title" className="text-white font-semibold">
            Modifier — {user.prenom} {user.nom}
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-prenom" className="block text-sm font-medium text-gray-300 mb-1">Prénom</label>
              <input id="edit-prenom" {...register('prenom')} className={inputClass(!!errors.prenom)} />
              {errors.prenom && <p role="alert" className="text-red-400 text-xs mt-1">{errors.prenom.message}</p>}
            </div>
            <div>
              <label htmlFor="edit-nom" className="block text-sm font-medium text-gray-300 mb-1">Nom</label>
              <input id="edit-nom" {...register('nom')} className={inputClass(!!errors.nom)} />
              {errors.nom && <p role="alert" className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input id="edit-email" {...register('email')} type="email" className={inputClass(!!errors.email)} />
            {errors.email && <p role="alert" className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="edit-roleId" className="block text-sm font-medium text-gray-300 mb-1">Rôle</label>
            <select id="edit-roleId" {...register('roleId')} className={cn(inputClass(!!errors.roleId), 'cursor-pointer')}>
              <option value="">Sélectionner un rôle</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            {errors.roleId && <p role="alert" className="text-red-400 text-xs mt-1">{errors.roleId.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
