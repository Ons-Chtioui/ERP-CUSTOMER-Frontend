'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft,
  Search,
  Filter,
  Calendar,
  Package,
  Building2,
  FileText,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useComponents } from '@/hooks/useComponents';
import { MovementForm } from '@/components/stock/MovementForm';
import { Can } from '@/components/auth/Can';
import { MovementType } from '@/types/stock';

const typeConfig = {
  IN: { label: 'Entrée', color: 'text-green-400', bg: 'bg-green-900/50', icon: TrendingUp },
  OUT: { label: 'Sortie', color: 'text-red-400', bg: 'bg-red-900/50', icon: TrendingDown },
  TRANSFER: { label: 'Transfert', color: 'text-blue-400', bg: 'bg-blue-900/50', icon: ArrowRightLeft },
  ADJUSTMENT: { label: 'Ajustement', color: 'text-orange-400', bg: 'bg-orange-900/50', icon: TrendingUp },
};

export default function StockMovementsPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showForm, setShowForm] = useState(false);

  const { data: movements, isLoading, refetch } = useStockMovements({
    warehouseId: selectedWarehouse ? parseInt(selectedWarehouse) : undefined,
    componentId: selectedComponent ? parseInt(selectedComponent) : undefined,
    type: selectedType as MovementType || undefined,
  });

  const { data: warehouses } = useWarehouses();
  const { data: components } = useComponents();

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
          <h1 className="text-2xl font-semibold text-white">Mouvements de stock</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {movements?.length || 0} mouvement(s)
          </p>
        </div>
        <Can permission="stock.create">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            {showForm ? 'Fermer' : '+ Nouveau mouvement'}
          </button>
        </Can>
      </div>

      {/* Formulaire de mouvement */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <MovementForm onSuccess={() => {
            setShowForm(false);
            refetch();
          }} />
        </div>
      )}

      {/* Filtres */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Tous les entrepôts</option>
              {warehouses?.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.nom}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Tous les composants</option>
              {components?.map(comp => (
                <option key={comp.id} value={comp.id}>{comp.nom}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Tous les types</option>
              <option value="IN">Entrées</option>
              <option value="OUT">Sorties</option>
              <option value="TRANSFER">Transferts</option>
              <option value="ADJUSTMENT">Ajustements</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSelectedWarehouse('');
              setSelectedComponent('');
              setSelectedType('');
            }}
            className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste des mouvements */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Composant</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Entrepôt</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Quantité</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Avant → Après</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Référence</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Utilisateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {movements?.map((mov) => {
                const TypeIcon = typeConfig[mov.type]?.icon || TrendingUp;
                const isTransfer = mov.type === 'TRANSFER';
                
                return (
                  <tr key={mov.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(mov.createdAt).toLocaleString('fr-TN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                        typeConfig[mov.type]?.bg,
                        typeConfig[mov.type]?.color
                      )}>
                        <TypeIcon className="w-3 h-3" />
                        {typeConfig[mov.type]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-medium">{mov.component?.nom}</p>
                        <p className="text-gray-500 text-xs font-mono">{mov.component?.reference}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white text-sm">{mov.warehouse?.nom}</p>
                        {isTransfer && mov.targetWarehouse && (
                          <p className="text-gray-500 text-xs">
                            → {mov.targetWarehouse.nom}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-sm font-semibold",
                        mov.type === 'IN' ? 'text-green-400' : 
                        mov.type === 'OUT' ? 'text-red-400' : 'text-white'
                      )}>
                        {mov.quantity}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        {mov.component?.unite}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-400">
                      {mov.quantityBefore} → {mov.quantityAfter}
                    </td>
                    <td className="px-4 py-3">
                      {mov.referenceDoc ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-400">
                          <FileText className="w-3 h-3" />
                          {mov.referenceDoc}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {mov.user ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <User className="w-3 h-3" />
                          {mov.user.prenom} {mov.user.nom}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(!movements || movements.length === 0) && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucun mouvement de stock</p>
            <Can permission="stock.create">
              <button
                onClick={() => setShowForm(true)}
                className="inline-block mt-3 text-indigo-400 text-sm hover:underline"
              >
                Créer le premier mouvement
              </button>
            </Can>
          </div>
        )}
      </div>
    </div>
  );
}