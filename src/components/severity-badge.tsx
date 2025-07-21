
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Vulnerability } from '@/types/scan';

const severityVariantMap: Record<string, 'destructive' | 'secondary' | 'default' | 'outline'> = {
  Critical: 'destructive',
  High: 'destructive',
  Medium: 'secondary',
  Low: 'default',
  Info: 'outline',
  Unknown: 'outline',
};

export const severityColorClassMap: Record<string, string> = {
  Critical: 'bg-red-600/80 border-red-500/60 hover:bg-red-600 text-red-100',
  High: 'bg-orange-600/80 border-orange-500/60 hover:bg-orange-600 text-orange-100',
  Medium: 'bg-yellow-600/80 border-yellow-500/60 hover:bg-yellow-600 text-yellow-100',
  Low: 'bg-blue-600/80 border-blue-500/60 hover:bg-blue-600 text-blue-100',
  Info: 'bg-gray-600/80 border-gray-500/60 hover:bg-gray-600 text-gray-100',
};

type SeverityBadgeProps = {
  severity: Vulnerability['severity'];
  count?: number;
  className?: string;
}

export const SeverityBadge = ({ severity, count, className }: SeverityBadgeProps) => {
  const variant = severityVariantMap[severity] || 'default';
  const colorClass = severityColorClassMap[severity] || '';

  return (
    <Badge
      variant={variant}
      className={cn(
        'capitalize',
        colorClass,
        className
      )}
    >
      {severity}
      {count && <span className="ml-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-black/20 text-xs">{count}</span>}
    </Badge>
  );
};
