import type { Product } from './products';

// ─── Client ───────────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country: string;
  tvaNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Statuts commande ─────────────────────────────────────────────────────────
export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft:     'Brouillon',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped:   'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  draft:     'bg-gray-700 text-gray-300',
  confirmed: 'bg-blue-900/50 text-blue-400',
  preparing: 'bg-yellow-900/50 text-yellow-400',
  shipped:   'bg-indigo-900/50 text-indigo-400',
  delivered: 'bg-green-900/50 text-green-400',
  cancelled: 'bg-red-900/50 text-red-400',
};

export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  draft:     ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped',   'cancelled'],
  shipped:   ['delivered'],
  delivered: [],
  cancelled: [],
};

// ─── Supplément sur une ligne ─────────────────────────────────────────────────
export interface OrderLineSupplement {
  id: number;
  orderLineId: number;
  componentId: number;
  quantity: number;
  unitPrice: number | string;
  tvaRate: number | string;
  totalHt: number | string;
  qtyDeducted: number;
  note?: string | null;
  component?: { id: number; nom: string; reference: string };
}

// ─── Ligne de commande ────────────────────────────────────────────────────────
export interface OrderLine {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  qtyFromStock: number;
  qtyFromAssembly: number;
  unitPrice: number;
  tvaRate: number;
  discount: number;
  totalHt: number;
  supplements: OrderLineSupplement[];
}

// ─── Historique statuts ───────────────────────────────────────────────────────
export interface OrderStatusHistory {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  comment: string | null;
  createdAt: string;
  user?: { id: string; prenom: string; nom: string };
}

export interface OrderModification {
  id: number;
  orderId: number;
  action: string;
  details: string | null;
  changedBy: number;
  createdAt: string;
  user?: { id: number; prenom: string; nom: string };
}

// ─── Commande ─────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  reference: string;
  clientId: string;
  client: Client;
  warehouseId: string;
  warehouse?: { id: number; nom: string; code: string };
  status: OrderStatus;
  note?: string | null;
  discount: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  createdBy: string;
  lines: OrderLine[];
  statusHistory?: OrderStatusHistory[];
  modifications?: OrderModification[];
  creator?: { id: string; prenom: string; nom: string };
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderStats {
  stats: { status: string; count: string; total: string }[];
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
}

// ─── DTOs input ───────────────────────────────────────────────────────────────
export interface CreateSupplementInput {
  componentId: number;
  quantity: number;
  unitPrice: number;
  tvaRate?: number;
  note?: string;
}

export interface CreateOrderLineInput {
  productId: string;
  quantity: number;
  discount?: number;
  supplements?: CreateSupplementInput[];
}

// ─── Disponibilité ────────────────────────────────────────────────────────────
export interface OrderAvailabilityLine {
  productId: number;
  name?: string;
  quantity: number;
  stockFini: number;
  stockFabricable: number;
  stockTotal: number;
  fromStock: number;
  fromAssembly: number;
  canFulfill: boolean;
}

export interface OrderAvailability {
  orderId: number;
  reference: string;
  canConfirm: boolean;
  lines: OrderAvailabilityLine[];
  missing: (OrderAvailabilityLine & { type?: string })[];
}