import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Product, Availability, SimulationResult, ProductionLog } from '@/types/products';

// ── Lister les produits ───────────────────────────────────────────────────────
export const useProducts = (filters?: {
  search?: string;
  categoryId?: number;
  parentId?: number;
  withStock?: boolean;
}) =>
  useQuery<Product[]>({
    queryKey: ['products', filters],
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters?.search)     p.set('search',     filters.search);
      if (filters?.categoryId) p.set('categoryId', String(filters.categoryId));
      if (filters?.parentId)   p.set('parentId',   String(filters.parentId));
      if (filters?.withStock)  p.set('withStock',  'true');
      return api.get(`/products${p.toString() ? `?${p}` : ''}`).then(r => r.data);
    },
  });

// ── Détail d'un produit ───────────────────────────────────────────────────────
export const useProduct = (id: number) =>
  useQuery<Product>({
    queryKey: ['products', id],
    queryFn: () => api.get(`/products/${id}`).then(r => r.data),
    enabled: !!id,
  });

// ── CRUD ─────────────────────────────────────────────────────────────────────
export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product> & { categoryId?: number; parentId?: number }) =>
      api.post<Product>('/products', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Product> & { id: number; categoryId?: number }) =>
      api.put<Product>(`/products/${id}`, data).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products', id] });
    },
  });
};

export const useArchiveProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

// ── Disponibilité ─────────────────────────────────────────────────────────────
export const useProductAvailability = (id: number, warehouseId?: number) =>
  useQuery<Availability>({
    queryKey: ['products', id, 'availability', warehouseId],
    queryFn: () => {
      const url = warehouseId
        ? `/products/${id}/availability?warehouseId=${warehouseId}`
        : `/products/${id}/availability`;
      return api.get(url).then(r => r.data);
    },
    enabled: !!id,
  });

// ── Simulation ────────────────────────────────────────────────────────────────
export const useSimulateProduction = () =>
  useMutation({
    mutationFn: ({ id, quantity, warehouseId }: { id: number; quantity: number; warehouseId: number }) =>
      api.post<SimulationResult>(`/products/${id}/simulate`, { quantity, warehouseId }).then(r => r.data),
  });

// ── Production ────────────────────────────────────────────────────────────────
export const useProduce = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity, warehouseId, notes }: {
      id: number; quantity: number; warehouseId: number; notes?: string;
    }) =>
      api.post<ProductionLog>(`/products/${id}/produce`, { quantity, warehouseId, notes }).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['products', id, 'availability'] });
      qc.invalidateQueries({ queryKey: ['products', id, 'inventory'] });
      qc.invalidateQueries({ queryKey: ['products', id, 'logs'] });
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
};

// ── Historique productions ────────────────────────────────────────────────────
export const useProductionLogs = (productId: number) =>
  useQuery<ProductionLog[]>({
    queryKey: ['products', productId, 'logs'],
    queryFn: () => api.get(`/products/${productId}/production-logs`).then(r => r.data),
    enabled: !!productId,
  });
