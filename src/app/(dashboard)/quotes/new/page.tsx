'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Loader2, ArrowLeft, Trash2, FileText, Plus,
  Warehouse, Wrench, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateQuote } from '@/hooks/useQuotes';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';

interface DraftLine {
  productId: string;
  nom: string;
  reference: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  tvaRate: number;
}

const TVA = 19;
const round = (n: number) => Math.round(n * 1000) / 1000;

function NewQuoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createQuote = useCreateQuote();
  const { data: clients = [] } = useClients();
  // withStock: true → retourne stockFini/stockFabricable pour chaque produit
  const { data: allProducts = [] } = useProducts({ withStock: true });

  const [clientId, setClientId]       = useState(searchParams.get('clientId') ?? '');
  const [validUntil, setValidUntil]   = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [note, setNote]               = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [lines, setLines]             = useState<DraftLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [error, setError]             = useState('');

  const addProduct = (p: (typeof allProducts)[0]) => {
    if (lines.some(l => l.productId === String(p.id))) return;
    setLines(prev => [...prev, {
      productId: String(p.id),
      nom:       p.nom,
      reference: p.reference,
      unitPrice: Number(p.prixVente) > 0 ? Number(p.prixVente) : Number(p.prixVenteAuto),
      quantity:  1,
      discount:  0,
      tvaRate:   TVA,
    }]);
    setProductSearch('');
  };

  const updateLine = (idx: number, field: keyof DraftLine, value: number) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const lineTotals = lines.map(l => {
    const ht  = l.quantity * l.unitPrice * (1 - l.discount / 100);
    const tva = ht * (l.tvaRate / 100);
    return { ht: round(ht), tva: round(tva) };
  });
  const factor   = 1 - globalDiscount / 100;
  const totalHt  = round(lineTotals.reduce((s, t) => s + t.ht, 0) * factor);
  const totalTva = round(lineTotals.reduce((s, t) => s + t.tva, 0) * factor);
  const totalTtc = round(totalHt + totalTva);

  // Produits visibles : exclure déjà ajoutés + filtrer par recherche
  const visibleProducts = allProducts.filter(p =>
    !lines.some(l => l.productId === String(p.id)) &&
    p.isActive &&
    (!productSearch ||
      p.nom.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.reference.toLowerCase().includes(productSearch.toLowerCase())),
  );

  const handleSubmit = async () => {
    setError('');
    if (!clientId)        { setError('Sélectionnez un client'); return; }
    if (!lines.length)    { setError('Ajoutez au moins une ligne'); return; }
    try {
      const quote = await createQuote.mutateAsync({
        clientId: Number(clientId),
        validUntil,
        note:     note || undefined,
        discount: globalDiscount || undefined,
        lines: lines.map(l => ({
          productId: Number(l.productId),
          quantity:  l.quantity,
          unitPrice: l.unitPrice,
          discount:  l.discount || undefined,
          tvaRate:   l.tvaRate,
        })),
      });
      router.push(`/quotes/${quote.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la création'));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Nouveau devis</h1>
          <p className="text-gray-400 text-sm">La référence est générée automatiquement</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Infos générales */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Client *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
              <option value="">— Sélectionner —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Validité jusqu&apos;au *</label>
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Remise globale (%)</label>
            <input type="number" min={0} max={100} value={globalDiscount}
              onChange={e => setGlobalDiscount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      {/* Lignes */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Lignes du devis
          </h2>
          <span className="text-gray-500 text-xs">{lines.length} produit(s)</span>
        </div>

        {/* Lignes déjà ajoutées */}
        {lines.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr className="text-gray-400 text-xs">
                  <th className="text-left px-4 py-3">Produit</th>
                  <th className="text-right px-4 py-3">P.U. HT</th>
                  <th className="text-right px-4 py-3">Qté</th>
                  <th className="text-right px-4 py-3">Rem.%</th>
                  <th className="text-right px-4 py-3">TVA%</th>
                  <th className="text-right px-4 py-3">Total HT</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {lines.map((l, idx) => (
                  <tr key={l.productId} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{l.nom}</p>
                      <p className="text-gray-500 text-xs font-mono">{l.reference}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min={0} step={0.001} value={l.unitPrice}
                        onChange={e => updateLine(idx, 'unitPrice', Number(e.target.value))}
                        className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono text-sm focus:outline-none focus:border-indigo-500" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min={0.001} step={0.001} value={l.quantity}
                        onChange={e => updateLine(idx, 'quantity', Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono text-sm focus:outline-none focus:border-indigo-500" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min={0} max={100} value={l.discount}
                        onChange={e => updateLine(idx, 'discount', Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono text-sm focus:outline-none focus:border-indigo-500" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min={0} max={100} value={l.tvaRate}
                        onChange={e => updateLine(idx, 'tvaRate', Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono text-sm focus:outline-none focus:border-indigo-500" />
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono text-sm">
                      {lineTotals[idx].ht.toFixed(3)}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeLine(idx)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totaux */}
        {lines.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-800 flex justify-end">
            <div className="text-right space-y-1 text-sm">
              {globalDiscount > 0 && (
                <p className="text-gray-400">Remise globale : <span className="text-orange-400">{globalDiscount}%</span></p>
              )}
              <p className="text-gray-400">Total HT : <span className="text-white font-mono">{totalHt.toFixed(3)} DTN</span></p>
              <p className="text-gray-400">TVA : <span className="text-white font-mono">{totalTva.toFixed(3)} DTN</span></p>
              <p className="text-white font-semibold text-base">Total TTC :
                <span className="font-mono text-indigo-400 ml-2">{totalTtc.toFixed(3)} DTN</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Liste produits toujours visible ── */}
        <div className="p-4 border-t border-gray-800">
          <input
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            placeholder="Rechercher un produit à ajouter..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 mb-2"
          />
          {visibleProducts.length > 0 ? (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {visibleProducts.slice(0, 12).map(p => {
                const price    = Number(p.prixVente) > 0 ? Number(p.prixVente) : Number(p.prixVenteAuto);
                const stockFini = p.stock?.stockFini ?? 0;
                const stockFab  = p.stock?.stockFabricable ?? 0;
                return (
                  <button key={p.id} onClick={() => addProduct(p)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors border border-transparent hover:border-gray-600">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Package className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">{p.nom}</p>
                        <p className="text-gray-500 text-xs font-mono">{p.reference}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      {/* Stock fini + fabricable */}
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
                      {/* Prix */}
                      <div className="text-right min-w-[70px]">
                        <p className="text-green-400 text-sm font-mono">{price.toFixed(3)}</p>
                        <p className="text-gray-500 text-xs">DTN</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-xs py-2">
              {productSearch ? 'Aucun produit trouvé' : 'Tous les produits ont été ajoutés'}
            </p>
          )}
          {visibleProducts.length > 0 && (
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1"><Warehouse className="w-3 h-3" /> Stock fini</span>
              <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> Fabricable</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()}
          className="px-4 py-2 border border-gray-700 rounded-lg text-gray-400 text-sm hover:bg-gray-800">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={createQuote.isPending || !clientId || !lines.length}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg">
          {createQuote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Créer le devis
        </button>
      </div>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>}>
      <NewQuoteForm />
    </Suspense>
  );
}