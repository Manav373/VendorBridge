import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Scale, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardContent } from './Card';
import { Badge } from './Badge';
import { formatCurrency } from '../../utils';

export function AIQuotationAnalysis() {
  // Mock comparison details for the charts
  const chartData = [
    { name: 'Infra Supplies (QT-001)', cost: 238500, delivery: 15, rating: 4.5, fill: '#10b981' },
    { name: 'Global Furniture (QT-002)', cost: 265000, delivery: 10, rating: 4.1, fill: '#3b82f6' },
    { name: 'Office Depot (QT-003)', cost: 218900, delivery: 20, rating: 4.0, fill: '#f59e0b' }
  ];

  // Mock Risk assessment
  const riskData = [
    {
      vendor: 'Infra Supplies',
      rating: 'Low Risk',
      variant: 'active' as const,
      details: [
        { type: 'Financial', status: 'Stable', text: 'Pricing is within 5% of historical average.', risk: 'low' },
        { type: 'Delivery', status: 'Moderate', text: '15-day delivery window matches lead requirements.', risk: 'low' },
        { type: 'Compliance', status: 'Excellent', text: 'All certifications and insurance policies are active.', risk: 'low' }
      ]
    },
    {
      vendor: 'Global Furniture Co',
      rating: 'Medium Risk',
      variant: 'pending' as const,
      details: [
        { type: 'Financial', status: 'Over Budget', text: 'Cost is 6% above the authorized RFQ budget.', risk: 'medium' },
        { type: 'Delivery', status: 'Safe', text: '10-day turnaround is highly secure.', risk: 'low' },
        { type: 'Contract', status: 'Needs Review', text: 'Installation liability clauses are non-standard.', risk: 'medium' }
      ]
    },
    {
      vendor: 'Office Depot Pro',
      rating: 'High Risk',
      variant: 'rejected' as const,
      details: [
        { type: 'Delivery', status: 'Critical', text: '20-day timeline has less than 2 days safety buffer.', risk: 'high' },
        { type: 'Financial', status: 'Excellent', text: 'Saves $19,600 compared to default budgeted reference.', risk: 'low' },
        { type: 'Service', status: 'Slight Concern', text: 'Warranty claims are managed by third-party partner.', risk: 'medium' }
      ]
    }
  ];

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2.5 shadow-xl text-xs">
          <p className="font-semibold text-foreground">{payload[0].payload.name}</p>
          <p className="text-emerald-400 mt-1 font-medium">Cost: {formatCurrency(payload[0].value)}</p>
          <p className="text-blue-400 font-medium">Delivery: {payload[0].payload.delivery} days</p>
          <p className="text-yellow-400 font-medium">Rating: {payload[0].payload.rating}/5</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top summary recommendation banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/20 border border-emerald-500/30">
          <Scale className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase font-extrabold bg-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full tracking-wider">AI Procurement Intelligence</span>
            <span className="text-xs text-muted-foreground">Analysis Mode: Multi-Objective Decision Support</span>
          </div>
          <h4 className="text-sm font-bold text-foreground">AI Recommendation Summary:</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The AI model recommends <span className="text-emerald-400 font-semibold">Infra Supplies Pvt Ltd (QT-2025-001)</span> as the optimal candidate. It yields a cost-saving of <span className="text-emerald-400 font-bold">$26,500 (10%)</span> compared to the high-end bid, maintains a secure safety lead buffer of 5 days prior to deadline, and leverages an established 95% performance history.
          </p>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost Comparison Chart */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-foreground">AI Bid Cost Comparison</h3>
            <p className="text-xs text-muted-foreground">Total quoted amounts vs. lower target preference</p>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-border/20 text-muted-foreground">
              <span>Best Bid: <strong className="text-emerald-400">$218,900 (Office Depot)</strong></span>
              <span>Average Bid: <strong>$240,800</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Timeline Comparison */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-foreground">Delivery Timeline & Margin buffer</h3>
            <p className="text-xs text-muted-foreground">Fulfillment latency (days) - lower is better</p>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 25]} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="delivery" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={25}>
                    {chartData.map((entry, index) => {
                      // Color code based on delivery days
                      const col = entry.delivery <= 10 ? '#3b82f6' : entry.delivery <= 15 ? '#10b981' : '#f59e0b';
                      return <Cell key={`cell-${index}`} fill={col} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-border/20 text-muted-foreground">
              <span>Fastest Delivery: <strong className="text-blue-400">10 days (Global)</strong></span>
              <span>Deadline Limit: <strong className="text-red-400">22 days</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <Card className="glass-card">
        <CardHeader>
          <h3 className="text-sm font-semibold text-foreground">AI Comparative Decision Matrix</h3>
          <p className="text-xs text-muted-foreground">Granular verification of non-financial clauses</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="py-2.5 font-semibold">Evaluation Factor</th>
                  <th className="py-2.5 text-center font-semibold">Infra Supplies</th>
                  <th className="py-2.5 text-center font-semibold">Global Furniture</th>
                  <th className="py-2.5 text-center font-semibold">Office Depot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {[
                  { factor: 'Extended Warranty', infra: '1 Year Included', global: '2 Years Included', depot: '6 Months Std' },
                  { factor: 'Installation SLA', infra: 'Self-Setup Required', global: 'White-Glove Included', depot: 'Partner (Paid)' },
                  { factor: 'Payment Terms', infra: 'Net 45 (Flexible)', global: 'Net 30 (Standard)', depot: 'Immediate 10%' },
                  { factor: 'Carbon Offsetting', infra: 'Gold Certified', global: 'Neutral Certified', depot: 'None Documented' }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/10">
                    <td className="py-3 font-medium text-foreground">{row.factor}</td>
                    <td className="py-3 text-center text-muted-foreground">{row.infra}</td>
                    <td className="py-3 text-center text-muted-foreground">{row.global}</td>
                    <td className="py-3 text-center text-muted-foreground">{row.depot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Risk Assessment Indicators */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                AI Risk Assessment Panel
              </h3>
              <p className="text-xs text-muted-foreground font-light">Evaluated based on reliability, financial compliance, and delivery buffer thresholds</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {riskData.map((risk, idx) => (
              <div key={idx} className="border border-border/40 rounded-xl p-4 bg-muted/10 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{risk.vendor}</span>
                  <Badge
                    variant={risk.variant}
                    className="text-[9px] uppercase font-bold"
                  >
                    {risk.rating}
                  </Badge>
                </div>
                
                <div className="space-y-2 pt-1">
                  {risk.details.map((detail, dIdx) => (
                    <div key={dIdx} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground font-medium">{detail.type} · <span className="text-foreground">{detail.status}</span></span>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          detail.risk === 'high' ? 'bg-red-500 animate-pulse' :
                          detail.risk === 'medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`} />
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 leading-normal">{detail.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
