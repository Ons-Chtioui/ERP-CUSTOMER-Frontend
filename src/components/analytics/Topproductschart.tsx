// src/components/analytics/TopProductsChart.tsx
// BarChart horizontal des top produits avec Recharts
'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface TopProductsChartProps {
  data: { name: string; reference: string; quantity: number; revenue: number }[];
  metric?: 'quantity' | 'revenue';
  height?: number;
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: { payload: { name: string; quantity: number; revenue: number }; value: number }[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-medium mb-1">{d.name}</p>
      <p className="text-indigo-400">Qté : <span className="font-mono">{d.quantity}</span></p>
      <p className="text-green-400">CA HT : <span className="font-mono">{Number(d.revenue).toFixed(3)} DTN</span></p>
    </div>
  );
};

const COLORS = ['#3B4EFF', '#4F6EFF', '#6380FF', '#8B9FFF', '#A3B4FF'];

export function TopProductsChart({ data, metric = 'quantity', height = 280 }: TopProductsChartProps) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-32 text-gray-500 text-sm">Aucune donnée</div>;
  }

  const top5 = data.slice(0, 5).map(d => ({
    ...d,
    label: d.name.length > 14 ? d.name.slice(0, 14) + '…' : d.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={top5} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#6B7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="label"
          type="category"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1F2937' }} />
        <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
          {top5.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}