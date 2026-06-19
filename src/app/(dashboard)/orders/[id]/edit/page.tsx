'use client';

/**
 * Page de modification d'une commande en brouillon.
 *
 * Mêmes fonctionnalités que la page de création :
 *  - Lignes avec suppléments (composants additionnels)
 *  - Stock fini / fabricable affiché par ligne
 *
 * Différence : les valeurs sont pré-remplies depuis la commande existante,
 * y compris les suppléments déjà enregistrés sur chaque ligne.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Trash2, AlertTriangle, Save, ShoppingCart,
  ChevronDown, ChevronUp, Package, Warehouse, Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrder, useUpdateOrderLines } from '@/hooks/useOrders';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { mediaUrl } from '@/lib/media';
import { SupplementSelector, type DraftSupplement } from '@/components/orders/SupplementSelector';

// ─── Type interne pour une ligne en cours d'édition ──────────────────────────
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

// ─── Badge de stock compact (identique à la page création) ──────────────────
function StockBadge({
  stockFini, stockFabricable, quantity,
}: {
  stockFini: number; stockFabricable: number; quantity: number;
}) {
  const stockTotal = stockFini + stockFabricable;
  const color =
    stockTotal >= quantity ? 'text-green-400'
    : stockTotal > 0       ? 'text-orange-400'
    : 'text-red-400';

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
      <span className={color}>
        {stockTotal >= quantity ? '✓' : '⚠'} {stockTotal}/{quantity}
      </span>
    </div>
  );
}

export default function EditOrderPage() {
  const router  = useRouter();
  const { id }  = useParams();
  const orderId = id as string;

  const { data: order, isLoading } = useOrder(orderId);
  const { data: clients = [] }     = useClients();
  const updateLines                = useUpdateOrderLines();

  const [clientId, setClientId]           = useState('');
  const [note, setNote]                   = useState('');
  const [discount, setDiscount]           = useState(0);
  const [lines, setLines]                 = useState<DraftLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [error, setError]                 = useState('');

  // withStock: true → récupère stockFini/stockFabricable pour chaque produit
  const { data: allProducts = [] } = useProducts({
    search:    productSearch || undefined,
    withStock: true,
  });

  // ── Pré-remplir depuis la commande existante (y compris suppléments) ──────
  useEffect(() => {
    if (order) {
      if (order.status !== 'draft') {
        router.replace(`/orders/${orderId}`);
        return;
      }
      setClientId(order.clientId);
      setNote(order.note ?? '');
      setDiscount(Number(order.discount));
      setLines(order.lines.map((l) => ({
        productId:       l.productId,
        nom:             l.product?.nom ?? '',
        reference:       l.product?.reference ?? '',
        imageUrl:        l.product?.imageUrl,
        unitPrice:       Number(l.unitPrice),
        quantity:        Number(l.quantity),
        discount:        Number(l.discount),
        tvaRate:         Number(l.tvaRate) || TVA,
        showSupplements: false,
        stockFini:       0, // rempli dynamiquement si le produit reste dans la liste recherche
        stockFabricable: 0,
        stockTotal:      0,
        // Convertir les suppléments existants (venant du backend) vers le format DraftSupplement
        supplements: (l.supplements ?? []).map((s) => ({
          componentId: s.componentId,
          nom:         s.component?.nom ?? `Composant #${s.componentId}`,
          reference:   s.component?.reference ?? '',
          quantity:    Number(s.quantity),
          unitPrice:   Number(s.unitPrice),
          tvaRate:     Number(s.tvaRate) || TVA,
        })),
      })));
    }
  }, [order, orderId, router]);

  // ── Ajouter un produit comme nouvelle ligne ───────────────────────────────
  const addProduct = (p: (typeof allProducts)[0]) => {
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
        stockFini:       p.stock?.stockFini ?? 0,
        stockFabricable: p.stock?.stockFabricable ?? 0,
        stockTotal:      p.stock?.stockTotal ?? 0,
      },
    ]);
    setProductSearch('');
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

  // ── Calculs ────────────────────────────────────────────────────────────────
  const lineHt = (l: DraftLine) => {
    const productHt = l.quantity * l.unitPrice * (1 - l.discount / 100);
    const suppHt    = l.supplements.reduce((s, sup) => s + sup.quantity * sup.unitPrice, 0);
    return productHt + suppHt;
  };

  const totalHt  = lines.reduce((s, l) => s + lineHt(l), 0) * (1 - discount / 100);
  const totalTva = totalHt * (TVA / 100);
  const totalTtc = totalHt + totalTva;

  // ── Sauvegarder ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!clientId)     { setError('Sélectionnez un client'); return; }
    if (!lines.length) { setError('Ajoutez au moins un produit'); return; }
    setError('');
    try {
      await updateLines.mutateAsync({
        id: orderId,
        clientId: Number(clientId),
        note:     note || undefined,
        discount: discount || undefined,
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
      router.push(`/orders/${orderId}`);
    } catch (err: unknown) {
      const msg = (err as {
        response?: { data?: { message?: string | string[] } };
      })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la modification');
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  if (!order) return <div className="text-center py-16 text-gray-400">Commande introuvable</div>;
  if (order.status !== 'draft')
    return (
      <div className="text-center py-16 text-orange-400">
        Seules les commandes en brouillon peuvent être modifiées
      </div>
    );

  const visibleProducts = allProducts.filter(
    (p) => !lines.find((l) => l.productId === String(p.id)) && p.isActive,
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white">Modifier la commande</h1>
            <p className="text-gray-400 text-sm mt-0.5 font-mono">
              {order.reference} — Brouillon
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={updateLines.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
        >
          {updateLines.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Colonne principale ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Client */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client <span className="text-red-400">*</span>
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Sélectionner --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          {/* Lignes */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-white font-medium">Lignes ({lines.length})</h2>
            </div>

            {lines.length > 0 && (
              <div className="divide-y divide-gray-800">
                {lines.map((line) => (
                  <div key={line.productId} className="p-4">
                    {/* Ligne principale */}
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

                    {/* Stock — affiché seulement si on connaît le stock (produit présent dans la recherche) */}
                    {line.stockTotal > 0 && (
                      <div className="mt-2 ml-11">
                        <StockBadge
                          stockFini={line.stockFini}
                          stockFabricable={line.stockFabricable}
                          quantity={line.quantity}
                        />
                      </div>
                    )}

                    {/* Accordéon suppléments */}
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

            {/* Recherche produit — liste toujours visible */}
            <div className="p-4 border-t border-gray-800">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Ajouter un produit..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 mb-2"
              />
              {visibleProducts.length > 0 && (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {visibleProducts.slice(0, 10).map((p) => {
                    const price     = Number(p.prixVente) > 0 ? Number(p.prixVente) : Number(p.prixVenteAuto);
                    const stockFini = p.stock?.stockFini ?? 0;
                    const stockFab  = p.stock?.stockFabricable ?? 0;
                    return (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">{p.nom}</p>
                          <p className="text-gray-500 text-xs font-mono">{p.reference}</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-3">
                          <div className="text-right text-xs">
                            <div className="flex items-center gap-1 justify-end">
                              <Warehouse className="w-3 h-3 text-gray-500" />
                              <span className={stockFini > 0 ? 'text-green-400 font-mono' : 'text-gray-600 font-mono'}>{stockFini}</span>
                            </div>
                            <div className="flex items-center gap-1 justify-end">
                              <Wrench className="w-3 h-3 text-gray-500" />
                              <span className={stockFab > 0 ? 'text-blue-400 font-mono' : 'text-gray-600 font-mono'}>{stockFab}</span>
                            </div>
                          </div>
                          <p className="text-green-400 text-sm font-mono shrink-0 min-w-[60px] text-right">{price.toFixed(3)} DTN</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Récapitulatif ── */}
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
                <span className="font-mono text-white">{round(totalHt).toFixed(3)} DTN</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>TVA ({TVA}%)</span>
                <span className="font-mono text-white">{round(totalTva).toFixed(3)} DTN</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-700 pt-2">
                <span className="text-gray-300">Total TTC</span>
                <span className="font-mono text-green-400 text-lg">{round(totalTtc).toFixed(3)} DTN</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Note</label>
              <textarea
                value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={updateLines.isPending || !lines.length || !clientId}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {updateLines.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}