'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, User, Clock, Receipt, Send, CreditCard, Ban, FileMinus, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import {
  useInvoice, useMarkInvoiceSent, useAddPayment, useCreateCreditNote, useCancelInvoice,
} from '@/hooks/useInvoices';
import {
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, PAYMENT_METHOD_LABELS, type PaymentMethod,
} from '@/types/commercial';
import { downloadPdf, pdfPaths } from '@/lib/documents';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const invoiceId = id as string;

  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const markSent      = useMarkInvoiceSent();
  const addPayment    = useAddPayment();
  const createCredit  = useCreateCreditNote();
  const cancelInvoice = useCancelInvoice();

  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount]     = useState('');
  const [payMethod, setPayMethod]     = useState<PaymentMethod>('bank_transfer');
  const [payRef, setPayRef]           = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [showCredit, setShowCredit]   = useState(false);
  const [error, setError]             = useState('');

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  if (!invoice) return <div className="text-center py-16 text-gray-400">Facture introuvable</div>;

  const restant = Number(invoice.totalTtc) - Number(invoice.amountPaid);
  const isCreditNote = invoice.type === 'credit_note';

  const handleSend = async () => {
    setError('');
    try {
      await markSent.mutateAsync(invoiceId);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur');
    }
  };

  const handlePayment = async () => {
    setError('');
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { setError('Montant invalide'); return; }
    try {
      await addPayment.mutateAsync({ id: invoiceId, amount, method: payMethod, reference: payRef || undefined });
      setShowPayment(false);
      setPayAmount('');
      setPayRef('');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur paiement');
    }
  };

  const handleCreditNote = async () => {
    setError('');
    try {
      const credit = await createCredit.mutateAsync({ id: invoiceId, reason: creditReason || undefined });
      setShowCredit(false);
      router.push(`/invoices/${credit.id}`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur avoir');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Annuler cette facture ?')) return;
    setError('');
    try {
      await cancelInvoice.mutateAsync(invoiceId);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur annulation');
    }
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
              <h1 className="text-2xl font-semibold text-white font-mono">{invoice.reference}</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                {isCreditNote ? 'Avoir' : 'Facture'}
              </span>
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', INVOICE_STATUS_COLORS[invoice.status])}>
                {INVOICE_STATUS_LABELS[invoice.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-400 text-sm flex-wrap">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <Link href={`/clients/${invoice.client?.id}`} className="hover:text-indigo-400">{invoice.client?.name}</Link>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(invoice.createdAt).toLocaleDateString('fr-TN')}
              </span>
              {invoice.dueDate && <span>Échéance : {new Date(invoice.dueDate).toLocaleDateString('fr-TN')}</span>}
              {invoice.originalInvoice && (
                <Link href={`/invoices/${invoice.originalInvoiceId}`} className="text-indigo-400 hover:text-indigo-300">
                  Facture source : {invoice.originalInvoice.reference}
                </Link>
              )}
            </div>
          </div>
        </div>

        {!isCreditNote ? (
          <div className="flex flex-wrap gap-2 justify-end">
            <button onClick={() => downloadPdf(pdfPaths.invoice(invoiceId), `${invoice.reference}.pdf`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg">
              <Download className="w-4 h-4" /> PDF
            </button>
            {invoice.status === 'draft' && (
              <Can permission="invoices.edit">
                <button onClick={handleSend} disabled={markSent.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg">
                  <Send className="w-4 h-4" /> Marquer envoyée
                </button>
              </Can>
            )}
            {['sent', 'partial', 'overdue'].includes(invoice.status) && restant > 0.001 && (
              <Can permission="invoices.pay">
                <button onClick={() => setShowPayment(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg">
                  <CreditCard className="w-4 h-4" /> Paiement
                </button>
              </Can>
            )}
            {!['paid', 'cancelled'].includes(invoice.status) && (
              <Can permission="credits.create">
                <button onClick={() => setShowCredit(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-orange-900/50 hover:bg-orange-900/70 text-orange-400 text-sm rounded-lg">
                  <FileMinus className="w-4 h-4" /> Avoir
                </button>
              </Can>
            )}
            {!['paid', 'cancelled'].includes(invoice.status) && (
              <Can permission="invoices.cancel">
                <button onClick={handleCancel} disabled={cancelInvoice.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm rounded-lg">
                  <Ban className="w-4 h-4" /> Annuler
                </button>
              </Can>
            )}
          </div>
        ) : (
          <button onClick={() => downloadPdf(pdfPaths.invoice(invoiceId), `${invoice.reference}.pdf`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg">
            <Download className="w-4 h-4" /> PDF Avoir
          </button>
        )}
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {!isCreditNote && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs">Total TTC</p>
            <p className="text-white font-mono font-bold">{Number(invoice.totalTtc).toFixed(3)} DTN</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs">Payé</p>
            <p className="text-green-400 font-mono font-bold">{Number(invoice.amountPaid).toFixed(3)} DTN</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs">Restant dû</p>
            <p className="text-orange-400 font-mono font-bold">{restant.toFixed(3)} DTN</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs">Paiements</p>
            <p className="text-white font-bold">{invoice.payments?.length ?? 0}</p>
          </div>
        </div>
      )}

      {/* Barre de progression du paiement */}
      {!isCreditNote && Number(invoice.totalTtc) > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Progression du paiement</span>
            <span className="font-mono text-white">
              {Math.min(100, (Number(invoice.amountPaid) / Number(invoice.totalTtc)) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-green-500"
              style={{ width: `${Math.min(100, (Number(invoice.amountPaid) / Number(invoice.totalTtc)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span className="text-green-400 font-mono">{Number(invoice.amountPaid).toFixed(3)} payé</span>
            <span className="text-orange-400 font-mono">{restant.toFixed(3)} restant</span>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-white font-medium">Enregistrer un paiement (restant : {restant.toFixed(3)} DTN)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="number" step={0.001} value={payAmount} onChange={e => setPayAmount(e.target.value)}
              placeholder="Montant" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
            <select value={payMethod} onChange={e => setPayMethod(e.target.value as PaymentMethod)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(m => (
                <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
              ))}
            </select>
            <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Référence"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handlePayment} disabled={addPayment.isPending}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg">Confirmer</button>
            <button onClick={() => setShowPayment(false)} className="px-4 py-2 border border-gray-700 text-gray-400 text-sm rounded-lg">Annuler</button>
          </div>
        </div>
      )}

      {showCredit && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-white font-medium">Générer un avoir</p>
          <input value={creditReason} onChange={e => setCreditReason(e.target.value)} placeholder="Motif (optionnel)"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
          <div className="flex gap-2">
            <button onClick={handleCreditNote} disabled={createCredit.isPending}
              className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg">Créer l&apos;avoir</button>
            <button onClick={() => setShowCredit(false)} className="px-4 py-2 border border-gray-700 text-gray-400 text-sm rounded-lg">Annuler</button>
          </div>
        </div>
      )}

      {invoice.note && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Note</p>
          <p className="text-white text-sm">{invoice.note}</p>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-indigo-400" />
          <h2 className="text-white font-medium">Lignes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr className="text-gray-400 text-xs">
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-right px-4 py-3">Qté</th>
                <th className="text-right px-4 py-3">P.U.</th>
                <th className="text-right px-4 py-3">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {invoice.lines?.map(line => (
                <tr key={line.id}>
                  <td className="px-4 py-3 text-white">{line.description}</td>
                  <td className="px-4 py-3 text-right text-white font-mono">{line.quantity}</td>
                  <td className="px-4 py-3 text-right text-white font-mono">{Number(line.unitPrice).toFixed(3)}</td>
                  <td className="px-4 py-3 text-right text-white font-mono">{Number(line.totalHt).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-4 border-t border-gray-800 flex justify-end">
          <div className="text-right space-y-1 text-sm">
            <p className="text-gray-400">Total HT : <span className="text-white font-mono">{Number(invoice.totalHt).toFixed(3)} DTN</span></p>
            <p className="text-gray-400">TVA : <span className="text-white font-mono">{Number(invoice.totalTva).toFixed(3)} DTN</span></p>
            <p className="text-white font-semibold">Total TTC : <span className="font-mono text-indigo-400">{Number(invoice.totalTtc).toFixed(3)} DTN</span></p>
          </div>
        </div>
      </div>

      {invoice.payments && invoice.payments.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-white font-medium">Historique des paiements</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr className="text-gray-400 text-xs">
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Méthode</th>
                <th className="text-left px-4 py-3">Référence</th>
                <th className="text-right px-4 py-3">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {invoice.payments.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-gray-400">{new Date(p.paidAt).toLocaleDateString('fr-TN')}</td>
                  <td className="px-4 py-3 text-white">{PAYMENT_METHOD_LABELS[p.method]}</td>
                  <td className="px-4 py-3 text-gray-400">{p.reference ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-mono">{Number(p.amount).toFixed(3)} DTN</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}