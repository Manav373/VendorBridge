import { useState } from 'react';
import { Plus, Search, Eye, Send, FileText, Calendar, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockRFQs } from '../services/mockData';
import { formatDate, formatCurrency, getStatusVariant } from '../utils';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/Loading';
import { useToast } from '../context/ToastContext';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

export default function RFQsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const filtered = mockRFQs.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
          { label: 'Total RFQs', value: mockRFQs.length, color: 'text-foreground' },
          { label: 'Active', value: mockRFQs.filter(r => r.status === 'active').length, color: 'text-emerald-400' },
          { label: 'Draft', value: mockRFQs.filter(r => r.status === 'draft').length, color: 'text-blue-400' },
          { label: 'Completed', value: mockRFQs.filter(r => r.status === 'completed').length, color: 'text-purple-400' },
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
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No RFQs found"
          description="Create your first RFQ to start the procurement process"
          action={<Button onClick={() => navigate('/rfqs/create')}>Create RFQ</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(rfq => (
            <Card key={rfq.id} className="hover:border-emerald-500/20">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-emerald-400">{rfq.id}</span>
                      <Badge variant={getStatusVariant(rfq.status)} className="capitalize">{rfq.status}</Badge>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-2">{rfq.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Deadline: <span className="text-foreground">{formatDate(rfq.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {rfq.vendorCount} vendors
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {rfq.itemCount} items
                      </div>
                      <div className="flex items-center gap-1.5">
                        Est. Value: <span className="text-foreground font-medium">{formatCurrency(rfq.estimatedValue)}</span>
                      </div>
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
                        onClick={() => toast({ type: 'success', title: 'RFQ Sent', description: `${rfq.id} has been sent to vendors.` })}
                      >
                        Send to Vendors
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
