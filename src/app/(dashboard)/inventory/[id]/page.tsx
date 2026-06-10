'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  Loader2, ArrowLeft, ClipboardList, Building2,
  CheckCircle, Play, AlertTriangle, Save, Search,
  Download, Package, TrendingUp, TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useInventorySession,
  useCountInventoryLine,
  useCloseInventorySession,
  useStartInventorySession,
} from '@/hooks/useInventory';
import { Can } from '@/components/auth/Can';
import type { InventoryLine } from '@/types/stock';

// ─── Badge statut ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = {
    draft:       { label: 'Brouillon', cls: 'bg-gray-800 text-gray-400' },
    in_progress: { label: 'En cours',  cls: 'bg-yellow-900/50 text-yellow-400' },
    closed:      { label: 'Clôturé',   cls: 'bg-green-900/50 text-green-400' },
  }[status] ?? { label: status, cls: 'bg-gray-800 text-gray-400' };

  return (
    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

// ─── Ligne de comptage ─────────────────────────────────────────────────────────
function CountRow({
  line,
  isInProgress,
  countValue,
  noteValue,
  onCountChange,
  onNoteChange,
  onSave,
  saving,
}: {
  line: InventoryLine;
  isInProgress: boolean;
  countValue: string;
  noteValue: string;
  onCountChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const counted = line.quantityCounted !== null;
  const ecart = line.ecart !== null ? Number(line.ecart) : null;

  return (
    <tr className={cn(
      'border-b border-gray-800 last:border-0 transition-colors',
      counted ? 'bg-green-950/10' : 'hover:bg-gray-800/30',
    )}>
      {/* Composant */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {line.component?.imageUrl ? (
            <img src={line.component.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-700 shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-gray-600" />
            </div>
          )}
          <div>
            <p className="text-white text-sm font-medium">{line.component?.nom}</p>
            <p className="text-gray-500 text-xs font-mono">{line.component?.reference}</p>
          </div>
        </div>
      </td>

      {/* Théorique */}
      <td className="px-4 py-3 text-right">
        <span className="text-white text-sm">{Number(line.quantityTheoretical).toFixed(2)}</span>
        <span className="text-gray-500 text-xs ml-1">{line.component?.unite}</span>
      </td>

      {/* Compté */}
      <td className="px-4 py-3 text-right">
        {isInProgress && !counted ? (
          <input
            type="number"
            step="0.01"
            min="0"
            value={countValue}
            onChange={(e) => onCountChange(e.target.value)}
            placeholder="0"
            className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-right focus:outline-none focus:border-indigo-500"
          />
        ) : (
          <span className={cn(
            'text-sm font-medium',
            counted ? (ecart !== 0 ? 'text-orange-400' : 'text-white') : 'text-gray-600',
          )}>
            {counted ? Number(line.quantityCounted).toFixed(2) : '—'}
          </span>
        )}
      </td>

      {/* Écart */}
      <td className="px-4 py-3 text-right">
        {ecart !== null ? (
          <div className="flex items-center justify-end gap-1">
            {ecart > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-400" />
            ) : ecart < 0 ? (
              <TrendingDown className="w-3 h-3 text-red-400" />
            ) : null}
            <span className={cn(
              'text-sm font-semibold',
              ecart > 0 ? 'text-green-400' : ecart < 0 ? 'text-red-400' : 'text-gray-400',
            )}>
              {ecart > 0 ? `+${ecart.toFixed(2)}` : ecart.toFixed(2)}
            </span>
          </div>
        ) : (
          <span className="text-gray-600 text-sm">—</span>
        )}
      </td>

      {/* Notes */}
      <td className="px-4 py-3">
        {isInProgress && !counted ? (
          <input
            type="text"
            value={noteValue}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Note..."
            className="w-32 px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        ) : (
          <span className="text-gray-500 text-xs">{line.notes || '—'}</span>
        )}
      </td>

      {/* Action */}
      <td className="px-4 py-3 text-center">
        {isInProgress && !counted ? (
          <button
            onClick={onSave}
            disabled={saving || countValue === ''}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors mx-auto"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Sauver
          </button>
        ) : counted ? (
          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
        ) : null}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InventorySessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = parseInt(params.id as string);

  const { data: session, isLoading } = useInventorySession(sessionId);
  const countLine = useCountInventoryLine();
  const closeSession = useCloseInventorySession();
  const startSession = useStartInventorySession();

  const [counts, setCounts] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [savingLine, setSavingLine] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterUncounted, setFilterUncounted] = useState(false);
  const [closeError, setCloseError] = useState('');

  const lines = session?.lines ?? [];
  const isInProgress = session?.status === 'in_progress';
  const isDraft = session?.status === 'draft';
  const isClosed = session?.status === 'closed';

  const countedLines = lines.filter((l) => l.quantityCounted !== null);
  const uncountedLines = lines.filter((l) => l.quantityCounted === null);
  const progress = lines.length > 0 ? Math.round((countedLines.length / lines.length) * 100) : 0;

  // Calcul des écarts
  const totalEcart = countedLines.reduce((s, l) => s + (Number(l.ecart) || 0), 0);
  const linesWithEcart = countedLines.filter((l) => l.ecart !== null && Number(l.ecart) !== 0).length;

  // Lignes filtrées
  const filteredLines = useMemo(() => {
    let result = lines;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.component?.nom?.toLowerCase().includes(q) ||
          l.component?.reference?.toLowerCase().includes(q),
      );
    }
    if (filterUncounted) result = result.filter((l) => l.quantityCounted === null);
    return result;
  }, [lines, search, filterUncounted]);

  const handleSave = async (componentId: number) => {
    const val = counts[componentId];
    if (val === '' || val === undefined) return;
    setSavingLine(componentId);
    try {
      await countLine.mutateAsync({
        sessionId,
        componentId,
        quantityCounted: parseFloat(val),
        notes: notes[componentId] || undefined,
      });
      setCounts((p) => { const n = { ...p }; delete n[componentId]; return n; });
      setNotes((p) => { const n = { ...p }; delete n[componentId]; return n; });
    } finally {
      setSavingLine(null);
    }
  };

  const handleClose = async () => {
    setCloseError('');
    try {
      await closeSession.mutateAsync(sessionId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCloseError(msg || 'Erreur lors de la clôture');
    }
  };

  const handleStart = async () => {
    await startSession.mutateAsync(sessionId);
  };

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Référence', 'Nom', 'Théorique', 'Compté', 'Écart', 'Notes'],
      ...lines.map((l) => [
        l.component?.reference ?? '',
        l.component?.nom ?? '',
        l.quantityTheoretical,
        l.quantityCounted ?? '',
        l.ecart ?? '',
        l.notes ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventaire-${sessionId}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <ClipboardList className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-400 mb-4">Session introuvable</p>
        <button onClick={() => router.back()} className="text-indigo-400 text-sm hover:underline">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="mt-1 p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-white">
                {session.nom || `Inventaire #${session.id}`}
              </h1>
              <StatusBadge status={session.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {session.warehouse?.nom}
              </span>
              {session.startedAt && (
                <span>Démarré {new Date(session.startedAt).toLocaleString('fr-TN')}</span>
              )}
              {session.closedAt && (
                <span className="text-green-400">
                  Clôturé {new Date(session.closedAt).toLocaleString('fr-TN')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {/* Démarrer */}
          {isDraft && (
            <Can permission="stock.inventory">
              <button
                onClick={handleStart}
                disabled={startSession.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
              >
                {startSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Démarrer
              </button>
            </Can>
          )}

          {/* Export CSV */}
          {lines.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}

          {/* Clôturer */}
          {isInProgress && (
            <Can permission="stock.inventory">
              <button
                onClick={handleClose}
                disabled={uncountedLines.length > 0 || closeSession.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                title={uncountedLines.length > 0 ? `${uncountedLines.length} ligne(s) non comptée(s)` : ''}
              >
                {closeSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Clôturer
              </button>
            </Can>
          )}
        </div>
      </div>

      {/* Erreur clôture */}
      {closeError && (
        <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {closeError}
        </div>
      )}

      {/* Cartes stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total lignes</p>
          <p className="text-2xl font-bold text-white">{lines.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Comptées</p>
          <p className="text-2xl font-bold text-green-400">{countedLines.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Restantes</p>
          <p className={cn('text-2xl font-bold', uncountedLines.length > 0 ? 'text-orange-400' : 'text-gray-500')}>
            {uncountedLines.length}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Écarts détectés</p>
          <p className={cn('text-2xl font-bold', linesWithEcart > 0 ? 'text-orange-400' : 'text-gray-500')}>
            {linesWithEcart}
          </p>
        </div>
      </div>

      {/* Barre de progression */}
      {isInProgress && lines.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progression du comptage</span>
            <span className="text-white font-medium">{progress}%</span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                progress === 100 ? 'bg-green-500' : 'bg-indigo-500',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{countedLines.length} ligne{countedLines.length !== 1 ? 's' : ''} comptée{countedLines.length !== 1 ? 's' : ''}</span>
            <span>{uncountedLines.length} restante{uncountedLines.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Message draft */}
      {isDraft && (
        <div className="bg-yellow-950/30 border border-yellow-800/50 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium text-sm">Session en brouillon</p>
            <p className="text-yellow-300/70 text-sm mt-0.5">
              Cliquez sur "Démarrer" pour lancer l'inventaire. Les stocks actuels seront capturés comme référence.
            </p>
          </div>
        </div>
      )}

      {/* Tableau */}
      {lines.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Barre de recherche + filtre */}
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un composant..."
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            {isInProgress && (
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={filterUncounted}
                  onChange={(e) => setFilterUncounted(e.target.checked)}
                  className="accent-indigo-500"
                />
                Non comptées seulement
              </label>
            )}
            <span className="text-xs text-gray-500 shrink-0">{filteredLines.length} ligne{filteredLines.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-800">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Composant</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Théorique</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Compté</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Écart</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Notes</th>
                  <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredLines.map((line) => (
                  <CountRow
                    key={line.id}
                    line={line}
                    isInProgress={isInProgress}
                    countValue={counts[line.component.id] ?? ''}
                    noteValue={notes[line.component.id] ?? ''}
                    onCountChange={(v) => setCounts((p) => ({ ...p, [line.component.id]: v }))}
                    onNoteChange={(v) => setNotes((p) => ({ ...p, [line.component.id]: v }))}
                    onSave={() => handleSave(line.component.id)}
                    saving={savingLine === line.component.id}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredLines.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              Aucune ligne ne correspond à votre recherche
            </div>
          )}
        </div>
      )}

      {/* Message aucune ligne (session started mais vide) */}
      {isInProgress && lines.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          <Package className="w-10 h-10 mx-auto mb-2 text-gray-700" />
          Aucun stock dans cet entrepôt à la date de démarrage.
        </div>
      )}

      {/* Résumé clôture */}
      {isClosed && linesWithEcart > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Résumé des ajustements appliqués
          </h3>
          <div className="space-y-2">
            {lines
              .filter((l) => l.ecart !== null && Number(l.ecart) !== 0)
              .map((l) => {
                const e = Number(l.ecart);
                return (
                  <div key={l.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-800 last:border-0">
                    <span className="text-white">{l.component?.nom}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">
                        {Number(l.quantityTheoretical).toFixed(2)} → {Number(l.quantityCounted).toFixed(2)} {l.component?.unite}
                      </span>
                      <span className={cn('font-semibold', e > 0 ? 'text-green-400' : 'text-red-400')}>
                        {e > 0 ? `+${e.toFixed(2)}` : e.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-sm">
            <span className="text-gray-400">Écart global</span>
            <span className={cn('font-semibold', totalEcart > 0 ? 'text-green-400' : totalEcart < 0 ? 'text-red-400' : 'text-gray-400')}>
              {totalEcart > 0 ? `+${totalEcart.toFixed(2)}` : totalEcart.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
