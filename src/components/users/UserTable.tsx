'use client';

import { Pencil, Trash2, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { Can } from '@/components/auth/Can';
import { usePermissions } from '@/hooks/usePermissions';

export interface UserRow {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: { id: number; nom: string; label: string } | string;
  isActive: boolean;
}

interface UserTableProps {
  users: UserRow[];
  loading?: boolean;
  onEdit?: (user: UserRow) => void;
  onDelete?: (user: UserRow) => void;
  onPermissions?: (user: UserRow) => void;
  onToggle?: (user: UserRow) => void;
}

function StatusBadge({ user, onToggle }: { user: UserRow; onToggle?: (u: UserRow) => void }) {
  const { can } = usePermissions();
  const canEdit = can('users.edit');

  const badge = (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
        user.isActive
          ? canEdit
            ? 'bg-green-900 text-green-300 group-hover:bg-red-900 group-hover:text-red-300'
            : 'bg-green-900 text-green-300'
          : canEdit
            ? 'bg-gray-700 text-gray-400 group-hover:bg-green-900 group-hover:text-green-300'
            : 'bg-gray-700 text-gray-400'
      }`}
    >
      {user.isActive
        ? <><ToggleRight className="w-3 h-3" /> Actif</>
        : <><ToggleLeft className="w-3 h-3" /> Inactif</>}
    </span>
  );

  if (!canEdit) return badge;

  return (
    <button
      onClick={() => onToggle?.(user)}
      title={user.isActive ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
      aria-label={user.isActive ? `Désactiver ${user.prenom}` : `Activer ${user.prenom}`}
      className="group"
    >
      {badge}
    </button>
  );
}

export function UserTable({ users, loading, onEdit, onDelete, onPermissions, onToggle }: UserTableProps) {
  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
        Chargement…
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
        Aucun utilisateur trouvé.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left">
            <th className="px-4 py-3 text-gray-400 font-medium">Nom</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Email</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Rôle</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Statut</th>
            <th className="px-4 py-3 text-gray-400 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className={`border-b border-gray-800 last:border-0 transition-colors ${
                user.isActive ? 'hover:bg-gray-800/50' : 'opacity-60 hover:bg-gray-800/30'
              }`}
            >
              <td className="px-4 py-3 text-white font-medium">
                {user.prenom} {user.nom}
              </td>
              <td className="px-4 py-3 text-gray-400">{user.email}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-300">
                  {typeof user.role === 'string' ? user.role : user.role?.label}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge user={user} onToggle={onToggle} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Can permission="users.permissions">
                    <button
                      onClick={() => onPermissions?.(user)}
                      title="Permissions"
                      aria-label={`Permissions de ${user.prenom} ${user.nom}`}
                      className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                  </Can>
                  <Can permission="users.edit">
                    <button
                      onClick={() => onEdit?.(user)}
                      title="Modifier"
                      aria-label={`Modifier ${user.prenom} ${user.nom}`}
                      className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/30 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </Can>
                  <Can permission="users.delete">
                    <button
                      onClick={() => onDelete?.(user)}
                      title="Supprimer"
                      aria-label={`Supprimer ${user.prenom} ${user.nom}`}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Can>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
