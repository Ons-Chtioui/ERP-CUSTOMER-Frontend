'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import api from '@/lib/api';
import { Can } from '@/components/auth/Can';
import { cn } from '@/lib/utils';

interface Permission {
  id: number;
  nom: string;
  module: string;
  action: string;
}

interface Role {
  id: number;
  nom: string;
  label: string;
  permissions: Permission[];
}

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [expandedRole, setExpandedRole] = useState<number | null>(null);
  const [pendingPerms, setPendingPerms] = useState<Record<number, number[]>>({});
  const [savedRole, setSavedRole] = useState<number | null>(null);
  const [error, setError] = useState('');

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
  });

  const { data: allPermissions = [], isLoading: permsLoading } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => api.get('/permissions').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) =>
      api.put(`/roles/${roleId}/permissions`, { permissionIds }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSavedRole(vars.roleId);
      setTimeout(() => setSavedRole(null), 2000);
      setError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la sauvegarde');
    },
  });

  // Initialiser les permissions en attente pour un rôle quand on l'ouvre
  const toggleRole = (role: Role) => {
    if (expandedRole === role.id) {
      setExpandedRole(null);
      return;
    }
    setExpandedRole(role.id);
    if (!pendingPerms[role.id]) {
      setPendingPerms((p) => ({ ...p, [role.id]: role.permissions.map((p) => p.id) }));
    }
  };

  const togglePerm = (roleId: number, permId: number) => {
    setPendingPerms((prev) => {
      const current = prev[roleId] ?? [];
      return {
        ...prev,
        [roleId]: current.includes(permId)
          ? current.filter((i) => i !== permId)
          : [...current, permId],
      };
    });
  };

  const toggleModule = (roleId: number, modulePermIds: number[], checked: boolean) => {
    setPendingPerms((prev) => {
      const current = prev[roleId] ?? [];
      return {
        ...prev,
        [roleId]: checked
          ? [...new Set([...current, ...modulePermIds])]
          : current.filter((id) => !modulePermIds.includes(id)),
      };
    });
  };

  const grouped = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  if (rolesLoading || permsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <Can permission="users.roles" fallback={
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        Accès refusé — permission <code className="bg-gray-800 px-1 rounded">users.roles</code> requise.
      </div>
    }>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Gestion des permissions par rôle</h1>
          <p className="text-gray-400 text-sm mt-1">
            Modifiez les permissions associées à chaque rôle. Réservé au super administrateur.
          </p>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {roles.map((role) => {
          const isOpen = expandedRole === role.id;
          const selected = pendingPerms[role.id] ?? role.permissions.map((p) => p.id);
          const isSaved = savedRole === role.id;
          const isDirty =
            isOpen &&
            JSON.stringify([...selected].sort()) !==
              JSON.stringify([...role.permissions.map((p) => p.id)].sort());

          return (
            <div key={role.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Header rôle */}
              <button
                onClick={() => toggleRole(role)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-white font-medium">{role.label}</p>
                    <p className="text-gray-500 text-xs">
                      {role.nom} — {selected.length} permission{selected.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isSaved && (
                    <span className="text-green-400 text-xs font-medium">✓ Sauvegardé</span>
                  )}
                  {isDirty && (
                    <span className="text-yellow-400 text-xs font-medium">● Modifié</span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Corps permissions */}
              {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-800 pt-4 space-y-4">
                  {Object.entries(grouped).map(([module, perms]) => {
                    const moduleIds = perms.map((p) => p.id);
                    const allChecked = moduleIds.every((id) => selected.includes(id));
                    const someChecked = moduleIds.some((id) => selected.includes(id));
                    return (
                      <div key={module} className="bg-gray-800/50 rounded-xl p-3">
                        <label className="flex items-center gap-2 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            ref={(el) => {
                              if (el) el.indeterminate = someChecked && !allChecked;
                            }}
                            onChange={(e) => toggleModule(role.id, moduleIds, e.target.checked)}
                            className="accent-indigo-500"
                          />
                          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                            {module}
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-1">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className={cn(
                                'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors',
                                selected.includes(perm.id)
                                  ? 'bg-indigo-900/40 text-white'
                                  : 'text-gray-400 hover:bg-gray-700/50',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={selected.includes(perm.id)}
                                onChange={() => togglePerm(role.id, perm.id)}
                                className="accent-indigo-500 shrink-0"
                              />
                              <span>{perm.action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setPendingPerms((p) => ({
                          ...p,
                          [role.id]: role.permissions.map((x) => x.id),
                        }));
                      }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      Réinitialiser
                    </button>
                    <button
                      onClick={() => saveMutation.mutate({ roleId: role.id, permissionIds: selected })}
                      disabled={saveMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
                    >
                      {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Sauvegarder
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Can>
  );
}
