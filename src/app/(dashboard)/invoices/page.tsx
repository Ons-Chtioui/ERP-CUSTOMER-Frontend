'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import { useInvoices, useInvoiceStats } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, type InvoiceStatus, type InvoiceType } from '@/types/commercial';

const STATUS_LIST: InvoiceStatus[] = ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'];

export default function InvoicesPage() {
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | ''>('');
  const [filterType, setFilterType]     = useState<InvoiceType | ''>('invoice');
  const [filterClient, setFilterClient] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useInvoices({
    status:   filterStatus || undefined,
    type:     filterType || undefined,
    clientId: filterClient || undefined,
    page,
    limit: 20,
  });
  const { data: stats } = useInvoiceStats();
  const { data: clients = [] } = useClients();

  const invoices = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  const unpaidTotal = stats?.reduce((s, r) => s + parseFloat(r.unpaid ?? '0'), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Factures & Avoirs</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data?.total ?? 0} document(s)</p>
        </div>
        <Can permission="invoices.create">
          <Link href="/invoices/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle facture
          </Link>
        </Can>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Impayé total</p>
            <p className="text-xl font-bold text-orange-400">{unpaidTotal.toFixed(3)} DTN</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Factures payées</p>
            <p className="text-xl font-bold text-green-400">
              {stats.find(s => s.type === 'invoice' && s.status === 'paid')?.count ?? 0}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">En retard</p>
            <p className="text-xl font-bold text-red-400">
              {stats.find(s => s.type === 'invoice' && s.status === 'overdue')?.count ?? 0}
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select value={filterType} onChange={e => { setFilterType(e.target.value as InvoiceType | ''); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
            <option value="">Tous types</option>
            <option value="invoice">Factures</option>
            <option value="credit_note">Avoirs</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as InvoiceStatus | ''); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
            <option value="">Tous statuts</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</option>)}
          </select>
          <select value={filterClient} onChange={e => { setFilterClient(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
            <option value="">Tous les clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => { setFilterStatus(''); setFilterType('invoice'); setFilterClient(''); setPage(1); }}
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
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Client</th>
                    <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Statut</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Total TTC</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Payé</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Échéance</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/invoices/${inv.id}`} className="text-indigo-400 hover:text-indigo-300 font-mono text-sm">
                          {inv.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {inv.type === 'credit_note' ? 'Avoir' : 'Facture'}
                      </td>
                      <td className="px-4 py-3 text-white text-sm">{inv.client?.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', INVOICE_STATUS_COLORS[inv.status])}>
                          {INVOICE_STATUS_LABELS[inv.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono text-sm">
                        {Number(inv.totalTtc).toFixed(3)} DTN
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono text-sm">
                        {Number(inv.amountPaid).toFixed(3)} DTN
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('fr-TN') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/invoices/${inv.id}`} className="text-xs text-indigo-400">Détails →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invoices.length === 0 && (
              <div className="text-center py-14">
                <Receipt className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Aucune facture</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <p className="text-gray-500 text-xs">Page {page} / {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 bg-gray-800 disabled:opacity-40 text-gray-300 text-sm rounded-lg">← Préc.</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1 bg-gray-800 disabled:opacity-40 text-gray-300 text-sm rounded-lg">Suiv. →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
