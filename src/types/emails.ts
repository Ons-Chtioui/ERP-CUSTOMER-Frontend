// src/types/emails.ts

export type EmailStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'bounced';

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
  createdBy: number | null;
  createdAt: string;
}

export interface EmailEvent {
  logId: string;
  status: EmailStatus;
  toEmail: string;
  subject: string;
  error?: string;
  sentAt?: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'stock_alert' | 'order_status' | 'invoice_due' | 'email_sent' | 'info';
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}