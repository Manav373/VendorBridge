import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Sparkles, Shield, Zap, RefreshCw } from 'lucide-react';
import { approvalService, type Approval } from '../services/approval.service';
import { formatCurrency, formatDate, getStatusVariant } from '../utils';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Loading';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [animatingSteps, setAnimatingSteps] = useState<number[]>([]);
  const [showSuccessBurst, setShowSuccessBurst] = useState(false);
  const { toast } = useToast();

  const loadApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res: any = await approvalService.getApprovals({ limit: 50 });
      const data = res?.data ?? res;
      const list = data?.approvals ?? [];
      setApprovals(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch {
      toast({ type: 'error', title: 'Error', description: 'Failed to load approvals.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadApprovals(); }, [loadApprovals]);

  const selected = approvals.find(a => a.id === selectedId) ?? approvals[0];

  const handleApprove = async (id: string) => {
    if (approvingId) return;
    setApprovingId(id);

    const currentApproval = approvals.find(a => a.id === id);
    if (!currentApproval) return;

    // Animate timeline steps
    const steps = currentApproval.timeline ?? [];
    const pendingIndices = steps.map((s, i) => ({ s, i })).filter(({ s }) => s.step_status !== 'completed').map(({ i }) => i);
    let delay = 0;
    pendingIndices.forEach((stepIdx) => {
      delay += 400;
      setTimeout(() => setAnimatingSteps(prev => [...prev, stepIdx]), delay);
    });

    setTimeout(() => setShowSuccessBurst(true), delay + 200);

    try {
      await approvalService.approveRequest(id);
      setTimeout(() => {
        setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
        setApprovingId(null);
        setAnimatingSteps([]);
        setTimeout(() => setShowSuccessBurst(false), 1000);
        toast({ type: 'success', title: '✓ Approved!', description: 'Purchase order has been fully approved.' });
        loadApprovals();
      }, delay + 800);
    } catch (err: any) {
      setApprovingId(null);
      setAnimatingSteps([]);
      setShowSuccessBurst(false);
      toast({ type: 'error', title: 'Approval failed', description: err?.message ?? 'Please try again.' });
    }
  };

  const handleReject = async () => {
    if (!actionId) return;
    try {
      await approvalService.rejectRequest(actionId, rejectReason);
      setApprovals(prev => prev.map(a => a.id === actionId ? { ...a, status: 'rejected' } : a));
      setShowRejectModal(false);
      setRejectReason('');
      toast({ type: 'error', title: 'Rejected', description: 'Purchase order has been rejected.' });
      loadApprovals();
    } catch (err: any) {
      toast({ type: 'error', title: 'Reject failed', description: err?.message ?? 'Please try again.' });
    }
  };

  const isAnimating = (stepIdx: number) => animatingSteps.includes(stepIdx);

  if (isLoading) return <PageLoader />;

  const stepIcons = { completed: CheckCircle, pending: Clock, waiting: AlertCircle };
  const stepColors = {
    completed: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
    pending: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/40',
    waiting: 'text-muted-foreground bg-muted border-border',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Approval Workflow</h1>
          <p className="text-sm text-muted-foreground">Review and manage purchase order approvals</p>
        </div>
        <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadApprovals}>
          Refresh
        </Button>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', count: approvals.filter(a => a.status === 'pending').length, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: Clock },
          { label: 'Approved', count: approvals.filter(a => a.status === 'approved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
          { label: 'Rejected', count: approvals.filter(a => a.status === 'rejected').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`border rounded-xl p-4 flex flex-col items-center gap-1 transition-all duration-500 ${s.bg}`}>
              <Icon className={`w-5 h-5 ${s.color} mb-0.5`} />
              <p className={`text-3xl font-black tabular-nums transition-all duration-500 ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>

      {approvals.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No approvals pending</p>
          <p className="text-sm">All purchase orders have been processed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left panel */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">All Approvals</h3>
            {approvals.map(approval => (
              <div
                key={approval.id}
                onClick={() => setSelectedId(approval.id)}
                className={cn(
                  'p-4 rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden',
                  selected?.id === approval.id
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]'
                    : 'border-border bg-card hover:border-emerald-500/30 hover:bg-card/80',
                  approvingId === approval.id && 'animate-pulse border-emerald-500'
                )}
              >
                {approvingId === approval.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-[shimmer_1.2s_infinite]" />
                )}
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs text-emerald-400/80">{approval.approval_number}</span>
                  <Badge variant={getStatusVariant(approval.status)} className="capitalize text-[10px]">
                    {approvingId === approval.id ? 'Processing...' : approval.status}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-foreground leading-tight">{approval.title}</p>
                {approval.amount && (
                  <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(Number(approval.amount))}</p>
                )}
                <div className="mt-2.5">
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                    approval.priority === 'high' || approval.priority === 'urgent' ? 'bg-red-500/15 text-red-400' :
                    approval.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {approval.priority} priority
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right panel */}
          {selected && (
            <div className="lg:col-span-2 space-y-4 relative">
              {showSuccessBurst && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                  <div className="relative flex items-center justify-center">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="absolute rounded-full border-2 border-emerald-500 animate-ping"
                        style={{ width: `${80 + i * 40}px`, height: `${80 + i * 40}px`, animationDelay: `${i * 150}ms`, animationDuration: '800ms', opacity: 0.6 - i * 0.15 }}
                      />
                    ))}
                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.8)] animate-bounce">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Workflow Card */}
              <Card className={cn('transition-all duration-300', approvingId === selected.id && 'border-emerald-500/50 shadow-[0_0_24px_rgba(16,185,129,0.12)]')}>
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                        <h3 className="font-semibold text-sm text-foreground">Approval Workflow</h3>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{selected.title}</p>
                    </div>
                    <Badge variant={getStatusVariant(selected.status)} className="capitalize shrink-0">
                      {approvingId === selected.id ? 'Processing...' : selected.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {selected.timeline && selected.timeline.length > 0 ? (
                    <div className="relative pl-10">
                      {selected.timeline.map((step: any, i: number) => {
                        const animating = isAnimating(i) && approvingId === selected.id;
                        const isCompleted = step.step_status === 'completed' || (approvingId === selected.id && animating);
                        const isPending = step.step_status === 'pending' && !animating;
                        const isLast = i === selected.timeline!.length - 1;

                        const Icon = isCompleted ? CheckCircle : stepIcons[step.step_status as keyof typeof stepIcons] || Clock;
                        const colorClass = animating
                          ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                          : isCompleted ? stepColors.completed
                          : isPending ? stepColors.pending
                          : stepColors.waiting;

                        return (
                          <div key={step.id ?? i} className="relative pb-7 last:pb-0">
                            {!isLast && (
                              <div className="absolute left-[-20px] top-9 w-0.5 h-full bg-border overflow-hidden">
                                <div className={cn('w-full transition-all duration-700', isCompleted ? 'h-full bg-emerald-500' : 'h-0')} style={{ transitionDelay: animating ? '300ms' : '0ms' }} />
                              </div>
                            )}
                            <div className={cn('absolute left-[-28px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500', colorClass, animating && 'scale-110')}>
                              <Icon className={cn('w-4 h-4 transition-all duration-300', animating && 'animate-spin')} style={animating ? { animationDuration: '0.6s' } : {}} />
                            </div>
                            <div className={cn('transition-all duration-300', animating && 'translate-x-1')}>
                              <div className="flex items-center justify-between mb-0.5">
                                <p className={cn('text-sm font-semibold transition-colors duration-300', isCompleted || animating ? 'text-foreground' : 'text-muted-foreground')}>
                                  {step.step_name}
                                </p>
                                {(step.actioned_at || animating) && (
                                  <span className={cn('text-xs transition-colors', isCompleted ? 'text-emerald-400' : 'text-muted-foreground')}>
                                    {step.actioned_at ? formatDate(step.actioned_at) : 'Just now'}
                                  </span>
                                )}
                              </div>
                              <p className={cn('text-xs transition-colors duration-300', animating ? 'text-emerald-400 font-medium' : 'text-muted-foreground')}>
                                {animating ? `✓ Approved by ${step.actioned_by_name ?? 'System'}` :
                                 isCompleted ? `Completed by ${step.actioned_by_name ?? 'System'}` :
                                 isPending ? `Awaiting approval` :
                                 `Waiting`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No timeline steps defined</p>
                  )}
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card>
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-sm text-foreground">Approval Summary</h3>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                    {[
                      { label: 'Approval #', value: selected.approval_number },
                      { label: 'Amount', value: selected.amount ? formatCurrency(Number(selected.amount)) : '—' },
                      { label: 'Priority', value: selected.priority },
                      { label: 'Requested By', value: selected.requested_by_name ?? '—' },
                      { label: 'Request Date', value: formatDate(selected.created_at) },
                      { label: 'Status', value: selected.status },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5 capitalize">{value}</p>
                      </div>
                    ))}
                  </div>
                  {selected.remarks && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Remarks</p>
                      <p className="text-sm text-foreground">{selected.remarks}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {selected.status === 'pending' && !approvingId && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="danger"
                    className="flex-1 justify-center"
                    leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => { setActionId(selected.id); setShowRejectModal(true); }}
                  >
                    Reject
                  </Button>
                  <Button
                    className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-transform"
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => handleApprove(selected.id)}
                  >
                    Approve
                  </Button>
                </div>
              )}

              {approvingId === selected.id && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-pulse">
                  <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium text-emerald-400">Processing approval...</p>
                </div>
              )}

              {selected.status === 'approved' && !approvingId && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">Purchase order approved</p>
                    <p className="text-xs text-muted-foreground mt-0.5">All workflow steps completed successfully</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-yellow-400 ml-auto" />
                </div>
              )}

              {selected.status === 'rejected' && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-sm font-medium text-red-400">This purchase order has been rejected</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Purchase Order" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Please provide a reason for rejecting this purchase order.</p>
          <Textarea
            label="Rejection Reason *"
            placeholder="Explain why you're rejecting this PO..."
            rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1 justify-center" onClick={handleReject} leftIcon={<XCircle className="w-4 h-4" />}>
              Reject PO
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
