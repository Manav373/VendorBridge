import { useState } from 'react';
import { FileText, ShoppingCart, CheckCircle, Edit, Send, UserPlus, Clock, Activity } from 'lucide-react';
import { mockActivities } from '../services/mockData';
import { formatDateTime } from '../utils';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils';

const moduleFilters = ['All', 'RFQ', 'Vendors', 'Approvals', 'Invoices', 'Purchase Orders', 'Quotations'];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Send,
  UserPlus,
  CheckCircle,
  Edit,
  ShoppingCart,
  Clock,
  FileCheck: FileText,
};

const typeColors: Record<string, string> = {
  rfq: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  approval: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  vendor: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  quotation: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  po: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
};

export default function ActivityLogsPage() {
  const [filter, setFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('today');

  const filtered = mockActivities.filter(a => {
    if (filter === 'All') return true;
    return a.module.toLowerCase().includes(filter.toLowerCase());
  });

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
          <Button variant="secondary" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: mockActivities.length, color: 'text-foreground' },
          { label: 'RFQ Actions', value: mockActivities.filter(a => a.type === 'rfq').length, color: 'text-blue-400' },
          { label: 'Approvals', value: mockActivities.filter(a => a.type === 'approval').length, color: 'text-yellow-400' },
          { label: 'Vendor Actions', value: mockActivities.filter(a => a.type === 'vendor').length, color: 'text-purple-400' },
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
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
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
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {filtered.map(activity => {
            const Icon = iconMap[activity.icon] || FileText;
            const colorClass = typeColors[activity.type] || 'bg-muted border-border text-muted-foreground';
            return (
              <div key={activity.id} className="relative pl-14">
                <div className={`absolute left-2 top-1 w-8 h-8 rounded-full border flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <Card className="hover:border-emerald-500/20">
                  <CardContent className="py-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">{activity.action}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colorClass}`}>
                            {activity.module}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground/60">
                          <span>by {activity.user}</span>
                          <span>·</span>
                          <span>{formatDateTime(activity.timestamp)}</span>
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
    </div>
  );
}
