import { useToast } from '../../context/ToastContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils';

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => {
        const { icon: Icon, color, bg, border } = typeConfig[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              'relative overflow-hidden flex items-start gap-3 p-4 rounded-xl border shadow-2xl animate-fade-in bg-card',
              border
            )}
          >
            <div className={cn("absolute inset-0 pointer-events-none", bg)} />
            <Icon className={cn('w-5 h-5 mt-0.5 shrink-0 relative z-10', color)} />
            <div className="flex-1 min-w-0 relative z-10">
              <p className="text-sm font-semibold text-foreground">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-muted-foreground hover:text-foreground transition-colors relative z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
