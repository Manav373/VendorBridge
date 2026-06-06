import { useState } from 'react';
import { Download, Printer, Mail, ChevronRight, ShoppingCart, FileText } from 'lucide-react';
import { mockPurchaseOrders } from '../services/mockData';
import { formatCurrency, formatDate, getStatusVariant } from '../utils';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils';

export default function PurchaseOrdersPage() {
  const [selectedId, setSelectedId] = useState(mockPurchaseOrders[0].id);
  const { toast } = useToast();

  const selected = mockPurchaseOrders.find(po => po.id === selectedId) || mockPurchaseOrders[0];

  const handleAction = (action: string) => {
    const msgs: Record<string, string> = {
      download: 'PDF downloaded successfully',
      print: 'Print dialog opened',
      email: 'PO emailed to vendor',
    };
    toast({ type: 'success', title: msgs[action], description: `${selected.id} · ${selected.vendorName}` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Purchase Orders & Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage all purchase orders and invoice tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => handleAction('download')}>
            Download PDF
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={() => handleAction('print')}>
            Print
          </Button>
          <Button size="sm" leftIcon={<Mail className="w-4 h-4" />} onClick={() => handleAction('email')}>
            Send Email
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* PO List */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Purchase Orders</h3>
          {mockPurchaseOrders.map(po => (
            <div
              key={po.id}
              onClick={() => setSelectedId(po.id)}
              className={cn(
                'p-3 rounded-xl border cursor-pointer transition-all',
                selectedId === po.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-border bg-card hover:border-emerald-500/30'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-emerald-400">{po.id}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">{po.vendorName.split(' ')[0]}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(po.grandTotal)}</p>
              <Badge variant={getStatusVariant(po.status)} className="mt-2 capitalize text-[10px]">
                {po.status.replace('_', ' ')}
              </Badge>
            </div>
          ))}
        </div>

        {/* PO Detail */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-foreground">Purchase Order & Invoice</span>
                  </div>
                  <p className="text-sm text-muted-foreground">PO #{selected.id} · auto-generated after approval</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getStatusVariant(selected.status)} className="capitalize">
                    {selected.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'PO Number', value: selected.id },
                  { label: 'Order Date', value: formatDate(selected.orderDate) },
                  { label: 'Expected Delivery', value: formatDate(selected.deliveryDate) },
                  { label: 'Due Date', value: formatDate(selected.dueDate) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vendor</p>
                  <p className="text-sm font-semibold text-foreground">{selected.vendorName}</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{selected.vendorAddress}</p>
                  <p className="text-xs text-muted-foreground">{selected.vendorGST}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bill To</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{selected.billTo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader><h3 className="font-semibold text-sm">Order Items</h3></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Item', 'Qty', 'Unit', 'Unit Price', 'Total'].map(h => (
                        <th key={h} className={`py-3 px-2 text-xs text-muted-foreground font-medium ${h === 'Item' ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {selected.items.map((item, i) => (
                      <tr key={i} className="table-row-hover">
                        <td className="py-3 px-2 font-medium">{item.name}</td>
                        <td className="py-3 px-2 text-right text-muted-foreground">{item.qty}</td>
                        <td className="py-3 px-2 text-right text-muted-foreground">{item.unit}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 px-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-border">
                    <tr>
                      <td colSpan={4} className="pt-3 px-2 text-right text-sm text-muted-foreground">Subtotal</td>
                      <td className="pt-3 px-2 text-right font-medium">{formatCurrency(selected.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="pt-1 px-2 text-right text-sm text-muted-foreground">Tax (18%)</td>
                      <td className="pt-1 px-2 text-right font-medium">{formatCurrency(selected.tax)}</td>
                    </tr>
                    {selected.shipping > 0 && (
                      <tr>
                        <td colSpan={4} className="pt-1 px-2 text-right text-sm text-muted-foreground">Shipping</td>
                        <td className="pt-1 px-2 text-right font-medium">{formatCurrency(selected.shipping)}</td>
                      </tr>
                    )}
                    <tr className="border-t border-border">
                      <td colSpan={4} className="pt-3 px-2 text-right font-bold">Grand Total</td>
                      <td className="pt-3 px-2 text-right text-lg font-bold text-emerald-400">{formatCurrency(selected.grandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Invoice section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Invoice Details
                </h3>
                {selected.invoiceNumber && (
                  <Badge variant="active">{selected.invoiceNumber}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selected.invoiceNumber ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice #</p>
                    <p className="text-sm font-semibold text-foreground">{selected.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice Date</p>
                    <p className="text-sm font-semibold text-foreground">{selected.invoiceDate ? formatDate(selected.invoiceDate) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due Amount</p>
                    <p className="text-sm font-bold text-red-400">{formatCurrency(selected.dueAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid Amount</p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(selected.paidAmount)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Invoice will be generated after delivery confirmation</p>
                  <Badge variant="pending" className="mt-2">Pending Payment</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
