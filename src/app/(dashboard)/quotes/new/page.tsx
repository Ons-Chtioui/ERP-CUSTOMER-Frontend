'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2, ArrowLeft, Trash2, FileText, Plus } from 'lucide-react';
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
  const prefillClient = searchParams.get('clientId') ?? '';

  const createQuote = useCreateQuote();
  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts();

  const [clientId, setClientId] = useState(prefillClient);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [note, setNote] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [error, setError] = useState('');

  const addProduct = (productId: string) => {
    const p = products.find(x => String(x.id) === productId);
    if (!p || lines.some(l => l.productId === productId)) return;
    setLines(prev => [...prev, {
      productId,
      nom: p.nom,
      reference: p.reference,
      unitPrice: Number(p.prixVente ?? 0),
      quantity: 1,
      discount: 0,
      tvaRate: TVA,
    }]);
    setProductSearch('');
  };

  const updateLine = (idx: number, field: keyof DraftLine, value: number) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const lineTotals = lines.map(l => {
    const ht = l.quantity * l.unitPrice * (1 - l.discount / 100);
    const tva = ht * (l.tvaRate / 100);
    return { ht: round(ht), tva: round(tva) };
  });
  const subHt  = round(lineTotals.reduce((s, t) => s + t.ht, 0));
  const subTva = round(lineTotals.reduce((s, t) => s + t.tva, 0));
  const factor = 1 - globalDiscount / 100;
  const totalHt  = round(subHt * factor);
  const totalTva = round(subTva * factor);
  const totalTtc = round(totalHt + totalTva);

  const filteredProducts = products.filter(p =>
    !lines.some(l => l.productId === String(p.id)) &&
    (p.nom.toLowerCase().includes(productSearch.toLowerCase()) ||
     p.reference.toLowerCase().includes(productSearch.toLowerCase())),
  );

  const handleSubmit = async () => {
    setError('');
    if (!clientId) { setError('Sélectionnez un client'); return; }
    if (lines.length === 0) { setError('Ajoutez au moins une ligne'); return; }
    try {
      const quote = await createQuote.mutateAsync({
        clientId: Number(clientId),
        validUntil,
        note: note || undefined,
        discount: globalDiscount || undefined,
        lines: lines.map(l => ({
          productId: Number(l.productId),
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount || undefined,
          tvaRate: l.tvaRate,
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
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Nouveau devis</h1>
          <p className="text-gray-400 text-sm">Créer un devis commercial</p>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Client *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
              <option value="">— Sélectionner —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Validité jusqu&apos;au *</label>
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Remise globale (%)</label>
            <input type="number" min={0} max={100} value={globalDiscount}
              onChange={e => setGlobalDiscount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none" />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Lignes</h2>
        <div className="relative">
          <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
            placeholder="Rechercher un produit à ajouter..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
          {productSearch && filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredProducts.slice(0, 8).map(p => (
                <button key={p.id} onClick={() => addProduct(String(p.id))}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-white flex justify-between">
                  <span>{p.nom}</span>
                  <span className="text-gray-400 font-mono text-xs">{p.reference}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs">
                  <th className="text-left py-2 px-2">Produit</th>
                  <th className="text-right py-2 px-2">P.U.</th>
                  <th className="text-right py-2 px-2">Qté</th>
                  <th className="text-right py-2 px-2">Rem.%</th>
                  <th className="text-right py-2 px-2">TVA%</th>
                  <th className="text-right py-2 px-2">Total HT</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {lines.map((l, idx) => (
                  <tr key={l.productId}>
                    <td className="py-2 px-2 text-white">{l.nom}<span className="text-gray-500 text-xs ml-2">{l.reference}</span></td>
                    <td className="py-2 px-2">
                      <input type="number" min={0} step={0.001} value={l.unitPrice}
                        onChange={e => updateLine(idx, 'unitPrice', Number(e.target.value))}
                        className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" min={0.001} step={0.001} value={l.quantity}
                        onChange={e => updateLine(idx, 'quantity', Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" min={0} max={100} value={l.discount}
                        onChange={e => updateLine(idx, 'discount', Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" min={0} max={100} value={l.tvaRate}
                        onChange={e => updateLine(idx, 'tvaRate', Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono" />
                    </td>
                    <td className="py-2 px-2 text-right text-white font-mono">{lineTotals[idx].ht.toFixed(3)}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lines.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">Ajoutez des produits au devis</p>
        )}

        {lines.length > 0 && (
          <div className="flex justify-end">
            <div className="text-right space-y-1 text-sm">
              <p className="text-gray-400">Total HT : <span className="text-white font-mono">{totalHt.toFixed(3)} DTN</span></p>
              <p className="text-gray-400">TVA : <span className="text-white font-mono">{totalTva.toFixed(3)} DTN</span></p>
              <p className="text-white font-semibold">Total TTC : <span className="font-mono text-indigo-400">{totalTtc.toFixed(3)} DTN</span></p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()}
          className="px-4 py-2 border border-gray-700 rounded-lg text-gray-400 text-sm hover:bg-gray-800">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={createQuote.isPending}
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
