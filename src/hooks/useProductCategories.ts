import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ProductCategory } from '@/types/products';

export const useProductCategories = () =>
  useQuery<ProductCategory[]>({
    queryKey: ['product-categories'],
    queryFn: () => api.get('/product-categories').then(r => r.data),
  });

export const useCreateProductCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductCategory>) =>
      api.post<ProductCategory>('/product-categories', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories'] }),
  });
};

export const useUpdateProductCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ProductCategory> & { id: number }) =>
      api.put<ProductCategory>(`/product-categories/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories'] }),
  });
};

export const useDeleteProductCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/product-categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories'] }),
  });
};
