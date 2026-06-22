import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DeliveryNote, DeliveryStatus } from '@/types/commercial';

interface DeliveryNoteFilters {
  clientId?: string;
  status?: DeliveryStatus;
}

export const useDeliveryNotes = (filters?: DeliveryNoteFilters) =>
  useQuery<DeliveryNote[]>({
    queryKey: ['delivery-notes', filters],
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters?.clientId) p.set('clientId', filters.clientId);
      if (filters?.status)   p.set('status',   filters.status);
      return api.get(`/delivery-notes${p.toString() ? `?${p}` : ''}`).then(r => r.data);
    },
  });

export const useDeliveryNote = (id: string) =>
  useQuery<DeliveryNote>({
    queryKey: ['delivery-notes', id],
    queryFn: () => api.get<DeliveryNote>(`/delivery-notes/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateDeliveryNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      clientId: number;
      orderId?: number;
      invoiceId?: number;
      deliveryAddress?: string;
      note?: string;
      lines: {
        productId: number;
        quantityOrdered: number;
        quantityDelivered: number;
      }[];
    }) => api.post<DeliveryNote>('/delivery-notes', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delivery-notes'] }),
  });
};

export const useMarkDelivered = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, note, signatureUrl,
    }: {
      id: string;
      note?: string;
      signatureUrl?: string;
    }) => api.patch<DeliveryNote>(`/delivery-notes/${id}/deliver`, { note, signatureUrl }).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['delivery-notes'] });
      qc.invalidateQueries({ queryKey: ['delivery-notes', id] });
    },
  });
};

export const useDeleteDeliveryNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/delivery-notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delivery-notes'] }),
  });
};
