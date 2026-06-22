'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2, ArrowLeft, Trash2, Receipt, Plus } from 'lucide-react';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';

interface DraftLine {
  productId: string;
  nom: string;
  description: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  tvaRate: number;
}

const TVA = 19;
const round = (n: number) => Math.round(n * 1000) / 1000;

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillClient = searchParams.get('clientId') ?? '';

  const createInvoice = useCreateInvoice();
  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts();

  const [clientId, setClientId] = useState(prefillClient);
  const [dueDate, setDueDate] = useState(() => {
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
    if (!p) return;
    setLines(prev => [...prev, {
      productId,
      nom: p.nom,
      description: p.nom,
      unitPrice: Number(p.prixVente ?? 0),
      quantity: 1,
      discount: 0,
      tvaRate: TVA,
    }]);
    setProductSearch('');
  };

  const updateLine = (idx: number, field: keyof DraftLine, value: number | string) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const lineTotals = lines.map(l => {
    const ht = l.quantity * l.unitPrice * (1 - l.discount / 100);
    return round(ht);
  });
  const subHt = round(lineTotals.reduce((s, t) => s + t, 0));
  const factor = 1 - globalDiscount / 100;
  const totalHt = round(subHt * factor);
  const totalTva = round(lines.reduce((s, l, i) => s + lineTotals[i] * (l.tvaRate / 100) * factor, 0));
  const totalTtc = round(totalHt + totalTva);

  const filteredProducts = products.filter(p =>
    p.nom.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.reference.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const handleSubmit = async () => {
    setError('');
    if (!clientId) { setError('Sélectionnez un client'); return; }
    if (lines.length === 0) { setError('Ajoutez au moins une ligne'); return; }
    try {
      const invoice = await createInvoice.mutateAsync({
        clientId: Number(clientId),
        dueDate,
        note: note || undefined,
        discount: globalDiscount || undefined,
        lines: lines.map(l => ({
          productId: l.productId ? Number(l.productId) : undefined,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount || undefined,
          tvaRate: l.tvaRate,
        })),
      });
      router.push(`/invoices/${invoice.id}`);
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
          <h1 className="text-2xl font-semibold text-white">Nouvelle facture</h1>
          <p className="text-gray-400 text-sm">Création manuelle d&apos;une facture</p>
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
            <label className="block text-xs text-gray-400 mb-1">Date d&apos;échéance</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
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
        <h2 className="text-white font-medium flex items-center gap-2"><Receipt className="w-4 h-4" /> Lignes</h2>
        <div className="relative">
          <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
            placeholder="Rechercher un produit..."
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
                  <th className="text-left py-2 px-2">Description</th>
                  <th className="text-right py-2 px-2">P.U.</th>
                  <th className="text-right py-2 px-2">Qté</th>
                  <th className="text-right py-2 px-2">Rem.%</th>
                  <th className="text-right py-2 px-2">Total HT</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {lines.map((l, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-2">
                      <input value={l.description} onChange={e => updateLine(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" min={0} step={0.001} value={l.unitPrice}
                        onChange={e => updateLine(idx, 'unitPrice', Number(e.target.value))}
                        className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" min={0.001} value={l.quantity}
                        onChange={e => updateLine(idx, 'quantity', Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" min={0} max={100} value={l.discount}
                        onChange={e => updateLine(idx, 'discount', Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono" />
                    </td>
                    <td className="py-2 px-2 text-right text-white font-mono">{lineTotals[idx].toFixed(3)}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => removeLine(idx)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lines.length > 0 && (
          <div className="flex justify-end text-sm space-y-1 text-right">
            <div>
              <p className="text-gray-400">Total TTC : <span className="text-indigo-400 font-mono font-semibold">{totalTtc.toFixed(3)} DTN</span></p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-400 text-sm">Annuler</button>
        <button onClick={handleSubmit} disabled={createInvoice.isPending}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg">
          {createInvoice.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Créer la facture
        </button>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>}>
      <NewInvoiceForm />
    </Suspense>
  );
}
