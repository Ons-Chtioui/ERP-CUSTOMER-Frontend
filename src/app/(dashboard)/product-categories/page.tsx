'use client';

import { useState } from 'react';
import { Loader2, Plus, Edit, Trash2, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import {
  useProductCategories,
  useCreateProductCategory,
  useUpdateProductCategory,
  useDeleteProductCategory,
} from '@/hooks/useProductCategories';
import type { ProductCategory } from '@/types/products';

// ─── Formulaire catégorie ──────────────────────────────────────────────────────
function CategoryForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<ProductCategory>;
  onSubmit: (data: { nom: string; couleur: string; description?: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [couleur, setCouleur] = useState(initial?.couleur ?? '#6366F1');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) { setError('Le nom est requis'); return; }
    if (!/^#[0-9A-Fa-f]{6}$/.test(couleur)) { setError('Couleur HEX invalide'); return; }
    setError('');
    onSubmit({ nom: nom.trim(), couleur, description: description.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nom <span className="text-red-400">*</span>
          </label>
          <input
            value={nom}
            onChange={e => setNom(e.target.value)}
            placeholder="Mobilier bureau"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Couleur</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={couleur}
              onChange={e => setCouleur(e.target.value)}
              className="h-9 w-12 rounded cursor-pointer bg-transparent border border-gray-700"
            />
            <input
              value={couleur}
              onChange={e => setCouleur(e.target.value)}
              placeholder="#6366F1"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description optionnelle"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
          Annuler
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial?.id ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
    </form>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function ProductCategoriesPage() {
  const { data: categories = [], isLoading } = useProductCategories();
  const create = useCreateProductCategory();
  const update = useUpdateProductCategory();
  const remove = useDeleteProductCategory();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  const [apiError, setApiError] = useState('');

  const handleCreate = async (data: { nom: string; couleur: string; description?: string }) => {
    setApiError('');
    try {
      await create.mutateAsync(data);
      setShowCreate(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg || 'Erreur lors de la création');
    }
  };

  const handleUpdate = async (data: { nom: string; couleur: string; description?: string }) => {
    if (!editTarget) return;
    setApiError('');
    try {
      await update.mutateAsync({ id: editTarget.id, ...data });
      setEditTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg || 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg || 'Erreur lors de la suppression');
    }
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Catégories de produits</h1>
          <p className="text-gray-400 text-sm mt-0.5">{categories.length} catégorie(s)</p>
        </div>
        <Can permission="bom.create">
          <button
            onClick={() => { setShowCreate(true); setApiError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle catégorie
          </button>
        </Can>
      </div>

      {/* Erreur globale */}
      {apiError && (
        <div className="flex items-center justify-between bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
          <span>{apiError}</span>
          <button onClick={() => setApiError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Formulaire de création */}
      {showCreate && (
        <div className="bg-gray-900 border border-indigo-700/50 rounded-2xl p-6">
          <h3 className="text-white font-medium mb-4">Nouvelle catégorie</h3>
          <CategoryForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={create.isPending}
          />
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3">
        {categories.map(cat => (
          <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {editTarget?.id === cat.id ? (
              /* Formulaire d'édition inline */
              <div className="p-5">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-indigo-400" /> Modifier
                </h3>
                <CategoryForm
                  initial={cat}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditTarget(null)}
                  loading={update.isPending}
                />
              </div>
            ) : (
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Couleur + nom */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.couleur}33`, border: `2px solid ${cat.couleur}66` }}
                >
                  <Tag className="w-5 h-5" style={{ color: cat.couleur }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">{cat.nom}</h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-mono"
                      style={{ backgroundColor: `${cat.couleur}22`, color: cat.couleur }}
                    >
                      {cat.couleur}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-gray-500 text-sm mt-0.5 truncate">{cat.description}</p>
                  )}
                </div>
                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <Can permission="bom.edit">
                    <button
                      onClick={() => setEditTarget(cat)}
                      className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/30 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </Can>
                  <Can permission="bom.delete">
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Can>
                </div>
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && !showCreate && (
          <div className="text-center py-14">
            <Tag className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Aucune catégorie</p>
            <Can permission="bom.create">
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
              >
                Créer la première catégorie
              </button>
            </Can>
          </div>
        )}
      </div>

      {/* Modal confirmation suppression */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-white font-semibold mb-2">Supprimer la catégorie</h3>
            <p className="text-gray-400 text-sm mb-6">
              Supprimer <strong className="text-white">{deleteTarget.nom}</strong> ?
              Les produits associés n'auront plus de catégorie.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={remove.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
              >
                {remove.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
