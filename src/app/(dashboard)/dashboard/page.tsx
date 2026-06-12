'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { useStockMovements } from '@/hooks/useStockMovements';
import {
  Warehouse, AlertTriangle, TrendingUp,
  TrendingDown, ArrowRightLeft, Bell,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: warehouses = [] }   = useWarehouses();
  const { data: alerts = [] }       = useStockAlerts();
  const { data: movements = [] }    = useStockMovements({ limit: 5 });
  const { data: summary = [] }      = useQuery({
    queryKey: ['warehouses', 'summary'],
    queryFn: () => api.get('/warehouses/summary').then(r => r.data),
  });

  const activeWarehouses  = warehouses.filter(w => w.isActive).length;
  const activeAlerts      = alerts.filter(a => a.status === 'active').length;
  const totalStock        = (summary as { totalQuantity?: number }[])
    .reduce((s: number, w: { totalQuantity?: number }) => s + (w.totalQuantity ?? 0), 0);
  const totalValue        = (summary as { totalValue?: number }[])
    .reduce((s: number, w: { totalValue?: number }) => s + (w.totalValue ?? 0), 0);

  const typeConfig: Record<string, { label: string; color: string; Icon: typeof TrendingUp }> = {
    IN:         { label: 'Entrée',      color: 'text-green-400',  Icon: TrendingUp },
    OUT:        { label: 'Sortie',      color: 'text-red-400',    Icon: TrendingDown },
    TRANSFER:   { label: 'Transfert',   color: 'text-blue-400',   Icon: ArrowRightLeft },
    ADJUSTMENT: { label: 'Ajustement', color: 'text-orange-400', Icon: TrendingUp },
  };

  return (
    <div className="space-y-6">
      {/* Accueil */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Bonjour, {user?.prenom ?? '…'} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Rôle : <span className="text-indigo-400 font-medium">{user?.role ?? '—'}</span>
        </p>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/warehouses" className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">Entrepôts actifs</p>
            <div className="w-9 h-9 bg-indigo-900/40 rounded-lg flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{activeWarehouses}</p>
        </Link>

        <Link href="/components" className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">Valeur stock</p>
            <div className="w-9 h-9 bg-green-900/40 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{totalValue.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-0.5">DTN</p>
        </Link>

        <Link href="/alerts" className={cn(
          'border rounded-xl p-5 transition-colors',
          activeAlerts > 0
            ? 'bg-orange-950/20 border-orange-800/50 hover:border-orange-700/70'
            : 'bg-gray-900 border-gray-800 hover:border-gray-700',
        )}>
          <div className="flex items-center justify-between mb-3">
            <p className={cn('text-sm', activeAlerts > 0 ? 'text-orange-400' : 'text-gray-400')}>
              Alertes stock
            </p>
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', activeAlerts > 0 ? 'bg-orange-900/50' : 'bg-gray-800')}>
              <Bell className={cn('w-5 h-5', activeAlerts > 0 ? 'text-orange-400' : 'text-gray-500')} />
            </div>
          </div>
          <p className={cn('text-3xl font-bold', activeAlerts > 0 ? 'text-orange-400' : 'text-white')}>
            {activeAlerts}
          </p>
        </Link>

        <Link href="/stock-movements" className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">Mouvements récents</p>
            <div className="w-9 h-9 bg-blue-900/40 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{movements.length}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertes actives */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Alertes stock actives
            </h2>
            <Link href="/alerts" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">
              Voir tout →
            </Link>
          </div>
          {alerts.filter(a => a.status === 'active').slice(0, 5).length > 0 ? (
            <div className="divide-y divide-gray-800">
              {alerts.filter(a => a.status === 'active').slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 bg-orange-900/40 rounded-lg flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{alert.component?.nom}</p>
                    <p className="text-gray-500 text-xs">{alert.warehouse?.nom}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-orange-400 text-sm font-semibold">{alert.quantityAtAlert}</p>
                    <p className="text-gray-600 text-xs">/ {alert.threshold}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-gray-600 text-sm">
              <span>✓ Aucune alerte active</span>
            </div>
          )}
        </div>

        {/* Derniers mouvements */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Derniers mouvements
            </h2>
            <Link href="/stock-movements" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">
              Voir tout →
            </Link>
          </div>
          {movements.slice(0, 5).length > 0 ? (
            <div className="divide-y divide-gray-800">
              {movements.slice(0, 5).map((mov) => {
                const cfg = typeConfig[mov.type] ?? typeConfig.IN;
                const Icon = cfg.Icon;
                return (
                  <div key={mov.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className={cn('w-4 h-4', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{mov.component?.nom}</p>
                      <p className="text-gray-500 text-xs">{mov.warehouse?.nom}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('text-sm font-semibold', cfg.color)}>
                        {mov.type === 'OUT' ? '-' : '+'}{mov.quantity}
                      </p>
                      <p className="text-gray-600 text-xs">{cfg.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-gray-600 text-sm">
              Aucun mouvement récent
            </div>
          )}
        </div>
      </div>

      {/* Résumé entrepôts */}
      {(summary as { warehouse: { id: number; nom: string; code: string }; totalItems: number; totalValue: number; totalQuantity: number }[]).length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-medium flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-indigo-400" />
              Résumé par entrepôt
            </h2>
            <Link href="/warehouses" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">
              Gérer →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {(summary as { warehouse: { id: number; nom: string; code: string }; totalItems: number; totalValue: number; totalQuantity: number }[]).map((s) => (
              <Link key={s.warehouse.id} href={`/warehouses/${s.warehouse.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{s.warehouse.nom}</p>
                    <span className="text-xs font-mono bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{s.warehouse.code}</span>
                  </div>
                </div>
                <div className="flex gap-6 text-right text-sm">
                  <div>
                    <p className="text-white font-semibold">{s.totalItems}</p>
                    <p className="text-gray-500 text-xs">références</p>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{(s.totalValue ?? 0).toFixed(0)}</p>
                    <p className="text-gray-500 text-xs">DTN</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
