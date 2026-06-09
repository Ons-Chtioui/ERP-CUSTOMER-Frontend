'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { Can } from '@/components/auth/Can';
import { PermissionsPanel } from '@/components/users/PermissionsPanel';
import { useState } from 'react';

interface UserDetail {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: { id: number; nom: string; label: string } | string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [permOpen, setPermOpen] = useState(false);

  const { data: user, isLoading, isError } = useQuery<UserDetail>({
    queryKey: ['user', id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        Chargement…
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-400 text-sm">Impossible de charger l&apos;utilisateur.</p>
        <button
          onClick={() => router.back()}
          className="text-indigo-400 text-sm hover:underline"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          aria-label="Retour"
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {user.prenom} {user.nom}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
        </div>
        <Can permission="users.permissions">
          <button
            onClick={() => setPermOpen(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Permissions
          </button>
        </Can>
      </div>

      {/* Infos */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 max-w-lg">
        {[
          { label: 'Prénom', value: user.prenom },
          { label: 'Nom', value: user.nom },
          { label: 'Email', value: user.email },
          { label: 'Rôle', value: typeof user.role === 'string' ? user.role : user.role?.label },
          {
            label: 'Statut',
            value: user.isActive ? 'Actif' : 'Inactif',
          },
          {
            label: 'Membre depuis',
            value: new Date(user.createdAt).toLocaleDateString('fr-FR'),
          },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-400">{label}</span>
            <span className="text-white font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Permissions panel */}
      <PermissionsPanel
        open={permOpen}
        userId={user.id}
        userName={`${user.prenom} ${user.nom}`}
        onClose={() => setPermOpen(false)}
      />
    </div>
  );
}
