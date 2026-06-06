import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, TrendingDown, Star, CheckCircle, AlertTriangle } from 'lucide-react';
import { mockQuotations } from '../services/mockData';
import { formatCurrency } from '../utils';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils';
import { AIVendorRecommendation } from '../components/ui/AIVendorRecommendation';
import { AIQuotationAnalysis } from '../components/ui/AIQuotationAnalysis';

export default function QuotationComparisonPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);

  const lowestAmount = Math.min(...mockQuotations.map(q => q.totalAmount));
  const fastestDelivery = Math.min(...mockQuotations.map(q => q.deliveryDays));

  const handleSelect = (id: string) => {
    setSelected(id);
    const q = mockQuotations.find(q => q.id === id);
    toast({ type: 'success', title: 'Quotation Selected', description: `${q?.vendorName} selected. Proceeding to approval.` });
    setTimeout(() => navigate('/approvals'), 1500);
  };

  const getFieldWinner = (values: number[], isLower = true) => {
    const best = isLower ? Math.min(...values) : Math.max(...values);
    return best;
  };

  const fields = [
    { label: 'Grand Total', key: 'totalAmount' as const, format: (v: number) => formatCurrency(v), winner: getFieldWinner(mockQuotations.map(q => q.totalAmount)) },
    { label: 'Delivery (days)', key: 'deliveryDays' as const, format: (v: number) => `${v} days`, winner: getFieldWinner(mockQuotations.map(q => q.deliveryDays)) },
    { label: 'Rating', key: 'rating' as const, format: (v: number) => `${v}/5`, winner: getFieldWinner(mockQuotations.map(q => q.rating), false), isHigherBetter: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Quotation Comparison</h1>
          <p className="text-sm text-muted-foreground">
            RFQ: Office Furniture Procurement Q2 · {mockQuotations.length} quotations received
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/quotations')}>Back</Button>
      </div>

      {/* AI Vendor Recommendation Widget */}
      <AIVendorRecommendation onSelectVendor={handleSelect} />

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
        <div className={`grid gap-4`} style={{ gridTemplateColumns: `200px repeat(${mockQuotations.length}, 1fr)` }}>
          {/* Header row */}
          <div />
          {mockQuotations.map(q => {
            const isLowest = q.totalAmount === lowestAmount;
            const isFastest = q.deliveryDays === fastestDelivery;
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
                    {q.vendorName[0]}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{q.vendorName}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= Math.floor(q.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{q.rating}</span>
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
                    {isLowest && isFastest && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-purple-500/15 text-purple-400 rounded-full">
                        <Award className="w-3 h-3" /> Recommended
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Key metrics */}
          {fields.map(field => (
            <>
              <div key={field.label} className="flex items-center bg-muted/30 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">{field.label}</span>
              </div>
              {mockQuotations.map(q => {
                const val = q[field.key] as number;
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
            </>
          ))}

          {/* Line Items */}
          <div className="flex items-start pt-3">
            <span className="text-sm font-medium text-muted-foreground">Line Items</span>
          </div>
          {mockQuotations.map(q => (
            <div key={q.id} className="space-y-1.5 py-2">
              {q.items.slice(0, 3).map((item, i) => (
                <div key={i} className="text-xs bg-muted/30 rounded-md p-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground truncate mr-2">{item.name}</span>
                    <span className="font-medium text-foreground shrink-0">{formatCurrency(item.unitPrice)}</span>
                  </div>
                </div>
              ))}
              {q.items.length > 3 && (
                <p className="text-[10px] text-muted-foreground/60 text-center">+{q.items.length - 3} more items</p>
              )}
            </div>
          ))}

          {/* Actions */}
          <div />
          {mockQuotations.map(q => (
            <div key={q.id} className="pt-2">
              <Button
                className={`w-full justify-center ${selected === q.id ? 'bg-emerald-600' : ''}`}
                onClick={() => handleSelect(q.id)}
                leftIcon={selected === q.id ? <CheckCircle className="w-4 h-4" /> : undefined}
              >
                {selected === q.id ? 'Selected' : 'Select Vendor'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* AI Quotation Analysis Panel */}
      <AIQuotationAnalysis />
    </div>
  );
}
