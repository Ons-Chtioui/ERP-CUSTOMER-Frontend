'use client';

/**
 * Page de création d'une nouvelle commande.
 *
 * Sélection d'entrepôt obligatoire : le stock affiché et déduit
 * correspond à l'entrepôt choisi (fini + fabricable).
 */

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Loader2, ArrowLeft, Trash2, ShoppingCart,
  AlertTriangle, ChevronDown, ChevronUp, Package,
  Warehouse, Wrench, CheckCircle2, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateOrder } from '@/hooks/useOrders';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useWarehouses } from '@/hooks/useWarehouses';
import { mediaUrl } from '@/lib/media';
import { SupplementSelector, type DraftSupplement } from '@/components/orders/SupplementSelector';
import { StockByWarehousePanel, SearchResultStock } from '@/components/orders/StockByWarehousePanel';

interface DraftLine {
  productId: string;
  nom: string;
  reference: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  discount: number;
  tvaRate: number;
  supplements: DraftSupplement[];
  showSupplements: boolean;
  stockFini: number;
  stockFabricable: number;
  stockTotal: number;
}

const TVA = 19;
const round = (n: number) => Math.round(n * 1000) / 1000;

function StockBadge({
  stockFini,
  stockFabricable,
  quantity,
  compact = false,
}: {
  stockFini: number;
  stockFabricable: number;
  quantity?: number;
  compact?: boolean;
}) {
  const stockTotal = stockFini + stockFabricable;
  const needed     = quantity ?? 0;
  const color =
    needed === 0
      ? stockTotal > 0 ? 'text-green-400' : 'text-red-400'
      : stockTotal >= needed
      ? 'text-green-400'
      : stockTotal > 0
      ? 'text-orange-400'
      : 'text-red-400';

  if (compact) {
    return (
      <div className={cn('text-xs font-mono text-right', color)}>
        <div className="flex items-center gap-1 justify-end">
          <Warehouse className="w-3 h-3 opacity-70" />
          <span>{stockFini}</span>
        </div>
        {stockFabricable > 0 && (
          <div className="flex items-center gap-1 justify-end text-blue-400">
            <Wrench className="w-3 h-3 opacity-70" />
            <span>+{stockFabricable}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1 text-gray-400">
        <Warehouse className="w-3.5 h-3.5" />
        <span>Stock fini :</span>
        <span className={stockFini > 0 ? 'text-green-400 font-mono' : 'text-red-400 font-mono'}>
          {stockFini}
        </span>
      </div>
      <div className="flex items-center gap-1 text-gray-400">
        <Wrench className="w-3.5 h-3.5" />
        <span>Fabricable :</span>
        <span className={stockFabricable > 0 ? 'text-blue-400 font-mono' : 'text-gray-600 font-mono'}>
          {stockFabricable}
        </span>
      </div>
      {needed > 0 && (
        <div className="flex items-center gap-1">
          {stockTotal >= needed ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className={color}>
            {stockTotal >= needed
              ? `OK (${stockTotal} dispo / ${needed} requis)`
              : `Insuffisant (${stockTotal} dispo / ${needed} requis)`}
          </span>
        </div>
      )}
    </div>
  );
}

function NewOrderForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const create       = useCreateOrder();

  const [clientId, setClientId]           = useState(searchParams.get('clientId') ?? '');
  const [warehouseId, setWarehouseId]     = useState('');
  const [note, setNote]                   = useState('');
  const [discount, setDiscount]           = useState(0);
  const [lines, setLines]                 = useState<DraftLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [error, setError]                 = useState('');

  const { data: clients = [] }     = useClients();
  const { data: warehouses = [] }  = useWarehouses();
  const activeWarehouses           = warehouses.filter((w) => w.isActive);
  const selectedWarehouseId        = warehouseId ? Number(warehouseId) : null;

  const { data: allProducts = [] } = useProducts({
    search: productSearch || undefined,
  });

  const updateLineStock = useCallback((productId: string, stock: {
    stockFini: number; stockFabricable: number; stockTotal: number;
  }) => {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? { ...l, stockFini: stock.stockFini, stockFabricable: stock.stockFabricable, stockTotal: stock.stockTotal }
          : l,
      ),
    );
  }, []);

  const addProduct = (p: (typeof allProducts)[0]) => {
    if (!selectedWarehouseId) { setError('Sélectionnez un entrepôt avant d\'ajouter des produits'); return; }
    if (lines.find((l) => l.productId === String(p.id))) return;
    const price = Number(p.prixVente) > 0 ? Number(p.prixVente) : Number(p.prixVenteAuto);
    setLines((prev) => [
      ...prev,
      {
        productId:       String(p.id),
        nom:             p.nom,
        reference:       p.reference,
        imageUrl:        p.imageUrl,
        unitPrice:       price,
        quantity:        1,
        discount:        0,
        tvaRate:         TVA,
        supplements:     [],
        showSupplements: false,
        stockFini:       0,
        stockFabricable: 0,
        stockTotal:      0,
      },
    ]);
    setProductSearch('');
    setError('');
  };

  const updateLine = (productId: string, field: 'quantity' | 'discount', value: number) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, [field]: value } : l)),
    );
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const toggleSupplements = (productId: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, showSupplements: !l.showSupplements } : l,
      ),
    );
  };

  const updateSupplements = (productId: string, supplements: DraftSupplement[]) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, supplements } : l)),
    );
  };

  const lineHt = (l: DraftLine) => {
    const productHt = l.quantity * l.unitPrice * (1 - l.discount / 100);
    const suppHt    = l.supplements.reduce((s, sup) => s + sup.quantity * sup.unitPrice, 0);
    return productHt + suppHt;
  };

  const totalHtRaw  = lines.reduce((s, l) => s + lineHt(l), 0) * (1 - discount / 100);
  const totalTvaRaw = totalHtRaw * (TVA / 100);
  const totalTtcRaw = totalHtRaw + totalTvaRaw;

  const handleSubmit = async () => {
    if (!clientId)       { setError('Sélectionnez un client'); return; }
    if (!warehouseId)    { setError('Sélectionnez un entrepôt'); return; }
    if (!lines.length)   { setError('Ajoutez au moins un produit'); return; }
    setError('');
    try {
      const order = await create.mutateAsync({
        clientId:    Number(clientId),
        warehouseId: Number(warehouseId),
        note:        note || undefined,
        discount:    discount || undefined,
        lines: lines.map((l) => ({
          productId: Number(l.productId),
          quantity:  l.quantity,
          discount:  l.discount || undefined,
          supplements: l.supplements.length > 0
            ? l.supplements.map((s) => ({
                componentId: s.componentId,
                quantity:    s.quantity,
                unitPrice:   s.unitPrice,
                tvaRate:     s.tvaRate,
              }))
            : undefined,
        })),
      });
      router.push(`/orders/${order.id}`);
    } catch (err: unknown) {
      const msg = (err as {
        response?: { data?: { message?: string | string[] } };
      })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la création');
    }
  };

  const visibleProducts = allProducts.filter(
    (p) => !lines.find((l) => l.productId === String(p.id)) && p.isActive,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Nouvelle commande</h1>
          <p className="text-gray-400 text-sm mt-0.5">La référence est générée automatiquement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">

          {/* Client + Entrepôt */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client <span className="text-red-400">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Sélectionner un client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Entrepôt <span className="text-red-400">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Sélectionner un entrepôt --</option>
                {activeWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.nom} ({w.code})</option>
                ))}
              </select>
              <p className="text-gray-600 text-xs mt-1">
                Le stock affiché et déduit à la confirmation provient de cet entrepôt.
              </p>
            </div>
          </div>

          {/* Lignes */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-white font-medium">Lignes de commande</h2>
              <span className="text-gray-500 text-xs">{lines.length} produit(s)</span>
            </div>

            {lines.length > 0 && (
              <div className="divide-y divide-gray-800">
                {lines.map((line) => (
                  <div key={line.productId} className="p-4">
                    <div className="flex items-center gap-3">
                      {line.imageUrl ? (
                        <img src={mediaUrl(line.imageUrl)!} alt="" className="w-8 h-8 rounded object-cover border border-gray-700 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-800 border border-gray-700 shrink-0 flex items-center justify-center">
                          <Package className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{line.nom}</p>
                        <p className="text-gray-500 text-xs font-mono">{line.reference}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-gray-400 text-xs">P.U.</p>
                        <p className="text-gray-300 text-sm font-mono">{line.unitPrice.toFixed(3)}</p>
                      </div>
                      <div className="shrink-0">
                        <p className="text-gray-400 text-xs mb-1 text-center">Qté</p>
                        <input
                          type="number" min="0.001" step="0.001" value={line.quantity}
                          onChange={(e) => updateLine(line.productId, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="shrink-0">
                        <p className="text-gray-400 text-xs mb-1 text-center">Remise%</p>
                        <input
                          type="number" min="0" max="100" step="0.1" value={line.discount}
                          onChange={(e) => updateLine(line.productId, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="text-right shrink-0 min-w-[70px]">
                        <p className="text-gray-400 text-xs">Total HT</p>
                        <p className="text-white text-sm font-mono">{round(lineHt(line)).toFixed(3)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleSupplements(line.productId)}
                          className={cn(
                            'p-1.5 rounded transition-colors',
                            line.supplements.length > 0 ? 'text-indigo-400 hover:text-indigo-300' : 'text-gray-600 hover:text-gray-400',
                          )}
                          title="Suppléments"
                        >
                          {line.showSupplements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => removeLine(line.productId)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 ml-11 space-y-2">
                      <StockBadge
                        stockFini={line.stockFini}
                        stockFabricable={line.stockFabricable}
                        quantity={line.quantity}
                      />
                      <StockByWarehousePanel
                        productId={Number(line.productId)}
                        selectedWarehouseId={selectedWarehouseId}
                        onWarehouseStock={(stock) => updateLineStock(line.productId, stock)}
                      />
                    </div>

                    {line.showSupplements && (
                      <div className="mt-3 ml-11">
                        <SupplementSelector
                          supplements={line.supplements}
                          onChange={(supps) => updateSupplements(line.productId, supps)}
                        />
                      </div>
                    )}
                    {!line.showSupplements && line.supplements.length > 0 && (
                      <div className="mt-1 ml-11">
                        <button
                          onClick={() => toggleSupplements(line.productId)}
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          {line.supplements.length} supplément(s) ·{' '}
                          {line.supplements.reduce((s, sup) => s + sup.quantity * sup.unitPrice, 0).toFixed(3)} DTN HT
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recherche produit */}
            <div className="p-4 border-t border-gray-800">
              {!selectedWarehouseId ? (
                <p className="text-orange-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Sélectionnez un entrepôt pour rechercher et ajouter des produits.
                </p>
              ) : (
                <>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Rechercher un produit à ajouter..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 mb-2"
                  />

                  {visibleProducts.length > 0 && (
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {visibleProducts.slice(0, 10).map((p) => {
                        const price = Number(p.prixVente) > 0 ? Number(p.prixVente) : Number(p.prixVenteAuto);
                        return (
                          <button
                            key={p.id}
                            onClick={() => addProduct(p)}
                            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors border border-transparent hover:border-gray-600"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm">{p.nom}</p>
                              <p className="text-gray-500 text-xs font-mono">{p.reference}</p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 ml-3">
                              <SearchResultStock productId={p.id} warehouseId={selectedWarehouseId} />
                              <div className="text-right min-w-[70px]">
                                <p className="text-green-400 text-sm font-mono">{price.toFixed(3)}</p>
                                <p className="text-gray-500 text-xs">DTN</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {visibleProducts.length > 0 && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Warehouse className="w-3 h-3" /> Stock fini (entrepôt sélectionné)
                      </span>
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> Fabricable (composants)
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-white font-medium">Récapitulatif</h3>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Remise globale (%)</label>
              <input
                type="number" min="0" max="100" step="0.1" value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2 text-sm pt-2 border-t border-gray-800">
              <div className="flex justify-between text-gray-400">
                <span>Total HT</span>
                <span className="font-mono text-white">{round(totalHtRaw).toFixed(3)} DTN</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>TVA ({TVA}%)</span>
                <span className="font-mono text-white">{round(totalTvaRaw).toFixed(3)} DTN</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-700 pt-2">
                <span className="text-gray-300">Total TTC</span>
                <span className="font-mono text-green-400 text-lg">{round(totalTtcRaw).toFixed(3)} DTN</span>
              </div>
            </div>

            {lines.length > 0 && selectedWarehouseId && (
              <div className="pt-2 border-t border-gray-800 space-y-1">
                <p className="text-gray-500 text-xs uppercase tracking-wider">Disponibilité</p>
                {lines.map((l) => {
                  const ok = l.stockTotal >= l.quantity;
                  return (
                    <div key={l.productId} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 truncate max-w-[120px]">{l.nom}</span>
                      <span className={ok ? 'text-green-400' : 'text-orange-400'}>
                        {ok ? '✓' : '⚠'} {l.stockTotal}/{l.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1">Note</label>
              <textarea
                value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                placeholder="Informations complémentaires..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={create.isPending || lines.length === 0 || !clientId || !warehouseId}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              {create.isPending ? 'Création...' : 'Créer la commande'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return <Suspense><NewOrderForm /></Suspense>;
}
