import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Star, Phone, Mail, Globe, Edit, Trash2, Eye, Users, CheckCircle, XCircle, Ban } from 'lucide-react';
import { vendorService, type Vendor } from '../services/vendor.service';
import { formatCurrency, getStatusVariant } from '../utils';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState, PageLoader } from '../components/ui/Loading';
import { useToast } from '../context/ToastContext';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.floor(Number(rating)) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

function VendorFormModal({ isOpen, onClose, onSaved, vendorToEdit }: { isOpen: boolean; onClose: () => void; onSaved: () => void; vendorToEdit?: Vendor | null }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', category: '', country: '',
    city: '', address: '', gstNumber: '', contactPerson: '',
  });

  useEffect(() => {
    if (vendorToEdit) {
      setForm({
        name: vendorToEdit.name || '',
        email: vendorToEdit.email || '',
        phone: vendorToEdit.phone || '',
        category: vendorToEdit.category || '',
        country: vendorToEdit.country || '',
        city: vendorToEdit.city || '',
        address: vendorToEdit.address || '',
        gstNumber: vendorToEdit.gst_number || '',
        contactPerson: vendorToEdit.contact_person || '',
      });
    } else {
      setForm({ name: '', email: '', phone: '', category: '', country: '', city: '', address: '', gstNumber: '', contactPerson: '' });
    }
  }, [vendorToEdit, isOpen]);

  const categoryOptions = [
    { value: 'Electronics', label: 'Electronics' },
    { value: 'IT Hardware', label: 'IT Hardware' },
    { value: 'Software', label: 'Software' },
    { value: 'Logistics', label: 'Logistics' },
    { value: 'Stationery', label: 'Stationery' },
    { value: 'Furniture', label: 'Furniture' },
    { value: 'IT Services', label: 'IT Services' },
    { value: 'Printing', label: 'Printing' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.category) {
      toast({ type: 'error', title: 'Missing fields', description: 'Name, email and category are required.' });
      return;
    }
    setLoading(true);
    try {
      if (vendorToEdit) {
        await vendorService.updateVendor(vendorToEdit.id, form);
        toast({ type: 'success', title: 'Vendor Updated', description: `${form.name} has been updated.` });
      } else {
        await vendorService.createVendor(form);
        toast({ type: 'success', title: 'Vendor Added!', description: `${form.name} has been registered.` });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ type: 'error', title: vendorToEdit ? 'Update failed' : 'Failed to add vendor', description: err?.message ?? 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={vendorToEdit ? "Edit Vendor" : "Add New Vendor"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Vendor Name *" placeholder="Company Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email *" placeholder="vendor@company.com" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="Phone" placeholder="+91 9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category *"
            options={categoryOptions}
            placeholder="Select category"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          />
          <Select
            label="Country"
            options={[
              { value: 'India', label: 'India' },
              { value: 'USA', label: 'USA' },
              { value: 'UK', label: 'UK' },
              { value: 'Germany', label: 'Germany' },
              { value: 'Singapore', label: 'Singapore' },
            ]}
            placeholder="Select country"
            value={form.country}
            onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="City" placeholder="Mumbai" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
          <Input label="Contact Person" placeholder="Contact name" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
        </div>
        <Input label="GST Number" placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))} />
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>{vendorToEdit ? "Save Changes" : "Add Vendor"}</Button>
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
          <div><p className="text-xs text-muted-foreground">Total Orders</p><p className="text-lg font-bold text-foreground">{vendor.total_orders}</p></div>
          <div><p className="text-xs text-muted-foreground">Total Value</p><p className="text-lg font-bold text-foreground">{formatCurrency(Number(vendor.total_value))}</p></div>
        </div>

        <div className="space-y-2">
          {[
            { icon: Mail, label: 'Email', value: vendor.email },
            { icon: Phone, label: 'Phone', value: vendor.phone || '—' },
            { icon: Globe, label: 'Country', value: vendor.country || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-16">{label}:</span>
              <span className="text-foreground">{value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 bg-muted/20 rounded-lg text-xs">
          {vendor.gst_number && <div><span className="text-muted-foreground">GST:</span> <span className="text-foreground font-mono ml-1">{vendor.gst_number}</span></div>}
          {vendor.vendor_code && <div><span className="text-muted-foreground">Code:</span> <span className="text-emerald-400 font-mono ml-1">{vendor.vendor_code}</span></div>}
        </div>
      </div>
    </Modal>
  );
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([{ value: '', label: 'All Categories' }]);
  const { toast } = useToast();

  const loadVendors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res: any = await vendorService.getVendors({
        search: search || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      const data = res?.data ?? res;
      setVendors(data?.vendors ?? []);
      setTotal(data?.pagination?.total ?? 0);
    } catch {
      toast({ type: 'error', title: 'Error', description: 'Failed to load vendors.' });
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  useEffect(() => {
    vendorService.getVendorCategories().then((cats: any[]) => {
      const opts = [{ value: '', label: 'All Categories' }, ...(cats ?? []).map((c: any) => ({ value: c.category, label: `${c.category} (${c.count})` }))];
      setCategories(opts);
    }).catch(() => {});
  }, []);

  const handleDelete = async (vendor: Vendor) => {
    if (!window.confirm(`Are you sure you want to delete ${vendor.name}?`)) return;
    try {
      await vendorService.deleteVendor(vendor.id);
      toast({ type: 'success', title: 'Vendor deleted', description: `${vendor.name} has been removed.` });
      loadVendors();
    } catch (err: any) {
      toast({ type: 'error', title: 'Delete failed', description: err?.message ?? 'Could not delete vendor.' });
    }
  };

  const handleStatusChange = async (vendor: Vendor, newStatus: string) => {
    const label = newStatus === 'active' ? 'approve' : newStatus === 'suspended' ? 'suspend' : newStatus;
    if (!window.confirm(`Are you sure you want to ${label} ${vendor.name}? An email will be sent to the vendor.`)) return;
    try {
      await vendorService.updateVendorStatus(vendor.id, newStatus);
      toast({ type: 'success', title: `Vendor ${newStatus === 'active' ? 'Approved' : 'Status Updated'}`, description: `${vendor.name} is now ${newStatus}. Email notification sent.` });
      loadVendors();
    } catch (err: any) {
      toast({ type: 'error', title: 'Status update failed', description: err?.message ?? 'Please try again.' });
    }
  };

  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status === 'active').length,
    pending: vendors.filter(v => v.status === 'pending').length,
    inactive: vendors.filter(v => v.status === 'inactive').length,
  };

  if (isLoading && vendors.length === 0) return <PageLoader />;

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
          { label: 'Total Vendors', value: total || stats.total, color: 'text-foreground' },
          { label: 'Active', value: stats.active, color: 'text-emerald-400' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Inactive', value: stats.inactive, color: 'text-red-400' },
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
              {vendors.length === 0 ? (
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
                vendors.map(vendor => (
                  <tr key={vendor.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                          {vendor.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{vendor.vendor_code}</p>
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
                    <td className="px-4 py-3 text-center font-medium">{vendor.total_orders}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(Number(vendor.total_value))}</td>
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
                          onClick={() => setVendorToEdit(vendor)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {vendor.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(vendor, 'active')}
                            className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors"
                            title="Approve (sends email)"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {vendor.status !== 'suspended' && (
                          <button
                            onClick={() => handleStatusChange(vendor, 'suspended')}
                            className="p-1.5 rounded-md hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 transition-colors"
                            title="Suspend (sends email)"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(vendor)}
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

        {vendors.length > 0 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Showing {vendors.length} of {total || vendors.length} vendors</p>
          </div>
        )}
      </Card>

      <VendorFormModal 
        isOpen={showAdd || !!vendorToEdit} 
        onClose={() => { setShowAdd(false); setVendorToEdit(null); }} 
        onSaved={loadVendors} 
        vendorToEdit={vendorToEdit} 
      />
      <VendorDetailModal vendor={selectedVendor} isOpen={!!selectedVendor} onClose={() => setSelectedVendor(null)} />
    </div>
  );
}
