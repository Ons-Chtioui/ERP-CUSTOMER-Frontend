'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Warehouse, Plus, Edit, Eye, CheckCircle, XCircle, Package, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import api from '@/lib/api';
import { Warehouse as WarehouseType } from '@/types/stock';

export default function WarehousesPage() {
  const queryClient = useQueryClient();

  // Requêtes
  const { data: warehouses, isLoading } = useQuery<WarehouseType[]>({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then(r => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['warehouses', 'summary'],
    queryFn: () => api.get('/warehouses/summary').then(r => r.data),
  });

  // Mutation pour activer/désactiver
  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/warehouses/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', 'summary'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  const totalValue = summary?.reduce((s: any, item: any) => s + item.totalValue, 0) || 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Entrepôts</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {warehouses?.length ?? 0} entrepôt(s)
          </p>
        </div>
        <Can permission="stock.create">
          <Link
            href="/warehouses/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvel entrepôt
          </Link>
        </Can>
      </div>

      {/* Cartes résumé */}
      {summary && summary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary.map((s: any) => (
            <div key={s.warehouse.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium text-sm">{s.warehouse.nom}</span>
                <span className="text-xs font-mono bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                  {s.warehouse.code}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Références</div>
                    <div className="text-white font-semibold">{s.totalItems}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* <Euro className="w-4 h-4 text-gray-500" /> */}
                  <div>
                    <div className="text-xs text-gray-500">Valeur</div>
                    <div className="text-white font-semibold">{s.totalValue.toFixed(2)} DTN</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tableau */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Code</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Nom</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Ville</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Statut</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {warehouses?.map((wh) => (
                <tr key={wh.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                      {wh.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{wh.nom}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{wh.ville || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                      wh.isActive
                        ? "bg-green-900/50 text-green-400"
                        : "bg-gray-800 text-gray-500"
                    )}>
                      {wh.isActive ? (
                        <><CheckCircle className="w-3 h-3" /> Actif</>
                      ) : (
                        <><XCircle className="w-3 h-3" /> Inactif</>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Can permission="stock.edit">
                        <button
                          onClick={() => toggleMutation.mutate(wh.id)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            wh.isActive
                              ? "text-red-400 hover:bg-red-900/50"
                              : "text-green-400 hover:bg-green-900/50"
                          )}
                          title={wh.isActive ? "Désactiver" : "Activer"}
                        >
                          {wh.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </Can>
                      <Link
                        href={`/warehouses/${wh.id}/edit`}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/warehouses/${wh.id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors"
                        title="Voir stock"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {warehouses?.length === 0 && (
          <div className="text-center py-12">
            <Warehouse className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucun entrepôt</p>
            <Can permission="stock.create">
              <Link
                href="/warehouses/new"
                className="inline-block mt-3 text-indigo-400 text-sm hover:underline"
              >
                Créer le premier entrepôt
              </Link>
            </Can>
          </div>
        )}
      </div>
    </div>
  );
}