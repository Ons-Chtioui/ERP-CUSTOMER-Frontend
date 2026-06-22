import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Quote, QuotesResponse, QuoteStatus } from '@/types/commercial';

interface QuoteFilters {
  status?: QuoteStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const useQuotes = (filters?: QuoteFilters) =>
  useQuery<QuotesResponse>({
    queryKey: ['quotes', filters],
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters?.status)   p.set('status',   filters.status);
      if (filters?.clientId) p.set('clientId', filters.clientId);
      if (filters?.dateFrom) p.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo)   p.set('dateTo',   filters.dateTo);
      if (filters?.page)     p.set('page',     String(filters.page));
      if (filters?.limit)    p.set('limit',    String(filters.limit));
      return api.get(`/quotes${p.toString() ? `?${p}` : ''}`).then(r => r.data);
    },
  });

export const useQuote = (id: string) =>
  useQuery<Quote>({
    queryKey: ['quotes', id],
    queryFn: () => api.get<Quote>(`/quotes/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateQuote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      clientId: number;
      validUntil: string;
      note?: string;
      discount?: number;
      lines: {
        productId: number;
        description?: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
        tvaRate?: number;
      }[];
    }) => api.post<Quote>('/quotes', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  });
};

export const useUpdateQuoteStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: QuoteStatus; comment?: string }) =>
      api.patch<Quote>(`/quotes/${id}/status`, { status, comment }).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: ['quotes', id] });
    },
  });
};

export const useConvertQuote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/quotes/${id}/convert`).then(r => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: ['quotes', id] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useDeleteQuote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/quotes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  });
};
