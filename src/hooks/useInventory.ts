// src/hooks/useInventory.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { InventorySession, InventoryLine } from '@/types/stock';

// GET /api/inventory - Liste des sessions d'inventaire
export const useInventorySessions = (warehouseId?: number) =>
  useQuery({
    queryKey: ['inventory', warehouseId],
    queryFn: () => {
      const url = warehouseId ? `/inventory?warehouseId=${warehouseId}` : '/inventory';
      return api.get<InventorySession[]>(url).then(r => r.data);
    },
  });

// GET /api/inventory/:id - Détail d'une session
export const useInventorySession = (id: number) =>
  useQuery({
    queryKey: ['inventory', id],
    queryFn: () => api.get<InventorySession>(`/inventory/${id}`).then(r => r.data),
    enabled: !!id,
  });

// POST /api/inventory - Créer une session
export const useCreateInventorySession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { warehouseId: number; nom?: string }) =>
      api.post<InventorySession>('/inventory', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

// POST /api/inventory/:id/start - Démarrer une session
export const useStartInventorySession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/inventory/${id}/start`).then(r => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['inventory', id] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

// POST /api/inventory/:id/count - Compter un composant
export const useCountInventoryLine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...data }: { 
      sessionId: number; 
      componentId: number; 
      quantityCounted: number; 
      notes?: string 
    }) => api.post<InventoryLine>(`/inventory/${sessionId}/count`, data).then(r => r.data),
    onSuccess: (_, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['inventory', sessionId] });
    },
  });
};

// POST /api/inventory/:id/close - Clôturer une session
export const useCloseInventorySession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/inventory/${id}/close`).then(r => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inventory', id] });
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
};