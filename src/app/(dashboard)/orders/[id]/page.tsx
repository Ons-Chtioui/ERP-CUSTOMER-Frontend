'use client';

/**
 * Page détail d'une commande.
 *
 * Affiche :
 *  - Les infos générales (référence, statut, client, dates)
 *  - Alerte stock si la commande ne peut pas être confirmée
 *  - Les lignes avec leurs suppléments (composants additionnels)
 *  - Les totaux
 *  - L'historique des changements de statut
 *  - Les boutons d'action (changer statut, modifier si draft)
 */

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, CheckCircle, XCircle, Truck,
  Package, AlertTriangle, Clock, User, MessageSquare, Edit,
  ChevronDown, ChevronUp, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrder, useUpdateOrderStatus, useCheckOrderAvailability } from '@/hooks/useOrders';
import { Can } from '@/components/auth/Can';
import {
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, NEXT_STATUSES, type OrderStatus,
} from '@/types/orders';
import { mediaUrl } from '@/lib/media';

// ─── Icônes et labels des actions de statut ───────────────────────────────────
const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  confirmed: CheckCircle,
  preparing: Package,
  shipped:   Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const STATUS_ACTION_LABELS: Record<string, string> = {
  confirmed: 'Confirmer',
  preparing: 'Mettre en préparation',
  shipped:   'Marquer expédiée',
  delivered: 'Marquer livrée',
  cancelled: 'Annuler',
};

const STATUS_ACTION_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-600 hover:bg-blue-500',
  preparing: 'bg-yellow-600 hover:bg-yellow-500',
  shipped:   'bg-indigo-600 hover:bg-indigo-500',
  delivered: 'bg-green-600 hover:bg-green-500',
  cancelled: 'bg-red-600 hover:bg-red-500',
};

export default function OrderDetailPage() {
  const router  = useRouter();
  const { id }  = useParams();
  const orderId = id as string;

  const { data: order, isLoading }  = useOrder(orderId);
  const { data: availability }      = useCheckOrderAvailability(orderId);
  const updateStatus                = useUpdateOrderStatus();

  const [pendingStatus, setPending]   = useState<OrderStatus | null>(null);
  const [comment, setComment]         = useState('');
  const [statusError, setStatusError] = useState('');
  // Contrôle l'accordéon suppléments par ligne (clé = line.id)
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  if (!order)
    return <div className="text-center py-16 text-gray-400">Commande introuvable</div>;

  const nextStatuses = NEXT_STATUSES[order.status];

  // ── Changer le statut via le backend ──────────────────────────────────────
  const handleStatusChange = async (status: OrderStatus) => {
    setStatusError('');
    try {
      await updateStatus.mutateAsync({ id: orderId, status, comment: comment || undefined });
      setPending(null);
      setComment('');
    } catch (err: unknown) {
      const data = (err as {
        response?: { data?: { message?: string; missing?: object[] } };
      })?.response?.data;
      if (data?.missing) {
        setStatusError('Stock insuffisant pour confirmer la commande');
      } else {
        setStatusError(
          typeof data?.message === 'string'
            ? data.message
            : 'Erreur lors du changement de statut',
        );
      }
    }
  };

  // ── Toggle accordéon suppléments ──────────────────────────────────────────
  const toggleLine = (lineId: string) => {
    setExpandedLines((prev) => {
      const next = new Set(prev);
      next.has(lineId) ? next.delete(lineId) : next.add(lineId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* ── En-tête ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-white font-mono">
                {order.reference}
              </h1>
              <span
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full font-medium',
                  ORDER_STATUS_COLORS[order.status],
                )}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <Link
                  href={`/clients/${order.client?.id}`}
                  className="hover:text-indigo-400 transition-colors"
                >
                  {order.client?.name}
                </Link>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(order.createdAt).toLocaleString('fr-TN')}
              </span>
            </div>
          </div>
        </div>

        {/* Boutons d'action statut */}
        <Can permission="orders.edit">
          <div className="flex gap-2 flex-wrap justify-end">
            {/* Bouton Modifier (seulement en brouillon) */}
            {order.status === 'draft' && (
              <Link
                href={`/orders/${orderId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" /> Modifier
              </Link>
            )}
            {/* Boutons de transition de statut */}
            {nextStatuses.map((s) => {
              const Icon = STATUS_ICONS[s] ?? CheckCircle;
              return (
                <button
                  key={s}
                  onClick={() => (s === 'cancelled' ? setPending(s) : handleStatusChange(s))}
                  disabled={updateStatus.isPending}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg transition-colors disabled:opacity-60',
                    STATUS_ACTION_COLORS[s] ?? 'bg-gray-700 hover:bg-gray-600',
                  )}
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  {STATUS_ACTION_LABELS[s]}
                </button>
              );
            })}
          </div>
        </Can>
      </div>

      {/* ── Alerte stock insuffisant ── */}
      {order.status === 'draft' && availability && !availability.canConfirm && (
        <div className="bg-orange-950/30 border border-orange-800/50 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-400 font-medium text-sm">
                Stock insuffisant pour confirmer
              </p>
              <p className="text-orange-300/70 text-xs mt-0.5">
                Les éléments suivants manquent :
              </p>
            </div>
          </div>
          <div className="space-y-1 pl-8">
            {availability.missing.map(
              (
                m: { name?: string; available: number; needed: number; type?: string },
                i: number,
              ) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-orange-300">
                    {m.type === 'supplement' ? '⚙ ' : ''}
                    {m.name ?? 'Inconnu'}
                  </span>
                  <span className="text-orange-400 font-mono">
                    {m.available} / {m.needed} requis
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* ── Erreur action ── */}
      {statusError && (
        <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {statusError}
          <button
            onClick={() => setStatusError('')}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Lignes de commande ── */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-medium">Lignes ({order.lines.length})</h2>
          </div>

          <div className="divide-y divide-gray-800">
            {order.lines.map((line) => {
              const isExpanded      = expandedLines.has(line.id);
              const hasSupplements  = (line.supplements ?? []).length > 0;
              // Calcul du sous-total suppléments pour affichage
              const suppTotal = (line.supplements ?? []).reduce(
                (s, sup) => s + Number(sup.totalHt),
                0,
              );

              return (
                <div key={line.id}>
                  {/* Ligne produit */}
                  <div className="px-4 py-3 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {/* Image */}
                      {line.product?.imageUrl ? (
                        <img
                          src={mediaUrl(line.product.imageUrl)!}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover border border-gray-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 shrink-0 flex items-center justify-center">
                          <Layers className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                      )}

                      {/* Nom */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {line.product?.nom}
                        </p>
                        <p className="text-gray-500 text-xs font-mono">
                          {line.product?.reference}
                        </p>
                        {/* Indicateur qté stock/assemblage (visible après confirmation) */}
                        {(line.qtyFromStock > 0 || line.qtyFromAssembly > 0) && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            {line.qtyFromStock > 0 && (
                              <span className="text-blue-400/70">
                                {line.qtyFromStock} stock
                              </span>
                            )}
                            {line.qtyFromStock > 0 && line.qtyFromAssembly > 0 && (
                              <span className="text-gray-600"> + </span>
                            )}
                            {line.qtyFromAssembly > 0 && (
                              <span className="text-yellow-400/70">
                                {line.qtyFromAssembly} assemblé
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Colonnes numériques */}
                      <div className="text-right shrink-0">
                        <p className="text-gray-400 text-xs">P.U.</p>
                        <p className="text-gray-300 text-sm font-mono">
                          {Number(line.unitPrice).toFixed(3)}
                        </p>
                      </div>
                      <div className="text-center shrink-0 w-12">
                        <p className="text-gray-400 text-xs">Qté</p>
                        <p className="text-white text-sm font-semibold">{line.quantity}</p>
                      </div>
                      <div className="text-center shrink-0 w-16">
                        <p className="text-gray-400 text-xs">Remise</p>
                        <p className="text-gray-400 text-sm">{line.discount}%</p>
                      </div>
                      <div className="text-right shrink-0 min-w-[80px]">
                        <p className="text-gray-400 text-xs">Total HT</p>
                        <p className="text-white text-sm font-mono">
                          {Number(line.totalHt).toFixed(3)}
                        </p>
                      </div>

                      {/* Toggle suppléments */}
                      {hasSupplements && (
                        <button
                          onClick={() => toggleLine(line.id)}
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                          title="Voir les suppléments"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Indicateur suppléments (accordéon fermé) */}
                    {hasSupplements && !isExpanded && (
                      <button
                        onClick={() => toggleLine(line.id)}
                        className="mt-1 ml-11 text-xs text-indigo-400/70 hover:text-indigo-400 transition-colors"
                      >
                        {line.supplements.length} supplément(s) · +{suppTotal.toFixed(3)} DTN HT
                      </button>
                    )}
                  </div>

                  {/* ── Suppléments de la ligne (accordéon) ── */}
                  {isExpanded && hasSupplements && (
                    <div className="bg-gray-800/20 border-t border-gray-800/50 px-4 py-3 ml-11">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                        Suppléments
                      </p>
                      <div className="space-y-2">
                        {line.supplements.map((supp) => (
                          <div
                            key={supp.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {/* Icône composant */}
                              <div className="w-5 h-5 rounded bg-indigo-900/30 border border-indigo-800/30 flex items-center justify-center shrink-0">
                                <Package className="w-3 h-3 text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-gray-300 text-xs">
                                  {supp.component?.nom ?? `Composant #${supp.componentId}`}
                                </p>
                                <p className="text-gray-600 text-xs font-mono">
                                  {supp.component?.reference}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-right">
                              <span className="text-gray-500">
                                {supp.quantity} × {Number(supp.unitPrice).toFixed(3)}
                              </span>
                              <span className="text-white font-mono w-20">
                                {Number(supp.totalHt).toFixed(3)} DTN
                              </span>
                              {/* Indicateur déduction stock */}
                              {Number(supp.qtyDeducted) > 0 ? (
                                <span className="text-green-400/70 text-xs">✓ déduit</span>
                              ) : (
                                <span className="text-gray-600 text-xs">en attente</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Sous-total suppléments */}
                      <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between text-xs">
                        <span className="text-gray-500">Sous-total suppléments</span>
                        <span className="text-gray-300 font-mono">
                          +{suppTotal.toFixed(3)} DTN HT
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Colonne droite : totaux, client, historique ── */}
        <div className="space-y-4">
          {/* Totaux */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Total HT</span>
              <span className="font-mono text-white">
                {Number(order.totalHt).toFixed(3)} DTN
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>TVA</span>
              <span className="font-mono text-white">
                {Number(order.totalTva).toFixed(3)} DTN
              </span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Remise globale</span>
                <span className="font-mono text-orange-400">-{order.discount}%</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t border-gray-700 pt-2">
              <span className="text-gray-200">Total TTC</span>
              <span className="font-mono text-green-400 text-lg">
                {Number(order.totalTtc).toFixed(3)} DTN
              </span>
            </div>
          </div>

          {/* Client */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-1 text-sm">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Client</p>
            <p className="text-white font-medium">{order.client?.name}</p>
            <p className="text-gray-500 text-xs font-mono">{order.client?.code}</p>
            {order.client?.email && (
              <p className="text-gray-400 text-xs">{order.client.email}</p>
            )}
            {order.client?.phone && (
              <p className="text-gray-400 text-xs">{order.client.phone}</p>
            )}
          </div>

          {/* Dates importantes */}
          {(order.confirmedAt || order.shippedAt || order.deliveredAt || order.cancelledAt) && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm space-y-1">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Dates</p>
              {order.confirmedAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Confirmée</span>
                  <span className="text-gray-300">
                    {new Date(order.confirmedAt).toLocaleDateString('fr-TN')}
                  </span>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Expédiée</span>
                  <span className="text-gray-300">
                    {new Date(order.shippedAt).toLocaleDateString('fr-TN')}
                  </span>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Livrée</span>
                  <span className="text-gray-300">
                    {new Date(order.deliveredAt).toLocaleDateString('fr-TN')}
                  </span>
                </div>
              )}
              {order.cancelledAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Annulée</span>
                  <span className="text-red-400">
                    {new Date(order.cancelledAt).toLocaleDateString('fr-TN')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          {order.note && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Note</p>
              <p className="text-gray-300 text-sm">{order.note}</p>
            </div>
          )}

          {/* Historique des statuts */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Historique
              </p>
              <div className="space-y-3">
                {order.statusHistory.map((h) => (
                  <div key={h.id} className="text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Ancien statut → nouveau statut */}
                      {h.fromStatus && (
                        <>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-xs',
                              ORDER_STATUS_COLORS[h.fromStatus as OrderStatus] ??
                                'bg-gray-700 text-gray-400',
                            )}
                          >
                            {ORDER_STATUS_LABELS[h.fromStatus as OrderStatus] ?? h.fromStatus}
                          </span>
                          <span className="text-gray-600">→</span>
                        </>
                      )}
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-xs',
                          ORDER_STATUS_COLORS[h.toStatus as OrderStatus] ??
                            'bg-gray-700 text-gray-400',
                        )}
                      >
                        {ORDER_STATUS_LABELS[h.toStatus as OrderStatus] ?? h.toStatus}
                      </span>
                      <span className="text-gray-600">
                        {new Date(h.createdAt).toLocaleString('fr-TN')}
                      </span>
                    </div>
                    {/* Nom de l'utilisateur qui a changé le statut */}
                    {h.user && (
                      <p className="text-gray-600 mt-0.5 pl-1">
                        par {h.user.prenom} {h.user.nom}
                      </p>
                    )}
                    {h.comment && (
                      <p className="text-gray-500 mt-0.5 pl-1 italic">"{h.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal confirmation annulation ── */}
      {pendingStatus === 'cancelled' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setPending(null)}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" /> Annuler la commande
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Cette action est irréversible. Le stock sera restitué si la commande était confirmée.
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Motif d'annulation (optionnel)"
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setPending(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                Retour
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updateStatus.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
              >
                {updateStatus.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}