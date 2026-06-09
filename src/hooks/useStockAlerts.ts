// src/hooks/useStockAlerts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { StockAlert } from '@/types/stock';

// GET /api/stock-alerts - Alertes actives
export const useStockAlerts = (warehouseId?: number) =>
  useQuery({
    queryKey: ['stock-alerts', warehouseId],
    queryFn: () => {
      const url = warehouseId ? `/stock-alerts?warehouseId=${warehouseId}` : '/stock-alerts';
      return api.get<StockAlert[]>(url).then(r => r.data);
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

// POST /api/stock-alerts/:id/resolve - Résoudre une alerte (optionnel)
export const useResolveAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/stock-alerts/${id}/resolve`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });
};