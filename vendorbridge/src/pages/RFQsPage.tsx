import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Send, FileText, Calendar, Users, ChevronRight, Lock, Mail, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { rfqService, type RFQ } from '../services/rfq.service';
import { formatDate, formatCurrency, getStatusVariant } from '../utils';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { EmptyState, PageLoader } from '../components/ui/Loading';
import { useToast } from '../context/ToastContext';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function RFQsPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadRFQs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res: any = await rfqService.getRFQs({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      const data = res?.data ?? res;
      setRfqs(data?.rfqs ?? []);
      setTotal(data?.pagination?.total ?? 0);
    } catch {
      toast({ type: 'error', title: 'Error', description: 'Failed to load RFQs.' });
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { loadRFQs(); }, [loadRFQs]);

  const handleSendToVendors = async (rfq: RFQ) => {
    try {
      await rfqService.updateRFQStatus(rfq.id, 'active');
      toast({ type: 'success', title: 'RFQ Activated', description: `${rfq.rfq_number} is now active.` });
      loadRFQs();
    } catch {
      toast({ type: 'error', title: 'Error', description: 'Failed to update RFQ status.' });
    }
  };

  const handleCloseRFQ = async (rfq: RFQ) => {
    if (!window.confirm(`Close RFQ ${rfq.rfq_number}? All assigned vendors will be notified via email.`)) return;
    try {
      await rfqService.updateRFQStatus(rfq.id, 'completed');
      toast({ type: 'success', title: '🔒 RFQ Closed', description: `${rfq.rfq_number} closed. Vendor emails sent.` });
      loadRFQs();
    } catch {
      toast({ type: 'error', title: 'Error', description: 'Failed to close RFQ.' });
    }
  };

  const handleDeleteRFQ = async (rfq: RFQ) => {
    if (!window.confirm(`Delete RFQ ${rfq.rfq_number}? This cannot be undone.`)) return;
    try {
      await rfqService.deleteRFQ(rfq.id);
      toast({ type: 'success', title: 'Deleted', description: `${rfq.rfq_number} has been deleted.` });
      loadRFQs();
    } catch {
      toast({ type: 'error', title: 'Error', description: 'Failed to delete RFQ.' });
    }
  };

  const statCounts = {
    total: total,
    active: rfqs.filter(r => r.status === 'active').length,
    draft: rfqs.filter(r => r.status === 'draft').length,
    completed: rfqs.filter(r => r.status === 'completed').length,
  };

  if (isLoading && rfqs.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Request for Quotations</h1>
          <p className="text-sm text-muted-foreground">Manage and track all procurement requests</p>
        </div>
        <Button onClick={() => navigate('/rfqs/create')} leftIcon={<Plus className="w-4 h-4" />}>
          Create RFQ
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total RFQs', value: statCounts.total, color: 'text-foreground' },
          { label: 'Active', value: statCounts.active, color: 'text-emerald-400' },
          { label: 'Draft', value: statCounts.draft, color: 'text-blue-400' },
          { label: 'Completed', value: statCounts.completed, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search RFQs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select options={statusOptions} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="sm:w-44" />
      </div>

      {/* Cards */}
      {rfqs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No RFQs found"
          description="Create your first RFQ to start the procurement process"
          action={<Button onClick={() => navigate('/rfqs/create')}>Create RFQ</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {rfqs.map(rfq => (
            <Card key={rfq.id} className="hover:border-emerald-500/20">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-emerald-400">{rfq.rfq_number}</span>
                      <Badge variant={getStatusVariant(rfq.status)} className="capitalize">{rfq.status}</Badge>
                      {rfq.priority === 'high' || rfq.priority === 'urgent' ? (
                        <Badge variant="danger" className="text-[10px] capitalize">{rfq.priority}</Badge>
                      ) : null}
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-2">{rfq.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Deadline: <span className="text-foreground">{formatDate(rfq.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {rfq.vendorCount ?? 0} vendors
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {rfq.itemCount ?? (rfq.items?.length ?? 0)} items
                      </div>
                      {rfq.estimated_value && (
                        <div className="flex items-center gap-1.5">
                          Est. Value: <span className="text-foreground font-medium">{formatCurrency(Number(rfq.estimated_value))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => navigate(`/quotations`)}
                    >
                      Quotations
                    </Button>
                    {rfq.status === 'draft' && (
                      <Button
                        size="sm"
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                        onClick={() => handleSendToVendors(rfq)}
                      >
                        Activate
                      </Button>
                    )}
                    {rfq.status === 'active' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Lock className="w-3.5 h-3.5" />}
                        onClick={() => handleCloseRFQ(rfq)}
                        className="text-orange-400 hover:text-orange-300 border-orange-500/20 hover:bg-orange-500/10"
                      >
                        Close RFQ
                      </Button>
                    )}
                    {(rfq.status === 'draft' || rfq.status === 'cancelled') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => handleDeleteRFQ(rfq)}
                        className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10"
                      >
                        Delete
                      </Button>
                    )}
                    <button
                      onClick={() => navigate('/rfqs/create')}
                      className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
