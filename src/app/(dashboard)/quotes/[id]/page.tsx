'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, User, Clock, FileText, ArrowRightLeft, Trash2, Download, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import {
  useQuote, useUpdateQuoteStatus, useConvertQuote, useDeleteQuote, useSendQuote,
} from '@/hooks/useQuotes';
import { downloadPdf, pdfPaths } from '@/lib/documents';
import {
  QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, QUOTE_NEXT_STATUSES, type QuoteStatus,
} from '@/types/commercial';

const STATUS_ACTION_LABELS: Partial<Record<QuoteStatus, string>> = {
  sent:     'Marquer envoyé',
  accepted: 'Accepter',
  refused:  'Refuser',
  expired:  'Marquer expiré',
};

export default function QuoteDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const quoteId = id as string;

  const { data: quote, isLoading } = useQuote(quoteId);
  const updateStatus = useUpdateQuoteStatus();
  const convertQuote = useConvertQuote();
  const deleteQuote  = useDeleteQuote();
  const sendQuote    = useSendQuote();

  const [pendingStatus, setPending] = useState<QuoteStatus | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  if (!quote) return <div className="text-center py-16 text-gray-400">Devis introuvable</div>;

  const nextStatuses = QUOTE_NEXT_STATUSES[quote.status];
  const canConvert = quote.status === 'accepted';

  const handleStatusChange = async (status: QuoteStatus) => {
    setError('');
    try {
      await updateStatus.mutateAsync({ id: quoteId, status, comment: comment || undefined });
      setPending(null);
      setComment('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Erreur lors du changement de statut');
    }
  };

  const handleConvert = async () => {
    setError('');
    try {
      const invoice = await convertQuote.mutateAsync(quoteId);
      router.push(`/invoices/${invoice.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Erreur lors de la conversion');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce devis brouillon ?')) return;
    await deleteQuote.mutateAsync(quoteId);
    router.push('/quotes');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="mt-1 p-2 hover:bg-gray-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-white font-mono">{quote.reference}</h1>
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', QUOTE_STATUS_COLORS[quote.status])}>
                {QUOTE_STATUS_LABELS[quote.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <Link href={`/clients/${quote.client?.id}`} className="hover:text-indigo-400">{quote.client?.name}</Link>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(quote.createdAt).toLocaleDateString('fr-TN')}
              </span>
              <span>Validité : {new Date(quote.validUntil).toLocaleDateString('fr-TN')}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => downloadPdf(pdfPaths.quote(quoteId), `${quote.reference}.pdf`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg">
            <Download className="w-4 h-4" /> PDF
          </button>
          <Can permission="quotes.edit">
            <button onClick={() => sendQuote.mutateAsync(quoteId)} disabled={sendQuote.isPending}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 text-sm rounded-lg">
              <Mail className="w-4 h-4" /> Envoyer par email
            </button>
          </Can>
          {quote.status === 'draft' && (
            <Can permission="quotes.delete">
              <button onClick={handleDelete} disabled={deleteQuote.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm rounded-lg">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </Can>
          )}
          {canConvert && (
            <Can permission="quotes.convert">
              <button onClick={handleConvert} disabled={convertQuote.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">
                {convertQuote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                Convertir en facture
              </button>
            </Can>
          )}
          {quote.status === 'converted' && quote.convertedTo && (
            <Link href={`/invoices/${quote.convertedTo}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-900/40 text-green-400 text-sm rounded-lg hover:bg-green-900/60">
              Voir la facture →
            </Link>
          )}
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {quote.status === 'sent' && (
        <div className="bg-blue-900/20 border border-blue-800/50 text-blue-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <span>ℹ</span> Le devis doit être <strong className="mx-1">accepté</strong> par le client avant conversion en facture.
        </div>
      )}

      {nextStatuses.length > 0 && (
        <Can permission="quotes.edit">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-3">Actions</p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map(s => (
                <button key={s} onClick={() => setPending(s)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg">
                  {STATUS_ACTION_LABELS[s] ?? QUOTE_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {pendingStatus && (
              <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                <p className="text-white text-sm">Confirmer : {QUOTE_STATUS_LABELS[pendingStatus]}</p>
                <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Commentaire (optionnel)"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => handleStatusChange(pendingStatus)} disabled={updateStatus.isPending}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">
                    Confirmer
                  </button>
                  <button onClick={() => { setPending(null); setComment(''); }}
                    className="px-4 py-2 border border-gray-700 text-gray-400 text-sm rounded-lg">Annuler</button>
                </div>
              </div>
            )}
          </div>
        </Can>
      )}

      {quote.note && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Note</p>
          <p className="text-white text-sm whitespace-pre-wrap">{quote.note}</p>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h2 className="text-white font-medium">Lignes du devis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr className="text-gray-400 text-xs">
                <th className="text-left px-4 py-3">Produit</th>
                <th className="text-right px-4 py-3">Qté</th>
                <th className="text-right px-4 py-3">P.U.</th>
                <th className="text-right px-4 py-3">Rem.%</th>
                <th className="text-right px-4 py-3">TVA%</th>
                <th className="text-right px-4 py-3">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {quote.lines?.map(line => (
                <tr key={line.id}>
                  <td className="px-4 py-3 text-white">
                    {line.product?.nom ?? line.description}
                    {line.product?.reference && <span className="text-gray-500 text-xs ml-2">{line.product.reference}</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-mono">{line.quantity}</td>
                  <td className="px-4 py-3 text-right text-white font-mono">{Number(line.unitPrice).toFixed(3)}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{line.discount}%</td>
                  <td className="px-4 py-3 text-right text-gray-400">{line.tvaRate}%</td>
                  <td className="px-4 py-3 text-right text-white font-mono">{Number(line.totalHt).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-4 border-t border-gray-800 flex justify-end">
          <div className="text-right space-y-1 text-sm">
            {quote.discount > 0 && <p className="text-gray-400">Remise globale : {quote.discount}%</p>}
            <p className="text-gray-400">Total HT : <span className="text-white font-mono">{Number(quote.totalHt).toFixed(3)} DTN</span></p>
            <p className="text-gray-400">TVA : <span className="text-white font-mono">{Number(quote.totalTva).toFixed(3)} DTN</span></p>
            <p className="text-white font-semibold text-base">Total TTC : <span className="font-mono text-indigo-400">{Number(quote.totalTtc).toFixed(3)} DTN</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}