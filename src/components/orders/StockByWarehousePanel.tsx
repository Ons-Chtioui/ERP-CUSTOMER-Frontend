// src/components/orders/StockByWarehousePanel.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Loader2, Warehouse, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductStockByWarehouse } from '@/hooks/useOrders';

interface StockByWarehousePanelProps {
  productId: number;
  selectedWarehouseId: number | null;
  onWarehouseStock?: (stock: {
    stockFini: number;
    stockFabricable: number;
    stockTotal: number;
  }) => void;
}

/** Affiche le stock fini / fabricable par entrepôt pour un produit. */
export function StockByWarehousePanel({
  productId,
  selectedWarehouseId,
  onWarehouseStock,
}: StockByWarehousePanelProps) {
  const { data: stocks = [], isLoading } = useProductStockByWarehouse(productId);

  // ✅ Ref pour éviter les mises à jour infinies
  const previousStockRef = useRef<string>('');

  useEffect(() => {
    if (!selectedWarehouseId || !onWarehouseStock) return;

    const row = stocks.find((s) => s.warehouseId === selectedWarehouseId);
    if (!row) return;

    // ✅ Créer une clé unique pour comparer les données
    const stockKey = `${row.stockFini}-${row.stockFabricable}-${row.stockTotal}`;

    // ✅ Ne mettre à jour que si les données ont changé
    if (previousStockRef.current !== stockKey) {
      previousStockRef.current = stockKey;
      onWarehouseStock({
        stockFini: row.stockFini,
        stockFabricable: row.stockFabricable,
        stockTotal: row.stockTotal,
      });
    }
  }, [stocks, selectedWarehouseId, onWarehouseStock]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="w-3 h-3 animate-spin" /> Chargement du stock...
      </div>
    );
  }

  if (!stocks.length) {
    return <p className="text-xs text-gray-600">Aucun entrepôt configuré</p>;
  }

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-800/50 text-gray-500">
            <th className="text-left px-2 py-1.5 font-medium">Entrepôt</th>
            <th className="text-right px-2 py-1.5 font-medium">
              <span className="inline-flex items-center gap-1">
                <Warehouse className="w-3 h-3" /> Fini
              </span>
            </th>
            <th className="text-right px-2 py-1.5 font-medium">
              <span className="inline-flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Fabric.
              </span>
            </th>
            <th className="text-right px-2 py-1.5 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((row) => {
            const isSelected = row.warehouseId === selectedWarehouseId;
            return (
              <tr
                key={row.warehouseId}
                className={cn(
                  'border-t border-gray-800',
                  isSelected ? 'bg-indigo-950/40' : 'bg-transparent',
                )}
              >
                <td className={cn('px-2 py-1.5', isSelected ? 'text-indigo-300 font-medium' : 'text-gray-400')}>
                  {row.warehouseName}
                  {isSelected && <span className="ml-1 text-indigo-400">●</span>}
                </td>
                <td className={cn('px-2 py-1.5 text-right font-mono', row.stockFini > 0 ? 'text-green-400' : 'text-gray-600')}>
                  {row.stockFini}
                </td>
                <td className={cn('px-2 py-1.5 text-right font-mono', row.stockFabricable > 0 ? 'text-blue-400' : 'text-gray-600')}>
                  {row.stockFabricable}
                </td>
                <td className={cn('px-2 py-1.5 text-right font-mono', row.stockTotal > 0 ? 'text-white' : 'text-gray-600')}>
                  {row.stockTotal}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Stock compact pour un résultat de recherche (entrepôt sélectionné). */
export function SearchResultStock({
  productId,
  warehouseId,
}: {
  productId: number;
  warehouseId: number;
}) {
  const { data: stocks = [], isLoading } = useProductStockByWarehouse(productId);
  const row = stocks.find((s) => s.warehouseId === warehouseId);

  if (isLoading) return <Loader2 className="w-3 h-3 animate-spin text-gray-500" />;
  if (!row) return <span className="text-gray-600 text-xs">—</span>;

  const hasStock = row.stockTotal > 0;

  return (
    <div className="text-right">
      <div className="flex items-center gap-1 justify-end">
        <Warehouse className="w-3 h-3 text-gray-500" />
        <span className={cn('text-xs font-mono', row.stockFini > 0 ? 'text-green-400' : 'text-gray-600')}>
          {row.stockFini}
        </span>
        <span className="text-gray-600 text-xs">finis</span>
      </div>
      <div className="flex items-center gap-1 justify-end">
        <Wrench className="w-3 h-3 text-gray-500" />
        <span className={cn('text-xs font-mono', row.stockFabricable > 0 ? 'text-blue-400' : 'text-gray-600')}>
          {row.stockFabricable}
        </span>
        <span className="text-gray-600 text-xs">fabric.</span>
      </div>
      {!hasStock && <span className="text-red-400 text-xs">Rupture</span>}
    </div>
  );
}