import { useState, useEffect } from 'react';
import { Award, BrainCircuit, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardHeader, CardContent } from './Card';
import { Badge } from './Badge';

export function AIVendorRecommendation({ onSelectVendor }: { onSelectVendor?: (vendorId: string) => void }) {
  // Mock AI recommendation details for the quotations
  const recommendationsData: Record<string, any> = {
    'QT-2025-001': {
      vendorName: 'Infra Supplies Pvt Ltd',
      score: 91,
      costEfficiency: 92,
      deliveryPerformance: 80,
      confidence: 89,
      status: 'Highly Recommended',
      explanation: [
        'Offers the best balance of pricing and delivery timeline.',
        'Cost is 10% lower than the average quotation price of $240,800.',
        'Consistent 95% SLA adherence across 23 past purchase orders.',
        'Payment terms are highly favorable (Net 45).'
      ],
      pros: ['Balanced Cost', 'High Past Rating', 'Favorable Payment Terms'],
      cons: ['Delivery takes 15 days (5 days slower than Global Furniture)']
    },
    'QT-2025-002': {
      vendorName: 'Global Furniture Co',
      score: 84,
      costEfficiency: 75,
      deliveryPerformance: 98,
      confidence: 82,
      status: 'Fastest Delivery Match',
      explanation: [
        'Fastest delivery timeline (10 days) among all respondents.',
        'Premium quality craftsmanship, but at a 11% cost premium.',
        'Installation services included, reducing internal operations workload.',
        'Solid rating (4.1/5) with 12 successful orders.'
      ],
      pros: ['Fastest Shipping', 'Includes Installation', 'Premium Build Quality'],
      cons: ['Highest overall cost ($265,000)']
    },
    'QT-2025-003': {
      vendorName: 'Office Depot Pro',
      score: 88,
      costEfficiency: 98,
      deliveryPerformance: 65,
      confidence: 94,
      status: 'Cost Leader',
      explanation: [
        'Lowest overall cost ($218,900), saving $46,100 compared to Global Furniture.',
        '98% cost efficiency score represents exceptional margin savings.',
        'Delivery timeline of 20 days is close to the RFQ limit and may pose a scheduling risk.',
        'Highly established vendor with strong credit terms.'
      ],
      pros: ['Lowest Pricing', 'Highest Budget Savings', 'Strong Financial Standing'],
      cons: ['Slowest delivery timeline (20 days)', 'Slightly lower historic rating (4.0)']
    }
  };

  const keys = Object.keys(recommendationsData);
  const [selectedQuoteId, setSelectedQuoteId] = useState(keys[0]);
  const current = recommendationsData[selectedQuoteId] || recommendationsData[keys[0]];

  // Animation for the score radial meter
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    setAnimatedScore(0);
    const timeout = setTimeout(() => {
      setAnimatedScore(current.score);
    }, 100);
    return () => clearTimeout(timeout);
  }, [selectedQuoteId, current.score]);

  // Radial calculation
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <Card className="glass-card border-emerald-500/20 shadow-[0_8px_32px_0_rgba(16,185,129,0.08)] relative overflow-hidden group">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-500" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="border-b border-border/40 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BrainCircuit className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              AI Vendor Recommendation Widget
            </h3>
            <p className="text-xs text-muted-foreground">Automated multi-dimensional vendor optimization evaluation</p>
          </div>
        </div>

        {/* Quote switcher tabs inside the widget */}
        <div className="flex bg-muted/65 p-1 rounded-lg border border-border/50 text-xs self-start md:self-auto">
          {keys.map((quoteId) => (
            <button
              key={quoteId}
              onClick={() => setSelectedQuoteId(quoteId)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedQuoteId === quoteId
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {quoteId === 'QT-2025-001' ? 'Infra' : quoteId === 'QT-2025-002' ? 'Global' : 'Office Depot'}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {/* Core Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* 1. Recommended Vendor Card */}
          <div className="space-y-3 p-4 bg-muted/20 border border-border/30 rounded-xl relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Award className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">AI Analysis Target</p>
              <h4 className="text-base font-bold text-foreground mt-1 truncate">{current.vendorName}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Quotation Ref: <span className="font-mono text-emerald-400">{selectedQuoteId}</span></p>
            </div>
            
            <div className="pt-2 flex flex-wrap gap-1">
              <Badge variant="active" className="text-[10px] px-2 py-0.5 font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {current.status}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-blue-400 border-blue-500/20 bg-blue-500/5">
                Match: {current.confidence}%
              </Badge>
            </div>

            <div className="pt-2 border-t border-border/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Vendor Profile</span>
              </div>
            </div>
          </div>

          {/* 2. Vendor Score Meter (Radial Gauge) */}
          <div className="flex flex-col items-center justify-center py-2 bg-muted/10 rounded-xl border border-border/10">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-muted-foreground/10"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Animated progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-emerald-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">{animatedScore}</span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none">AI Score</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Weighted overall vendor fit</p>
          </div>

          {/* 3. Indicators Grid (Cost and Delivery) */}
          <div className="space-y-4">
            {/* Cost Efficiency Indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-1">
                  💰 Cost Efficiency
                </span>
                <span className="text-emerald-400 font-bold">{current.costEfficiency}/100</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border/50">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{ width: `${current.costEfficiency}%` }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground/80">
                {current.costEfficiency >= 90 ? 'Exceptional savings potential' : 'Standard competitive margin'}
              </p>
            </div>

            {/* Delivery Performance Indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-1">
                  ⚡ Delivery Performance
                </span>
                <span className="text-blue-400 font-bold">{current.deliveryPerformance}/100</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border/50">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
                  style={{ width: `${current.deliveryPerformance}%` }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground/80">
                {current.deliveryPerformance >= 90 ? 'Critical priority speed' : 'Standard lead-time schedule'}
              </p>
            </div>
          </div>
        </div>

        {/* Pros & Cons Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
            <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Key Advantages (Pros)
            </h5>
            <ul className="text-xs space-y-1 text-muted-foreground">
              {current.pros.map((pro: string, i: number) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold select-none">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-3.5 bg-red-500/5 border border-red-500/10 rounded-xl">
            <h5 className="text-xs font-bold text-red-400 flex items-center gap-1 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Potential Considerations (Cons)
            </h5>
            <ul className="text-xs space-y-1 text-muted-foreground">
              {current.cons.map((con: string, i: number) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold select-none">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. Recommendation Explanation Panel */}
        <div className="p-4 bg-muted/40 border border-border/40 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            Recommendation Explanation Panel
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {current.explanation.map((item: string, idx: number) => (
              <div key={idx} className="flex gap-2 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <p className="leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive action */}
        {onSelectVendor && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onSelectVendor(selectedQuoteId)}
              className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-all border border-emerald-500/20 shadow-md shadow-emerald-950/20 active:scale-[0.98]"
            >
              Approve AI Recommendation & Route to Approvals
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
