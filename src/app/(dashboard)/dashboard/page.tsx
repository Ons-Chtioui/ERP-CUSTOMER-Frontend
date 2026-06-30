// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useState } from 'react';
import {
  TrendingUp, Package, FileText, AlertTriangle,
  ShoppingCart, Building2, RefreshCw, Calendar,
} from 'lucide-react';
import { Can } from '@/components/auth/Can';
import { useDashboardAnalytics } from '@/hooks/useAnalytics';
import { KPICard } from '@/components/analytics/KPICard';
import { RevenueChart } from '@/components/analytics/Revenuechart';
import { TopProductsChart } from '@/components/analytics/Topproductschart';
import { StatusPieChart } from '@/components/analytics/Statuspiechart';
import { ExportButtons } from '@/components/analytics/ExportButtons';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2,CURRENT_YEAR - 3,CURRENT_YEAR - 4];

export default function DashboardPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const {
    isLoading, isError,
    kpis, monthlyCa, topProducts,
    stockStatus, ordersByStatus, warehousePerf,
    rolling12, refetch,
  } = useDashboardAnalytics(year);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-800 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-900 border border-gray-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-gray-900 border border-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-900 border border-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !kpis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-gray-400">Impossible de charger les données</p>
        <button onClick={refetch}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">
          Réessayer
        </button>
      </div>
    );
  }

  // Taux de paiement
  const totalRevenue = kpis.ca + kpis.totalUnpaid;
  const paymentRate  = totalRevenue > 0 ? Math.round((kpis.ca / totalRevenue) * 100) : 0;

  // Alertes critiques (rupture + critique)
  const criticalAlerts = stockStatus.filter(s => s.status === 'rupture' || s.status === 'critique');

  return (
    <div className="space-y-6">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm">Vue d&apos;ensemble — Année {year}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sélecteur année */}
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
  <Calendar className="w-4 h-4 text-blue-500" />
  <select 
    value={year} 
    onChange={e => setYear(Number(e.target.value))}
    className="bg-transparent text-white text-sm focus:outline-none"
  >
    {YEARS.map(y => (
      <option key={y} value={y} className="bg-gray-800 text-white hover:bg-gray-700">
        {y}
      </option>
    ))}
  </select>
</div>
          {/* Rafraîchir */}
          <button onClick={refetch}
            className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Rafraîchir">
            <RefreshCw className="w-4 h-4" />
          </button>
          {/* Exports Excel */}
          <Can permission="analytics.export">
            <ExportButtons year={year} />
          </Can>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="CA Encaissé"
          value={`${kpis.ca.toFixed(3)} DTN`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-green-400"
          subtitle={`Impayé : ${kpis.totalUnpaid.toFixed(3)} DTN`}
          progress={paymentRate}
          progressColor="bg-green-500"
          href="/invoices?status=paid"
        />
        <KPICard
          title="Commandes"
          value={kpis.orderCount}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="text-indigo-400"
          subtitle={`${ordersByStatus.find(o => o.status === 'delivered')?.count ?? 0} livrées`}
          href="/orders"
        />
        <KPICard
          title="Factures en retard"
          value={kpis.overdueInvoiceCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={kpis.overdueInvoiceCount > 0 ? 'text-red-400' : 'text-green-400'}
          subtitle={kpis.overdueInvoiceCount > 0 ? 'Action requise' : 'Tout est à jour ✓'}
          href="/invoices?status=overdue"
        />
        <KPICard
          title="Stock critique"
          value={kpis.lowStockCount}
          icon={<Package className="w-5 h-5" />}
          color={kpis.lowStockCount > 0 ? 'text-orange-400' : 'text-green-400'}
          subtitle={kpis.lowStockCount > 0 ? 'Réappro. nécessaire' : 'Stock OK ✓'}
          href="/alerts"
        />
      </div>

      {/* ── Graphiques ligne 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CA Mensuel (2/3) */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              CA mensuel {year}
            </h2>
            <span className="text-gray-500 text-xs font-mono">
              Total : {kpis.ca.toFixed(3)} DTN
            </span>
          </div>
          {/* CA glissant 12 mois si disponible, sinon mensuel de l'année */}
          <RevenueChart
            data={rolling12.length > 0
              ? rolling12.map(r => ({ month: r.month, revenue: r.ca }))
              : monthlyCa.map(m => ({ month: m.month, revenue: m.ca }))
            }
            height={220}
          />
        </div>

        {/* Commandes par statut (1/3) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-medium mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-indigo-400" />
            Commandes par statut
          </h2>
          <StatusPieChart
            data={ordersByStatus.map(o => ({ status: o.status, count: o.count }))}
            height={220}
          />
        </div>
      </div>

      {/* ── Graphiques ligne 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 produits */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              Top 5 produits {year}
            </h2>
            <span className="text-gray-500 text-xs">par quantité vendue</span>
          </div>
          <TopProductsChart
            data={topProducts.map(p => ({
              name:      p.name,
              reference: p.reference,
              quantity:  p.totalQty,
              revenue:   p.totalHt,
            }))}
            metric="quantity"
            height={250}
          />
        </div>

        {/* État stock composants */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              État stock composants
            </h2>
            {criticalAlerts.length > 0 && (
              <span className="bg-red-900/40 text-red-400 text-xs px-2 py-0.5 rounded-full">
                {criticalAlerts.length} alertes
              </span>
            )}
          </div>
          {/* Tableau résumé par statut */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(['rupture', 'critique', 'faible', 'normal'] as const).map(s => {
              const count = stockStatus.filter(c => c.status === s).length;
              const colors = {
                rupture:  'text-red-400 bg-red-900/30 border-red-800/50',
                critique: 'text-orange-400 bg-orange-900/30 border-orange-800/50',
                faible:   'text-yellow-400 bg-yellow-900/30 border-yellow-800/50',
                normal:   'text-green-400 bg-green-900/30 border-green-800/50',
              };
              const labels = { rupture: 'Rupture', critique: 'Critique', faible: 'Faible', normal: 'Normal' };
              return (
                <div key={s} className={`border rounded-lg p-3 ${colors[s]}`}>
                  <p className="text-xs opacity-70">{labels[s]}</p>
                  <p className="text-2xl font-bold font-mono">{count}</p>
                </div>
              );
            })}
          </div>
          {/* Alertes critiques */}
          {criticalAlerts.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {criticalAlerts.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 truncate max-w-[160px]">{c.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-red-400">{c.quantiteDisponible}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      c.status === 'rupture' ? 'bg-red-900/50 text-red-400' : 'bg-orange-900/50 text-orange-400'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Performance entrepôts ── */}
      {warehousePerf.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-medium mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Performance des entrepôts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {warehousePerf.map(wh => {
              const maxValue = Math.max(...warehousePerf.map(w => w.stockValue), 1);
              const pct = Math.round((wh.stockValue / maxValue) * 100);
              return (
                <div key={wh.warehouseId} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-white text-sm font-medium">{wh.warehouseName}</p>
                    <span className="bg-indigo-900/40 text-indigo-400 text-xs px-2 py-0.5 rounded-full">
                      {wh.componentCount} réf.
                    </span>
                  </div>
                  <p className="text-indigo-400 font-mono text-lg font-bold">
                    {wh.stockValue.toFixed(0)} DTN
                  </p>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{pct}% de la valeur totale</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}