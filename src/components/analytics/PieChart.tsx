// frontend/src/components/analytics/PieChart.tsx
import { cn } from '@/lib/utils';

interface PieChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
}

export function PieChart({ data, size = 120 }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0 || total === 0) {
    return <p className="text-gray-500 text-sm">Aucune donnée</p>;
  }

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {data.map((d, i) => {
            const percentage = (d.value / total) * 100;
            const startAngle = data.slice(0, i).reduce((s, item) => s + (item.value / total) * 360, 0);
            const endAngle = startAngle + (d.value / total) * 360;

            const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);

            const largeArc = percentage > 50 ? 1 : 0;

            return (
              <path
                key={i}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={d.color || colors[i % colors.length]}
                stroke="#1F2937"
                strokeWidth="1"
              />
            );
          })}
          <circle cx="50" cy="50" r="20" fill="#1F2937" />
        </svg>
      </div>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: d.color || colors[i % colors.length] }}
            />
            <span className="text-gray-300">{d.label}</span>
            <span className="text-gray-500 ml-auto">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}