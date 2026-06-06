import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Award, TrendingDown, Star, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { quotationService, type Quotation } from '../services/quotation.service';
import { approvalService } from '../services/approval.service';
import { formatCurrency } from '../utils';
import { Button } from '../components/ui/Button';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils';
import { AIVendorRecommendation } from '../components/ui/AIVendorRecommendation';
import { AIQuotationAnalysis } from '../components/ui/AIQuotationAnalysis';

export default function QuotationComparisonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rfqId = location.state?.rfqId;
  const rfqTitle = location.state?.rfqTitle;

  useEffect(() => {
    const fetchQuotations = async () => {
      if (!rfqId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res: any = await quotationService.getRFQQuotations(rfqId);
        const list = res?.data?.quotations ?? res?.data ?? res ?? [];
        setQuotations(list);
      } catch (err) {
        console.error(err);
        toast({ type: 'error', title: 'Error', description: 'Failed to load quotations for comparison.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuotations();
  }, [rfqId, toast]);

  if (isLoading) return <PageLoader />;

  if (!rfqId || quotations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Quotation Comparison</h1>
          <Button variant="ghost" onClick={() => navigate('/rfqs')}>Back to RFQs</Button>
        </div>
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8 text-yellow-400" />}
          title="No quotations to compare"
          description="There are no quotations received for this RFQ to perform comparison."
          action={<Button onClick={() => navigate('/rfqs')}>View RFQs</Button>}
        />
      </div>
    );
  }

  const lowestAmount = Math.min(...quotations.map(q => Number(q.total_amount)));
  const fastestDelivery = Math.min(...quotations.map(q => Number(q.delivery_days)));

  const handleSelect = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSelected(id);
    const q = quotations.find(q => q.id === id);
    if (!q) {
      setIsSubmitting(false);
      return;
    }

    try {
      await approvalService.createApproval({
        rfqId: q.rfq_id,
        quotationId: q.id,
        title: `Quotation Selected: ${q.vendor_name} for RFQ ${rfqTitle || q.rfq_id}`,
        amount: Number(q.total_amount),
        priority: 'medium'
      });
      toast({ type: 'success', title: 'Quotation Selected', description: `${q.vendor_name} selected. Proceeding to approval.` });
      setTimeout(() => navigate('/approvals'), 1500);
    } catch (err: any) {
      toast({ type: 'error', title: 'Selection Failed', description: err?.message ?? 'Failed to route to approvals.' });
      setIsSubmitting(false);
    }
  };

  const getFieldWinner = (values: number[], isLower = true) => {
    if (values.length === 0) return 0;
    const best = isLower ? Math.min(...values) : Math.max(...values);
    return best;
  };

  const fields = [
    { label: 'Grand Total', key: 'total_amount' as const, format: (v: number) => formatCurrency(v), winner: getFieldWinner(quotations.map(q => Number(q.total_amount))) },
    { label: 'Delivery (days)', key: 'delivery_days' as const, format: (v: number) => `${v} days`, winner: getFieldWinner(quotations.map(q => Number(q.delivery_days))) },
    { label: 'Rating', key: 'rating' as const, format: (v: number) => `${v || 0}/5`, winner: getFieldWinner(quotations.map(q => Number(q.rating ?? 0)), false), isHigherBetter: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Quotation Comparison</h1>
          <p className="text-sm text-muted-foreground">
            RFQ: {rfqTitle || 'RFQ Document'} · {quotations.length} quotations received
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/quotations', { state: { rfqId, rfqTitle } })}>Back</Button>
      </div>

      {/* AI Vendor Recommendation Widget */}
      <AIVendorRecommendation rfqId={rfqId} onSelectVendor={handleSelect} />

      {/* Alert */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Lowest price alert</p>
          <p className="text-xs text-muted-foreground">
            Accepting lowest price directly without approval may violate the approval workflow.
            Always route through the approval process.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <div className={`grid gap-4`} style={{ gridTemplateColumns: `200px repeat(${quotations.length}, minmax(180px, 1fr))` }}>
          {/* Header row */}
          <div />
          {quotations.map(q => {
            const isLowest = Number(q.total_amount) === lowestAmount;
            const isFastest = Number(q.delivery_days) === fastestDelivery;
            const isSelected = selected === q.id;
            return (
              <div
                key={q.id}
                className={cn(
                  'bg-card border rounded-xl p-4 transition-all',
                  isLowest && !isSelected ? 'border-emerald-500 bg-emerald-500/5' :
                  isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-border'
                )}
              >
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-base font-bold text-foreground mx-auto mb-2">
                    {q.vendor_name ? q.vendor_name[0] : 'V'}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{q.vendor_name}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= Math.floor(Number(q.rating ?? 0)) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{q.rating ?? 0}</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {isLowest && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full">
                        <TrendingDown className="w-3 h-3" /> Lowest Price
                      </span>
                    )}
                    {isFastest && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-full">
                        ⚡ Fastest
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Key metrics */}
          {fields.map(field => (
            <div key={field.label} className="contents">
              <div className="flex items-center bg-muted/30 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">{field.label}</span>
              </div>
              {quotations.map(q => {
                const val = Number(q[field.key as keyof Quotation] ?? 0);
                const isWinner = field.isHigherBetter ? val === field.winner : val === field.winner;
                return (
                  <div
                    key={q.id}
                    className={cn(
                      'flex items-center justify-center p-3 rounded-lg border transition-all',
                      isWinner ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-card border-border text-foreground'
                    )}
                  >
                    <span className={`text-sm font-bold ${isWinner ? 'text-emerald-400' : ''}`}>
                      {field.format(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Line Items */}
          <div className="flex items-start pt-3">
            <span className="text-sm font-medium text-muted-foreground">Line Items</span>
          </div>
          {quotations.map(q => (
            <div key={q.id} className="space-y-1.5 py-2">
              {(q.items || []).slice(0, 3).map((item, i) => (
                <div key={i} className="text-xs bg-muted/30 rounded-md p-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground truncate mr-2">{item.item_name}</span>
                    <span className="font-medium text-foreground shrink-0">{formatCurrency(Number(item.unit_price))}</span>
                  </div>
                </div>
              ))}
              {(q.items || []).length > 3 && (
                <p className="text-[10px] text-muted-foreground/60 text-center">+{(q.items || []).length - 3} more items</p>
              )}
            </div>
          ))}

          {/* Actions */}
          <div />
          {quotations.map(q => (
            <div key={q.id} className="pt-2">
              <Button
                className={`w-full justify-center ${selected === q.id ? 'bg-emerald-600' : ''}`}
                onClick={() => handleSelect(q.id)}
                disabled={isSubmitting}
                leftIcon={selected === q.id ? (isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />) : undefined}
              >
                {selected === q.id ? 'Selected' : 'Select Vendor'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* AI Quotation Analysis Panel */}
      <AIQuotationAnalysis rfqId={rfqId} />
    </div>
  );
}
