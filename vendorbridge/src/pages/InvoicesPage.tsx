import { useState } from 'react';
import { Receipt, DollarSign, Clock, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { mockPurchaseOrders } from '../services/mockData';
import { formatCurrency, formatDate } from '../utils';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils';

export default function InvoicesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  // Derive invoices from POs that have invoice numbers
  const invoices = mockPurchaseOrders.map(po => ({
    ...po,
    paymentStatus: po.invoiceNumber ? 'unpaid' : 'pending',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Invoices
          </h1>
          <p className="text-sm text-muted-foreground">Track and manage vendor invoices</p>
        </div>
        <Button
          leftIcon={<Download className="w-4 h-4" />}
          onClick={() => toast({ type: 'success', title: 'Invoice Downloaded', description: 'Invoice PDF saved.' })}
        >
          Download Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoiced', value: formatCurrency(invoices.reduce((s, i) => s + i.grandTotal, 0)), icon: DollarSign, color: 'text-foreground', bg: 'bg-card' },
          { label: 'Pending Payment', value: formatCurrency(invoices.reduce((s, i) => s + i.dueAmount, 0)), icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/5' },
          { label: 'Paid', value: formatCurrency(invoices.reduce((s, i) => s + i.paidAmount, 0)), icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { label: 'Overdue', value: '0', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/5' },
        ].map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={cn('rounded-xl border border-border p-4', c.bg)}>
              <Icon className={`w-5 h-5 ${c.color} mb-2`} />
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Invoice table */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-sm">Invoice List</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Invoice #', 'PO Reference', 'Vendor', 'Amount', 'Issue Date', 'Due Date', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {invoices.map(inv => (
                <tr
                  key={inv.id}
                  className={cn('table-row-hover cursor-pointer', selectedId === inv.id ? 'bg-emerald-500/5' : '')}
                  onClick={() => setSelectedId(inv.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-emerald-400">
                    {inv.invoiceNumber || <span className="text-muted-foreground italic">Pending</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inv.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                        {inv.vendorName[0]}
                      </div>
                      <span className="text-foreground text-xs">{inv.vendorName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(inv.grandTotal)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {inv.invoiceDate ? formatDate(inv.invoiceDate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={inv.paidAmount >= inv.grandTotal ? 'active' : inv.invoiceNumber ? 'pending' : 'draft'}>
                      {inv.paidAmount >= inv.grandTotal ? 'Paid' : inv.invoiceNumber ? 'Unpaid' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Download className="w-3 h-3" />}
                      onClick={e => { e.stopPropagation(); toast({ type: 'success', title: 'Downloaded', description: `Invoice for ${inv.vendorName}` }); }}
                    >
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
