'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2, ArrowLeft, Trash2, Truck, Plus, Package, Warehouse, Wrench } from 'lucide-react';
import { useCreateDeliveryNote } from '@/hooks/useDeliveryNotes';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useInvoices } from '@/hooks/useInvoices';

interface DraftLine {
  productId: string;
  nom: string;
  reference: string;
  quantityOrdered: number;
  quantityDelivered: number;
}

function NewDeliveryNoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createBL = useCreateDeliveryNote();
  const { data: clients = [] } = useClients();
  const { data: allProducts = [] } = useProducts({ withStock: true });
  const { data: ordersData } = useOrders();
  const { data: invoicesData } = useInvoices({ type: 'invoice' });

  const [clientId, setClientId]           = useState(searchParams.get('clientId') ?? '');
  const [orderId, setOrderId]             = useState(searchParams.get('orderId') ?? '');
  const [invoiceId, setInvoiceId]         = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [note, setNote]                   = useState('');
  const [lines, setLines]                 = useState<DraftLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [error, setError]                 = useState('');

  const orders   = ordersData?.data ?? [];
  const invoices = invoicesData?.data ?? [];

  const addProduct = (p: (typeof allProducts)[0]) => {
    if (lines.some(l => l.productId === String(p.id))) return;
    setLines(prev => [...prev, {
      productId:         String(p.id),
      nom:               p.nom,
      reference:         p.reference,
      quantityOrdered:   1,
      quantityDelivered: 1,
    }]);
    setProductSearch('');
  };

  const updateLine = (idx: number, field: 'quantityOrdered' | 'quantityDelivered', value: number) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const visibleProducts = allProducts.filter(p =>
    !lines.some(l => l.productId === String(p.id)) &&
    p.isActive &&
    (!productSearch ||
      p.nom.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.reference.toLowerCase().includes(productSearch.toLowerCase())),
  );

  const handleSubmit = async () => {
    setError('');
    if (!clientId)     { setError('Sélectionnez un client'); return; }
    if (!lines.length) { setError('Ajoutez au moins une ligne'); return; }
    try {
      const bl = await createBL.mutateAsync({
        clientId:        Number(clientId),
        orderId:         orderId   ? Number(orderId)   : undefined,
        invoiceId:       invoiceId ? Number(invoiceId) : undefined,
        deliveryAddress: deliveryAddress || undefined,
        note:            note || undefined,
        lines: lines.map((l, i) => ({
          productId:         Number(l.productId),
          quantityOrdered:   l.quantityOrdered,
          quantityDelivered: l.quantityDelivered,
          position:          i,
        })),
      });
      router.push(`/delivery-notes/${bl.id}`);
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
          <p className="text-gray-400 text-sm">La référence est générée automatiquement</p>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Infos générales */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Client *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
              <option value="">— Sélectionner —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Commande liée (optionnel)</label>
            <select value={orderId} onChange={e => setOrderId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
              <option value="">— Aucune commande —</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.reference} — {o.client?.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Facture liée (optionnel)</label>
            <select value={invoiceId} onChange={e => setInvoiceId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
              <option value="">— Aucune facture —</option>
              {invoices.map((inv: { id: string | number; reference: string; client?: { name: string } }) =>
                <option key={inv.id} value={inv.id}>{inv.reference} — {inv.client?.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Adresse de livraison</label>
            <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
              placeholder="Adresse complète..."
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
            <Truck className="w-4 h-4 text-indigo-400" /> Produits livrés
          </h2>
          <span className="text-gray-500 text-xs">{lines.length} ligne(s)</span>
        </div>

        {lines.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr className="text-gray-400 text-xs">
                  <th className="text-left px-4 py-3">Produit</th>
                  <th className="text-right px-4 py-3">Qté commandée</th>
                  <th className="text-right px-4 py-3">Qté livrée</th>
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
                      <input type="number" min={0} value={l.quantityOrdered}
                        onChange={e => updateLine(idx, 'quantityOrdered', Number(e.target.value))}
                        className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right font-mono text-sm ml-auto block focus:outline-none focus:border-indigo-500" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min={0} value={l.quantityDelivered}
                        onChange={e => updateLine(idx, 'quantityDelivered', Number(e.target.value))}
                        className="w-24 px-2 py-1 bg-gray-800 border border-green-800 rounded text-white text-right font-mono text-sm ml-auto block focus:outline-none focus:border-green-500" />
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

        {/* Liste produits toujours visible */}
        <div className="p-4 border-t border-gray-800">
          <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
            placeholder="Rechercher un produit à ajouter..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 mb-2" />
          {visibleProducts.length > 0 ? (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {visibleProducts.slice(0, 12).map(p => {
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
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-400 text-sm hover:bg-gray-800">Annuler</button>
        <button onClick={handleSubmit} disabled={createBL.isPending || !clientId || !lines.length}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg">
          {createBL.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Créer le bon de livraison
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