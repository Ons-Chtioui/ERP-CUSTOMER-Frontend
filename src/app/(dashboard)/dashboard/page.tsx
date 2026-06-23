// frontend/src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useDashboardAnalytics } from '@/hooks/useAnalytics';

import { Can } from '@/components/auth/Can';
import { ExportButtons } from '@/components/analytics/ExportButtons';
import { KPICard } from '@/components/analytics/KPICard';
import { BarChart } from '@/components/analytics/BarChart';

import {
  Warehouse,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Wallet,
  Receipt,
  FileText,
  Download,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Package,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

import { exportCsv } from '@/lib/export';

// ─── LOADING SPINNER ──────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-gray-400 text-sm">Chargement du tableau de bord...</p>
    </div>
  );
}

// ─── ERROR STATE ───────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center max-w-md">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-2">Erreur de chargement</h3>
        <p className="text-gray-400 text-sm">
          Impossible de charger les données du tableau de bord.
        </p>
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" /> Réessayer
        </button>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [year] = useState(new Date().getFullYear());

  // ─── QUERIES ──────────────────────────────────────────────────────
  const {
    data: analytics,
    isLoading: loadingAnalytics,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useDashboardAnalytics();

  const { data: warehouses = [], isLoading: loadingWarehouses } = useWarehouses();
  const { data: alerts = [], isLoading: loadingAlerts } = useStockAlerts();
  const { data: movements = [], isLoading: loadingMovements } = useStockMovements({ limit: 5 });

  const { data: summary = [] } = useQuery({
    queryKey: ['warehouses', 'summary'],
    queryFn: () => api.get('/warehouses/summary').then((r) => r.data),
    enabled: !loadingWarehouses,
  });

  // ─── COMPUTED VALUES ─────────────────────────────────────────────
  const activeWarehouses = useMemo(
    () => warehouses.filter((w: any) => w.isActive).length,
    [warehouses]
  );

  const activeAlerts = useMemo(
    () => alerts.filter((a: any) => a.status === 'active').length,
    [alerts]
  );

  const totalValue = useMemo(
    () => (summary as { totalValue?: number }[]).reduce(
      (s: number, w: { totalValue?: number }) => s + (w.totalValue ?? 0),
      0
    ),
    [summary]
  );

  const typeConfig: Record<string, { label: string; color: string; Icon: any }> = {
    IN: { label: 'Entrée', color: 'text-green-400', Icon: TrendingUp },
    OUT: { label: 'Sortie', color: 'text-red-400', Icon: TrendingDown },
    TRANSFER: { label: 'Transfert', color: 'text-blue-400', Icon: ArrowRightLeft },
    ADJUSTMENT: { label: 'Ajustement', color: 'text-orange-400', Icon: TrendingUp },
  };

  // ─── LOADING STATE ──────────────────────────────────────────────
  if (loadingAnalytics && !analytics) {
    return <LoadingSpinner />;
  }

  // ─── ERROR STATE ─────────────────────────────────────────────────
  if (analyticsError) {
    return <ErrorState onRetry={() => refetchAnalytics()} />;
  }

  // ─── RENDER ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Bonjour, {user?.prenom ?? 'Utilisateur'} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Rôle : <span className="text-indigo-400 font-medium">{typeof user?.role === 'string' ? user.role : user?.role?.nom ?? '—'}</span>
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            Dernière mise à jour : {new Date().toLocaleTimeString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* ✅ BOUTONS D'EXPORT EXCEL */}
          <ExportButtons year={year} />

          {/* ✅ BOUTON CSV (compatibilité) */}
          <Can permission="reports.export">
            <button
              onClick={async () => {
                try {
                  await exportCsv('dashboard');
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Erreur export CSV';
                  alert(message);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </Can>

          <button
            onClick={() => refetchAnalytics()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard
          title="CA encaissé"
          value={`${analytics?.revenue.paid.toFixed(0) ?? 0} DTN`}
          icon={<DollarSign />}
          color="text-green-400"
        />
        <KPICard
          title="Impayé"
          value={`${analytics?.revenue.unpaid.toFixed(0) ?? 0} DTN`}
          icon={<Wallet />}
          color="text-orange-400"
        />
        <KPICard
          title="Commandes livrées"
          value={analytics?.orders.delivered ?? 0}
          icon={<ShoppingCart />}
          color="text-blue-400"
        />
        <KPICard
          title="Factures en retard"
          value={analytics?.invoices.overdue ?? 0}
          icon={<AlertTriangle />}
          color="text-red-400"
        />
        <KPICard
          title="Conversion devis"
          value={`${analytics?.quotes.conversionRate ?? 0}%`}
          icon={<TrendingUp />}
          color="text-indigo-400"
        />
        <KPICard
          title="Alertes stock"
          value={activeAlerts}
          icon={<AlertTriangle />}
          color="text-orange-400"
        />

        <KPICard
          title="Entrepôts"
          value={activeWarehouses}
          icon={<Warehouse />}
          color="text-white"
          href="/warehouses"
        />
        <KPICard
          title="Valeur stock"
          value={`${totalValue.toFixed(0)} DTN`}
          icon={<Package />}
          color="text-white"
          href="/components"
        />
      </div>

      {/* CHARTS SECTION */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-medium flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-green-400" />
              Chiffre d&apos;affaires mensuel - {year}
            </h2>
            <BarChart
              data={analytics.monthlyRevenue.map((m) => ({
                month: m.month,
                revenue: m.revenue,
              }))}
              labelKey="month"
              valueKey="revenue"
              color="bg-green-500"
            />
            <div className="mt-3 text-right text-xs text-gray-500">
              Total : {analytics.monthlyRevenue.reduce((s, m) => s + m.revenue, 0).toFixed(0)} DTN
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-medium flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Produits les plus vendus
            </h2>
            <BarChart
              data={analytics.topProducts.map((p) => ({
                name: p.name,
                quantity: p.quantity,
              }))}
              labelKey="name"
              valueKey="quantity"
              color="bg-indigo-500"
            />
          </div>

          {/* Warehouse Performance */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-medium flex items-center gap-2 mb-4">
              <Warehouse className="w-4 h-4 text-blue-400" />
              Performance entrepôts
            </h2>
            {analytics.warehouses.length > 0 ? (
              <div className="space-y-3">
                {analytics.warehouses.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition"
                  >
                    <span className="text-white font-medium">{w.name}</span>
                    <div className="text-right">
                      <span className="text-gray-400 text-sm">{w.items} refs</span>
                      <span className="ml-3 text-green-400 font-mono">{w.value.toFixed(0)} DTN</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucun entrepôt configuré</p>
            )}
          </div>

          {/* Commercial KPIs */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-medium flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-purple-400" />
              KPIs commerciaux
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {analytics.invoices.byStatus.map((s) => (
                <div key={s.status} className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs capitalize">{s.status}</p>
                  <p className="text-white font-bold text-lg">{s.count}</p>
                  <p className="text-gray-500 text-xs font-mono">{s.total.toFixed(0)} DTN</p>
                </div>
              ))}
            </div>
            <Link
              href="/quotes"
              className="mt-4 inline-flex items-center gap-1 text-indigo-400 text-sm hover:text-indigo-300 transition"
            >
              <FileText className="w-4 h-4" /> Voir tous les devis →
            </Link>
          </div>
        </div>
      )}

      {/* BOTTOM SECTION - Stock Alerts & Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Alerts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Ruptures & alertes stock
            </h2>
            <Link href="/alerts" className="text-indigo-400 text-sm hover:text-indigo-300 transition">
              Voir tout →
            </Link>
          </div>
          {loadingAlerts ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Chargement des alertes...
            </div>
          ) : (
            <>
              {(analytics?.stockAlerts ?? alerts.filter((a: any) => a.status === 'active'))
                .slice(0, 5)
                .map((alert: any, i: number) => {
                  const componentName = alert.component?.nom ?? alert.component ?? 'Composant';
                  const warehouseName = alert.warehouse?.nom ?? alert.warehouse ?? 'Entrepôt';
                  const quantity = alert.quantity ?? alert.quantityAtAlert ?? 0;

                  return (
                    <div
                      key={alert.id ?? i}
                      className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate font-medium">{componentName}</p>
                        <p className="text-gray-500 text-xs">{warehouseName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-400 text-sm font-semibold">
                          {quantity} unités
                        </p>
                        <p className="text-gray-500 text-xs">Seuil: {alert.threshold ?? '—'}</p>
                      </div>
                    </div>
                  );
                })}
              {(!analytics?.stockAlerts || analytics.stockAlerts.length === 0) && (
                <p className="text-center text-gray-500 text-sm py-8">✅ Aucune alerte stock</p>
              )}
            </>
          )}
        </div>

        {/* Recent Movements */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Derniers mouvements
            </h2>
            <Link href="/stock-movements" className="text-indigo-400 text-sm hover:text-indigo-300 transition">
              Voir tout →
            </Link>
          </div>
          {loadingMovements ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Chargement des mouvements...
            </div>
          ) : (
            <>
              {movements.slice(0, 5).map((mov: any) => {
                const cfg = typeConfig[mov.type] ?? typeConfig.IN;
                const Icon = cfg.Icon;
                const isOut = mov.type === 'OUT';

                return (
                  <div
                    key={mov.id}
                    className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition"
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', cfg.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate font-medium">
                        {mov.component?.nom ?? 'Composant'}
                      </p>
                      <p className="text-gray-500 text-xs">{mov.warehouse?.nom ?? 'Entrepôt'}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-sm font-semibold', cfg.color)}>
                        {isOut ? '-' : '+'}{mov.quantity}
                      </p>
                      <p className="text-gray-500 text-xs capitalize">{cfg.label}</p>
                    </div>
                  </div>
                );
              })}
              {movements.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-8">Aucun mouvement récent</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}