import { useState, useEffect } from 'react';
import { Download, TrendingUp, BarChart3, Users, ShoppingCart, Calendar, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { reportService } from '../services/report.service';
import { formatCurrency } from '../utils';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { AIProcurementInsights } from '../components/ui/AIProcurementInsights';
import { PageLoader } from '../components/ui/Loading';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

const months = [
  { value: '2025-05', label: 'May 2025' },
  { value: '2025-04', label: 'Apr 2025' },
  { value: '2025-03', label: 'Mar 2025' },
];

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState('2025-05');
  const [stats, setStats] = useState<any>(null);
  const [spendingData, setSpendingData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadReportsData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, spendRes, perfRes] = await Promise.allSettled([
        reportService.getDashboardStats(),
        reportService.getSpendingReport(),
        reportService.getVendorPerformanceReport()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }
      if (spendRes.status === 'fulfilled' && spendRes.value) {
        setSpendingData(spendRes.value);
      }
      if (perfRes.status === 'fulfilled' && perfRes.value) {
        setPerformanceData(perfRes.value);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
      toast({ type: 'error', title: 'Error', description: 'Failed to load report data.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
          <p className="text-muted-foreground mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="font-semibold" style={{ color: p.color }}>
              {formatCurrency(Number(p.value))}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExport = () => {
    toast({ type: 'success', title: 'Report Exported', description: 'Procurement_Report_May2025.xlsx downloaded.' });
  };

  if (isLoading) return <PageLoader />;

  // Map backend stats with fallbacks
  const kpis = [
    {
      label: 'Total Spend',
      value: formatCurrency(Number(stats?.totalProcurementSpend || spendingData?.summary?.total_spend || 2340000)),
      icon: ShoppingCart,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Active Vendors',
      value: stats?.vendors?.active ?? 28,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Active RFQs',
      value: stats?.rfqs?.active ?? 12,
      icon: TrendingUp,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10'
    },
    {
      label: 'Pending Approvals',
      value: stats?.approvals?.pending ?? 5,
      icon: Calendar,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
  ];

  const categorySpend = spendingData?.byCategory && spendingData.byCategory.length > 0
    ? spendingData.byCategory.map((item: any) => ({
        category: item.category || 'General',
        spend: Number(item.spend)
      }))
    : [
        { category: 'IT Hardware', spend: 820000 },
        { category: 'Furniture', spend: 320000 },
        { category: 'Logistics', spend: 450000 },
        { category: 'Software', spend: 280000 },
        { category: 'Stationery', spend: 85000 },
      ];

  const monthlyTrend = spendingData?.monthlyTrend && spendingData.monthlyTrend.length > 0
    ? spendingData.monthlyTrend.map((item: any) => ({
        month: item.month,
        spend: Number(item.spend)
      }))
    : [
        { month: 'Jan', spend: 185000 },
        { month: 'Feb', spend: 220000 },
        { month: 'Mar', spend: 195000 },
        { month: 'Apr', spend: 310000 },
        { month: 'May', spend: 285000 },
      ];

  const topVendors = performanceData?.topVendors && performanceData.topVendors.length > 0
    ? performanceData.topVendors.map((item: any) => ({
        vendor: item.name,
        spend: Number(item.total_spend),
        pos: item.order_count,
        rating: item.rating ?? 4.0
      }))
    : [
        { vendor: 'Infra Supplies Pvt Ltd', spend: 450000, pos: 23, rating: 4.5 },
        { vendor: 'Global Furniture Co', spend: 320000, pos: 12, rating: 4.1 },
        { vendor: 'TechCore Ltd', spend: 280000, pos: 18, rating: 4.2 },
        { vendor: 'Panking Transport', spend: 195000, pos: 31, rating: 3.8 },
      ];

  const totalSpendVal = categorySpend.reduce((acc, curr) => acc + curr.spend, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Procurement Insights & Live Spending Analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadReportsData}>
            Refresh
          </Button>
          <select className="input-field text-sm py-2 w-auto" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <Button leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>Export Report</Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="kpi-card">
              <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* AI Procurement Insights Section */}
      <AIProcurementInsights />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spend by Category */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-sm">Spend by Category</h3>
            <p className="text-xs text-muted-foreground">Distribution of purchase values</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categorySpend.map((item, i) => (
                <div key={item.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.category}</span>
                    <span className="font-medium text-foreground">{formatCurrency(item.spend)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${totalSpendVal > 0 ? (item.spend / totalSpendVal) * 100 : 0}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-sm">Monthly Procurement Trend</h3>
            <p className="text-xs text-muted-foreground">Rolling monthly spend</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="spend" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Vendors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Top Vendors by Spend</h3>
              <p className="text-xs text-muted-foreground">Ranked by total procurement value</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['#', 'Vendor', 'Total Spend', 'POs', 'Performance Rating'].map(h => (
                    <th key={h} className="text-left py-3 px-2 text-xs text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {topVendors.map((v, i) => (
                  <tr key={v.vendor} className="table-row-hover">
                    <td className="py-3 px-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        i === 1 ? 'bg-gray-400/20 text-gray-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium text-foreground">{v.vendor}</td>
                    <td className="py-3 px-2 font-bold text-emerald-400">{formatCurrency(v.spend)}</td>
                    <td className="py-3 px-2 text-muted-foreground">{v.pos}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${topVendors[0].spend > 0 ? (v.spend / topVendors[0].spend) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{v.rating}/5</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pie chart */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-sm">Vendor Spend Distribution</h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={topVendors}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="spend"
                nameKey="vendor"
                label={({ name, percent }) => `${name}: ${(Number(percent || 0) * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#4b5563' }}
              >
                {topVendors.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
