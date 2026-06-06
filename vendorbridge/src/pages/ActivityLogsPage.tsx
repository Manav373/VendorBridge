import { useState, useEffect, useCallback } from 'react';
import { FileText, ShoppingCart, CheckCircle, Edit, Send, UserPlus, Clock, Activity, RefreshCw } from 'lucide-react';
import { activityLogService, type ActivityLog } from '../services/activityLog.service';
import { formatDateTime } from '../utils';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loading';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils';

const moduleFilters = ['All', 'auth', 'vendor', 'rfq', 'quotation', 'approval', 'po', 'invoice', 'report', 'ai', 'system'];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  USER_LOGIN: CheckCircle, USER_REGISTERED: UserPlus,
  VENDOR_CREATED: UserPlus, VENDOR_UPDATED: Edit, VENDOR_DELETED: FileText,
  RFQ_CREATED: FileText, RFQ_PUBLISHED: Send,
  APPROVAL_CREATED: Clock, APPROVAL_APPROVED: CheckCircle,
  PO_CREATED: ShoppingCart,
  default: Activity,
};

const moduleColors: Record<string, string> = {
  rfq: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  approval: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  vendor: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  quotation: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  po: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  auth: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  invoice: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
  system: 'bg-muted border-border text-muted-foreground',
  ai: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('month');
  const { toast } = useToast();

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 100 };
      if (filter !== 'All') params.module = filter;
      const res: any = await activityLogService.getLogs(params);
      const data = res?.data ?? res;
      setLogs(data?.logs ?? []);
    } catch {
      toast({ type: 'error', title: 'Error', description: 'Failed to load activity logs.' });
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter(log => {
    if (filter === 'All') return true;
    return log.module?.toLowerCase() === filter.toLowerCase();
  });

  const stats = {
    total: logs.length,
    rfq: logs.filter(l => l.module === 'rfq').length,
    approval: logs.filter(l => l.module === 'approval').length,
    vendor: logs.filter(l => l.module === 'vendor').length,
  };

  if (isLoading && logs.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Activity & Logs
          </h1>
          <p className="text-sm text-muted-foreground">Procurement audit trail and system activity</p>
        </div>
        <div className="flex gap-2">
          <select className="input-field text-xs py-1.5 w-auto" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadLogs}>
            Refresh
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: stats.total, color: 'text-foreground' },
          { label: 'RFQ Actions', value: stats.rfq, color: 'text-blue-400' },
          { label: 'Approvals', value: stats.approval, color: 'text-yellow-400' },
          { label: 'Vendor Actions', value: stats.vendor, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Module filters */}
      <div className="flex flex-wrap gap-2">
        {moduleFilters.map(m => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all border capitalize',
              filter === m
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                : 'border-border text-muted-foreground hover:border-emerald-500/30 hover:text-foreground'
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No activity logs found</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-4">
            {filtered.map(activity => {
              const IconComponent = iconMap[activity.action] ?? iconMap.default;
              const colorClass = moduleColors[activity.module?.toLowerCase() ?? ''] ?? 'bg-muted border-border text-muted-foreground';
              return (
                <div key={activity.id} className="relative pl-14">
                  <div className={`absolute left-2 top-1 w-8 h-8 rounded-full border flex items-center justify-center ${colorClass}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <Card className="hover:border-emerald-500/20">
                    <CardContent className="py-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">{activity.action}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${colorClass}`}>
                              {activity.module}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground/60">
                            {activity.user_name && <span>by {activity.user_name}</span>}
                            {activity.user_name && <span>·</span>}
                            <span>{formatDateTime(activity.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
