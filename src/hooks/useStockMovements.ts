// src/hooks/useStockMovements.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { StockMovement, MovementType } from '@/types/stock';

// GET /api/stock-movements - Historique des mouvements avec filtres
export function useStockMovements(filters?: { 
  warehouseId?: number; 
  componentId?: number; 
  type?: MovementType;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['stock-movements', filters],
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters?.warehouseId) p.set('warehouseId', String(filters.warehouseId));
      if (filters?.componentId) p.set('componentId', String(filters.componentId));
      if (filters?.type) p.set('type', filters.type);
      if (filters?.limit) p.set('limit', String(filters.limit));
      const url = `/stock-movements${p.toString() ? `?${p}` : ''}`;
      return api.get<StockMovement[]>(url).then(r => r.data);
    },
  });
}

// Mutation générique pour les mouvements
function useMovementMutation(endpoint: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/stock-movements/${endpoint}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      qc.invalidateQueries({ queryKey: ['warehouses', 'summary'] });
      qc.invalidateQueries({ queryKey: ['components'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      qc.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });
}

// POST /api/stock-movements/in - Entrée de stock
export const useCreateIn = () => useMovementMutation('in');

// POST /api/stock-movements/out - Sortie de stock
export const useCreateOut = () => useMovementMutation('out');

// POST /api/stock-movements/transfer - Transfert entre entrepôts
export const useCreateTransfer = () => useMovementMutation('transfer');