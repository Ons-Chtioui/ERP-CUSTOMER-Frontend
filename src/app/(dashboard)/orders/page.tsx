'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2, Plus, ShoppingCart, Search, Filter,
  TrendingUp, Clock, CheckCircle, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import { useOrders, useOrderStats } from '@/hooks/useOrders';
import { useClients } from '@/hooks/useClients';
import {
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type OrderStatus,
} from '@/types/orders';

const STATUS_LIST: OrderStatus[] = ['draft', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [filterStatus, setFilterStatus]   = useState<OrderStatus | ''>('');
  const [filterClient, setFilterClient]   = useState('');
  const [page, setPage]                   = useState(1);

  const { data: ordersData, isLoading } = useOrders({
    status:   filterStatus || undefined,
    clientId: filterClient || undefined,
    page,
    limit: 20,
  });
  const { data: stats } = useOrderStats();
  const { data: clients = [] } = useClients();

  const orders = ordersData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Commandes</h1>
          <p className="text-gray-400 text-sm mt-0.5">{ordersData?.total ?? 0} commande(s)</p>
        </div>
        <Can permission="orders.create">
          <Link href="/orders/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle commande
          </Link>
        </Can>
      </div>

      {/* KPI */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total commandes', value: stats.totalOrders, icon: ShoppingCart, color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
            { label: 'CA total TTC', value: `${stats.totalRevenue.toFixed(0)} DTN`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-900/30' },
            { label: 'Panier moyen', value: `${stats.avgOrderValue.toFixed(0)} DTN`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-900/30' },
            { label: 'Livrées', value: stats.stats.find(s => s.status === 'delivered')?.count ?? 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs">{label}</p>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
                  <Icon className={cn('w-4 h-4', color)} />
                </div>
              </div>
              <p className={cn('text-xl font-bold', color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as OrderStatus | ''); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
            <option value="">Tous les statuts</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
          </select>
          <select value={filterClient} onChange={e => { setFilterClient(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
            <option value="">Tous les clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => { setFilterStatus(''); setFilterClient(''); setPage(1); }}
            className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 transition-colors">
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-800">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Référence</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Client</th>
                    <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Statut</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Total TTC</th>
                    <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Lignes</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/orders/${order.id}`} className="text-indigo-400 hover:text-indigo-300 font-mono text-sm transition-colors">
                          {order.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-white text-sm">{order.client?.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', ORDER_STATUS_COLORS[order.status])}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono text-sm">
                        {Number(order.totalTtc).toFixed(3)} DTN
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 text-sm">
                        {order.lines?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('fr-TN')}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/orders/${order.id}`}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                          Détails →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div className="text-center py-14">
                <ShoppingCart className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Aucune commande</p>
              </div>
            )}

            {/* Pagination */}
            {ordersData && ordersData.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <p className="text-gray-500 text-xs">
                  Page {ordersData.page} / {ordersData.totalPages} — {ordersData.total} commandes
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm rounded-lg transition-colors">
                    ← Préc.
                  </button>
                  <button onClick={() => setPage(p => Math.min(ordersData.totalPages, p + 1))} disabled={page === ordersData.totalPages}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm rounded-lg transition-colors">
                    Suiv. →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
