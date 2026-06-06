import { useState } from 'react';
import { Search, Plus, Star, Phone, Mail, Globe, Edit, Trash2, Eye, Users } from 'lucide-react';
import { mockVendors } from '../services/mockData';
import { formatCurrency, getStatusVariant } from '../utils';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/Loading';
import { useToast } from '../context/ToastContext';

type Vendor = typeof mockVendors[0];

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'IT Hardware', label: 'IT Hardware' },
  { value: 'Software', label: 'Software' },
  { value: 'Logistics', label: 'Logistics' },
  { value: 'Stationery', label: 'Stationery' },
  { value: 'Furniture', label: 'Furniture' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function AddVendorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', category: '', country: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ type: 'success', title: 'Vendor added!', description: `${form.name} has been registered.` });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Vendor" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Vendor Name *" placeholder="Company Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" placeholder="vendor@company.com" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Phone" placeholder="+1 555 0123" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            options={categories.slice(1)}
            placeholder="Select category"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          />
          <Select
            label="Country"
            options={[{ value: 'India', label: 'India' }, { value: 'USA', label: 'USA' }, { value: 'UK', label: 'UK' }, { value: 'Germany', label: 'Germany' }]}
            placeholder="Select country"
            value={form.country}
            onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Vendor</Button>
        </div>
      </form>
    </Modal>
  );
}

function VendorDetailModal({ vendor, isOpen, onClose }: { vendor: Vendor | null; isOpen: boolean; onClose: () => void }) {
  if (!vendor) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={vendor.name} size="lg">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-xl font-bold text-emerald-400">{vendor.name[0]}</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{vendor.name}</h3>
            <p className="text-sm text-muted-foreground">{vendor.category}</p>
            <StarRating rating={vendor.rating} />
          </div>
          <Badge variant={getStatusVariant(vendor.status)} className="ml-auto capitalize">{vendor.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
          <div><p className="text-xs text-muted-foreground">Total Orders</p><p className="text-lg font-bold text-foreground">{vendor.totalOrders}</p></div>
          <div><p className="text-xs text-muted-foreground">Total Value</p><p className="text-lg font-bold text-foreground">{formatCurrency(vendor.totalValue)}</p></div>
        </div>

        <div className="space-y-2">
          {[
            { icon: Mail, label: 'Email', value: vendor.email },
            { icon: Phone, label: 'Phone', value: vendor.phone },
            { icon: Globe, label: 'Country', value: vendor.country },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-16">{label}:</span>
              <span className="text-foreground">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1">Send RFQ</Button>
          <Button className="flex-1" leftIcon={<Edit className="w-4 h-4" />}>Edit Vendor</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function VendorsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const { toast } = useToast();

  const filtered = mockVendors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || v.category === categoryFilter;
    const matchStatus = !statusFilter || v.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Vendors</h1>
          <p className="text-sm text-muted-foreground">Manage supplier profiles and registrations</p>
        </div>
        <Button onClick={() => setShowAdd(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Vendor
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Vendors', value: mockVendors.length, color: 'text-foreground' },
          { label: 'Active', value: mockVendors.filter(v => v.status === 'active').length, color: 'text-emerald-400' },
          { label: 'Pending', value: mockVendors.filter(v => v.status === 'pending').length, color: 'text-yellow-400' },
          { label: 'Inactive', value: mockVendors.filter(v => v.status === 'inactive').length, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              options={categories}
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="sm:w-48"
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="sm:w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Vendor', 'Category', 'Contact', 'Rating', 'Orders', 'Value', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<Users className="w-8 h-8" />}
                      title="No vendors found"
                      description="Try adjusting your filters or add a new vendor"
                      action={<Button size="sm" onClick={() => setShowAdd(true)}>Add Vendor</Button>}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map(vendor => (
                  <tr key={vendor.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                          {vendor.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground">{vendor.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{vendor.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted-foreground">{vendor.email}</p>
                      <p className="text-xs text-muted-foreground">{vendor.phone}</p>
                    </td>
                    <td className="px-4 py-3"><StarRating rating={vendor.rating} /></td>
                    <td className="px-4 py-3 text-center font-medium">{vendor.totalOrders}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(vendor.totalValue)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(vendor.status)} className="capitalize">{vendor.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedVendor(vendor)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toast({ type: 'info', title: 'Coming soon', description: 'Delete functionality in progress.' })}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Showing {filtered.length} of {mockVendors.length} vendors</p>
            <div className="flex items-center gap-1">
              {['1', '2', '3'].map(p => (
                <button key={p} className={`w-7 h-7 text-xs rounded-md transition-colors ${p === '1' ? 'bg-emerald-500 text-white' : 'hover:bg-muted text-muted-foreground'}`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <AddVendorModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <VendorDetailModal vendor={selectedVendor} isOpen={!!selectedVendor} onClose={() => setSelectedVendor(null)} />
    </div>
  );
}
