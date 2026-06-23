'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, User, Clock, Truck, CheckCircle, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import { useDeliveryNote, useMarkDelivered, useDeleteDeliveryNote } from '@/hooks/useDeliveryNotes';
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from '@/types/commercial';
import { downloadPdf, pdfPaths } from '@/lib/documents';

export default function DeliveryNoteDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const dnId = id as string;

  const { data: dn, isLoading } = useDeliveryNote(dnId);
  const markDelivered = useMarkDelivered();
  const deleteBL      = useDeleteDeliveryNote();

  const [note, setNote] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [error, setError] = useState('');

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  if (!dn) return <div className="text-center py-16 text-gray-400">Bon de livraison introuvable</div>;

  const handleDeliver = async (signed: boolean) => {
    setError('');
    try {
      await markDelivered.mutateAsync({
        id: dnId,
        note: note || undefined,
        signatureUrl: signed ? (signatureUrl || undefined) : undefined,
      });
      setNote('');
      setSignatureUrl('');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce bon de livraison ?')) return;
    await deleteBL.mutateAsync(dnId);
    router.push('/delivery-notes');
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
              <h1 className="text-2xl font-semibold text-white font-mono">{dn.reference}</h1>
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', DELIVERY_STATUS_COLORS[dn.status])}>
                {DELIVERY_STATUS_LABELS[dn.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-400 text-sm flex-wrap">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <Link href={`/clients/${dn.client?.id}`} className="hover:text-indigo-400">{dn.client?.name}</Link>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(dn.createdAt).toLocaleDateString('fr-TN')}
              </span>
              {dn.deliveredAt && (
                <span>Livré le {new Date(dn.deliveredAt).toLocaleDateString('fr-TN')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => downloadPdf(pdfPaths.deliveryNote(dnId), `${dn.reference}.pdf`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg">
            <Download className="w-4 h-4" /> PDF
          </button>
          {dn.status === 'pending' && (
            <Can permission="delivery.delete">
              <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 bg-red-900/40 text-red-400 text-sm rounded-lg">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </Can>
          )}
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {(dn.deliveryAddress || dn.note) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
          {dn.deliveryAddress && (
            <div>
              <p className="text-gray-400 text-xs">Adresse de livraison</p>
              <p className="text-white text-sm">{dn.deliveryAddress}</p>
            </div>
          )}
          {dn.note && (
            <div>
              <p className="text-gray-400 text-xs">Note</p>
              <p className="text-white text-sm">{dn.note}</p>
            </div>
          )}
        </div>
      )}

      {dn.status === 'pending' && (
        <Can permission="delivery.edit">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <p className="text-white font-medium">Marquer comme livré</p>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note de livraison (optionnel)" rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none" />
            <input value={signatureUrl} onChange={e => setSignatureUrl(e.target.value)}
              placeholder="URL signature client (optionnel — marque comme signé)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
            <div className="flex gap-2">
              <button onClick={() => handleDeliver(false)} disabled={markDelivered.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg">
                <Truck className="w-4 h-4" /> Livré
              </button>
              <button onClick={() => handleDeliver(true)} disabled={markDelivered.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg">
                <CheckCircle className="w-4 h-4" /> Livré + Signé
              </button>
            </div>
          </div>
        </Can>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <Truck className="w-4 h-4 text-indigo-400" />
          <h2 className="text-white font-medium">Lignes livrées</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr className="text-gray-400 text-xs">
              <th className="text-left px-4 py-3">Produit</th>
              <th className="text-right px-4 py-3">Qté commandée</th>
              <th className="text-right px-4 py-3">Qté livrée</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {dn.lines?.map(line => (
              <tr key={line.id}>
                <td className="px-4 py-3 text-white">{line.product?.nom ?? `Produit #${line.productId}`}</td>
                <td className="px-4 py-3 text-right text-white font-mono">{line.quantityOrdered}</td>
                <td className="px-4 py-3 text-right text-white font-mono">{line.quantityDelivered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}