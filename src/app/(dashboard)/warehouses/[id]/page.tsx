'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, Warehouse, Package, Edit,
  MapPin, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useWarehouseStock } from '@/hooks/useWarehouses';
import { ComponentImage } from '@/components/stock/ComponentImage';

export default function WarehouseDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const warehouseId = parseInt(id as string);

  const { data: warehouse, isLoading } = useQuery({
    queryKey: ['warehouses', warehouseId],
    queryFn: () => api.get(`/warehouses/${warehouseId}`).then(r => r.data),
    enabled: !!warehouseId,
  });

  const { data: stock = [], isLoading: stockLoading } = useWarehouseStock(warehouseId);

  const totalValue = stock.reduce((s: number, i: { component: { prixAchat: number | string }; quantity: number }) =>
    s + (Number(i.component?.prixAchat) || 0) * Number(i.quantity), 0);
  const lowStock = stock.filter((i: { component: { seuilAlerte: number | string }; quantity: number }) =>
    Number(i.quantity) <= Number(i.component?.seuilAlerte) && Number(i.component?.seuilAlerte) > 0);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  if (!warehouse) return <div className="text-center py-16 text-gray-400">Entrepôt introuvable</div>;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">{warehouse.nom}</h1>
              <span className="font-mono text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{warehouse.code}</span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full', warehouse.isActive ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500')}>
                {warehouse.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            {(warehouse.ville || warehouse.pays) && (
              <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[warehouse.ville, warehouse.pays].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
        <Link href={`/warehouses/${warehouseId}/edit`} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
          <Edit className="w-4 h-4" /> Modifier
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Références',    value: stock.length,                 cls: 'text-white',        icon: Package },
          { label: 'Valeur stock',  value: `${totalValue.toFixed(0)} DTN`, cls: 'text-white',      icon: TrendingUp },
          { label: 'Stock bas',     value: lowStock.length,              cls: lowStock.length > 0 ? 'text-orange-400' : 'text-gray-500', icon: AlertTriangle },
          { label: 'Quantité totale', value: stock.reduce((s: number, i: { quantity: number }) => s + Number(i.quantity), 0), cls: 'text-white', icon: Package },
        ].map(({ label, value, cls, icon: Icon }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-xs">{label}</p>
              <Icon className="w-4 h-4 text-gray-600" />
            </div>
            <p className={cn('text-2xl font-bold', cls)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Stock */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-400" />
            Stock par composant
          </h2>
          {stockLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Composant</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Qté disponible</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Réservé</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Prix achat</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stock.map((item: {
                id: number;
                component: { id: number; nom: string; reference: string; imageUrl?: string; unite: string; prixAchat: number | string; seuilAlerte: number | string };
                quantity: number;
                reservedQty: number;
              }) => {
                const isLow = Number(item.quantity) <= Number(item.component?.seuilAlerte) && Number(item.component?.seuilAlerte) > 0;
                return (
                  <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/components/${item.component?.id}`} className="flex items-center gap-3 hover:opacity-80">
                        <ComponentImage imageUrl={item.component?.imageUrl} nom={item.component?.nom} size="sm" />
                        <div>
                          <p className="text-white text-sm font-medium">{item.component?.nom}</p>
                          <p className="text-gray-500 text-xs font-mono">{item.component?.reference}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('text-sm font-semibold', isLow ? 'text-orange-400' : 'text-white')}>
                        {Number(item.quantity).toFixed(2)}
                      </span>
                      <span className="text-gray-500 text-xs ml-1">{item.component?.unite}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-white text-sm">{Number(item.reservedQty).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-400">
                      {Number(item.component?.prixAchat).toFixed(3)} DTN
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-900/50 text-orange-400">
                          <AlertTriangle className="w-3 h-3" /> Stock bas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">✓ OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {stock.length === 0 && !stockLoading && (
          <div className="text-center py-12 text-gray-500 text-sm">
            <Package className="w-10 h-10 mx-auto mb-2 text-gray-700" />
            Aucun stock dans cet entrepôt
          </div>
        )}
      </div>
    </div>
  );
}
