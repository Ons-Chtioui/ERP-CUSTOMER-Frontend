// src/hooks/notifications/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export type NotificationType =
  | 'stock_alert'
  | 'order_status'
  | 'invoice_due'
  | 'email_sent'
  | 'info';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
}

export const notificationKeys = {
  all: () => ['notifications'] as const,
  list: (p: object) => ['notifications', 'list', p] as const,
  count: () => ['notifications', 'count'] as const,
  detail: (id: number) => ['notifications', id] as const,
};

// ─── RÉCUPÉRER LES NOTIFICATIONS ──────────────────────────────────

export function useNotifications(options: { unreadOnly?: boolean; limit?: number } = {}) {
  const { unreadOnly = false, limit = 50 } = options;

  return useQuery<NotificationsResponse>({
    queryKey: notificationKeys.list({ unreadOnly, limit }),
    queryFn: () =>
      api.get('/notifications', { params: { unreadOnly, limit } }).then((r) => r.data),
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

// ─── COMPTER LES NON LUES ──────────────────────────────────────────

export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: notificationKeys.count(),
    queryFn: () =>
      api.get('/notifications/count').then((r) => r.data),
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

// ─── MARQUER COMME LUE ─────────────────────────────────────────────

export function useMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id: number) =>
      api.patch(`/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all() });
      qc.invalidateQueries({ queryKey: notificationKeys.count() });
    },
  });
}

// ─── MARQUER TOUTES COMME LUES ─────────────────────────────────────

export function useMarkAllRead() {
  const qc = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () =>
      api.patch('/notifications/read-all').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all() });
      qc.invalidateQueries({ queryKey: notificationKeys.count() });
      toast.success('✅ Toutes les notifications marquées comme lues');
    },
    onError: () => {
      toast.error('❌ Erreur lors du marquage des notifications');
    },
  });
}

// ─── SUPPRIMER UNE NOTIFICATION ────────────────────────────────────

export function useDeleteNotification() {
  const qc = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id: number) =>
      api.delete(`/notifications/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all() });
      qc.invalidateQueries({ queryKey: notificationKeys.count() });
      toast.success('✅ Notification supprimée');
    },
    onError: () => {
      toast.error('❌ Erreur lors de la suppression');
    },
  });
}

// ─── HOOK COMBINÉ ──────────────────────────────────────────────────

export function useNotificationsCombined(options: { unreadOnly?: boolean; limit?: number } = {}) {
  const { data, isLoading, error, refetch } = useNotifications(options);
  const { data: countData } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  const deleteNotif = useDeleteNotification();

  return {
    notifications: data?.items || [],
    total: data?.total || 0,
    unreadCount: countData?.count || 0,
    isLoading,
    error,
    refetch,
    markAsRead: markRead.mutate,
    markAllAsRead: markAllRead.mutate,
    delete: deleteNotif.mutate,
    isMarking: markRead.isPending,
    isDeleting: deleteNotif.isPending,
  };
}