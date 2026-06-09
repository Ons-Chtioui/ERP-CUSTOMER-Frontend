'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Can } from '@/components/auth/Can';
import { UserTable, type UserRow } from '@/components/users/UserTable';
import { CreateUserModal, type CreateUserFormData, type Role } from '@/components/users/CreateUserModal';
import { EditUserModal, type EditUserFormData } from '@/components/users/EditUserModal';
import { PermissionsPanel } from '@/components/users/PermissionsPanel';

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser]     = useState<UserRow | null>(null);
  const [permUser, setPermUser]     = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [apiError, setApiError]     = useState('');

  // ── Fetch ──────────────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading } = useQuery<UserRow[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
  });

  // ── Helpers erreur ─────────────────────────────────────────────
  const extractError = (err: unknown) => {
    const msg = (err as { response?: { data?: { message?: string | string[] } } })
      ?.response?.data?.message;
    return Array.isArray(msg) ? msg[0] : msg || 'Une erreur est survenue';
  };

  // ── Mutation créer ─────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: CreateUserFormData) =>
      api.post('/users', {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        password: data.password,
        roleId: data.roleId,
        permissionIds: data.permissionIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateOpen(false);
      setApiError('');
    },
    onError: (err) => setApiError(extractError(err)),
  });

  // ── Mutation modifier ──────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditUserFormData }) =>
      api.put(`/users/${id}`, {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        roleId: data.roleId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
      setApiError('');
    },
    onError: (err) => setApiError(extractError(err)),
  });

  // ── Mutation activer/désactiver ────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/users/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (err) => setApiError(extractError(err)),
  });

  // ── Mutation supprimer ─────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteUser(null);
    },
    onError: (err) => setApiError(extractError(err)),
  });

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Utilisateurs</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {users.length} compte{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Can permission="users.create">
          <button
            onClick={() => { setApiError(''); setCreateOpen(true); }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            + Nouvel utilisateur
          </button>
        </Can>
      </div>

      {/* Erreur globale */}
      {apiError && (
        <div className="mb-4 bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center justify-between">
          <span>{apiError}</span>
          <button onClick={() => setApiError('')} className="text-red-400 hover:text-red-300 ml-4 text-lg leading-none">×</button>
        </div>
      )}

      {/* Tableau */}
      <UserTable
        users={users}
        loading={usersLoading}
        onEdit={(user) => { setApiError(''); setEditUser(user); }}
        onDelete={(user) => setDeleteUser(user)}
        onPermissions={(user) => setPermUser(user)}
        onToggle={(user) => toggleMutation.mutate(user.id)}
      />

      {/* Modal création */}
      <CreateUserModal
        open={createOpen}
        roles={roles}
        loading={createMutation.isPending}
        onClose={() => { setCreateOpen(false); setApiError(''); }}
        onSubmit={async (data) => createMutation.mutate(data)}
      />

      {/* Modal édition */}
      <EditUserModal
        open={!!editUser}
        user={editUser}
        roles={roles}
        loading={editMutation.isPending}
        onClose={() => { setEditUser(null); setApiError(''); }}
        onSubmit={async (data) => editMutation.mutate({ id: editUser!.id, data })}
      />

      {/* Panel permissions */}
      {permUser && (
        <PermissionsPanel
          open={!!permUser}
          userId={permUser.id}
          userName={`${permUser.prenom} ${permUser.nom}`}
          onClose={() => setPermUser(null)}
        />
      )}

      {/* Modal confirmation suppression */}
      {deleteUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setDeleteUser(null)}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-white font-semibold mb-2">Confirmer la suppression</h3>
            <p className="text-gray-400 text-sm mb-6">
              Supprimer <strong className="text-white">{deleteUser.prenom} {deleteUser.nom}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteUser(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteUser.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
