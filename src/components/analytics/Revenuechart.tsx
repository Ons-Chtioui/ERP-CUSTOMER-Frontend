// src/components/analytics/RevenueChart.tsx
// Graphique CA mensuel avec Recharts (LineChart interactif)
'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
  height?: number;
}

// Tooltip custom avec style dark
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-indigo-400 font-mono font-bold">
        {Number(payload[0].value).toFixed(3)} DTN
      </p>
    </div>
  );
};

export function RevenueChart({ data, height = 220 }: RevenueChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  // Formater les mois "2024-01" → "Jan 24"
  const formattedData = data.map(d => ({
    ...d,
    label: new Date(d.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formattedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3B4EFF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B4EFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#6B7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6B7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${(Number(v) / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3B4EFF"
          strokeWidth={2.5}
          fill="url(#revenueGradient)"
          dot={{ fill: '#3B4EFF', strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5, fill: '#3B4EFF' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}