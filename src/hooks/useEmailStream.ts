// src/hooks/emails/useEmailStream.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';

export type EmailStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'bounced';

export interface EmailEvent {
  logId: number;
  status: EmailStatus;
  toEmail: string;
  subject: string;
  template?: string;
  relatedType?: string;
  relatedId?: number;
  error?: string;
  sentAt?: string;
  createdAt?: string;
}

interface UseEmailStreamOptions {
  onEvent?: (event: EmailEvent) => void;
  onStatusChange?: (logId: number, status: EmailStatus) => void;
}

export function useEmailStream(options: UseEmailStreamOptions = {}) {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qc = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);

  const connect = useCallback(() => {
    // Nettoyer l'ancienne connexion
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    // Récupérer l'URL et le token
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

    const url = `${apiUrl}/emails/stream${token ? `?token=${token}` : ''}`;

    try {
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
        setError(null);
      };

      // Événement email.status
      es.addEventListener('email.status', (e: MessageEvent) => {
        try {
          const event: EmailEvent = JSON.parse(e.data);

          setEvents((prev) => {
            const idx = prev.findIndex((ev) => ev.logId === event.logId);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = event;
              return updated;
            }
            return [event, ...prev].slice(0, 100);
          });

          // Invalider le cache quand un email est terminé
          if (event.status === 'sent' || event.status === 'failed' || event.status === 'bounced') {
            qc.invalidateQueries({ queryKey: ['emails', 'logs'] });
          }

          // Callbacks
          options.onEvent?.(event);
          options.onStatusChange?.(event.logId, event.status);
        } catch (err) {
          console.error('[SSE] Parse error:', err);
        }
      });

      // Ping keepalive — ignorer
      es.addEventListener('ping', () => {});

      es.onerror = () => {
        setConnected(false);
        setError('Connexion SSE perdue, tentative de reconnexion...');
        es.close();

        // Reconnexion automatique après 5 secondes
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    } catch (err) {
      setError('Erreur de connexion SSE');
      console.error('[SSE] Connection error:', err);
    }
  }, [options, qc, token]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setConnected(false);
    };
  }, [connect]);

  const clearEvents = useCallback(() => setEvents([]), []);

  const getByRelatedId = useCallback(
    (relatedId: number) => events.filter((e) => e.relatedId === relatedId),
    [events],
  );

  const getInProgress = useCallback(
    () => events.filter((e) => ['pending', 'sending'].includes(e.status)),
    [events],
  );

  const getLastEvent = useCallback(
    (logId: number) => events.find((e) => e.logId === logId),
    [events],
  );

  return {
    events,
    connected,
    error,
    clearEvents,
    getByRelatedId,
    getInProgress,
    getLastEvent,
    reconnect: connect,
  };
}