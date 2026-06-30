// frontend/src/components/analytics/KPICard.tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
  progress?: number;
  progressColor?: string;
  href?: string;
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  icon, 
  color = 'text-indigo-400', 
  subtitle, 
  progress,
  progressColor = 'bg-indigo-500',
  href,
  className 
}: KPICardProps) {
  const content = (
    <div className={cn('bg-gray-900 border border-gray-800 rounded-xl p-4', href && 'hover:border-gray-700 hover:bg-gray-800/50 transition-colors', className)}>
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-xs mb-1">{title}</p>
        {icon && <span className={cn('w-4 h-4', color)}>{icon}</span>}
      </div>
      <p className={cn('text-xl font-bold', color)}>{value}</p>
      {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-500 text-xs">Avancement</span>
            <span className="text-gray-400 text-xs font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className={cn('h-full rounded-full transition-all', progressColor)} 
              style={{ width: `${Math.min(progress, 100)}%` }} 
            />
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}