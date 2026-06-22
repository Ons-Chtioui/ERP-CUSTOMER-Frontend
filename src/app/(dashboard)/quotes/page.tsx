'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import { useQuotes } from '@/hooks/useQuotes';
import { useClients } from '@/hooks/useClients';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, type QuoteStatus } from '@/types/commercial';

const STATUS_LIST: QuoteStatus[] = ['draft', 'sent', 'accepted', 'refused', 'expired', 'converted'];

export default function QuotesPage() {
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | ''>('');
  const [filterClient, setFilterClient] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuotes({
    status:   filterStatus || undefined,
    clientId: filterClient || undefined,
    page,
    limit: 20,
  });
  const { data: clients = [] } = useClients();
  const quotes = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Devis</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data?.total ?? 0} devis</p>
        </div>
        <Can permission="quotes.create">
          <Link href="/quotes/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Nouveau devis
          </Link>
        </Can>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as QuoteStatus | ''); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
            <option value="">Tous les statuts</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</option>)}
          </select>
          <select value={filterClient} onChange={e => { setFilterClient(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
            <option value="">Tous les clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => { setFilterStatus(''); setFilterClient(''); setPage(1); }}
            className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 transition-colors">
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
                    <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Total TTC</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Validité</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {quotes.map(quote => (
                    <tr key={quote.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/quotes/${quote.id}`} className="text-indigo-400 hover:text-indigo-300 font-mono text-sm">
                          {quote.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-white text-sm">{quote.client?.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', QUOTE_STATUS_COLORS[quote.status])}>
                          {QUOTE_STATUS_LABELS[quote.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono text-sm">
                        {Number(quote.totalTtc).toFixed(3)} DTN
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(quote.validUntil).toLocaleDateString('fr-TN')}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(quote.createdAt).toLocaleDateString('fr-TN')}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/quotes/${quote.id}`} className="text-xs text-indigo-400 hover:text-indigo-300">Détails →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {quotes.length === 0 && (
              <div className="text-center py-14">
                <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Aucun devis</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <p className="text-gray-500 text-xs">Page {page} / {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm rounded-lg">← Préc.</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm rounded-lg">Suiv. →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
