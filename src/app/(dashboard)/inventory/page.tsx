'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ClipboardList, Plus, Play, CheckCircle,
  Building2, Calendar, Eye, AlertCircle, X, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import { useInventorySessions, useCreateInventorySession, useStartInventorySession } from '@/hooks/useInventory';
import { useWarehouses } from '@/hooks/useWarehouses';
import type { InventorySession } from '@/types/stock';

// ─── Config statuts ────────────────────────────────────────────────────────────
const STATUS = {
  draft:       { label: 'Brouillon',  color: 'text-gray-400',   bg: 'bg-gray-800',        dot: 'bg-gray-500'   },
  in_progress: { label: 'En cours',   color: 'text-yellow-400', bg: 'bg-yellow-900/50',   dot: 'bg-yellow-400' },
  closed:      { label: 'Clôturé',    color: 'text-green-400',  bg: 'bg-green-900/50',    dot: 'bg-green-400'  },
} as const;

// ─── Carte session ──────────────────────────────────────────────────────────────
function SessionCard({
  session,
  onStart,
  onView,
  starting,
}: {
  session: InventorySession;
  onStart: () => void;
  onView: () => void;
  starting: boolean;
}) {
  const cfg = STATUS[session.status];
  const lines = session.lines ?? [];
  const counted = lines.filter((l) => l.quantityCounted !== null).length;
  const progress = lines.length > 0 ? Math.round((counted / lines.length) * 100) : 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-medium truncate">
              {session.nom || `Inventaire #${session.id}`}
            </h3>
            <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0', cfg.bg, cfg.color)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
              {cfg.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {session.warehouse?.nom}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(session.createdAt).toLocaleDateString('fr-TN')}
            </span>
            {session.startedAt && (
              <span className="flex items-center gap-1 text-yellow-500">
                <Play className="w-3 h-3" />
                Démarré {new Date(session.startedAt).toLocaleDateString('fr-TN')}
              </span>
            )}
            {session.closedAt && (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle className="w-3 h-3" />
                Clôturé {new Date(session.closedAt).toLocaleDateString('fr-TN')}
              </span>
            )}
            {session.user && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {session.user.prenom} {session.user.nom}
              </span>
            )}
          </div>

          {/* Barre de progression (visible si in_progress et lignes) */}
          {session.status === 'in_progress' && lines.length > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{counted}/{lines.length} lignes comptées</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          {session.status === 'draft' && (
            <Can permission="stock.inventory">
              <button
                onClick={onStart}
                disabled={starting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-60 text-white text-xs rounded-lg transition-colors"
              >
                {starting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Démarrer
              </button>
            </Can>
          )}
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
          >
            <Eye className="w-3 h-3" />
            {session.status === 'in_progress' ? 'Compter' : 'Détails'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default function InventoryPage() {
  const router = useRouter();
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formWarehouse, setFormWarehouse] = useState('');
  const [formError, setFormError] = useState('');
  const [startingId, setStartingId] = useState<number | null>(null);

  const { data: sessions = [], isLoading } = useInventorySessions(
    filterWarehouse ? +filterWarehouse : undefined,
  );
  const { data: warehouses = [] } = useWarehouses();
  const createSession = useCreateInventorySession();
  const startSession = useStartInventorySession();

  // Filtrer localement par statut
  const filtered = filterStatus
    ? sessions.filter((s) => s.status === filterStatus)
    : sessions;

  // Stats
  const stats = {
    total: sessions.length,
    draft: sessions.filter((s) => s.status === 'draft').length,
    inProgress: sessions.filter((s) => s.status === 'in_progress').length,
    closed: sessions.filter((s) => s.status === 'closed').length,
  };

  const handleCreate = async () => {
    if (!formWarehouse) { setFormError('Sélectionner un entrepôt'); return; }
    setFormError('');
    try {
      const session = await createSession.mutateAsync({
        warehouseId: +formWarehouse,
        nom: formName || undefined,
      });
      setShowForm(false);
      setFormName('');
      setFormWarehouse('');
      router.push(`/inventory/${session.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Erreur lors de la création');
    }
  };

  const handleStart = async (id: number) => {
    setStartingId(id);
    try {
      await startSession.mutateAsync(id);
      router.push(`/inventory/${id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Erreur lors du démarrage');
    } finally {
      setStartingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Inventaire</h1>
          <p className="text-gray-400 text-sm mt-0.5">{sessions.length} session(s)</p>
        </div>
        <Can permission="stock.inventory">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvel inventaire
          </button>
        </Can>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-indigo-900/30 border-indigo-800/50' },
          { label: 'Brouillons', value: stats.draft, color: 'text-gray-400', bg: 'bg-gray-800/50 border-gray-700' },
          { label: 'En cours', value: stats.inProgress, color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800/30' },
          { label: 'Clôturés', value: stats.closed, color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/30' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('border rounded-xl p-4', bg)}>
            <p className="text-gray-400 text-xs">{label}</p>
            <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tous les entrepôts</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.nom}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="in_progress">En cours</option>
            <option value="closed">Clôturé</option>
          </select>
        </div>
      </div>

      {/* Modal création */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Nouvel inventaire</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nom <span className="text-gray-500">(optionnel)</span></label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Inventaire mensuel juin"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Entrepôt <span className="text-red-400">*</span></label>
                <select
                  value={formWarehouse}
                  onChange={(e) => setFormWarehouse(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Sélectionner --</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.nom}</option>)}
                </select>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={createSession.isPending || !formWarehouse}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
              >
                {createSession.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onStart={() => handleStart(session.id)}
              onView={() => router.push(`/inventory/${session.id}`)}
              starting={startingId === session.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Aucune session d'inventaire</p>
          <Can permission="stock.inventory">
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
            >
              Créer le premier inventaire
            </button>
          </Can>
        </div>
      )}
    </div>
  );
}
