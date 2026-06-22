import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  Invoice, InvoicesResponse, InvoiceStatsRow, InvoiceStatus, InvoiceType, PaymentMethod,
} from '@/types/commercial';

interface InvoiceFilters {
  status?: InvoiceStatus;
  type?: InvoiceType;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const useInvoices = (filters?: InvoiceFilters) =>
  useQuery<InvoicesResponse>({
    queryKey: ['invoices', filters],
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters?.status)   p.set('status',   filters.status);
      if (filters?.type)     p.set('type',     filters.type);
      if (filters?.clientId) p.set('clientId', filters.clientId);
      if (filters?.dateFrom) p.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo)   p.set('dateTo',   filters.dateTo);
      if (filters?.page)     p.set('page',     String(filters.page));
      if (filters?.limit)    p.set('limit',    String(filters.limit));
      return api.get(`/invoices${p.toString() ? `?${p}` : ''}`).then(r => r.data);
    },
  });

export const useInvoice = (id: string) =>
  useQuery<Invoice>({
    queryKey: ['invoices', id],
    queryFn: () => api.get<Invoice>(`/invoices/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useInvoiceStats = () =>
  useQuery<InvoiceStatsRow[]>({
    queryKey: ['invoices', 'stats'],
    queryFn: () => api.get<InvoiceStatsRow[]>('/invoices/stats').then(r => r.data),
  });

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      clientId: number;
      quoteId?: number;
      orderId?: number;
      dueDate?: string;
      note?: string;
      discount?: number;
      lines: {
        productId?: number;
        description: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
        tvaRate?: number;
      }[];
    }) => api.post<Invoice>('/invoices', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
};

export const useMarkInvoiceSent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<Invoice>(`/invoices/${id}/send`).then(r => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoices', id] });
    },
  });
};

export const useAddPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, amount, method, reference, paidAt, note,
    }: {
      id: string;
      amount: number;
      method: PaymentMethod;
      reference?: string;
      paidAt?: string;
      note?: string;
    }) => api.post<Invoice>(`/invoices/${id}/payments`, { amount, method, reference, paidAt, note }).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoices', id] });
      qc.invalidateQueries({ queryKey: ['invoices', 'stats'] });
    },
  });
};

export const useCreateCreditNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post<Invoice>(`/invoices/${id}/credit-note`, { reason }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
};

export const useCancelInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<Invoice>(`/invoices/${id}/cancel`).then(r => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoices', id] });
    },
  });
};
