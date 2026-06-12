import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ProductInventoryItem } from '@/types/products';

// ── Stock produit fini par entrepôt ───────────────────────────────────────────
export const useProductInventory = (productId: number) =>
  useQuery<ProductInventoryItem[]>({
    queryKey: ['products', productId, 'inventory'],
    queryFn: () => api.get(`/products/${productId}/inventory`).then(r => r.data),
    enabled: !!productId,
  });

// ── Transfert stock produit entre entrepôts ───────────────────────────────────
export const useTransferProductStock = (productId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      fromWarehouseId, toWarehouseId, quantity,
    }: { fromWarehouseId: number; toWarehouseId: number; quantity: number }) =>
      api.post(`/products/${productId}/inventory/transfer`, {
        fromWarehouseId, toWarehouseId, quantity,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId, 'inventory'] });
      qc.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
};
