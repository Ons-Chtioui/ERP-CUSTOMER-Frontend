import type { Client } from './orders';
import type { Product } from './products';

// ─── Devis ────────────────────────────────────────────────────────────────────
export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'refused'
  | 'expired'
  | 'converted';

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft:     'Brouillon',
  sent:      'Envoyé',
  accepted:  'Accepté',
  refused:   'Refusé',
  expired:   'Expiré',
  converted: 'Converti',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft:     'bg-gray-700 text-gray-300',
  sent:      'bg-blue-900/50 text-blue-400',
  accepted:  'bg-green-900/50 text-green-400',
  refused:   'bg-red-900/50 text-red-400',
  expired:   'bg-orange-900/50 text-orange-400',
  converted: 'bg-indigo-900/50 text-indigo-400',
};

// Transitions manuelles de statut (boutons d'action dans l'UI).
// La conversion accepted → converted se fait via le bouton dédié "Convertir en facture",
// pas via ce tableau — c'est intentionnel pour séparer les deux actions.
export const QUOTE_NEXT_STATUSES: Record<QuoteStatus, QuoteStatus[]> = {
  draft:     ['sent', 'refused'],
  sent:      ['accepted', 'refused', 'expired'],
  accepted:  ['refused'],   // peut encore être refusé manuellement même si accepté
  refused:   [],
  expired:   [],
  converted: [],            // état final : aucune transition possible
};

export interface QuoteLine {
  id: number;
  productId: number;
  product?: Product;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
  discount: number;
  totalHt: number;
  position: number;
}

export interface Quote {
  id: number;
  reference: string;
  clientId: number;
  client: Client;
  status: QuoteStatus;
  validUntil: string;
  note?: string | null;
  discount: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  convertedTo?: number | null;
  convertedAt?: string | null;
  lines: QuoteLine[];
  creator?: { id: number; prenom: string; nom: string };
  createdAt: string;
  updatedAt: string;
}

export interface QuotesResponse {
  data: Quote[];
  total: number;
  page: number;
  limit: number;
}

// ─── Factures ─────────────────────────────────────────────────────────────────
export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type InvoiceType = 'invoice' | 'credit_note';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft:     'Brouillon',
  sent:      'Envoyée',
  partial:   'Partiellement payée',
  paid:      'Payée',
  overdue:   'En retard',
  cancelled: 'Annulée',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft:     'bg-gray-700 text-gray-300',
  sent:      'bg-blue-900/50 text-blue-400',
  partial:   'bg-yellow-900/50 text-yellow-400',
  paid:      'bg-green-900/50 text-green-400',
  overdue:   'bg-red-900/50 text-red-400',
  cancelled: 'bg-gray-800 text-gray-500',
};

export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'card';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash:          'Espèces',
  bank_transfer: 'Virement',
  cheque:        'Chèque',
  card:          'Carte',
};

export interface InvoiceLine {
  id: number;
  productId?: number | null;
  product?: Product;
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
  discount: number;
  totalHt: number;
  position: number;
}

export interface Payment {
  id: number;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  paidAt: string;
  note?: string | null;
  creator?: { id: number; prenom: string; nom: string };
  createdAt: string;
}

export interface Invoice {
  id: number;
  reference: string;
  clientId: number;
  client: Client;
  quoteId?: number | null;
  orderId?: number | null;
  originalInvoiceId?: number | null;
  originalInvoice?: Invoice | null;
  type: InvoiceType;
  status: InvoiceStatus;
  dueDate?: string | null;
  note?: string | null;
  discount: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  amountPaid: number;
  lines: InvoiceLine[];
  payments: Payment[];
  creator?: { id: number; prenom: string; nom: string };
  createdAt: string;
  updatedAt: string;
}

export interface InvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
}

export interface InvoiceStatsRow {
  type: InvoiceType;
  status: InvoiceStatus;
  count: string;
  totalTtc: string;
  unpaid: string;
}

// ─── Bons de livraison ────────────────────────────────────────────────────────
export type DeliveryStatus = 'pending' | 'delivered' | 'signed';

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending:   'En attente',
  delivered: 'Livré',
  signed:    'Signé',
};

export const DELIVERY_STATUS_COLORS: Record<DeliveryStatus, string> = {
  pending:   'bg-yellow-900/50 text-yellow-400',
  delivered: 'bg-blue-900/50 text-blue-400',
  signed:    'bg-green-900/50 text-green-400',
};

export interface DeliveryNoteLine {
  id: number;
  productId: number;
  product?: Product;
  quantityOrdered: number;
  quantityDelivered: number;
  position: number;
}

export interface DeliveryNote {
  id: number;
  reference: string;
  clientId: number;
  client: Client;
  orderId?: number | null;
  invoiceId?: number | null;
  order?: { id: number; reference: string } | null;
  invoice?: { id: number; reference: string } | null;
  status: DeliveryStatus;
  deliveryAddress?: string | null;
  deliveredAt?: string | null;
  signatureUrl?: string | null;
  note?: string | null;
  lines: DeliveryNoteLine[];
  creator?: { id: number; prenom: string; nom: string };
  createdAt: string;
  updatedAt: string;
}