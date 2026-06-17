'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, Plus, Trash2, Search, Save,
  Package, AlertTriangle, CheckCircle, Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/hooks/useProducts';
import { useBom, useSetBom, useDeleteBomLine } from '@/hooks/useBom';
import { useComponents } from '@/hooks/useComponents';
import { Can } from '@/components/auth/Can';

interface DraftLine {
  componentId: number;
  nom: string;
  reference: string;
  prixAchat: number;
  prixVente: number;
  unite: string;
  quantity: number;
}

export default function BomEditorPage() {
  const router = useRouter();
  const { id } = useParams();
  const productId = parseInt(id as string);

  const { data: product, isLoading: loadingProduct } = useProduct(productId);
  const { data: existingBom = [], isLoading: loadingBom } = useBom(productId);
  const { data: allComponents = [], isLoading: loadingComponents } = useComponents();

  const setBom = useSetBom(productId);
  const deleteLine = useDeleteBomLine(productId);

  const [draft, setDraft] = useState<DraftLine[] | null>(null);
  const [search, setSearch] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialiser le brouillon à partir de la BOM existante
  const lines: DraftLine[] = useMemo(() => {
    if (draft !== null) return draft;
    return existingBom.map(l => ({
      componentId: l.component.id,
      nom: l.component.nom,
      reference: l.component.reference,
      prixAchat: Number(l.component.prixAchat),
      prixVente: Number(l.component.prixVente),
      unite: l.component.unite,
      quantity: Number(l.quantity),
    }));
  }, [draft, existingBom]);

  const setLines = (fn: (prev: DraftLine[]) => DraftLine[]) => {
    setDraft(prev => fn(prev ?? lines));
    setSaveSuccess(false);
  };

  // Composants filtrés (hors ceux déjà dans le brouillon)
  const inBomIds = new Set(lines.map(l => l.componentId));
  const filteredComponents = allComponents.filter(c =>
    !inBomIds.has(c.id) && c.isActive &&
    (search === '' ||
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.reference.toLowerCase().includes(search.toLowerCase()))
  );

  const addComponent = (comp: typeof allComponents[0]) => {
    setLines(prev => [
      ...prev,
      {
        componentId: comp.id,
        nom: comp.nom,
        reference: comp.reference,
        prixAchat: Number(comp.prixAchat),
        prixVente: Number(comp.prixVente),
        unite: comp.unite,
        quantity: 1,
      },
    ]);
    setSearch('');
  };

  const updateQty = (componentId: number, qty: number) => {
    setLines(prev =>
      prev.map(l => l.componentId === componentId ? { ...l, quantity: qty } : l)
    );
  };

  const removeLine = (componentId: number) => {
    setLines(prev => prev.filter(l => l.componentId !== componentId));
  };

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(false);
    const invalid = lines.some(l => !Number.isInteger(l.quantity) || l.quantity <= 0);
    if (invalid) { setSaveError('Toutes les quantités doivent être supérieures à 0'); return; }

    try {
      await setBom.mutateAsync(lines.map(l => ({ componentId: l.componentId, quantity: l.quantity })));
      setSaveSuccess(true);
      setDraft(null); // reset dirty state
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveError(msg || 'Erreur lors de la sauvegarde');
    }
  };

  // Calculs en temps réel
  const coutComponents  = lines.reduce((s, l) => s + l.quantity * l.prixAchat, 0);
  const venteComponents = lines.reduce((s, l) => s + l.quantity * l.prixVente, 0);
  const coutMO = Number(product?.coutMO ?? 0);
  const coutRevient   = coutComponents + coutMO;
  const prixVenteAuto = venteComponents + coutMO;
  const prixVenteEff  = Number(product?.prixVente ?? 0) > 0
    ? Number(product?.prixVente)
    : prixVenteAuto;
  const marge = prixVenteEff - coutRevient;

  const isDirty = draft !== null;

  if (loadingProduct || loadingBom) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
    </div>
  );

  if (!product) return (
    <div className="text-center py-16 text-gray-400">Produit introuvable</div>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Nomenclature (BOM)
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Link href={`/products/${productId}`} className="text-gray-400 text-sm hover:text-indigo-400 transition-colors">
                {product.nom}
              </Link>
              <span className="text-gray-600 text-xs font-mono">{product.reference}</span>
              {isDirty && (
                <span className="text-xs bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded-full border border-orange-700/40">
                  Modifications non sauvegardées
                </span>
              )}
            </div>
          </div>
        </div>
        <Can permission="bom.edit">
          <button
            onClick={handleSave}
            disabled={setBom.isPending || !isDirty}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            {setBom.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {setBom.isPending ? 'Sauvegarde…' : 'Sauvegarder la BOM'}
          </button>
        </Can>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Colonne gauche : lignes BOM */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tableau BOM */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                <h2 className="text-white font-medium">Composants de la nomenclature</h2>
                <span className="text-gray-600 text-xs">({lines.length})</span>
              </div>
            </div>

            {lines.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucun composant — ajoutez-en depuis le panneau de droite</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50 border-b border-gray-800">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Composant</th>
                      <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Prix achat</th>
                      <th className="text-center text-xs font-medium text-gray-400 px-4 py-3 w-32">Quantité</th>
                      <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Coût ligne</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {lines.map((line) => {
                      const coutLigne = line.quantity * line.prixAchat;
                      return (
                        <tr key={line.componentId} className="hover:bg-gray-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-white text-sm font-medium">{line.nom}</p>
                            <p className="text-gray-500 text-xs font-mono">{line.reference}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-400 font-mono whitespace-nowrap">
                            {line.prixAchat.toFixed(3)} <span className="text-gray-600 text-xs">DTN/{line.unite}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={line.quantity}
                              onChange={e => updateQty(line.componentId, parseInt(e.target.value, 10) || 0)}
                              className={cn(
                                'w-24 text-center bg-gray-800 border rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors',
                                line.quantity <= 0 ? 'border-red-600' : 'border-gray-700',
                              )}
                            />
                            <span className="text-gray-600 text-xs ml-1">{line.unite}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-mono">
                            <span className="text-white">{coutLigne.toFixed(3)}</span>
                            <span className="text-gray-600 text-xs ml-1">DTN</span>
                          </td>
                          <td className="px-4 py-3">
                            <Can permission="bom.edit">
                              <button
                                onClick={() => removeLine(line.componentId)}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                                title="Retirer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Can>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {lines.length > 0 && (
                    <tfoot className="bg-gray-800/30 border-t border-gray-700">
                      <tr>
                        <td colSpan={3} className="px-4 py-2.5 text-xs text-gray-400 font-medium text-right">
                          Total composants
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-white font-mono text-sm">
                          {coutComponents.toFixed(3)} <span className="text-gray-500 text-xs">DTN</span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

          {/* Messages */}
          {saveError && (
            <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 bg-green-950/40 border border-green-800/50 rounded-lg px-4 py-3 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              BOM sauvegardée — coûts recalculés automatiquement.
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          {/* Récapitulatif coûts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <h3 className="text-white font-medium text-sm">Calcul automatique</h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Coût composants</span>
                <span className="font-mono text-white">{coutComponents.toFixed(3)} DTN</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Coût MO</span>
                <span className="font-mono text-white">{coutMO.toFixed(3)} DTN</span>
              </div>
              <div className="border-t border-gray-700 pt-2 flex justify-between font-semibold">
                <span className="text-gray-300">Coût de revient</span>
                <span className="font-mono text-white">{coutRevient.toFixed(3)} DTN</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Prix vente auto</span>
                <span className="font-mono text-green-400">{prixVenteAuto.toFixed(3)} DTN</span>
              </div>
              {Number(product.prixVente) > 0 && (
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Prix vente manuel</span>
                  <span className="font-mono text-blue-400">{Number(product.prixVente).toFixed(3)} DTN</span>
                </div>
              )}
              <div className={cn(
                'flex justify-between font-semibold border-t border-gray-700 pt-2',
                marge >= 0 ? 'text-emerald-400' : 'text-red-400',
              )}>
                <span>Marge brute</span>
                <span className="font-mono">
                  {marge >= 0 ? '+' : ''}{marge.toFixed(3)} DTN
                  <span className="text-xs ml-1 font-normal">
                    ({coutRevient > 0 ? ((marge / coutRevient) * 100).toFixed(0) : 0}%)
                  </span>
                </span>
              </div>
            </div>

            <p className="text-gray-600 text-xs pt-1">
              Sauvegardez pour appliquer ces valeurs au produit.
            </p>
          </div>

          {/* Ajout composant */}
          <Can permission="bom.edit">
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-white font-medium text-sm">Ajouter un composant</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un composant…"
                    className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {loadingComponents ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  </div>
                ) : filteredComponents.length === 0 ? (
                  <p className="text-gray-600 text-xs text-center py-3">
                    {search ? 'Aucun résultat' : 'Tous les composants sont déjà dans la BOM'}
                  </p>
                ) : (
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {filteredComponents.map(comp => (
                      <button
                        key={comp.id}
                        onClick={() => addComponent(comp)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-left group"
                      >
                        <div>
                          <p className="text-white text-sm group-hover:text-indigo-300 transition-colors">
                            {comp.nom}
                          </p>
                          <p className="text-gray-500 text-xs font-mono">{comp.reference}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-gray-400 text-xs font-mono">
                            {Number(comp.prixAchat).toFixed(3)} DTN
                          </p>
                          <p className="text-gray-600 text-xs">{comp.unite}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Can>
        </div>
      </div>
    </div>
  );
}
