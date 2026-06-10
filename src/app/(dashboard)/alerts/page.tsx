'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Building2,
  Package,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { useWarehouses } from '@/hooks/useWarehouses';
import { StockAlert } from '@/types/stock';

export default function AlertsPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const { data: alerts, isLoading } = useStockAlerts(selectedWarehouse ? parseInt(selectedWarehouse) : undefined);
  const { data: warehouses } = useWarehouses();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  const activeAlerts = alerts?.filter(a => a.status === 'active') || [];
  const resolvedAlerts = alerts?.filter(a => a.status === 'resolved') || [];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Alertes stock</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {activeAlerts.length} alerte(s) active(s)
          </p>
        </div>
      </div>

      {/* Filtre par entrepôt */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <Building2 className="w-5 h-5 text-gray-500" />
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tous les entrepôts</option>
            {warehouses?.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.nom}</option>
            ))}
          </select>
          {selectedWarehouse && (
            <button
              onClick={() => setSelectedWarehouse('')}
              className="px-3 py-2 text-gray-400 hover:text-white text-sm"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Alertes actives */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            Alertes actives
          </h2>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Alertes résolues */}
      {resolvedAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Alertes résolues
          </h2>
          <div className="space-y-3">
            {resolvedAlerts.slice(0, 5).map((alert) => (
              <AlertCard key={alert.id} alert={alert} resolved />
            ))}
          </div>
        </div>
      )}

      {(!alerts || alerts.length === 0) && (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">Aucune alerte</p>
          <p className="text-gray-600 text-sm mt-1">
            Tous les stocks sont au-dessus des seuils d'alerte
          </p>
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, resolved }: { alert: StockAlert; resolved?: boolean }) {
  return (
    <div className={cn(
      "border rounded-xl p-4 transition-colors",
      resolved 
        ? "bg-gray-900/50 border-gray-800" 
        : "bg-orange-950/20 border-orange-800/50"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-2 rounded-full",
          resolved ? "bg-gray-800" : "bg-orange-900/50"
        )}>
          {resolved ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-medium">{alert.component?.nom}</h3>
              <p className="text-gray-400 text-sm font-mono mt-0.5">
                {alert.component?.reference}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm">
                <span className={cn(
                  "font-semibold",
                  resolved ? "text-green-400" : "text-orange-400"
                )}>
                  Stock: {alert.quantityAtAlert}
                </span>
                <span className="text-gray-500 text-xs ml-1">
                  / seuil: {alert.threshold}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(alert.createdAt).toLocaleString('fr-TN')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-3 text-sm">
            <span className="flex items-center gap-1 text-gray-400">
              <Building2 className="w-3 h-3" />
              {alert.warehouse?.nom}
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              <Package className="w-3 h-3" />
              {alert.component?.unite}
            </span>
           
            
          </div>
        </div>
      </div>
    </div>
  );
}