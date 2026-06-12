import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { BomLine } from '@/types/products';

// ── Lire la BOM ───────────────────────────────────────────────────────────────
export const useBom = (productId: number) =>
  useQuery<BomLine[]>({
    queryKey: ['products', productId, 'bom'],
    queryFn: () => api.get(`/products/${productId}/bom`).then(r => r.data),
    enabled: !!productId,
  });

// ── Remplacer toute la BOM ────────────────────────────────────────────────────
export const useSetBom = (productId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lines: { componentId: number; quantity: number }[]) =>
      api.put<BomLine[]>(`/products/${productId}/bom`, { lines }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId, 'bom'] });
      qc.invalidateQueries({ queryKey: ['products', productId] });
      qc.invalidateQueries({ queryKey: ['products', productId, 'availability'] });
    },
  });
};

// ── Ajouter / mettre à jour une ligne ─────────────────────────────────────────
export const useUpsertBomLine = (productId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ componentId, quantity }: { componentId: number; quantity: number }) =>
      api.patch(`/products/${productId}/bom/${componentId}`, { quantity }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId, 'bom'] });
      qc.invalidateQueries({ queryKey: ['products', productId] });
    },
  });
};

// ── Supprimer une ligne ───────────────────────────────────────────────────────
export const useDeleteBomLine = (productId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (componentId: number) =>
      api.delete(`/products/${productId}/bom/${componentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId, 'bom'] });
      qc.invalidateQueries({ queryKey: ['products', productId] });
    },
  });
};
