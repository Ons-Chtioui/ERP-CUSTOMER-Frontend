'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  ArrowLeft, 
  Package, 
  Euro, 
  MapPin, 
  Building2,
  Box,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { InventoryItem, Warehouse } from '@/types/stock';

export default function WarehouseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = parseInt(params.id as string);

  // Charger les infos de l'entrepôt
  const { data: warehouse, isLoading: isLoadingWarehouse } = useQuery<Warehouse>({
    queryKey: ['warehouses', warehouseId],
    queryFn: () => api.get(`/warehouses/${warehouseId}`).then(r => r.data),
    enabled: !!warehouseId,
  });

  // Charger le stock de l'entrepôt
  const { data: stock, isLoading: isLoadingStock } = useQuery<InventoryItem[]>({
    queryKey: ['warehouses', warehouseId, 'stock'],
    queryFn: () => api.get(`/warehouses/${warehouseId}/stock`).then(r => r.data),
    enabled: !!warehouseId,
  });

  if (isLoadingWarehouse || isLoadingStock) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Entrepôt introuvable</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-indigo-400 text-sm hover:underline"
        >
          Retour
        </button>
      </div>
    );
  }

  // Calcul des statistiques avec conversion des types
  const totalItems = stock?.length || 0;
  const totalQuantity = stock?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;
  const totalValue = stock?.reduce((sum, item) => {
    const quantity = Number(item.quantity);
    const prixAchat = Number(item.component?.prixAchat) || 0;
    return sum + (quantity * prixAchat);
  }, 0) || 0;
  const lowStockItems = stock?.filter(item => {
    const quantity = Number(item.quantity);
    const seuil = Number(item.component?.seuilAlerte) || 0;
    return quantity <= seuil;
  }).length || 0;

  return (
    <div className="space-y-6">
      {/* En-tête avec retour */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">{warehouse.nom}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-mono text-gray-400">{warehouse.code}</span>
            {warehouse.ville && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {warehouse.ville}, {warehouse.pays}
              </span>
            )}
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              warehouse.isActive
                ? "bg-green-900/50 text-green-400"
                : "bg-gray-800 text-gray-500"
            )}>
              {warehouse.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Références</p>
              <p className="text-2xl font-bold text-white">{totalItems}</p>
              <p className="text-xs text-gray-500 mt-1">produits distincts</p>
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
              <p className="text-xs text-gray-500 mt-1">unités en stock</p>
            </div>
            <div className="w-10 h-10 bg-blue-900/50 rounded-full flex items-center justify-center">
              <Box className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Valeur totale</p>
              <p className="text-2xl font-bold text-white">{totalValue.toFixed(2)} DTN</p>
              <p className="text-xs text-gray-500 mt-1">stock estimé</p>
            </div>
            <div className="w-10 h-10 bg-green-900/50 rounded-full flex items-center justify-center">
              <Euro className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Stock bas</p>
              <p className="text-2xl font-bold text-white">{lowStockItems}</p>
              <p className="text-xs text-orange-400 mt-1">sous le seuil d'alerte</p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              lowStockItems > 0 ? "bg-orange-900/50" : "bg-gray-800"
            )}>
              <TrendingDown className={cn(
                "w-5 h-5",
                lowStockItems > 0 ? "text-orange-400" : "text-gray-500"
              )} />
            </div>
          </div>
        </div>
      </div>

      {/* Adresse si disponible */}
      {warehouse.adresse && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Adresse
          </h3>
          <p className="text-white text-sm">{warehouse.adresse}</p>
        </div>
      )}

      {/* Tableau du stock */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="text-white font-semibold">Stock actuel</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {totalItems} référence(s) en stock
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Référence</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Nom</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Unité</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Quantité</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Valeur unitaire</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Valeur totale</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stock?.map((item) => {
                // Conversion des types
                const quantity = Number(item.quantity);
                const prixAchat = Number(item.component?.prixAchat) || 0;
                const seuilAlerte = Number(item.component?.seuilAlerte) || 0;
                const isLowStock = quantity <= seuilAlerte;
                const totalItemValue = quantity * prixAchat;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-400">
                        {item.component?.reference || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white text-sm font-medium">
                        {item.component?.nom || '—'}
                      </span>
                      {item.component?.description && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                          {item.component.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {item.component?.unite || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-sm font-semibold",
                        isLowStock ? "text-orange-400" : "text-white"
                      )}>
                        {quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-400">
                      {prixAchat.toFixed(3)} DTN
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white font-medium">
                      {totalItemValue.toFixed(3)} DTN
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-900/50 text-orange-400">
                          <TrendingDown className="w-3 h-3" />
                          Stock bas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">
                          <TrendingUp className="w-3 h-3" />
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {stock?.length === 0 && (
          <div className="text-center py-12">
            <Box className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucun stock dans cet entrepôt</p>
            <p className="text-gray-600 text-sm mt-1">
              Commencez par créer des mouvements d'entrée
            </p>
          </div>
        )}
      </div>

      {/* Résumé des mouvements récents (optionnel) */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Actions rapides</h3>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/stock-movements?warehouseId=${warehouseId}`)}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            Voir l'historique
          </button>
          <button
            onClick={() => router.push(`/stock-movements?warehouseId=${warehouseId}&type=IN`)}
            className="flex-1 px-4 py-2 border border-gray-700 hover:bg-gray-800 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Entrée de stock
          </button>
          <button
            onClick={() => router.push(`/stock-movements?warehouseId=${warehouseId}&type=OUT`)}
            className="flex-1 px-4 py-2 border border-gray-700 hover:bg-gray-800 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Sortie de stock
          </button>
        </div>
      </div>
    </div>
  );
}