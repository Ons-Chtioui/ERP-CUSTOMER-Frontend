import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Component, Category, Supplier } from '@/types/stock';

// GET /api/components - Liste des composants avec leur stock
export function useComponents(filters?: { search?: string; categoryId?: number; supplierId?: number }) {
  return useQuery({
    queryKey: ['components', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.categoryId) params.set('categoryId', String(filters.categoryId));
      if (filters?.supplierId) params.set('supplierId', String(filters.supplierId));
      const url = `/components${params.toString() ? `?${params}` : ''}`;
      
      // Récupérer les composants
      const components = await api.get<Component[]>(url).then(r => r.data);
      
      // Pour chaque composant, récupérer son stock
      const componentsWithStock = await Promise.all(
        components.map(async (comp) => {
          try {
            const stockData = await api.get(`/components/${comp.id}/stock`).then(r => r.data);
            return {
              ...comp,
              totalQuantity: stockData.totalQuantity || 0,
            };
          } catch {
            return { ...comp, totalQuantity: 0 };
          }
        })
      );
      
      return componentsWithStock;
    },
  });
}

// Le reste du fichier reste identique...
export const useComponent = (id: number) =>
  useQuery({
    queryKey: ['components', id],
    queryFn: () => api.get<Component>(`/components/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useComponentStock = (id: number) =>
  useQuery({
    queryKey: ['components', id, 'stock'],
    queryFn: () => api.get(`/components/${id}/stock`).then(r => r.data),
    enabled: !!id,
  });

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/components/categories').then(r => r.data),
  });

export const useSuppliers = () =>
  useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<Supplier[]>('/components/suppliers').then(r => r.data),
  });

export function useCreateComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Component>) => api.post<Component>('/components', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['components'] });
    },
  });
}

export function useUpdateComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Component> & { id: number }) =>
      api.put<Component>(`/components/${id}`, data).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['components'] });
      qc.invalidateQueries({ queryKey: ['components', id] });
    },
  });
}

export function useDeleteComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/components/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['components'] });
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nom: string; description?: string }) =>
      api.post<Category>('/components/categories', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Supplier>) =>
      api.post<Supplier>('/components/suppliers', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}