'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2, ArrowLeft, Trash2, Truck, Plus } from 'lucide-react';
import { useCreateDeliveryNote } from '@/hooks/useDeliveryNotes';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';

interface DraftLine {
  productId: string;
  nom: string;
  quantityOrdered: number;
  quantityDelivered: number;
}

function NewDeliveryNoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillClient = searchParams.get('clientId') ?? '';

  const createBL = useCreateDeliveryNote();
  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts();

  const [clientId, setClientId] = useState(prefillClient);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [error, setError] = useState('');

  const addProduct = (productId: string) => {
    const p = products.find(x => String(x.id) === productId);
    if (!p || lines.some(l => l.productId === productId)) return;
    setLines(prev => [...prev, {
      productId,
      nom: p.nom,
      quantityOrdered: 1,
      quantityDelivered: 1,
    }]);
    setProductSearch('');
  };

  const updateLine = (idx: number, field: 'quantityOrdered' | 'quantityDelivered', value: number) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

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
      const dn = await createBL.mutateAsync({
        clientId: Number(clientId),
        deliveryAddress: deliveryAddress || undefined,
        note: note || undefined,
        lines: lines.map(l => ({
          productId: Number(l.productId),
          quantityOrdered: l.quantityOrdered,
          quantityDelivered: l.quantityDelivered,
        })),
      });
      router.push(`/delivery-notes/${dn.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la création'));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Nouveau bon de livraison</h1>
          <p className="text-gray-400 text-sm">Créer un BL de livraison</p>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Client *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
              <option value="">— Sélectionner —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Adresse de livraison</label>
            <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
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
        <h2 className="text-white font-medium flex items-center gap-2"><Truck className="w-4 h-4" /> Lignes</h2>
        <div className="relative">
          <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
          {productSearch && filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredProducts.slice(0, 8).map(p => (
                <button key={p.id} onClick={() => addProduct(String(p.id))}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-white">{p.nom}</button>
              ))}
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs">
                <th className="text-left py-2">Produit</th>
                <th className="text-right py-2">Qté commandée</th>
                <th className="text-right py-2">Qté livrée</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {lines.map((l, idx) => (
                <tr key={l.productId}>
                  <td className="py-2 text-white">{l.nom}</td>
                  <td className="py-2">
                    <input type="number" min={0} value={l.quantityOrdered}
                      onChange={e => updateLine(idx, 'quantityOrdered', Number(e.target.value))}
                      className="w-24 ml-auto block px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono" />
                  </td>
                  <td className="py-2">
                    <input type="number" min={0} value={l.quantityDelivered}
                      onChange={e => updateLine(idx, 'quantityDelivered', Number(e.target.value))}
                      className="w-24 ml-auto block px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono" />
                  </td>
                  <td className="py-2">
                    <button onClick={() => removeLine(idx)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-400 text-sm">Annuler</button>
        <button onClick={handleSubmit} disabled={createBL.isPending}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg">
          {createBL.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Créer le BL
        </button>
      </div>
    </div>
  );
}

export default function NewDeliveryNotePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>}>
      <NewDeliveryNoteForm />
    </Suspense>
  );
}
