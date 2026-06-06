import { useState, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Printer, Mail, ChevronRight, ShoppingCart, FileText, RefreshCw } from 'lucide-react';
import { purchaseOrderService, type PurchaseOrder } from '../services/purchaseOrder.service';
import { formatCurrency, formatDate, getStatusVariant } from '../utils';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loading';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils';

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFull, setSelectedFull] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();

  const loadPOs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res: any = await purchaseOrderService.getPOs({ limit: 50 });
      const data = res?.data ?? res;
      const list: PurchaseOrder[] = data?.purchaseOrders ?? [];
      setPurchaseOrders(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch {
      toast({ type: 'error', title: 'Error', description: 'Failed to load purchase orders.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch full PO (with items) when selection changes
  useEffect(() => {
    if (!selectedId) return;
    purchaseOrderService.getPOById(selectedId)
      .then(po => setSelectedFull(po))
      .catch(() => {
        // Fallback to the list item (without items)
        const fallback = purchaseOrders.find(p => p.id === selectedId) ?? null;
        setSelectedFull(fallback);
      });
  }, [selectedId]);

  useEffect(() => { loadPOs(); }, [loadPOs]);

  const selected = selectedFull ?? purchaseOrders.find(po => po.id === selectedId) ?? purchaseOrders[0];

  const handleAction = async (action: string) => {
    if (!selected) return;

    if (action === 'print') {
      window.print();
      return;
    }

    if (action === 'download') {
      const element = document.getElementById(`po-print-${selected.id}`);
      if (!element) {
        toast({ type: 'error', title: 'Error', description: 'Print template not ready' });
        return;
      }
      const clone = element.cloneNode(true) as HTMLElement;
      // MUST remove 'hidden' — Tailwind applies display:none !important
      // which overrides our inline style, so html2canvas captures nothing
      clone.classList.remove('hidden', 'print:block');
      clone.style.display = 'block';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      document.body.appendChild(clone);

      toast({ type: 'info', title: 'Generating PDF', description: 'Please wait...' });

      html2canvas(clone, { scale: 2, useCORS: true, windowWidth: 1024 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Add a small margin (e.g. 0.4 inches)
        const margin = 0.4;
        const printWidth = pdfWidth - (margin * 2);
        const printHeight = (canvas.height * printWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, printHeight);
        pdf.save(`PO_${selected.po_number}.pdf`);
        
        document.body.removeChild(clone);
        toast({ type: 'success', title: 'Downloaded', description: `${selected.po_number} saved as PDF.` });
      }).catch((err) => {
        document.body.removeChild(clone);
        toast({ type: 'error', title: 'Error', description: 'Failed to generate PDF' });
        console.error('PDF generation error:', err);
      });
      return;
    }

    if (action === 'email') {
      toast({ type: 'info', title: 'Sending Email', description: 'Sending PO to vendor...' });
      try {
        await purchaseOrderService.sendEmail(selected.id);
        toast({ type: 'success', title: 'Email Sent', description: `PO ${selected.po_number} emailed to vendor successfully.` });
      } catch (err: any) {
        toast({ type: 'error', title: 'Failed to send email', description: err?.response?.data?.message || err.message });
      }
      return;
    }
  };

  if (isLoading) return <PageLoader />;

  if (purchaseOrders.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-xl font-bold">Purchase Orders</h1>
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No purchase orders yet</p>
          <p className="text-sm">Purchase orders will appear here after approvals are processed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Purchase Orders & Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage all purchase orders and invoice tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadPOs}>Refresh</Button>
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => handleAction('download')}>Download PDF</Button>
          <Button variant="secondary" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={() => handleAction('print')}>Print</Button>
          <Button size="sm" leftIcon={<Mail className="w-4 h-4" />} onClick={() => handleAction('email')}>Send Email</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* PO List */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Purchase Orders</h3>
          {purchaseOrders.map(po => (
            <div
              key={po.id}
              onClick={() => setSelectedId(po.id)}
              className={cn(
                'p-3 rounded-xl border cursor-pointer transition-all',
                selectedId === po.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-border bg-card hover:border-emerald-500/30'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-emerald-400">{po.po_number}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">{po.vendor_name?.split(' ')[0]}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(Number(po.grand_total))}</p>
              <Badge variant={getStatusVariant(po.status)} className="mt-2 capitalize text-[10px]">
                {po.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          ))}
        </div>

        {/* PO Detail */}
        {selected && (
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
                    <p className="text-sm text-muted-foreground">PO #{selected.po_number} · auto-generated after approval</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getStatusVariant(selected.status)} className="capitalize">
                      {selected.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'PO Number', value: selected.po_number },
                    { label: 'Order Date', value: formatDate(selected.order_date) },
                    { label: 'Expected Delivery', value: selected.delivery_date ? formatDate(selected.delivery_date) : '—' },
                    { label: 'Due Date', value: selected.due_date ? formatDate(selected.due_date) : '—' },
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
                    <p className="text-sm font-semibold text-foreground">{selected.vendor_name}</p>
                    {selected.bill_to && <p className="text-xs text-muted-foreground whitespace-pre-line mt-1">{selected.vendor_address}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bill To</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{selected.bill_to ?? '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            {selected.items && selected.items.length > 0 && (
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
                        {selected.items.map((item: any, i: number) => (
                          <tr key={i} className="table-row-hover">
                            <td className="py-3 px-2 font-medium">{item.item_name ?? item.name}</td>
                            <td className="py-3 px-2 text-right text-muted-foreground">{item.quantity ?? item.qty}</td>
                            <td className="py-3 px-2 text-right text-muted-foreground">{item.unit}</td>
                            <td className="py-3 px-2 text-right">{formatCurrency(Number(item.unit_price ?? item.unitPrice))}</td>
                            <td className="py-3 px-2 text-right font-semibold">{formatCurrency(Number(item.total_price ?? item.total))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-border">
                        <tr>
                          <td colSpan={4} className="pt-3 px-2 text-right text-sm text-muted-foreground">Subtotal</td>
                          <td className="pt-3 px-2 text-right font-medium">{formatCurrency(Number(selected.subtotal))}</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="pt-1 px-2 text-right text-sm text-muted-foreground">Tax ({selected.tax_percent ?? 18}%)</td>
                          <td className="pt-1 px-2 text-right font-medium">{formatCurrency(Number(selected.tax_amount))}</td>
                        </tr>
                        {Number(selected.shipping) > 0 && (
                          <tr>
                            <td colSpan={4} className="pt-1 px-2 text-right text-sm text-muted-foreground">Shipping</td>
                            <td className="pt-1 px-2 text-right font-medium">{formatCurrency(Number(selected.shipping))}</td>
                          </tr>
                        )}
                        <tr className="border-t border-border">
                          <td colSpan={4} className="pt-3 px-2 text-right font-bold">Grand Total</td>
                          <td className="pt-3 px-2 text-right text-lg font-bold text-emerald-400">{formatCurrency(Number(selected.grand_total))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Payment Details
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Grand Total</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(Number(selected.grand_total))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid Amount</p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(Number(selected.paid_amount))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due Amount</p>
                    <p className="text-sm font-bold text-red-400">{formatCurrency(Number(selected.due_amount))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Status</p>
                    <Badge variant={Number(selected.due_amount) === 0 ? 'active' : 'pending'} className="mt-1">
                      {Number(selected.due_amount) === 0 ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Print Template */}
      {selected && (
        <div id={`po-print-${selected.id}`} className="hidden print:block print-area p-10 max-w-4xl mx-auto text-black bg-white min-h-screen">
          <div className="flex justify-between items-start border-b pb-6 mb-8 border-gray-200">
            <div>
              <h1 className="text-4xl font-bold text-emerald-600 mb-2">PURCHASE ORDER</h1>
              <p className="text-sm text-gray-500 font-mono">PO #: {selected.po_number}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(selected.order_date)}</p>
              <p className="text-sm text-gray-500">Expected Delivery: {selected.delivery_date ? formatDate(selected.delivery_date) : 'N/A'}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800">VendorBridge</h2>
              <p className="text-sm text-gray-500">123 Procurement Ave, Suite 100</p>
              <p className="text-sm text-gray-500">Business City, 10001</p>
              <p className="text-sm text-gray-500">contact@vendorbridge.com</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vendor Details</h3>
              <p className="font-bold text-gray-800">{selected.vendor_name}</p>
              <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{selected.vendor_address || 'Address not provided'}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ship To / Bill To</h3>
              <p className="font-bold text-gray-800">VendorBridge Warehouse</p>
              <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{selected.bill_to || '123 Procurement Ave, Suite 100\nBusiness City, 10001'}</p>
            </div>
          </div>

          <table className="w-full mb-10">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="py-3 px-2 text-left text-sm font-bold text-gray-800">Description</th>
                <th className="py-3 px-2 text-right text-sm font-bold text-gray-800">Qty</th>
                <th className="py-3 px-2 text-right text-sm font-bold text-gray-800">Unit Price</th>
                <th className="py-3 px-2 text-right text-sm font-bold text-gray-800">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(selected.items || []).map((item: any, i: number) => (
                <tr key={i}>
                  <td className="py-4 px-2 text-sm font-medium text-gray-800">{item.item_name ?? item.name}</td>
                  <td className="py-4 px-2 text-right text-sm text-gray-600">{item.quantity ?? item.qty} {item.unit}</td>
                  <td className="py-4 px-2 text-right text-sm text-gray-600">{formatCurrency(Number(item.unit_price ?? item.unitPrice))}</td>
                  <td className="py-4 px-2 text-right text-sm font-bold text-gray-800">{formatCurrency(Number(item.total_price ?? item.total))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-800">
                <td colSpan={3} className="pt-4 px-2 text-right text-sm text-gray-600">Subtotal:</td>
                <td className="pt-4 px-2 text-right font-medium text-gray-800">{formatCurrency(Number(selected.subtotal))}</td>
              </tr>
              <tr>
                <td colSpan={3} className="pt-2 px-2 text-right text-sm text-gray-600">Tax ({selected.tax_percent ?? 18}%):</td>
                <td className="pt-2 px-2 text-right font-medium text-gray-800">{formatCurrency(Number(selected.tax_amount))}</td>
              </tr>
              {Number(selected.shipping) > 0 && (
                <tr>
                  <td colSpan={3} className="pt-2 px-2 text-right text-sm text-gray-600">Shipping:</td>
                  <td className="pt-2 px-2 text-right font-medium text-gray-800">{formatCurrency(Number(selected.shipping))}</td>
                </tr>
              )}
              <tr className="border-t border-gray-200 mt-2">
                <td colSpan={3} className="pt-4 px-2 text-right font-bold text-gray-800">Grand Total:</td>
                <td className="pt-4 px-2 text-right font-bold text-2xl text-emerald-600">{formatCurrency(Number(selected.grand_total))}</td>
              </tr>
            </tfoot>
          </table>

          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Terms & Instructions</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              1. Please supply items as per the delivery date mentioned above.
              2. Invoice must quote the PO Number.
              3. Payment terms are Net 30 days unless otherwise specified.
              {selected.notes ? `\n\nAdditional Notes: ${selected.notes}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t border-gray-200">
            <div>
              <div className="border-b border-gray-400 w-48 mb-2"></div>
              <p className="text-sm text-gray-500">Authorized Signature</p>
            </div>
            <div className="text-right text-sm text-gray-400">
              <p>System Generated Purchase Order</p>
              <p>VendorBridge ERP</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
