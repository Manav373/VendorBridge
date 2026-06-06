import { cn } from '../../utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'active' | 'pending' | 'rejected' | 'draft' | 'completed' | 'outline';
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-muted text-muted-foreground',
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  rejected: 'bg-red-500/15 text-red-400 border border-red-500/20',
  draft: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  completed: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  outline: 'border border-border text-muted-foreground',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function getStatusVariant(status: string): BadgeProps['variant'] {
  const map: Record<string, BadgeProps['variant']> = {
    active: 'active',
    approved: 'active',
    completed: 'completed',
    pending: 'pending',
    draft: 'draft',
    rejected: 'rejected',
    cancelled: 'rejected',
    submitted: 'draft',
    sent: 'draft',
    inactive: 'outline',
    pending_approval: 'pending',
  };
  return map[status.toLowerCase()] || 'default';
}
