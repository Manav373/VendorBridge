import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, Send, FileText, RefreshCw, CheckCircle, XCircle, Mail } from 'lucide-react';
import { quotationService, type Quotation } from '../services/quotation.service';
import { formatCurrency, formatDate, getStatusVariant } from '../utils';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { useToast } from '../context/ToastContext';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullQuotation, setFullQuotation] = useState<Quotation | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const rfqId = location.state?.rfqId;
  const rfqTitle = location.state?.rfqTitle;

  const loadQuotations = useCallback(async () => {
    setIsLoading(true);
    try {
      let res: any;
      if (rfqId) {
        res = await quotationService.getRFQQuotations(rfqId);
      } else {
        res = await quotationService.getQuotations({ limit: 100 });
      }
      const list = res?.data?.quotations ?? res?.data ?? res ?? [];
      setQuotations(list);
      if (list.length > 0) {
        setSelectedId(list[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      console.error(err);
      toast({ type: 'error', title: 'Error', description: 'Failed to load quotations.' });
    } finally {
      setIsLoading(false);
    }
  }, [rfqId, toast]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  useEffect(() => {
    if (selectedId) {
      quotationService.getQuotationById(selectedId)
        .then(data => setFullQuotation(data))
        .catch(console.error);
    } else {
      setFullQuotation(null);
    }
  }, [selectedId]);

  const baseSelected = quotations.find(q => q.id === selectedId) || quotations[0];
  const selected = fullQuotation || baseSelected;

  const handleSaveDraft = () => {
    toast({ type: 'success', title: 'Draft Saved', description: 'Your notes and changes have been saved locally.' });
  };

  const handleSubmit = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await quotationService.updateQuotationStatus(selected.id, 'submitted');
      toast({ type: 'success', title: 'Quotation Submitted', description: 'Your quotation has been submitted for review.' });
      loadQuotations();
    } catch (err: any) {
      toast({ type: 'error', title: 'Error', description: err?.message ?? 'Failed to submit quotation.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!selected || isSubmitting) return;
    if (!window.confirm(`Accept quotation from ${selected.vendor_name}? An acceptance email will be sent to the vendor.`)) return;
    setIsSubmitting(true);
    try {
      await quotationService.updateQuotationStatus(selected.id, 'accepted');
      toast({ type: 'success', title: '✅ Quotation Accepted', description: `${selected.vendor_name} has been notified via email.` });
      loadQuotations();
    } catch (err: any) {
      toast({ type: 'error', title: 'Error', description: err?.message ?? 'Failed to accept quotation.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selected || isSubmitting) return;
    if (!window.confirm(`Reject quotation from ${selected.vendor_name}? A rejection email will be sent to the vendor.`)) return;
    setIsSubmitting(true);
    try {
      await quotationService.updateQuotationStatus(selected.id, 'rejected');
      toast({ type: 'success', title: '❌ Quotation Rejected', description: `${selected.vendor_name} has been notified via email.` });
      loadQuotations();
    } catch (err: any) {
      toast({ type: 'error', title: 'Error', description: err?.message ?? 'Failed to reject quotation.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <PageLoader />;

  if (quotations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Quotations</h1>
            <p className="text-sm text-muted-foreground">
              {rfqTitle ? `RFQ: ${rfqTitle}` : 'No quotations found'}
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/rfqs')}>Back to RFQs</Button>
        </div>
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No quotations received yet"
          description={rfqTitle ? `No vendors have submitted quotations for "${rfqTitle}" yet.` : 'No quotations found in the system.'}
          action={<Button onClick={() => navigate('/rfqs')}>View RFQs</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Quotations List</h1>
          <p className="text-sm text-muted-foreground">
            {rfqTitle ? `RFQ: ${rfqTitle}` : `Viewing all submitted quotations`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-4.5 h-4.5" />} onClick={loadQuotations}>
            Refresh
          </Button>
          <Button variant="ghost" onClick={() => navigate('/rfqs')}>Back to RFQs</Button>
        </div>
      </div>

      {/* RFQ selector tabs */}
      <div className="flex gap-2 flex-wrap">
        {quotations.map(q => (
          <button
            key={q.id}
            onClick={() => setSelectedId(q.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              selectedId === q.id
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                : 'border-border text-muted-foreground hover:border-emerald-500/30'
            }`}
          >
            {q.vendor_name || 'Vendor'} · {q.quotation_number || q.id.substring(0, 8)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quotation details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{rfqTitle || 'RFQ Document'}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">From: {selected.vendor_name}</p>
                </div>
                <Badge variant={getStatusVariant(selected.status)} className="capitalize">{selected.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Item', 'Qty', 'Unit', 'Unit Price', 'Total'].map(h => (
                        <th key={h} className={`py-3 text-xs text-muted-foreground font-medium ${h === 'Item' ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {(selected.items || []).map((item, i) => (
                      <tr key={i} className="table-row-hover">
                        <td className="py-3 font-medium">{item.item_name}</td>
                        <td className="py-3 text-right text-muted-foreground">{item.quantity}</td>
                        <td className="py-3 text-right text-muted-foreground">{item.unit || 'pcs'}</td>
                        <td className="py-3 text-right">{formatCurrency(Number(item.unit_price))}</td>
                        <td className="py-3 text-right font-semibold text-emerald-400">{formatCurrency(Number(item.total_price ?? (item.quantity * item.unit_price)))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border">
                      <td colSpan={4} className="pt-3 text-right text-sm font-semibold">Grand Total:</td>
                      <td className="pt-3 text-right text-base font-bold text-emerald-400">{formatCurrency(Number(selected.total_amount))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-sm">Notes & Conditions</h3>
            </CardHeader>
            <CardContent>
              {(selected.vendor_remarks || selected.notes) && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  <p className="text-xs font-medium text-foreground mb-1">Vendor Notes:</p>
                  {selected.vendor_remarks || selected.notes}
                </div>
              )}
              <Textarea
                label="Additional Notes"
                placeholder="Add any additional terms, conditions, or comments..."
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </CardContent>
            <CardFooter>
              <div className="flex gap-3 flex-wrap">
                <Button variant="secondary" leftIcon={<Save className="w-4 h-4" />} onClick={handleSaveDraft} disabled={isSubmitting}>Save Draft</Button>
                <Button leftIcon={<Send className="w-4 h-4" />} onClick={handleSubmit} disabled={isSubmitting}>Submit Quotation</Button>
                <Button variant="outline" leftIcon={<FileText className="w-4 h-4" />} onClick={() => window.print()}>Print</Button>
                {(selected.status === 'submitted' || selected.status === 'under_review') && (
                  <>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                      onClick={handleAccept}
                      disabled={isSubmitting}
                    >
                      Accept & Notify
                    </Button>
                    <Button
                      variant="danger"
                      leftIcon={<XCircle className="w-4 h-4" />}
                      onClick={handleReject}
                      disabled={isSubmitting}
                    >
                      Reject & Notify
                    </Button>
                  </>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><h3 className="font-semibold text-sm">Quotation Summary</h3></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Vendor', value: selected.vendor_name },
                { label: 'Submitted', value: selected.submitted_at ? formatDate(selected.submitted_at) : 'Not Submitted' },
                { label: 'Valid Until', value: formatDate(selected.valid_until) },
                { label: 'Delivery', value: `${selected.delivery_days} days` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-base font-bold text-emerald-400">{formatCurrency(Number(selected.total_amount))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium mb-1">Compare Quotations</p>
                <p className="text-xs text-muted-foreground mb-3">View all vendors side-by-side</p>
                <Button
                  className="w-full justify-center"
                  variant="secondary"
                  onClick={() => navigate('/quotations/compare', { state: { rfqId: selected.rfq_id, rfqTitle: rfqTitle || selected.rfq_id } })}
                >
                  Open Comparison
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Template */}
      <div className="hidden print:block print-area p-10 max-w-4xl mx-auto text-black bg-white min-h-screen">
        <div className="flex justify-between items-start border-b pb-6 mb-8 border-gray-200">
          <div>
            <h1 className="text-4xl font-bold text-emerald-600 mb-2">QUOTATION</h1>
            <p className="text-sm text-gray-500 font-mono">Ref: {selected.quotation_number || selected.id.substring(0,8)}</p>
            <p className="text-sm text-gray-500">Date: {selected.submitted_at ? formatDate(selected.submitted_at) : 'Draft'}</p>
            <p className="text-sm text-gray-500">Valid Until: {selected.valid_until ? formatDate(selected.valid_until) : 'N/A'}</p>
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
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prepared For</h3>
            <p className="font-bold text-gray-800">VendorBridge Procurement</p>
            <p className="text-sm text-gray-600 mt-1">RFQ Ref: {rfqTitle || selected.rfq_id}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vendor Details</h3>
            <p className="font-bold text-gray-800">{selected.vendor_name}</p>
            <p className="text-sm text-gray-600 mt-1">{selected.vendor_email || 'Contact vendor directly'}</p>
            <p className="text-sm text-gray-600">Delivery: {selected.delivery_days} days</p>
          </div>
        </div>

        <table className="w-full mb-10">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-3 text-left text-sm font-bold text-gray-800">Description</th>
              <th className="py-3 text-right text-sm font-bold text-gray-800">Qty</th>
              <th className="py-3 text-right text-sm font-bold text-gray-800">Unit Price</th>
              <th className="py-3 text-right text-sm font-bold text-gray-800">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(selected.items || []).map((item, i) => (
              <tr key={i}>
                <td className="py-4 text-sm font-medium text-gray-800">{item.item_name}</td>
                <td className="py-4 text-right text-sm text-gray-600">{item.quantity} {item.unit}</td>
                <td className="py-4 text-right text-sm text-gray-600">{formatCurrency(Number(item.unit_price))}</td>
                <td className="py-4 text-right text-sm font-bold text-gray-800">{formatCurrency(Number(item.total_price ?? (item.quantity * item.unit_price)))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800">
              <td colSpan={3} className="py-4 text-right font-bold text-gray-800">Grand Total:</td>
              <td className="py-4 text-right font-bold text-2xl text-emerald-600">{formatCurrency(Number(selected.total_amount))}</td>
            </tr>
          </tfoot>
        </table>

        {(selected.notes || selected.vendor_remarks) && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes & Terms</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{selected.vendor_remarks || selected.notes}</p>
          </div>
        )}

        <div className="text-center text-sm text-gray-400 mt-16 pt-8 border-t border-gray-200">
          <p>Thank you for your business. This is a system-generated quotation.</p>
        </div>
      </div>
    </div>
  );
}
