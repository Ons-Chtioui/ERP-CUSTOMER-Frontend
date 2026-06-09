'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Role {
  id: number;
  nom: string;
  label: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  nom: string;
  module: string;
  action: string;
}

const createUserSchema = z.object({
  prenom: z.string().min(2, 'Prénom requis'),
  nom: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir une majuscule')
    .regex(/[0-9]/, 'Doit contenir un chiffre'),
  roleId: z.coerce.number({ invalid_type_error: 'Rôle requis' }).min(1, 'Rôle requis'),
});

export type CreateUserFormData = z.infer<typeof createUserSchema> & {
  permissionIds: number[];
};

interface CreateUserModalProps {
  open: boolean;
  roles: Role[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserFormData) => Promise<void>;
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function CreateUserModal({ open, roles, loading, onClose, onSubmit }: CreateUserModalProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [permsExpanded, setPermsExpanded] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof createUserSchema>>({ resolver: zodResolver(createUserSchema) });

  const selectedRoleId = watch('roleId');

  // Charger toutes les permissions une fois à l'ouverture
  useEffect(() => {
    if (!open) return;
    reset();
    setSelectedPermIds([]);
    setLoadingPerms(true);
    api.get<Permission[]>('/permissions')
      .then((r) => setAllPermissions(r.data))
      .finally(() => setLoadingPerms(false));
  }, [open, reset]);

  // Quand le rôle change → pré-cocher ses permissions
  useEffect(() => {
    if (!selectedRoleId) return;
    const role = roles.find((r) => r.id === Number(selectedRoleId));
    if (role?.permissions) {
      setSelectedPermIds(role.permissions.map((p) => p.id));
    } else {
      // Charger le rôle avec ses permissions si pas déjà dispo
      api.get<Role>(`/roles/${selectedRoleId}`)
        .then((r) => setSelectedPermIds((r.data.permissions ?? []).map((p) => p.id)))
        .catch(() => {});
    }
  }, [selectedRoleId, roles]);

  const togglePerm = (id: number) =>
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const toggleAll = (permIds: number[], checked: boolean) =>
    setSelectedPermIds((prev) =>
      checked
        ? [...new Set([...prev, ...permIds])]
        : prev.filter((id) => !permIds.includes(id)),
    );

  const handleFormSubmit = async (data: z.infer<typeof createUserSchema>) => {
    await onSubmit({ ...data, permissionIds: selectedPermIds });
  };

  if (!open) return null;

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500',
      'focus:outline-none focus:ring-1 transition-colors',
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
    );

  // Grouper par module
  const grouped = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h2 id="modal-title" className="text-white font-semibold">Nouvel utilisateur</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <form id="create-user-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
            <div className="p-6 space-y-4 border-b border-gray-800">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Informations</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium text-gray-300 mb-1">Prénom</label>
                  <input id="prenom" {...register('prenom')} placeholder="Jean" className={inputClass(!!errors.prenom)} />
                  {errors.prenom && <p role="alert" className="text-red-400 text-xs mt-1">{errors.prenom.message}</p>}
                </div>
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-gray-300 mb-1">Nom</label>
                  <input id="nom" {...register('nom')} placeholder="Dupont" className={inputClass(!!errors.nom)} />
                  {errors.nom && <p role="alert" className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input id="email" {...register('email')} type="email" placeholder="jean.dupont@entreprise.com" className={inputClass(!!errors.email)} />
                {errors.email && <p role="alert" className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Mot de passe</label>
                <input id="password" {...register('password')} type="password" placeholder="••••••••" className={inputClass(!!errors.password)} />
                {errors.password && <p role="alert" className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-gray-300 mb-1">Rôle</label>
                <select id="roleId" {...register('roleId')} className={cn(inputClass(!!errors.roleId), 'cursor-pointer')}>
                  <option value="">Sélectionner un rôle</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
                {errors.roleId && <p role="alert" className="text-red-400 text-xs mt-1">{errors.roleId.message}</p>}
              </div>
            </div>

            {/* Section Permissions */}
            <div className="p-6 space-y-3">
              <button
                type="button"
                onClick={() => setPermsExpanded((v) => !v)}
                className="flex items-center justify-between w-full"
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Permissions ({selectedPermIds.length} sélectionnées)
                </p>
                {permsExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>

              {permsExpanded && (
                loadingPerms ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(grouped).map(([module, perms]) => {
                      const moduleIds = perms.map((p) => p.id);
                      const allChecked = moduleIds.every((id) => selectedPermIds.includes(id));
                      const someChecked = moduleIds.some((id) => selectedPermIds.includes(id));
                      return (
                        <div key={module} className="bg-gray-800/50 rounded-xl p-3">
                          {/* En-tête module avec "tout cocher" */}
                          <label className="flex items-center gap-2 mb-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                              onChange={(e) => toggleAll(moduleIds, e.target.checked)}
                              className="accent-indigo-500"
                            />
                            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{module}</span>
                          </label>
                          <div className="grid grid-cols-2 gap-1">
                            {perms.map((perm) => (
                              <label key={perm.id} className={cn(
                                'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors',
                                selectedPermIds.includes(perm.id) ? 'bg-indigo-900/40 text-white' : 'text-gray-400 hover:bg-gray-700/50',
                              )}>
                                <input
                                  type="checkbox"
                                  checked={selectedPermIds.includes(perm.id)}
                                  onChange={() => togglePerm(perm.id)}
                                  className="accent-indigo-500 shrink-0"
                                />
                                <span>{perm.action}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </form>
        </div>

        {/* Footer fixe */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
            Annuler
          </button>
          <button
            type="submit"
            form="create-user-form"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Création...' : 'Créer l\'utilisateur'}
          </button>
        </div>
      </div>
    </div>
  );
}
