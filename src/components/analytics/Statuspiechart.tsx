// src/components/analytics/StatusPieChart.tsx
// PieChart des statuts (commandes, factures, devis) avec Recharts
'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StatusPieChartProps {
  data: { status: string; count: number }[];
  colors?: Record<string, string>;
  height?: number;
}

const DEFAULT_COLORS: Record<string, string> = {
  // Commandes
  draft:     '#6B7280', confirmed: '#3B82F6', preparing: '#F59E0B',
  shipped:   '#8B5CF6', delivered: '#10B981', cancelled: '#EF4444',
  // Factures
  paid:      '#10B981', partial: '#F59E0B', overdue: '#EF4444',
  sent:      '#3B82F6',
  // Devis
  accepted:  '#10B981', refused: '#EF4444', expired: '#F97316',
  converted: '#8B5CF6',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', confirmed: 'Confirmée', preparing: 'Préparation',
  shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée',
  paid: 'Payée', partial: 'Partielle', overdue: 'En retard',
  sent: 'Envoyée', accepted: 'Accepté', refused: 'Refusé',
  expired: 'Expirée', converted: 'Converti',
};

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { count: number } }[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300">{STATUS_LABELS[payload[0].name] ?? payload[0].name}</p>
      <p className="text-white font-bold">{payload[0].value}</p>
    </div>
  );
};

export function StatusPieChart({ data, colors = DEFAULT_COLORS, height = 200 }: StatusPieChartProps) {
  const filtered = data.filter(d => d.count > 0);
  if (!filtered.length) return <div className="flex items-center justify-center h-32 text-gray-500 text-sm">Aucune donnée</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="70%"
          paddingAngle={2}
        >
          {filtered.map((d, i) => (
            <Cell key={i} fill={colors[d.status] ?? DEFAULT_COLORS[d.status] ?? '#6B7280'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-gray-300">{STATUS_LABELS[value] ?? value}</span>
          )}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}