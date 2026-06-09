'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  Plus, 
  Package, 
  Search, 
  Edit, 
  Eye, 
  Trash2,
  AlertTriangle,
  Filter,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Can } from '@/components/auth/Can';
import api from '@/lib/api';
import { Component, Category, Supplier } from '@/types/stock';

// Interface étendue pour inclure le stock
interface ComponentWithStock extends Component {
  totalQuantity?: number;
  isLowStock?: boolean;
}

export default function ComponentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [deleteComponent, setDeleteComponent] = useState<Component | null>(null);
  const [componentsWithStock, setComponentsWithStock] = useState<ComponentWithStock[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Récupérer les composants
  const { data: components, isLoading: isLoadingComponents } = useQuery<Component[]>({
    queryKey: ['components', { search: searchTerm, categoryId: selectedCategory, supplierId: selectedSupplier }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (selectedSupplier) params.set('supplierId', selectedSupplier);
      const url = `/components${params.toString() ? `?${params}` : ''}`;
      return api.get(url).then(r => r.data);
    },
  });

  // Récupérer les catégories et fournisseurs
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/components/categories').then(r => r.data),
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/components/suppliers').then(r => r.data),
  });

  // Charger le stock pour chaque composant
  useEffect(() => {
    const loadStockForComponents = async () => {
      if (!components || components.length === 0) {
        setComponentsWithStock([]);
        return;
      }

      setIsLoadingStock(true);
      try {
        const componentsWithStockData = await Promise.all(
          components.map(async (comp) => {
            try {
              const stockData = await api.get(`/components/${comp.id}/stock`).then(r => r.data);
              const totalQuantity = stockData.totalQuantity || 0;
              const seuil = Number(comp.seuilAlerte) || 0;
              return {
                ...comp,
                totalQuantity,
                isLowStock: totalQuantity <= seuil && seuil > 0,
              };
            } catch (error) {
              console.error(`Erreur stock pour ${comp.id}:`, error);
              return {
                ...comp,
                totalQuantity: 0,
                isLowStock: false,
              };
            }
          })
        );
        setComponentsWithStock(componentsWithStockData);
      } catch (error) {
        console.error('Erreur chargement stocks:', error);
      } finally {
        setIsLoadingStock(false);
      }
    };

    loadStockForComponents();
  }, [components]);

  // Mutation suppression
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/components/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      setDeleteComponent(null);
    },
  });

  if (isLoadingComponents) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  // Calcul des stats avec les vrais stocks
  const totalValue = componentsWithStock.reduce((sum, c) => {
    const prix = Number(c.prixAchat) || 0;
    const qty = c.totalQuantity || 0;
    return sum + (prix * qty);
  }, 0);
  
  const lowStockCount = componentsWithStock.filter(c => c.isLowStock).length;
  const totalQuantity = componentsWithStock.reduce((sum, c) => sum + (c.totalQuantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Composants</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {components?.length ?? 0} référence(s)
          </p>
        </div>
        <Can permission="stock.create">
          <Link
            href="/components/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau composant
          </Link>
        </Can>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Références</p>
              <p className="text-2xl font-bold text-white">{components?.length || 0}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-900/50 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Quantité totale</p>
              <p className="text-2xl font-bold text-white">{totalQuantity}</p>
            </div>
            <div className="w-10 h-10 bg-blue-900/50 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Valeur totale</p>
              <p className="text-2xl font-bold text-white">{totalValue.toFixed(3)} DTN</p>
            </div>
            <div className="w-10 h-10 bg-green-900/50 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Stock bas</p>
              <p className="text-2xl font-bold text-white">{lowStockCount}</p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              lowStockCount > 0 ? "bg-orange-900/50" : "bg-gray-800"
            )}>
              <AlertTriangle className={cn(
                "w-5 h-5",
                lowStockCount > 0 ? "text-orange-400" : "text-gray-500"
              )} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">Toutes les catégories</option>
            {categories?.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>

          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tous les fournisseurs</option>
            {suppliers?.map(sup => (
              <option key={sup.id} value={sup.id}>{sup.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau des composants */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Référence</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Nom</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Catégorie</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Prix unitaire</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Stock</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Statut</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {componentsWithStock.map((comp) => {
                const prix = Number(comp.prixAchat) || 0;
                const quantity = comp.totalQuantity || 0;
                const unite = comp.unite || 'unité';
                const isLowStock = comp.isLowStock || false;

                return (
                  <tr key={comp.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-400">
                        {comp.reference}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white text-sm font-medium">{comp.nom}</span>
                      {comp.description && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                          {comp.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {comp.category?.nom || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-white font-mono">
                        {prix.toFixed(3)} <span className="text-xs text-gray-400">DTN</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-sm font-semibold",
                        isLowStock ? "text-orange-400" : "text-white"
                      )}>
                        {quantity}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">{unite}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-900/50 text-orange-400">
                          <AlertTriangle className="w-3 h-3" />
                          Stock bas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">
                          ✓ OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/components/${comp.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Can permission="stock.edit">
                          <Link
                            href={`/components/${comp.id}/edit`}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Can>
                        <Can permission="stock.delete">
                          <button
                            onClick={() => setDeleteComponent(comp)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(!componentsWithStock || componentsWithStock.length === 0) && !isLoadingComponents && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucun composant</p>
            <Can permission="stock.create">
              <Link
                href="/components/new"
                className="inline-block mt-3 text-indigo-400 text-sm hover:underline"
              >
                Créer le premier composant
              </Link>
            </Can>
          </div>
        )}

        {isLoadingStock && (
          <div className="text-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mx-auto" />
            <p className="text-gray-500 text-sm mt-2">Chargement des stocks...</p>
          </div>
        )}
      </div>

      {/* Modal confirmation suppression */}
      {deleteComponent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setDeleteComponent(null)}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-white font-semibold">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Supprimer <strong className="text-white">{deleteComponent.nom}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteComponent(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteComponent.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}