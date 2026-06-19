import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Order, OrdersResponse, OrderStats, OrderStatus } from '@/types/orders';

interface OrderFilters {
  status?: OrderStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const useOrders = (filters?: OrderFilters) =>
  useQuery<OrdersResponse>({
    queryKey: ['orders', filters],
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters?.status)   p.set('status',   filters.status);
      if (filters?.clientId) p.set('clientId', filters.clientId);
      if (filters?.dateFrom) p.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo)   p.set('dateTo',   filters.dateTo);
      if (filters?.page)     p.set('page',     String(filters.page));
      if (filters?.limit)    p.set('limit',    String(filters.limit));
      return api.get(`/orders${p.toString() ? `?${p}` : ''}`).then(r => r.data);
    },
  });

export const useOrder = (id: string) =>
  useQuery<Order>({
    queryKey: ['orders', id],
    queryFn: () => api.get<Order>(`/orders/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useOrderStats = () =>
  useQuery<OrderStats>({
    queryKey: ['orders', 'stats'],
    queryFn: () => api.get<OrderStats>('/orders/stats').then(r => r.data),
  });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      clientId: number;
      note?: string;
      discount?: number;
      lines: {
        productId: number;
        quantity: number;
        discount?: number;
        supplements?: {
          componentId: number;
          quantity: number;
          unitPrice: number;
          tvaRate?: number;
          note?: string;
        }[];
      }[];
    }) => api.post<Order>('/orders', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: OrderStatus; comment?: string }) =>
      api.patch<Order>(`/orders/${id}/status`, { status, comment }).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', id] });
      qc.invalidateQueries({ queryKey: ['orders', 'stats'] });
    },
  });
};

export const useUpdateOrderLines = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, ...data
    }: {
      id: string;
      clientId?: number;
      note?: string;
      discount?: number;
      lines?: {
        productId: number;
        quantity: number;
        discount?: number;
        supplements?: {
          componentId: number;
          quantity: number;
          unitPrice: number;
          tvaRate?: number;
          note?: string;
        }[];
      }[];
    }) => api.put<Order>(`/orders/${id}/lines`, data).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', id] });
    },
  });
};

export const useCheckOrderAvailability = (id: string) =>
  useQuery({
    queryKey: ['orders', id, 'availability'],
    queryFn: () => api.get(`/orders/${id}/availability`).then(r => r.data),
    enabled: !!id,
  });

export const useDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};