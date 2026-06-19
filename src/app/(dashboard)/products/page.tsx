'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2, Plus, Package, Search, Edit, Eye, Trash2,
  AlertTriangle, TrendingUp, Tag, Filter, Settings,
  Zap, Warehouse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import { useProducts, useArchiveProduct, useProductAvailability } from '@/hooks/useProducts';
import { useProductCategories } from '@/hooks/useProductCategories';
import { useProductInventory } from '@/hooks/useProductInventory';
import { ProductCategoryBadge } from '@/components/products/ProductCategoryBadge';
import { mediaUrl } from '@/lib/media';
import api from '@/lib/api';
import type { Product } from '@/types/products';

// ─── Ligne produit avec stock et disponibilité ────────────────────────────────
function ProductRow({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (p: { id: number; nom: string }) => void;
}) {
  const { data: inventory = [] }   = useProductInventory(product.id);
  const { data: availability }     = useProductAvailability(product.id);

  const prixVenteEff = Number(product.prixVente) > 0
    ? Number(product.prixVente)
    : Number(product.prixVenteAuto);
  const cout  = Number(product.coutRevient);
  const marge = prixVenteEff - cout;
  const margePct = cout > 0 ? (marge / cout) * 100 : 0;

  // Stock produit fini (toutes entrepôts)
  const stockFini = inventory.reduce((s, i) => s + Number(i.quantity), 0);
  // Stock fabricable depuis les composants
  const stockFabricable = availability?.stockDisponible ?? 0;
  // Disponibilité totale = stock fini + fabricable
  const stockTotal = stockFini + stockFabricable;
  const goulot = availability?.goulot;

  const hasBom = (product.bomLines?.length ?? 0) > 0;
  const isLowStock = stockTotal <= product.seuilAlerte && product.seuilAlerte > 0;

  return (
    <tr className={cn(
      'border-b border-gray-800 last:border-0 transition-colors',
      isLowStock ? 'bg-orange-950/10 hover:bg-orange-950/20' : 'hover:bg-gray-800/40',
    )}>
      {/* Produit */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {product.imageUrl ? (
            <img src={mediaUrl(product.imageUrl)!} alt="" className="w-9 h-9 rounded-lg object-cover border border-gray-700 shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-gray-600" />
            </div>
          )}
          <div>
            <p className="text-white text-sm font-medium">{product.nom}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-gray-500 text-xs font-mono">{product.reference}</span>
              {product.parent && <span className="text-purple-400 text-xs">variante</span>}
              {isLowStock && <span className="text-orange-400 text-xs flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />alerte</span>}
            </div>
          </div>
        </div>
      </td>

      {/* Catégorie */}
      <td className="px-4 py-3">
        <ProductCategoryBadge category={product.category} />
      </td>

      {/* Coût */}
      <td className="px-4 py-3 text-right text-sm text-white font-mono">
        {cout.toFixed(3)} <span className="text-gray-500 text-xs">DTN</span>
      </td>

      {/* Prix vente */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm text-green-400 font-mono">{prixVenteEff.toFixed(3)}</span>
        <span className="text-gray-500 text-xs ml-1">DTN</span>
        {Number(product.prixVente) === 0 && <span className="block text-gray-600 text-xs">auto</span>}
      </td>

      {/* Marge */}
      <td className="px-4 py-3 text-right">
        <span className={cn('text-sm font-semibold', marge >= 0 ? 'text-emerald-400' : 'text-red-400')}>
          {marge >= 0 ? '+' : ''}{marge.toFixed(3)}
        </span>
        <span className="text-gray-500 text-xs ml-1">({margePct.toFixed(0)}%)</span>
      </td>

      {/* Stock fini (entrepôts) */}
      <td className="px-4 py-3 text-right">
        <span className={cn('text-sm font-mono', stockFini > 0 ? 'text-white' : 'text-gray-600')}>
          {stockFini}
        </span>
        <span className="text-gray-500 text-xs ml-1">{product.unite}</span>
      </td>

      {/* Fabricable (composants) */}
      <td className="px-4 py-3 text-right">
        <div>
          <span className={cn('text-sm font-mono', stockFabricable > 0 ? 'text-blue-400' : 'text-gray-600')}>
            {stockFabricable}
          </span>
          {goulot && stockFabricable > 0 && (
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-yellow-500 text-xs truncate max-w-20">{goulot.nom}</span>
            </div>
          )}
          {!hasBom && <span className="block text-gray-600 text-xs">pas de BOM</span>}
        </div>
      </td>

      {/* Dispo. totale */}
      <td className="px-4 py-3 text-right">
        <span className={cn(
          'text-sm font-bold font-mono',
          stockTotal > 0 ? (stockTotal > product.seuilAlerte ? 'text-emerald-400' : 'text-orange-400') : 'text-red-400',
        )}>
          {stockTotal}
        </span>
        {product.seuilAlerte > 0 && (
          <span className="block text-gray-600 text-xs">seuil: {product.seuilAlerte}</span>
        )}
      </td>

      {/* BOM */}
      <td className="px-4 py-3 text-center">
        {hasBom ? (
          <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full">
            {product.bomLines?.length} comp.
          </span>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <Link href={`/products/${product.id}`}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" title="Voir">
            <Eye className="w-4 h-4" />
          </Link>
          <Can permission="bom.edit">
            <Link href={`/products/${product.id}/bom`}
              className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors" title="BOM">
              <Tag className="w-4 h-4" />
            </Link>
            <Link href={`/products/${product.id}/edit`}
              className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/30 rounded-lg transition-colors" title="Modifier">
              <Edit className="w-4 h-4" />
            </Link>
          </Can>
          <Can permission="bom.delete">
            <button onClick={() => onDelete({ id: product.id, nom: product.nom })}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors" title="Archiver">
              <Trash2 className="w-4 h-4" />
            </button>
          </Can>
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [search, setSearch]       = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nom: string } | null>(null);

  const { data: products = [], isLoading } = useProducts({
    search: search || undefined,
    categoryId: categoryId ? +categoryId : undefined,
  });
  const { data: categories = [] } = useProductCategories();
  const archive = useArchiveProduct();

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
    </div>
  );

  const totalPrixVente = products.reduce((s, p) => {
    const pv = Number(p.prixVente) > 0 ? Number(p.prixVente) : Number(p.prixVenteAuto);
    return s + pv;
  }, 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Produits finis</h1>
          <p className="text-gray-400 text-sm mt-0.5">{products.length} référence(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Can permission="bom.view">
            <Link href="/product-categories"
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
              <Settings className="w-4 h-4" /> Catégories
            </Link>
          </Can>
          <Can permission="bom.create">
            <Link href="/products/new"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Nouveau produit
            </Link>
          </Can>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Références',     value: products.length,                               icon: Package,    color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
          { label: 'Avec BOM',       value: products.filter(p => (p.bomLines?.length ?? 0) > 0).length, icon: Tag, color: 'text-blue-400', bg: 'bg-blue-900/30' },
          { label: 'Variantes',      value: products.filter(p => p.parent).length,          icon: Filter,     color: 'text-purple-400', bg: 'bg-purple-900/30' },
          { label: 'CA potentiel',   value: `${totalPrixVente.toFixed(0)} DTN`,             icon: TrendingUp, color: 'text-green-400',  bg: 'bg-green-900/30' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-xs">{label}</p>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
            </div>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou référence..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
            <option value="">Toutes les catégories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
      </div>

      {/* Légende colonnes stock */}
      <div className="flex items-center gap-6 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/70 inline-block" /> Stock fini = produits déjà fabriqués en entrepôt</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Fabricable = unités producibles depuis les composants</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Dispo. totale = Stock fini + Fabricable</span>
        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> Goulot = composant limitant</span>
      </div>

      {/* Tableau */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Produit</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Catégorie</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Coût rev.</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Prix vente</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Marge</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">
                  <span className="flex items-center justify-end gap-1">
                    <Warehouse className="w-3 h-3" /> Stock fini
                  </span>
                </th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">
                  <span className="flex items-center justify-end gap-1">
                    <Zap className="w-3 h-3 text-blue-400" /> Fabricable
                  </span>
                </th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Dispo. totale</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">BOM</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <ProductRow key={p.id} product={p} onDelete={setDeleteTarget} />
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-14">
            <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Aucun produit fini</p>
            <Can permission="bom.create">
              <Link href="/products/new" className="mt-3 text-indigo-400 text-sm hover:underline inline-block">
                Créer le premier produit
              </Link>
            </Can>
          </div>
        )}
      </div>

      {/* Modal archivage */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-900/40 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-white font-semibold">Archiver le produit</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Archiver <strong className="text-white">{deleteTarget.nom}</strong> ?
              Les données sont conservées.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
                Annuler
              </button>
              <button
                onClick={() => archive.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
                disabled={archive.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors">
                {archive.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
