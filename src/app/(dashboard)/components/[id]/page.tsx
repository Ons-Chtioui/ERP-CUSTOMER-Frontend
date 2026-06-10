'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  ArrowLeft, 
  Package, 
  DollarSign, 
  Tag,
  Building2,
  AlertTriangle,
  Edit,
  TrendingUp,
  TrendingDown,
  Warehouse,
  Calendar,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarcodeDisplay } from '@/components/stock/BarcodeDisplay';
import { mediaUrl } from '@/lib/media';
import { useComponent, useComponentStock } from '@/hooks/useComponents';
import { Can } from '@/components/auth/Can';
import Link from 'next/link';

export default function ComponentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const componentId = parseInt(params.id as string);

  const { data: component, isLoading: isLoadingComponent } = useComponent(componentId);
  const { data: stockData, isLoading: isLoadingStock } = useComponentStock(componentId);

  if (isLoadingComponent || isLoadingStock) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!component) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Composant introuvable</p>
        <button onClick={() => router.back()} className="mt-4 text-indigo-400 text-sm hover:underline">
          Retour
        </button>
      </div>
    );
  }

  const prix = Number(component.prixAchat) || 0;
  const seuil = Number(component.seuilAlerte) || 0;
  const totalQuantity = stockData?.totalQuantity || 0;
  const isLowStock = totalQuantity <= seuil && seuil > 0;
  const byWarehouse = stockData?.byWarehouse || [];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-4">
            {/* Image du composant */}
            {component.imageUrl ? (
              <img
                src={mediaUrl(component.imageUrl)}
                alt={component.nom}
                className="w-16 h-16 rounded-xl object-cover border border-gray-700 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                <Package className="w-7 h-7 text-gray-600" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-white">{component.nom}</h1>
                <span className="font-mono text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                  {component.reference}
                </span>
                {!component.isActive && (
                  <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">
                    Désactivé
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {component.category?.nom || 'Sans catégorie'} • {component.supplier?.nom || 'Sans fournisseur'}
              </p>
            </div>
          </div>
        </div>
        <Can permission="stock.edit">
          <Link
            href={`/components/${component.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </Link>
        </Can>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Stock total</p>
              <p className={cn(
                "text-2xl font-bold",
                isLowStock ? "text-orange-400" : "text-white"
              )}>
                {totalQuantity}
              </p>
              <p className="text-xs text-gray-500 mt-1">{component.unite}</p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isLowStock ? "bg-orange-900/50" : "bg-blue-900/50"
            )}>
              {isLowStock ? (
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              ) : (
                <Package className="w-5 h-5 text-blue-400" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Prix d'achat</p>
              <p className="text-2xl font-bold text-white">{prix.toFixed(3)} DTN</p>
              <p className="text-xs text-gray-500 mt-1">Dinar Tunisien</p>
            </div>
            <div className="w-10 h-10 bg-green-900/50 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Prix de vente</p>
              <p className="text-2xl font-bold text-emerald-400">
                {Number(component.prixVente ?? 0).toFixed(3)} DTN
              </p>
              <p className="text-xs text-gray-500 mt-1">Dinar Tunisien</p>
            </div>
            <div className="w-10 h-10 bg-emerald-900/50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Seuil d'alerte</p>
              <p className="text-2xl font-bold text-white">{seuil}</p>
              <p className="text-xs text-gray-500 mt-1">{component.unite}</p>
            </div>
            <div className="w-10 h-10 bg-orange-900/50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Valeur totale</p>
              <p className="text-2xl font-bold text-white">{(totalQuantity * prix).toFixed(3)} DTN</p>
              <p className="text-xs text-gray-500 mt-1">Stock estimé</p>
            </div>
            <div className="w-10 h-10 bg-purple-900/50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Statut stock */}
      <div className={cn(
        "rounded-xl p-4",
        isLowStock 
          ? "bg-orange-950/30 border border-orange-800/50" 
          : "bg-green-950/30 border border-green-800/50"
      )}>
        <div className="flex items-center gap-3">
          {isLowStock ? (
            <>
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-orange-400 font-medium">Stock bas</p>
                <p className="text-orange-300/70 text-sm">
                  Le stock ({totalQuantity} {component.unite}) est inférieur au seuil d'alerte ({seuil} {component.unite})
                </p>
              </div>
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Stock OK</p>
                <p className="text-green-300/70 text-sm">
                  Le stock ({totalQuantity} {component.unite}) est supérieur au seuil d'alerte ({seuil} {component.unite})
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {component.description && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Description
          </h3>
          <p className="text-gray-400 text-sm">{component.description}</p>
        </div>
      )}

      {/* Stock par entrepôt */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Warehouse className="w-4 h-4" />
            Répartition par entrepôt
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Entrepôt</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Quantité</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Réservé</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Disponible</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {byWarehouse.map((item: any) => {
                const isLow = item.quantity <= seuil && seuil > 0;
                return (
                  <tr key={item.warehouse.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-medium">{item.warehouse.nom}</p>
                        <p className="text-gray-500 text-xs font-mono">{item.warehouse.code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("text-sm", isLow ? "text-orange-400 font-semibold" : "text-white")}>
                        {item.quantity}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">{component.unite}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {item.reservedQty}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400">
                      {item.available}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-900/50 text-orange-400">
                          <AlertTriangle className="w-3 h-3" />
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

        {byWarehouse.length === 0 && (
          <div className="text-center py-8">
            <Warehouse className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucun stock dans les entrepôts</p>
          </div>
        )}
      </div>

      {/* Informations supplémentaires */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Informations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-gray-500">Date de création</span>
            <span className="text-white">{new Date(component.createdAt).toLocaleString('fr-TN')}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-gray-500">Dernière modification</span>
            <span className="text-white">{new Date(component.updatedAt).toLocaleString('fr-TN')}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-gray-500">Catégorie</span>
            <span className="text-white">{component.category?.nom || '—'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-gray-500">Fournisseur</span>
            <span className="text-white">{component.supplier?.nom || '—'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-gray-500">Code-barres (auto)</span>
            <span className="text-white font-mono text-xs">{component.barcode || '—'}</span>
          </div>
        </div>
      </div>

      {/* Barcode visuel */}
      {component.barcode && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Code-barres EAN-13
          </h3>
          <BarcodeDisplay value={component.barcode} height={70} />
        </div>
      )}

      {/* Actions rapides */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Actions rapides</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/stock-movements?componentId=${component.id}&type=IN`}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors"
          >
            + Entrée de stock
          </Link>
          <Link
            href={`/stock-movements?componentId=${component.id}&type=OUT`}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
          >
            - Sortie de stock
          </Link>
          <Link
            href={`/stock-movements?componentId=${component.id}`}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            📜 Voir historique
          </Link>
        </div>
      </div>
    </div>
  );
}