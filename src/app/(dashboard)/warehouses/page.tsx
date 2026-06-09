'use client';
import { useState } from 'react';

import { Can } from '@/components/auth/Can';
import { useWarehouses ,useWarehouseSummary} from '@/hooks/useWarehouses';

export default function WarehousesPage() {
  const { data: warehouses, isLoading } = useWarehouses();
  const { data: summary } = useWarehouseSummary();

  if (isLoading)
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"/>
    </div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Entrepôts</h1>
          <p className="text-gray-500 text-sm mt-1">{warehouses?.length ?? 0} entrepôt(s)</p>
        </div>
        <Can permission="stock.create">
          <a href="/warehouses/new"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Nouvel entrepôt
          </a>
        </Can>
      </div>

     
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {summary.map((s: any) => (
            <div key={s.warehouse.id} className="bg- border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{s.warehouse.nom}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {s.warehouse.code}
                </span>
              </div>
              <div className="text-2xl font-semibold">{s.totalItems}</div>
              <div className="text-xs text-gray-500">références · {s.totalValue.toFixed(2)} DTN valeur</div>
            </div>
          ))}
        </div>
      )}

      {/* Tableau */}
      <div className="bg border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Code','Nom','Ville','Statut','Actions'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {warehouses?.map(wh => (
              <tr key={wh.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-gray-400 px-2 py-0.5 rounded">{wh.code}</span>
                </td>
                <td className="px-4 py-3 text-sm font-medium">{wh.nom}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{wh.ville}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    wh.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {wh.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a href={`/warehouses/${wh.id}`} className="text-indigo-600 text-sm hover:underline">
                    Voir stock →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
