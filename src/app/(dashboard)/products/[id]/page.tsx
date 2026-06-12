'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, Edit, Package,
  AlertTriangle, Play, ClipboardList, Warehouse, History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct, useProductAvailability, useProduce, useProductionLogs } from '@/hooks/useProducts';
import { useWarehouses } from '@/hooks/useWarehouses';
import { ProductCategoryBadge } from '@/components/products/ProductCategoryBadge';
import { BomSummaryWidget } from '@/components/products/BomSummaryWidget';
import { ProductStockWidget } from '@/components/products/ProductStockWidget';
import { Can } from '@/components/auth/Can';
import { mediaUrl } from '@/lib/media';

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const productId = parseInt(id as string);

  const { data: product, isLoading } = useProduct(productId);
  const { data: availability }       = useProductAvailability(productId);
  const { data: logs = [] }          = useProductionLogs(productId);
  const { data: warehouses = [] }    = useWarehouses();

  const produce = useProduce();

  const [produceOpen, setProduceOpen] = useState(false);
  const [produceQty, setProduceQty]   = useState(1);
  const [produceWh, setProduceWh]     = useState('');
  const [produceNote, setProduceNote] = useState('');
  const [produceError, setProduceError] = useState('');

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  if (!product) return <div className="text-center py-16 text-gray-400">Produit introuvable</div>;

  const prixVenteEff = Number(product.prixVente) > 0 ? Number(product.prixVente) : Number(product.prixVenteAuto);
  const cout = Number(product.coutRevient);
  const marge = prixVenteEff - cout;

  const handleProduce = async () => {
    if (!produceWh) { setProduceError('Sélectionner un entrepôt'); return; }
    setProduceError('');
    try {
      await produce.mutateAsync({ id: productId, quantity: produceQty, warehouseId: +produceWh, notes: produceNote });
      setProduceOpen(false);
      setProduceQty(1);
      setProduceWh('');
      setProduceNote('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setProduceError(msg || 'Erreur lors de la production');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="mt-1 p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-start gap-4">
            {product.imageUrl ? (
              <img src={mediaUrl(product.imageUrl)!} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-700 shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                <Package className="w-7 h-7 text-gray-600" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold text-white">{product.nom}</h1>
                {!product.isActive && <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">Archivé</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{product.reference}</span>
                <ProductCategoryBadge category={product.category} />
                {product.parent && <span className="text-xs text-purple-400">variante de {product.parent.nom}</span>}
              </div>
              {product.description && <p className="text-gray-500 text-sm mt-1">{product.description}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Can permission="bom.produce">
            <button onClick={() => setProduceOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors">
              <Play className="w-4 h-4" /> Produire
            </button>
          </Can>
          <Can permission="bom.edit">
            <Link href={`/products/${productId}/bom`}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
              <ClipboardList className="w-4 h-4" /> Gérer BOM
            </Link>
          </Can>
          <Can permission="bom.edit">
            <Link href={`/products/${productId}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
              <Edit className="w-4 h-4" /> Modifier
            </Link>
          </Can>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Coût de revient', value: `${cout.toFixed(3)} DTN`, cls: 'text-white',       sub: `MO: ${Number(product.coutMO).toFixed(3)} DTN` },
          { label: 'Prix de vente',   value: `${prixVenteEff.toFixed(3)} DTN`, cls: 'text-green-400', sub: Number(product.prixVente) === 0 ? 'calculé auto' : 'manuel' },
          { label: 'Marge unitaire',  value: `${marge >= 0 ? '+' : ''}${marge.toFixed(3)} DTN`, cls: marge >= 0 ? 'text-emerald-400' : 'text-red-400', sub: `${((marge / (cout || 1)) * 100).toFixed(0)}%` },
          { label: 'Fabricables',     value: availability?.stockDisponible ?? '…', cls: 'text-blue-400', sub: availability?.goulot ? `goulot: ${availability.goulot.nom}` : 'toutes entrepôts' },
        ].map(({ label, value, cls, sub }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            <p className={cn('text-xl font-bold', cls)}>{value}</p>
            <p className="text-gray-600 text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BOM résumé */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-white font-medium">Disponibilité stock</h2>
            <Can permission="bom.edit">
              <Link href={`/products/${productId}/bom`}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Gérer BOM →
              </Link>
            </Can>
          </div>
          <div className="p-5">
            {availability ? (
              <BomSummaryWidget availability={availability} unite={product.unite} />
            ) : (
              <p className="text-gray-600 text-sm text-center py-4">Chargement…</p>
            )}
          </div>
        </div>

        {/* Stock produit fini */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-indigo-400" />
            <h2 className="text-white font-medium">Stock produit fini</h2>
          </div>
          <div className="p-5">
            <ProductStockWidget productId={productId} unite={product.unite} />
          </div>
        </div>
      </div>

      {/* Historique productions */}
      {logs.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h2 className="text-white font-medium">Historique des productions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-800">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Quantité</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Coût unitaire</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Coût total</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Entrepôt</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(log.producedAt).toLocaleString('fr-TN')}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-semibold">{log.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-400">
                      {Number(log.coutUnitaireSnapshot).toFixed(3)} DTN
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white font-mono">
                      {Number(log.coutTotal).toFixed(3)} DTN
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{log.warehouse?.nom}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Production */}
      {produceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setProduceOpen(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-900/40 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Lancer la production</h3>
                <p className="text-gray-500 text-xs">{product.nom}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Quantité à produire</label>
                <input type="number" min="1" step="1" value={produceQty}
                  onChange={e => setProduceQty(+e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
                <p className="text-gray-600 text-xs mt-1">
                  Fabricables : <span className="text-green-400 font-medium">{availability?.stockDisponible ?? '?'}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Entrepôt <span className="text-red-400">*</span></label>
                <select value={produceWh} onChange={e => setProduceWh(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500">
                  <option value="">-- Sélectionner --</option>
                  {warehouses.filter(w => w.isActive).map(w => <option key={w.id} value={w.id}>{w.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Notes</label>
                <input type="text" value={produceNote} onChange={e => setProduceNote(e.target.value)}
                  placeholder="Ex: Lot juin 2026"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
              </div>

              {produceWh && (
                <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-3 text-sm">
                  <p className="text-gray-300">Coût estimé :</p>
                  <p className="text-green-400 font-semibold">
                    {(cout * produceQty).toFixed(3)} DTN
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">{produceQty} × {cout.toFixed(3)} DTN</p>
                </div>
              )}

              {produceError && (
                <div className="bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {produceError}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setProduceOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
                Annuler
              </button>
              <button onClick={handleProduce} disabled={produce.isPending || !produceWh || produceQty <= 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors">
                {produce.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {produce.isPending ? 'Production...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
