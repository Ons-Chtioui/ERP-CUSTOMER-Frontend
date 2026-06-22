'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import { useDeliveryNotes } from '@/hooks/useDeliveryNotes';
import { useClients } from '@/hooks/useClients';
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS, type DeliveryStatus } from '@/types/commercial';

const STATUS_LIST: DeliveryStatus[] = ['pending', 'delivered', 'signed'];

export default function DeliveryNotesPage() {
  const [filterStatus, setFilterStatus] = useState<DeliveryStatus | ''>('');
  const [filterClient, setFilterClient] = useState('');

  const { data: notes = [], isLoading } = useDeliveryNotes({
    status:   filterStatus || undefined,
    clientId: filterClient || undefined,
  });
  const { data: clients = [] } = useClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Bons de livraison</h1>
          <p className="text-gray-400 text-sm mt-0.5">{notes.length} bon(s)</p>
        </div>
        <Can permission="delivery.create">
          <Link href="/delivery-notes/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Nouveau BL
          </Link>
        </Can>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as DeliveryStatus | '')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
            <option value="">Tous les statuts</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{DELIVERY_STATUS_LABELS[s]}</option>)}
          </select>
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
            <option value="">Tous les clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => { setFilterStatus(''); setFilterClient(''); }}
            className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800">
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-800">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Référence</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Client</th>
                    <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Statut</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Commande</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Facture</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {notes.map(dn => (
                    <tr key={dn.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/delivery-notes/${dn.id}`} className="text-indigo-400 hover:text-indigo-300 font-mono text-sm">
                          {dn.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-white text-sm">{dn.client?.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', DELIVERY_STATUS_COLORS[dn.status])}>
                          {DELIVERY_STATUS_LABELS[dn.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm font-mono">
                        {dn.order ? (
                          <Link href={`/orders/${dn.order.id}`} className="hover:text-indigo-400">{dn.order.reference}</Link>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm font-mono">
                        {dn.invoice ? (
                          <Link href={`/invoices/${dn.invoice.id}`} className="hover:text-indigo-400">{dn.invoice.reference}</Link>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(dn.createdAt).toLocaleDateString('fr-TN')}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/delivery-notes/${dn.id}`} className="text-xs text-indigo-400">Détails →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {notes.length === 0 && (
              <div className="text-center py-14">
                <Truck className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Aucun bon de livraison</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
