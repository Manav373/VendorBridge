import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Send, FileText } from 'lucide-react';
import { mockQuotations } from '../services/mockData';
import { formatCurrency, formatDate, getStatusVariant } from '../utils';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

export default function QuotationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(mockQuotations[0].id);
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const selected = mockQuotations.find(q => q.id === selectedId) || mockQuotations[0];

  const handleSubmit = () => {
    toast({ type: 'success', title: 'Quotation Submitted', description: 'Your quotation has been submitted for review.' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Submit Quotation</h1>
          <p className="text-sm text-muted-foreground">
            RFQ: {selected.rfqTitle} · Deadline: {formatDate('2025-06-15')}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/rfqs')}>Back to RFQs</Button>
      </div>

      {/* RFQ selector tabs */}
      <div className="flex gap-2 flex-wrap">
        {mockQuotations.map(q => (
          <button
            key={q.id}
            onClick={() => setSelectedId(q.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              selectedId === q.id
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                : 'border-border text-muted-foreground hover:border-emerald-500/30'
            }`}
          >
            {q.vendorName.split(' ')[0]} · {q.id}
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
                  <h3 className="font-semibold">{selected.rfqTitle}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">From: {selected.vendorName}</p>
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
                    {selected.items.map((item, i) => (
                      <tr key={i} className="table-row-hover">
                        <td className="py-3 font-medium">{item.name}</td>
                        <td className="py-3 text-right text-muted-foreground">{item.qty}</td>
                        <td className="py-3 text-right text-muted-foreground">{item.unit}</td>
                        <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-right font-semibold text-emerald-400">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border">
                      <td colSpan={4} className="pt-3 text-right text-sm font-semibold">Grand Total:</td>
                      <td className="pt-3 text-right text-base font-bold text-emerald-400">{formatCurrency(selected.totalAmount)}</td>
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
              {selected.notes && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  <p className="text-xs font-medium text-foreground mb-1">Vendor Notes:</p>
                  {selected.notes}
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
              <div className="flex gap-3">
                <Button variant="secondary" leftIcon={<Save className="w-4 h-4" />}>Save Draft</Button>
                <Button leftIcon={<Send className="w-4 h-4" />} onClick={handleSubmit}>Submit Quotation</Button>
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
                { label: 'Vendor', value: selected.vendorName },
                { label: 'Submitted', value: formatDate(selected.submittedDate) },
                { label: 'Valid Until', value: formatDate(selected.validUntil) },
                { label: 'Delivery', value: `${selected.deliveryDays} days` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-base font-bold text-emerald-400">{formatCurrency(selected.totalAmount)}</span>
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
                <Button className="w-full justify-center" variant="secondary" onClick={() => navigate('/quotations/compare')}>
                  Open Comparison
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
