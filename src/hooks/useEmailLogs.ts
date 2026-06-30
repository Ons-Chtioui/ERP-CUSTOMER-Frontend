// src/hooks/emails/useEmailLogs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { EmailStatus } from './useEmailStream';
import { toast } from 'react-hot-toast';

export interface EmailLog {
  id: number;
  toEmail: string;
  toName: string | null;
  subject: string;
  template: string;
  status: EmailStatus;
  error: string | null;
  relatedType: string | null;
  relatedId: number | null;
  sentAt: string | null;
  createdAt: string;
  creator?: { id: number; name: string } | null;
}

export interface QueryEmailLogsParams {
  limit?: number;
  relatedId?: number;
  relatedType?: string;
  status?: string;
}

export const emailLogKeys = {
  all: () => ['emails', 'logs'] as const,
  list: (p: object) => ['emails', 'logs', p] as const,
  detail: (id: number) => ['emails', 'logs', id] as const,
};

export function useEmailLogs(params?: QueryEmailLogsParams) {
  return useQuery<EmailLog[]>({
    queryKey: emailLogKeys.list(params ?? {}),
    queryFn: () =>
      api.get('/emails/logs', { params }).then((r) => r.data),
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export function useResendEmail() {
  const qc = useQueryClient();

  return useMutation<{ logId: number; jobId: string }, Error, number>({
    mutationFn: (logId: number) =>
      api.post(`/emails/resend/${logId}`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: emailLogKeys.all() });
      toast.success(`📧 Email #${data.logId} renvoyé avec succès`);
    },
    onError: (error) => {
      toast.error(`❌ Erreur: ${error.message || 'Impossible de renvoyer l\'email'}`);
    },
  });
}

export function useEmailLogsWithFilters(params?: QueryEmailLogsParams) {
  const logsQuery = useEmailLogs(params);
  const resendMutation = useResendEmail();

  // Filtrage côté client pour les logs
  const filteredLogs = logsQuery.data?.filter((log) => {
    if (params?.status && log.status !== params.status) return false;
    if (params?.relatedId && log.relatedId !== params.relatedId) return false;
    if (params?.relatedType && log.relatedType !== params.relatedType) return false;
    return true;
  });

  return {
    logs: filteredLogs || [],
    allLogs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
    isError: logsQuery.isError,
    error: logsQuery.error,
    refetch: logsQuery.refetch,
    resend: resendMutation.mutate,
    isResending: resendMutation.isPending,
    resendError: resendMutation.error,
  };
}