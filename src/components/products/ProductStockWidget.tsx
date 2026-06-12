'use client';

import { useState } from 'react';
import { Warehouse, ArrowRightLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductInventory, useTransferProductStock } from '@/hooks/useProductInventory';
import { useWarehouses } from '@/hooks/useWarehouses';

interface Props {
  productId: number;
  unite?: string;
}

export function ProductStockWidget({ productId, unite = 'unité' }: Props) {
  const { data: inventory = [], isLoading } = useProductInventory(productId);
  const { data: warehouses = [] } = useWarehouses();
  const transfer = useTransferProductStock(productId);

  const [showTransfer, setShowTransfer] = useState(false);
  const [fromWh, setFromWh] = useState('');
  const [toWh, setToWh] = useState('');
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');

  const totalStock = inventory.reduce((s, i) => s + Number(i.quantity), 0);

  const handleTransfer = async () => {
    if (!fromWh || !toWh || !qty) { setError('Tous les champs sont requis'); return; }
    if (fromWh === toWh) { setError('Source et destination identiques'); return; }
    setError('');
    try {
      await transfer.mutateAsync({
        fromWarehouseId: +fromWh,
        toWarehouseId: +toWh,
        quantity: +qty,
      });
      setShowTransfer(false);
      setFromWh(''); setToWh(''); setQty('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Erreur lors du transfert');
    }
  };

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>;

  return (
    <div className="space-y-3">
      {/* Total */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Stock total</p>
        <p className="text-white font-semibold">{totalStock} {unite}{totalStock !== 1 ? 's' : ''}</p>
      </div>

      {/* Par entrepôt */}
      {inventory.length > 0 ? (
        <div className="space-y-2">
          {inventory.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-white text-sm">{item.warehouse.nom}</span>
                <span className="text-gray-500 text-xs font-mono">{item.warehouse.code}</span>
              </div>
              <span className={cn(
                'text-sm font-semibold',
                Number(item.quantity) === 0 ? 'text-gray-500' : 'text-green-400',
              )}>
                {Number(item.quantity).toFixed(2)} {unite}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-sm text-center py-4">Aucun stock</p>
      )}

      {/* Bouton transfert */}
      {inventory.length > 1 && (
        <button
          onClick={() => setShowTransfer(v => !v)}
          className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          {showTransfer ? 'Annuler' : 'Transférer entre entrepôts'}
        </button>
      )}

      {/* Formulaire transfert */}
      {showTransfer && (
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-white text-sm font-medium">Transfert de stock</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Source</label>
              <select value={fromWh} onChange={e => setFromWh(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500">
                <option value="">--</option>
                {inventory.map(i => <option key={i.id} value={i.warehouse.id}>{i.warehouse.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Destination</label>
              <select value={toWh} onChange={e => setToWh(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500">
                <option value="">--</option>
                {warehouses.filter(w => w.isActive && String(w.id) !== fromWh)
                  .map(w => <option key={w.id} value={w.id}>{w.nom}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Quantité</label>
            <input type="number" step="0.01" min="0.01" value={qty} onChange={e => setQty(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleTransfer} disabled={transfer.isPending}
            className="w-full flex items-center justify-center gap-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs rounded-lg transition-colors">
            {transfer.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
            Transférer
          </button>
        </div>
      )}
    </div>
  );
}
