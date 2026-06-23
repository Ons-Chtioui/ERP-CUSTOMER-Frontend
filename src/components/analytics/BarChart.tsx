// frontend/src/components/analytics/BarChart.tsx
import { cn } from '@/lib/utils';

interface BarChartProps {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  color?: string;
  maxValue?: number;
}

export function BarChart({
  data,
  labelKey,
  valueKey,
  color = 'bg-indigo-500',
  maxValue,
}: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

  if (data.length === 0) {
    return <p className="text-gray-500 text-sm">Aucune donnée</p>;
  }

  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const value = Number(d[valueKey]) || 0;
        const percentage = (value / max) * 100;

        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-20 truncate">{String(d[labelKey])}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', color)}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className="text-white text-xs font-mono w-16 text-right">
              {value.toFixed(0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}