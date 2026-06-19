import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Client } from '@/types/orders';

export const useClients = (search?: string) =>
  useQuery<Client[]>({
    queryKey: ['clients', search],
    queryFn: () => {
      const url = search ? `/clients?search=${encodeURIComponent(search)}` : '/clients';
      return api.get<Client[]>(url).then(r => r.data);
    },
  });

export const useClient = (id: string) =>
  useQuery<Client>({
    queryKey: ['clients', id],
    queryFn: () => api.get<Client>(`/clients/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Client>) =>
      api.post<Client>('/clients', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Client> & { id: string }) =>
      api.put<Client>(`/clients/${id}`, data).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['clients', id] });
    },
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
};
