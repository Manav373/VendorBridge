import { useState } from 'react';
import { Download, TrendingUp, BarChart3, Users, ShoppingCart, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { mockReportsData } from '../services/mockData';
import { formatCurrency } from '../utils';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { AIProcurementInsights } from '../components/ui/AIProcurementInsights';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

const months = [
  { value: '2025-05', label: 'May 2025' },
  { value: '2025-04', label: 'Apr 2025' },
  { value: '2025-03', label: 'Mar 2025' },
];

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState('2025-05');
  const { toast } = useToast();
  const data = mockReportsData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
          <p className="text-muted-foreground mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="font-semibold" style={{ color: p.color }}>
              {formatCurrency(p.value)}
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Procurement Insights · May 2025</p>
        </div>
        <div className="flex gap-2">
          <select className="input-field text-sm py-2 w-auto" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <Button leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>Export Report</Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: formatCurrency(data.totalSpend / 1000) + 'K', icon: ShoppingCart, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Active Vendors', value: data.activeVendors, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Active RFQs', value: data.activeRFQs, icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Months Active', value: data.monthsActive, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map(kpi => {
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
            <p className="text-xs text-muted-foreground">May 2025</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.spendByCategory.map((item, i) => (
                <div key={item.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.category}</span>
                    <span className="font-medium text-foreground">{formatCurrency(item.spend)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(item.spend / data.spendByCategory[0].spend) * 100}%`,
                        backgroundColor: COLORS[i],
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
            <p className="text-xs text-muted-foreground">Jan–May 2025</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthlyTrend}>
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
            <Button variant="ghost" size="sm">View All Vendors</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['#', 'Vendor', 'Total Spend', 'POs', 'Performance'].map(h => (
                    <th key={h} className="text-left py-3 px-2 text-xs text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.topVendors.map((v, i) => (
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
                            style={{ width: `${(v.spend / data.topVendors[0].spend) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{((v.spend / data.topVendors[0].spend) * 100).toFixed(0)}%</span>
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
                data={data.topVendors}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="spend"
                nameKey="vendor"
                label={({ name, percent }) => `${name}: ${(Number(percent || 0) * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#4b5563' }}
              >
                {data.topVendors.map((_, i) => (
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
