'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Permission {
  id: number;
  nom: string;
  action: string;
  module: string;
}

interface PermissionsPanelProps {
  userId: number;
  userName: string;
  open: boolean;
  onClose: () => void;
}

export function PermissionsPanel({ userId, userName, open, onClose }: PermissionsPanelProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  // On stocke les IDs numériques sélectionnés
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');

    Promise.all([
      api.get<Permission[]>('/permissions'),
      api.get<{ permissions: { id: number }[] }>(`/users/${userId}/permissions`),
    ])
      .then(([allRes, userRes]) => {
        setAllPermissions(allRes.data);
        setSelectedIds(userRes.data.permissions.map((p) => p.id));
      })
      .catch(() => setError('Impossible de charger les permissions'))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const toggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/users/${userId}/permissions`, { permissionIds: selectedIds });
      onClose();
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // Grouper par module
  const grouped = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="permissions-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 id="permissions-title" className="text-white font-semibold">
              Permissions — {userName}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-2 text-red-400 text-sm">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : (
            Object.entries(grouped).map(([module, perms]) => (
              <div key={module}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {module}
                </h3>
                <div className="space-y-1">
                  {perms.map((perm) => {
                    const checked = selectedIds.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                          checked ? 'bg-indigo-900/30' : 'hover:bg-gray-800',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(perm.id)}
                          className="mt-0.5 accent-indigo-500"
                        />
                        <div>
                          <p className="text-sm text-white font-medium">{perm.nom}</p>
                          <p className="text-xs text-gray-400">{perm.action}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
