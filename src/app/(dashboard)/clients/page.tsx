'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2, Plus, Search, Users, Edit, Trash2,
  Phone, Mail, MapPin, X, CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import { useClients, useDeleteClient } from '@/hooks/useClients';

export default function ClientsPage() {
  const [search, setSearch]         = useState('');
  const [deleteTarget, setDelete]   = useState<{ id: string; name: string } | null>(null);
  const [error, setError]           = useState('');

  const { data: clients = [], isLoading } = useClients(search || undefined);
  const deleteMutation = useDeleteClient();

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Clients</h1>
          <p className="text-gray-400 text-sm mt-0.5">{clients.length} client(s)</p>
        </div>
        <Can permission="clients.create">
          <Link href="/clients/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Nouveau client
          </Link>
        </Can>
      </div>

      {error && (
        <div className="flex items-center justify-between bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Recherche */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, code..."
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50 border-b border-gray-800">
            <tr>
              <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Client</th>
              <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Contact</th>
              <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Ville</th>
              <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Statut</th>
              <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/clients/${client.id}`} className="group">
                    <p className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                      {client.name}
                    </p>
                    <p className="text-gray-500 text-xs font-mono mt-0.5">{client.code}</p>
                  </Link>
                </td>
                <td className="px-4 py-3 space-y-0.5">
                  {client.email && (
                    <p className="flex items-center gap-1 text-gray-400 text-xs">
                      <Mail className="w-3 h-3" />{client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="flex items-center gap-1 text-gray-400 text-xs">
                      <Phone className="w-3 h-3" />{client.phone}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {client.city ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{client.city}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                    client.isActive ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500',
                  )}>
                    <CheckCircle className="w-3 h-3" />
                    {client.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Can permission="clients.edit">
                      <Link href={`/clients/${client.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/30 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Can>
                    <Can permission="clients.delete">
                      <button onClick={() => setDelete({ id: client.id, name: client.name })}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Can>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <div className="text-center py-14">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Aucun client</p>
          </div>
        )}
      </div>

      {/* Modal suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setDelete(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-white font-semibold mb-2">Supprimer le client</h3>
            <p className="text-gray-400 text-sm mb-6">
              Supprimer <strong className="text-white">{deleteTarget.name}</strong> ?
              Impossible s'il a des commandes.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelete(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteMutation.mutateAsync(deleteTarget.id);
                    setDelete(null);
                  } catch (err: unknown) {
                    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                    setError(msg || 'Erreur lors de la suppression');
                    setDelete(null);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors">
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
