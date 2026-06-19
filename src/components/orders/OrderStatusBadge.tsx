'use client';

import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types/orders';

// ─── Libellés des statuts ──────────────────────────────────────────────────
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft:     'Brouillon',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped:   'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

// ─── Couleurs des statuts (dark theme) ─────────────────────────────────────
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  draft:     'bg-gray-800 text-gray-300',
  confirmed: 'bg-blue-900/50 text-blue-300',
  preparing: 'bg-yellow-900/50 text-yellow-300',
  shipped:   'bg-purple-900/50 text-purple-300',
  delivered: 'bg-green-900/50 text-green-300',
  cancelled: 'bg-red-900/50 text-red-300',
};

// ─── Icônes des statuts (optionnel) ──────────────────────────────────────
export const ORDER_STATUS_ICONS: Record<OrderStatus, string> = {
  draft:     '📝',
  confirmed: '✅',
  preparing: '⚙️',
  shipped:   '📦',
  delivered: '🎯',
  cancelled: '❌',
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
  showIcon?: boolean;
}

export function OrderStatusBadge({ 
  status, 
  className = '',
  showIcon = false 
}: OrderStatusBadgeProps) {
  const label = ORDER_STATUS_LABELS[status] || status;
  const color = ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.draft;
  const icon = ORDER_STATUS_ICONS[status] || '';

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
      color,
      className
    )}>
      {showIcon && <span>{icon}</span>}
      {label}
    </span>
  );
}