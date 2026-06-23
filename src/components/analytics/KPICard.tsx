// frontend/src/components/analytics/KPICard.tsx
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
  className?: string;
}

export function KPICard({ title, value, icon, color = 'text-indigo-400', subtitle, className }: KPICardProps) {
  return (
    <div className={cn('bg-gray-900 border border-gray-800 rounded-xl p-4', className)}>
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-xs mb-1">{title}</p>
        {icon && <span className={cn('w-4 h-4', color)}>{icon}</span>}
      </div>
      <p className={cn('text-xl font-bold', color)}>{value}</p>
      {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}