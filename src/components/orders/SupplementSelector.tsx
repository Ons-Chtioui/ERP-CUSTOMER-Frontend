'use client';

/**
 * SupplementSelector
 * Permet d'ajouter des composants du stock comme suppléments sur une ligne de commande.
 * Un supplément = un composant (même entité que les composants BOM) avec une qté et un prix.
 *
 * Props :
 *   - supplements   : liste des suppléments déjà ajoutés (état géré par le parent)
 *   - onChange      : callback appelé à chaque modification
 *   - disabled      : désactiver les interactions (lecture seule)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Search } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Type d'un supplément dans le formulaire ──────────────────────────────────
export interface DraftSupplement {
  componentId: number;
  nom: string;
  reference: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
}

interface SupplementSelectorProps {
  supplements: DraftSupplement[];
  onChange: (supplements: DraftSupplement[]) => void;
  disabled?: boolean;
}

export function SupplementSelector({
  supplements,
  onChange,
  disabled = false,
}: SupplementSelectorProps) {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // ── Charger les composants disponibles depuis l'API ────────────────────────
  // On réutilise le même endpoint que les autres modules (/components)
  const { data: components = [], isLoading } = useQuery({
    queryKey: ['components', search],
    queryFn: () =>
      api
        .get('/components', { params: search ? { search } : {} })
        .then((r) => r.data?.data ?? r.data ?? []),
    enabled: showSearch,
  });

  // ── Ajouter un composant comme supplément ──────────────────────────────────
  const handleAdd = (comp: { id: number; nom: string; reference: string; prixAchat?: number }) => {
    // Éviter les doublons
    if (supplements.find((s) => s.componentId === comp.id)) return;

    onChange([
      ...supplements,
      {
        componentId: comp.id,
        nom:         comp.nom,
        reference:   comp.reference,
        quantity:    1,
        unitPrice:   Number(comp.prixAchat ?? 0), // prix par défaut = prix d'achat
        tvaRate:     19,
      },
    ]);
    setSearch('');
    setShowSearch(false);
  };

  // ── Modifier un champ d'un supplément existant ─────────────────────────────
  const handleUpdate = (
    componentId: number,
    field: 'quantity' | 'unitPrice' | 'tvaRate',
    value: number,
  ) => {
    onChange(
      supplements.map((s) =>
        s.componentId === componentId ? { ...s, [field]: value } : s,
      ),
    );
  };

  // ── Supprimer un supplément ────────────────────────────────────────────────
  const handleRemove = (componentId: number) => {
    onChange(supplements.filter((s) => s.componentId !== componentId));
  };

  // Composants visibles dans la recherche (exclure ceux déjà ajoutés)
  const visibleComponents = components.filter(
    (c: { id: number }) => !supplements.find((s) => s.componentId === c.id),
  );

  // Total HT des suppléments (pour affichage)
  const totalSuppHt = supplements.reduce(
    (sum, s) => sum + s.quantity * s.unitPrice,
    0,
  );

  return (
    <div className="mt-3 pt-3 border-t border-gray-800">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-300">
          Suppléments
          <span className="text-xs text-gray-500 ml-2">(composants additionnels)</span>
        </label>
        {!disabled && (
          <button
            type="button"
            onClick={() => setShowSearch((v) => !v)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        )}
      </div>

      {/* Zone de recherche de composants */}
      {showSearch && !disabled && (
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un composant..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Liste des résultats */}
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-gray-500 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Chargement des composants...
            </div>
          ) : visibleComponents.length > 0 ? (
            <div className="mt-1 space-y-1 max-h-56 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
              {/* Tous les composants disponibles (filtrés si recherche tapée) */}
              {visibleComponents.map((c: {
                id: number; nom: string; reference: string; prixAchat?: number;
              }) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleAdd(c)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-700 transition-colors text-left"
                >
                  <div>
                    <p className="text-white text-sm">{c.nom}</p>
                    <p className="text-gray-500 text-xs font-mono">{c.reference}</p>
                  </div>
                  {c.prixAchat != null && (
                    <span className="text-green-400 text-xs font-mono shrink-0 ml-3">
                      {Number(c.prixAchat).toFixed(3)} DTN
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            // Aucun composant : soit aucun résultat de recherche, soit aucun composant en base,
            // soit tous les composants sont déjà ajoutés comme suppléments
            <p className="text-gray-500 text-xs px-3 py-2">
              {search
                ? 'Aucun composant trouvé pour cette recherche'
                : components.length === 0
                ? 'Aucun composant disponible dans le stock'
                : 'Tous les composants ont déjà été ajoutés'}
            </p>
          )}
        </div>
      )}

      {/* Liste des suppléments sélectionnés */}
      {supplements.length > 0 && (
        <div className="space-y-2">
          {supplements.map((s) => (
            <div
              key={s.componentId}
              className="bg-gray-800/60 border border-gray-700 rounded-lg p-2"
            >
              {/* Nom + référence */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-gray-200 text-sm">{s.nom}</p>
                  <p className="text-gray-500 text-xs font-mono">{s.reference}</p>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(s.componentId)}
                    className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Champs modifiables : quantité, prix unitaire, TVA */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Quantité</label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={s.quantity}
                    onChange={(e) =>
                      handleUpdate(s.componentId, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    disabled={disabled}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  {/* Prix unitaire HT — peut être modifié manuellement */}
                  <label className="block text-xs text-gray-500 mb-1">P.U. HT</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={s.unitPrice}
                    onChange={(e) =>
                      handleUpdate(s.componentId, 'unitPrice', parseFloat(e.target.value) || 0)
                    }
                    disabled={disabled}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  {/* Total HT calculé automatiquement = qty × unitPrice */}
                  <label className="block text-xs text-gray-500 mb-1">Total HT</label>
                  <div className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-green-400 text-xs text-center font-mono">
                    {(s.quantity * s.unitPrice).toFixed(3)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Sous-total suppléments */}
          <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-800">
            <span>{supplements.length} supplément(s)</span>
            <span className="font-mono text-gray-400">
              Sous-total HT : {totalSuppHt.toFixed(3)} DTN
            </span>
          </div>
        </div>
      )}

      {supplements.length === 0 && !showSearch && (
        <p className="text-gray-600 text-xs">Aucun supplément ajouté</p>
      )}
    </div>
  );
}
