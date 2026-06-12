'use client';

import { Package, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Availability } from '@/types/products';

interface Props {
  availability: Availability;
  unite?: string;
}

export function BomSummaryWidget({ availability, unite = 'unité' }: Props) {
  const { stockDisponible, goulot, details } = availability;

  return (
    <div className="space-y-4">
      {/* Stock fabricable */}
      <div className={cn(
        'rounded-xl p-4 flex items-center justify-between',
        stockDisponible > 0
          ? 'bg-green-950/30 border border-green-800/50'
          : 'bg-orange-950/30 border border-orange-800/50',
      )}>
        <div className="flex items-center gap-3">
          {stockDisponible > 0
            ? <TrendingUp className="w-5 h-5 text-green-400" />
            : <AlertTriangle className="w-5 h-5 text-orange-400" />}
          <div>
            <p className={cn('font-medium', stockDisponible > 0 ? 'text-green-400' : 'text-orange-400')}>
              {stockDisponible > 0 ? 'Fabricable' : 'Stock insuffisant'}
            </p>
            <p className="text-gray-400 text-sm">
              {stockDisponible} {unite}{stockDisponible !== 1 ? 's' : ''} disponibles à la production
            </p>
          </div>
        </div>
        <p className={cn('text-3xl font-bold', stockDisponible > 0 ? 'text-green-400' : 'text-orange-400')}>
          {stockDisponible}
        </p>
      </div>

      {/* Goulot d'étranglement */}
      {goulot && stockDisponible === details.find(d => d.isGoulot)?.fabricable && (
        <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-950/20 border border-yellow-800/30 rounded-lg px-3 py-2">
          <Zap className="w-4 h-4 shrink-0" />
          <span>Goulot : <strong>{goulot.nom}</strong> — limite à {goulot.fabricable} unité{goulot.fabricable !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Détail par composant */}
      <div className="space-y-2">
        {details.map((d) => {
          const pct = d.qteBom > 0 ? Math.min(100, (d.stockDispo / d.qteBom) * 10) : 100;
          return (
            <div key={d.componentId} className={cn(
              'bg-gray-800/50 rounded-lg p-3',
              d.isGoulot && 'border border-yellow-700/40',
            )}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <span className="text-white text-sm font-medium">{d.nom}</span>
                  {d.isGoulot && (
                    <span className="text-xs bg-yellow-900/50 text-yellow-400 px-1.5 py-0.5 rounded">goulot</span>
                  )}
                </div>
                <div className="text-right text-xs text-gray-400">
                  <span className={cn('font-semibold', d.stockDispo < d.qteBom ? 'text-orange-400' : 'text-white')}>
                    {d.stockDispo}
                  </span>
                  <span> / {d.qteBom} requis → </span>
                  <span className={cn('font-semibold', d.fabricable === 0 ? 'text-red-400' : 'text-green-400')}>
                    {d.fabricable} fab.
                  </span>
                </div>
              </div>
              {/* Barre de progression */}
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    d.fabricable === 0 ? 'bg-red-500' : d.isGoulot ? 'bg-yellow-500' : 'bg-green-500',
                  )}
                  style={{ width: `${Math.min(100, (d.stockDispo / Math.max(d.qteBom, 1)) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
