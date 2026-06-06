import { useState, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Receipt, DollarSign, Clock, CheckCircle, AlertCircle, Download, RefreshCw, Mail } from 'lucide-react';
import { invoiceService, type Invoice } from '../services/invoice.service';
import { formatCurrency, formatDate, getStatusVariant } from '../utils';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loading';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res: any = await invoiceService.getInvoices({ limit: 50 });
      const data = res?.data ?? res;
      const list: Invoice[] = data?.invoices ?? [];
      setInvoices(list);
      if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
    } catch {
      toast({ type: 'error', title: 'Error', description: 'Failed to load invoices.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const selectedInvoice = invoices.find(i => i.id === selectedId) || invoices[0];

  if (isLoading) return <PageLoader />;

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.grand_total), 0);
  const totalDue = invoices.reduce((s, i) => s + Number(i.due_amount), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.paid_amount), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  const handleDownloadPDF = (invoice: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const element = document.getElementById(`invoice-print-${invoice.id}`);
    if (!element) {
      toast({ type: 'error', title: 'Error', description: 'Template not ready for download' });
      return;
    }
    
    const clone = element.cloneNode(true) as HTMLElement;
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
      
      const margin = 0.3;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, printHeight);
      pdf.save(`Invoice_${invoice.invoice_number}.pdf`);
      
      document.body.removeChild(clone);
      toast({ type: 'success', title: 'Downloaded', description: `Invoice ${invoice.invoice_number} saved as PDF.` });
    }).catch((err) => {
      document.body.removeChild(clone);
      toast({ type: 'error', title: 'Error', description: 'Failed to generate PDF' });
      console.error('PDF generation error:', err);
    });
  };

  const handleMarkPaid = async (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (inv.status === 'paid') {
      toast({ type: 'info', title: 'Already Paid', description: `Invoice ${inv.invoice_number} is already marked as paid.` });
      return;
    }
    if (!window.confirm(`Mark invoice ${inv.invoice_number} as paid? A payment confirmation email will be sent to the vendor.`)) return;
    try {
      await invoiceService.updateInvoiceStatus(inv.id, 'paid');
      toast({ type: 'success', title: '✅ Payment Recorded', description: `Invoice ${inv.invoice_number} marked as paid. Email sent to vendor.` });
      loadInvoices();
    } catch (err: any) {
      toast({ type: 'error', title: 'Failed', description: err?.message ?? 'Could not update invoice status.' });
    }
  };

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
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadInvoices}>Refresh</Button>
          <Button
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => selectedInvoice && handleDownloadPDF(selectedInvoice)}
          >
            Download Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoiced', value: formatCurrency(totalInvoiced), icon: DollarSign, color: 'text-foreground', bg: 'bg-card' },
          { label: 'Pending Payment', value: formatCurrency(totalDue), icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/5' },
          { label: 'Paid', value: formatCurrency(totalPaid), icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { label: 'Overdue', value: String(overdueCount), icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/5' },
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
          {invoices.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No invoices yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Invoice #', 'Vendor', 'Amount', 'Issue Date', 'Due Date', 'Status', ''].map(h => (
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
                    <td className="px-4 py-3 font-mono text-xs text-emerald-400">{inv.invoice_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                          {(inv.vendor_name ?? '?')[0]}
                        </div>
                        <span className="text-foreground text-xs">{inv.vendor_name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(Number(inv.grand_total))}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(inv.invoice_date)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(inv.status)} className="capitalize">{inv.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Download className="w-3 h-3" />}
                          onClick={e => handleDownloadPDF(inv, e)}
                        >
                          PDF
                        </Button>
                        {inv.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<CheckCircle className="w-3 h-3" />}
                            onClick={e => handleMarkPaid(inv, e)}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Print Templates - Hidden from normal UI, rendered for EVERY invoice */}
      {invoices.map(inv => (
        <div key={inv.id} id={`invoice-print-${inv.id}`} className="hidden print:block print-area w-full max-w-[800px] mx-auto text-black bg-white p-8 font-sans" style={{ minHeight: '1056px' }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-wider uppercase mb-1">VendorBridge</h1>
              <p className="text-xs text-gray-600">123 Procurement Ave, Suite 100, Business City, NY 10001</p>
              <p className="text-xs text-gray-600">www.vendorbridge.com, contact@vendorbridge.com</p>
              <p className="text-xs font-bold text-gray-800 mt-1">+1 (555) 123-4567</p>
            </div>
            <div>
              <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                LOGO
              </div>
            </div>
          </div>

          {/* Bill To & Ship To */}
          <div className="flex gap-8 mb-8">
            <div className="flex-1">
              <h3 className="text-xs font-bold text-blue-900 border-b border-gray-400 pb-1 mb-2">BILL TO</h3>
              <p className="text-xs text-gray-800 font-semibold">{inv.vendor_name}</p>
              <p className="text-xs text-gray-600">Accounts Department</p>
              <p className="text-xs text-gray-600 whitespace-pre-line">Vendor Address Missing</p>
              <p className="text-xs text-gray-600">{inv.vendor_email}</p>
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-blue-900 border-b border-gray-400 pb-1 mb-2">SHIP TO</h3>
              <p className="text-xs text-gray-800 font-semibold">VendorBridge Warehouse</p>
              <p className="text-xs text-gray-600">Receiving Dept</p>
              <p className="text-xs text-gray-600">123 Procurement Ave</p>
              <p className="text-xs text-gray-600">+1 (555) 987-6543</p>
            </div>
            <div className="flex-1">
              <div className="flex text-xs mb-1"><span className="w-24 text-gray-600">Page</span> <span className="flex-1 border-b border-gray-400 text-right">1 of 1</span></div>
              <div className="flex text-xs mb-1"><span className="w-24 text-gray-600">Date</span> <span className="flex-1 border-b border-gray-400 text-right">{formatDate(inv.invoice_date)}</span></div>
              <div className="flex text-xs mb-1"><span className="w-24 text-gray-600">Date of Expiry</span> <span className="flex-1 border-b border-gray-400 text-right">{formatDate(inv.due_date)}</span></div>
              <div className="flex text-xs mb-1"><span className="w-24 text-gray-600">Invoice No.</span> <span className="flex-1 border-b border-gray-400 text-right">{inv.invoice_number}</span></div>
              <div className="flex text-xs mb-1"><span className="w-24 text-gray-600">Customer ID</span> <span className="flex-1 border-b border-gray-400 text-right">{inv.vendor_id?.substring(0,6) || 'CUST'}</span></div>
            </div>
          </div>

          {/* Shipment Information */}
          <h3 className="text-xs font-bold text-blue-900 border-b border-gray-400 pb-1 mb-2 mt-4">SHIPMENT INFORMATION</h3>
          <div className="flex gap-8 mb-8">
            <div className="flex-1 space-y-1">
              <div className="flex text-xs"><span className="w-32 text-gray-600">P.O. #</span> <span className="flex-1 border-b border-gray-400">{inv.po_number || ''}</span></div>
              <div className="flex text-xs"><span className="w-32 text-gray-600">P.O. Date</span> <span className="flex-1 border-b border-gray-400">{formatDate(inv.invoice_date)}</span></div>
              <div className="flex text-xs"><span className="w-32 text-gray-600">Letter of Credit #</span> <span className="flex-1 border-b border-gray-400"></span></div>
              <div className="flex text-xs"><span className="w-32 text-gray-600">Currency</span> <span className="flex-1 border-b border-gray-400">USD</span></div>
              <div className="flex text-xs"><span className="w-32 text-gray-600">Payment Terms</span> <span className="flex-1 border-b border-gray-400">Net 30</span></div>
              <div className="flex text-xs"><span className="w-32 text-gray-600">Est. Ship Date</span> <span className="flex-1 border-b border-gray-400"></span></div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex text-xs"><span className="w-36 text-gray-600">Mode of Transportation</span> <span className="flex-1 border-b border-gray-400"></span></div>
              <div className="flex text-xs"><span className="w-36 text-gray-600">Transportation Terms</span> <span className="flex-1 border-b border-gray-400"></span></div>
              <div className="flex text-xs"><span className="w-36 text-gray-600">Number of Packages</span> <span className="flex-1 border-b border-gray-400"></span></div>
              <div className="flex text-xs"><span className="w-36 text-gray-600">Est. Gross Weight</span> <span className="flex-1 border-b border-gray-400"></span></div>
              <div className="flex text-xs"><span className="w-36 text-gray-600">Est. Net Weight</span> <span className="flex-1 border-b border-gray-400"></span></div>
              <div className="flex text-xs"><span className="w-36 text-gray-600">Carrier</span> <span className="flex-1 border-b border-gray-400"></span></div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full mb-4 border-collapse border border-gray-400 text-xs mt-4">
            <thead>
              <tr className="bg-gray-100 text-gray-800 text-center font-bold">
                <th className="border border-gray-400 py-2 px-2">ITEM #</th>
                <th className="border border-gray-400 py-2 px-2 text-left">DESCRIPTION</th>
                <th className="border border-gray-400 py-2 px-2">UNIT</th>
                <th className="border border-gray-400 py-2 px-2">QTY</th>
                <th className="border border-gray-400 py-2 px-2">UNIT PRICE</th>
                <th className="border border-gray-400 py-2 px-2">SALES TAX</th>
                <th className="border border-gray-400 py-2 px-2 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-6">
                <td className="border border-gray-400 px-2 text-center">1</td>
                <td className="border border-gray-400 px-2 font-medium">Invoice Amount for PO {inv.po_number}</td>
                <td className="border border-gray-400 px-2 text-center">Lot</td>
                <td className="border border-gray-400 px-2 text-center">1</td>
                <td className="border border-gray-400 px-2 text-center">{formatCurrency(Number(inv.grand_total))}</td>
                <td className="border border-gray-400 px-2 text-center">0.00</td>
                <td className="border border-gray-400 px-2 text-right font-medium">{formatCurrency(Number(inv.grand_total))}</td>
              </tr>
              {[...Array(8)].map((_, i) => (
                <tr key={i} className="h-6">
                  <td className="border border-gray-400"></td>
                  <td className="border border-gray-400"></td>
                  <td className="border border-gray-400"></td>
                  <td className="border border-gray-400"></td>
                  <td className="border border-gray-400"></td>
                  <td className="border border-gray-400"></td>
                  <td className="border border-gray-400 text-right px-2 text-gray-500">0.00</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Sections */}
          <div className="flex gap-8 mt-2">
            <div className="w-1/2">
              <h3 className="text-xs font-bold text-blue-900 border-b border-gray-400 pb-1 mb-2">SPECIAL NOTES, TERMS OF SALE</h3>
              <div className="border-b border-gray-400 h-5 mb-2"></div>
              <div className="border-b border-gray-400 h-5 mb-2"></div>
              <div className="border-b border-gray-400 h-5 mb-2"></div>
              <div className="border-b border-gray-400 h-5 mb-2"></div>
            </div>
            
            <div className="w-1/2 text-[11px]">
              <div className="flex justify-end mb-1"><span className="w-48 text-right pr-4 text-gray-600">SUBTOTAL</span><span className="w-24 text-right border-b border-gray-400 font-medium">{formatCurrency(Number(inv.grand_total))}</span></div>
              <div className="flex justify-end mb-1"><span className="w-48 text-right pr-4 text-gray-600">SUBTOTAL LESS DISCOUNT</span><span className="w-24 text-right border-b border-gray-400 font-medium">{formatCurrency(Number(inv.grand_total))}</span></div>
              <div className="flex justify-end mb-1"><span className="w-48 text-right pr-4 text-gray-600">SUBJECT TO SALES TAX</span><span className="w-24 text-right border-b border-gray-400">0.00</span></div>
              <div className="flex justify-end mb-1"><span className="w-48 text-right pr-4 text-gray-600">TAX RATE</span><span className="w-24 text-right border-b border-gray-400">0.00%</span></div>
              <div className="flex justify-end mb-1"><span className="w-48 text-right pr-4 text-gray-600">TOTAL TAX</span><span className="w-24 text-right border-b border-gray-400">0.00</span></div>
              <div className="flex justify-end mb-1"><span className="w-48 text-right pr-4 text-gray-600">SHIPPING/HANDLING</span><span className="w-24 text-right border-b border-gray-400">0.00</span></div>
              <div className="flex justify-end mb-1"><span className="w-48 text-right pr-4 text-gray-600">INSURANCE</span><span className="w-24 text-right border-b border-gray-400">0.00</span></div>
              <div className="flex justify-end mb-1"><span className="w-48 text-right pr-4 text-gray-600">{"<OTHER>"}</span><span className="w-24 text-right border-b border-gray-400">0.00</span></div>
              <div className="flex justify-end mb-4"><span className="w-48 text-right pr-4 text-gray-600">{"<OTHER>"}</span><span className="w-24 text-right border-b border-gray-400">0.00</span></div>
              
              <div className="flex justify-end items-center font-bold text-sm mt-2">
                <span className="text-right pr-4 text-gray-800">Invoice Total $</span>
                <span className="w-24 text-right border-b-2 border-black pb-1">{formatCurrency(Number(inv.grand_total)).replace('$', '')}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs font-bold text-gray-800">
            I declare that the above information is true and correct to the best of my knowledge.
          </div>
          <div className="flex gap-8 mt-8">
            <div className="flex-1 flex items-end">
              <span className="text-xs text-gray-600 mr-2">Signature</span>
              <div className="flex-1 border-b border-gray-800 h-4"></div>
            </div>
            <div className="flex-1 flex items-end">
              <span className="text-xs text-gray-600 mr-2">Date</span>
              <div className="flex-1 border-b border-gray-800 h-4"></div>
            </div>
            <div className="flex-1"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
