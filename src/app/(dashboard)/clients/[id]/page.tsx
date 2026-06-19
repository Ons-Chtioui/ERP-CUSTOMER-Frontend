'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Edit, Mail, Phone, MapPin, FileText, Plus } from 'lucide-react';
import { useClient } from '@/hooks/useClients';
import { useOrders } from '@/hooks/useOrders';
import { Can } from '@/components/auth/Can';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/orders';
import { cn } from '@/lib/utils';

export default function ClientDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const clientId = id as string;

  const { data: client, isLoading } = useClient(clientId);
  const { data: ordersData } = useOrders({ clientId, limit: 10 });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  if (!client) return <div className="text-center py-16 text-gray-400">Client introuvable</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="mt-1 p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white">{client.name}</h1>
            <p className="text-gray-500 text-xs font-mono mt-0.5">{client.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Can permission="orders.create">
            <Link href={`/orders/new?clientId=${clientId}`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Nouvelle commande
            </Link>
          </Can>
          <Can permission="clients.edit">
            <Link href={`/clients/${clientId}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
              <Edit className="w-4 h-4" /> Modifier
            </Link>
          </Can>
        </div>
      </div>

      {/* Infos */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
        {[
          { label: 'Email', value: client.email, icon: Mail },
          { label: 'Téléphone', value: client.phone, icon: Phone },
          { label: 'Adresse', value: [client.address, client.city, client.country].filter(Boolean).join(', '), icon: MapPin },
          { label: 'N° TVA', value: client.tvaNumber, icon: FileText },
        ].map(({ label, value, icon: Icon }) => value ? (
          <div key={label} className="flex items-center gap-3 text-sm">
            <Icon className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-gray-400 w-24 shrink-0">{label}</span>
            <span className="text-white">{value}</span>
          </div>
        ) : null)}
      </div>

      {/* Commandes récentes */}
      {ordersData && ordersData.data.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-medium">Commandes récentes</h2>
            <Link href={`/orders?clientId=${clientId}`} className="text-indigo-400 text-xs hover:text-indigo-300">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {ordersData.data.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/50 transition-colors">
                <div>
                  <p className="text-white font-medium text-sm">{order.reference}</p>
                  <p className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('fr-TN')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', ORDER_STATUS_COLORS[order.status])}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-white font-mono text-sm">{Number(order.totalTtc).toFixed(3)} DTN</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
