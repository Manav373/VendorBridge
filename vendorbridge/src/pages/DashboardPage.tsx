import { useState, useEffect } from 'react';
import {
  FileText, Clock, ShoppingCart, AlertTriangle,
  Plus, Eye, ArrowRight, ChevronRight, Users,
  BrainCircuit
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { reportService } from '../services/report.service';
import { activityLogService } from '../services/activityLog.service';
import { formatCurrency, formatDateTime, getStatusVariant } from '../utils';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

const FALLBACK_STATS = {
  activeRFQs: 0,
  pendingApprovals: 0,
  procurementValue: 0,
  vendorCount: 0,
  monthlySpend: [
    { month: 'Jan', value: 0 }, { month: 'Feb', value: 0 },
    { month: 'Mar', value: 0 }, { month: 'Apr', value: 0 },
    { month: 'May', value: 0 }, { month: 'Jun', value: 0 },
  ],
  categorySpend: [],
  recentPOs: [],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(FALLBACK_STATS);
  const [activities, setActivities] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('Loading AI executive briefing...');

  useEffect(() => {
    Promise.all([
      reportService.getDashboardStats().catch(() => FALLBACK_STATS),
      activityLogService.getLogs({ limit: 4 }).catch(() => ({ data: { logs: [] } })),
    ]).then(([dashData, logData]) => {
      setStats(dashData ?? FALLBACK_STATS);
      setActivities(logData?.logs ?? logData?.data?.logs ?? []);

      // AI insight (non-blocking)
      import('../services/ai.service').then(({ aiService }) =>
        aiService.getProcurementInsights()
          .then((res: any) => setAiInsight(res?.summary ?? 'Procurement operations look healthy.'))
          .catch(() => setAiInsight('AI service unavailable. Check back shortly.'))
      );
    }).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <PageLoader />;

  const kpiCards = [
    {
      title: "Active RFQ's",
      value: stats.activeRFQs ?? 0,
      sub: 'Live procurement requests',
      icon: FileText,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      dot: 'bg-emerald-500',
      route: '/rfqs',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals ?? 0,
      sub: 'Awaiting authorization',
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      dot: 'bg-yellow-500',
      route: '/approvals',
    },
    {
      title: 'Total PO Value',
      value: formatCurrency(stats.procurementValue ?? 0),
      sub: 'Active purchase orders',
      icon: ShoppingCart,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      dot: 'bg-blue-500',
      route: '/purchase-orders',
    },
    {
      title: 'Active Vendors',
      value: stats.vendorCount ?? 0,
      sub: 'Registered suppliers',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      dot: 'bg-red-500',
      route: '/vendors',
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
              {formatCurrency(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const monthlySpend = stats.monthlySpend?.length ? stats.monthlySpend : FALLBACK_STATS.monthlySpend;
  const categorySpend = stats.categorySpend?.length ? stats.categorySpend : [];
  const recentPOs = stats.recentPOs ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="text-emerald-400 font-medium">{user?.firstName}</span> · Today's Overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/rfqs/create')} leftIcon={<Plus className="w-4 h-4" />}>
            New RFQ
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/vendors')} leftIcon={<Users className="w-4 h-4" />}>
            Add Vendor
          </Button>
          <Button size="sm" onClick={() => navigate('/reports')} leftIcon={<Eye className="w-4 h-4" />}>
            View Reports
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="kpi-card group cursor-pointer relative overflow-hidden" onClick={() => navigate(card.route)}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] rounded-full blur-xl group-hover:bg-white/[0.03] transition-colors" />
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <span className={`w-2 h-2 rounded-full ${card.dot} animate-pulse mt-1`} />
              </div>
              <div className="text-2xl font-bold text-foreground mb-0.5">{card.value}</div>
              <div className="text-xs font-semibold text-muted-foreground">{card.title}</div>
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Monthly Performance Summary (AI) */}
      <div className="bg-card/70 backdrop-blur-sm border border-border/80 rounded-xl p-5 relative overflow-hidden group shadow-[0_4px_20px_0_rgba(16,185,129,0.02)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-500" />
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 tracking-wider">AI Executive Briefing</span>
              <span className="text-[10px] text-muted-foreground/60">Live</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Procurement Intelligence Summary</h3>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1.5">{aiInsight}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Spend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Monthly Procurement Spend</h3>
                <p className="text-xs text-muted-foreground">Last 6 months</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlySpend}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Spend */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground">Spend by Category</h3>
            <p className="text-xs text-muted-foreground">Current year</p>
          </CardHeader>
          <CardContent>
            {categorySpend.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={categorySpend}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categorySpend.map((_entry: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {categorySpend.slice(0, 4).map((cat: any, i: number) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-muted-foreground">{cat.name}</span>
                      </div>
                      <span className="text-foreground font-medium">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No spend data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent POs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Recent Purchase Orders</h3>
                <p className="text-xs text-muted-foreground">Latest transactions</p>
              </div>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => navigate('/purchase-orders')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentPOs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No purchase orders yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="text-xs text-muted-foreground font-medium pb-3">PO ID</th>
                    <th className="text-xs text-muted-foreground font-medium pb-3">Vendor</th>
                    <th className="text-xs text-muted-foreground font-medium pb-3 text-right">Amount</th>
                    <th className="text-xs text-muted-foreground font-medium pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentPOs.map((po: any) => (
                    <tr key={po.id} className="table-row-hover cursor-pointer" onClick={() => navigate('/purchase-orders')}>
                      <td className="py-3 font-mono text-xs text-emerald-400">{po.poNumber ?? po.id}</td>
                      <td className="py-3 text-xs text-muted-foreground">{po.vendorName ?? po.vendor}</td>
                      <td className="py-3 text-xs font-medium text-right">{formatCurrency(po.grandTotal ?? po.amount)}</td>
                      <td className="py-3 text-right">
                        <Badge variant={getStatusVariant(po.status)}>{po.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
                <p className="text-xs text-muted-foreground">Latest system events</p>
              </div>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />} onClick={() => navigate('/activity-logs')}>
                See All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No activity yet</div>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 4).map((activity: any, i: number) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDateTime(activity.created_at ?? activity.timestamp)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{activity.module}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
