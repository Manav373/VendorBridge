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
import { mockDashboardStats, mockActivities } from '../services/mockData';
import { formatCurrency, formatDateTime, getStatusVariant } from '../utils';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats] = useState(mockDashboardStats);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 600);
  }, []);

  if (isLoading) return <PageLoader />;

  const kpiCards = [
    {
      title: "Active RFQ's",
      value: '12',
      sub: '3 closing this week',
      icon: FileText,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      dot: 'bg-emerald-500',
    },
    {
      title: 'Pending Approvals',
      value: '5',
      sub: '2 overdue by 18h',
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      dot: 'bg-yellow-500',
    },
    {
      title: 'POs This Month',
      value: '$ 2.3L',
      sub: '+12% vs last month',
      icon: ShoppingCart,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      dot: 'bg-blue-500',
    },
    {
      title: 'Overdue Invoices',
      value: '3',
      sub: 'Total ₹84,000 pending',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      dot: 'bg-red-500',
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
            <div key={card.title} className="kpi-card group cursor-pointer relative overflow-hidden">
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
              <span className="text-[10px] text-muted-foreground/60">Generated 10m ago</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Monthly Performance Summary</h3>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1.5">
              Procurement operations in May demonstrated a strong <strong className="text-emerald-400">94% overall Health Score</strong>. The average cycle latency decreased by <strong className="text-foreground">34 hours</strong> due to the adoption of automated approval templates. However, Legal reviews continue to restrict workflow velocity, and a delivery delay risk is highlighted on <strong className="text-yellow-400">Office Depot (QT-2025-003)</strong> in the active furniture refresh tender. Consolidating IT purchases is projected to save up to <strong className="text-emerald-400">$38,400</strong> this quarter.
            </p>
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
              <AreaChart data={stats.monthlySpend}>
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
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={stats.categorySpend}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.categorySpend.map((_entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {stats.categorySpend.slice(0, 4).map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="text-foreground font-medium">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
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
                {stats.recentPOs.map(po => (
                  <tr key={po.id} className="table-row-hover cursor-pointer" onClick={() => navigate('/purchase-orders')}>
                    <td className="py-3 font-mono text-xs text-emerald-400">{po.id}</td>
                    <td className="py-3 text-xs text-muted-foreground">{po.vendor}</td>
                    <td className="py-3 text-xs font-medium text-right">{formatCurrency(po.amount)}</td>
                    <td className="py-3 text-right">
                      <Badge variant={getStatusVariant(po.status)}>{po.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <div className="space-y-4">
              {mockActivities.slice(0, 4).map((activity, i) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDateTime(activity.timestamp)}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{activity.module}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
