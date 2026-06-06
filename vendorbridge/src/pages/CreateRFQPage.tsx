import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, ArrowLeft, ArrowRight, CheckCircle, Send, Save, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils';
import { rfqService } from '../services/rfq.service';
import { vendorService, type Vendor } from '../services/vendor.service';

interface LineItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  description: string;
}

const categories = [
  { value: 'IT Hardware', label: 'IT Hardware' },
  { value: 'Software', label: 'Software' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Logistics', label: 'Logistics' },
  { value: 'Stationery', label: 'Stationery' },
];

const steps = [
  { num: 1, label: 'RFQ Details' },
  { num: 2, label: 'Products & Vendors' },
  { num: 3, label: 'Review & Submit' },
];

export default function CreateRFQPage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rfqData, setRfqData] = useState({
    title: '',
    category: '',
    deadline: '',
    description: '',
    priority: 'medium',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', name: '', qty: 1, unit: 'pcs', description: '' },
  ]);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadVendors = async () => {
      setIsLoadingVendors(true);
      try {
        const res: any = await vendorService.getVendors({ limit: 100 });
        const list = res?.data?.vendors ?? res?.vendors ?? [];
        setVendors(list);
      } catch (err) {
        console.error('Failed to load vendors', err);
      } finally {
        setIsLoadingVendors(false);
      }
    };
    loadVendors();
  }, []);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!rfqData.title.trim()) newErrors.title = 'RFQ Title is required.';
    if (!rfqData.category) newErrors.category = 'Please select a category.';
    if (!rfqData.deadline) newErrors.deadline = 'Submission Deadline is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    const hasItem = items.some(i => i.name.trim() !== '');
    if (!hasItem) newErrors.items = 'Add at least one product or service item.';
    if (selectedVendors.length === 0) newErrors.vendors = 'Select at least one vendor.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep(s => s + 1);
  };

  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now().toString(), name: '', qty: 1, unit: 'pcs', description: '' }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const toggleVendor = (id: string) => {
    setSelectedVendors(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).map(f => f.name);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: rfqData.title,
        category: rfqData.category,
        deadline: rfqData.deadline,
        priority: rfqData.priority,
        description: rfqData.description || '',
        items: items
          .filter(i => i.name.trim() !== '')
          .map(i => ({
            name: i.name,
            quantity: i.qty,       // backend expects 'quantity', not 'qty'
            unit: i.unit,
            description: i.description || ''
          }))
      };

      const newRFQ = await rfqService.createRFQ(payload);

      if (!isDraft && selectedVendors.length > 0) {
        await rfqService.assignVendors(newRFQ.id, selectedVendors);
      }

      toast({
        type: 'success',
        title: isDraft ? 'Draft Saved' : 'RFQ Created',
        description: isDraft
          ? 'Your RFQ has been saved as draft'
          : 'RFQ has been sent to selected vendors',
      });
      navigate('/rfqs');
    } catch (err: any) {
      let errorMsg = err?.message || 'Failed to create RFQ.';
      if (err?.errors && Array.isArray(err.errors)) {
        errorMsg += ': ' + err.errors.map((e: any) => e.message).join(', ');
      }
      
      toast({
        type: 'error',
        title: 'Validation Error',
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchedVendors = vendors.filter(v => v.category === rfqData.category && v.status === 'active');
  const otherVendors = vendors.filter(v => v.category !== rfqData.category && v.status === 'active');

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Create RFQ</h1>
          <p className="text-sm text-muted-foreground">New request for quotation</p>
        </div>
        <Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/rfqs')}>
          Back
        </Button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <button
              onClick={() => step > s.num && setStep(s.num)}
              className="flex items-center gap-2"
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                step > s.num ? 'bg-emerald-500 text-white cursor-pointer' :
                step === s.num ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400' :
                'bg-muted border border-border text-muted-foreground'
              )}>
                {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
              </div>
              <span className={cn(
                'hidden sm:block text-sm font-medium transition-colors',
                step === s.num ? 'text-foreground' : 'text-muted-foreground'
              )}>{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={cn('w-16 sm:w-24 h-0.5 mx-3 transition-all', step > s.num ? 'bg-emerald-500' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <h3 className="font-semibold">RFQ Information</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="RFQ Title *"
              placeholder="e.g., Office Furniture Procurement Q2"
              value={rfqData.title}
              onChange={e => { setRfqData(d => ({ ...d, title: e.target.value })); setErrors(er => ({ ...er, title: '' })); }}
            />
            {errors.title && <p className="text-xs text-red-400 -mt-2">{errors.title}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  label="Category *"
                  options={categories}
                  placeholder="Select category"
                  value={rfqData.category}
                  onChange={e => { setRfqData(d => ({ ...d, category: e.target.value })); setErrors(er => ({ ...er, category: '' })); }}
                />
                {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
              </div>
              <div>
                <Input
                  label="Submission Deadline *"
                  type="date"
                  value={rfqData.deadline}
                  onChange={e => { setRfqData(d => ({ ...d, deadline: e.target.value })); setErrors(er => ({ ...er, deadline: '' })); }}
                />
                {errors.deadline && <p className="text-xs text-red-400 mt-1">{errors.deadline}</p>}
              </div>
            </div>
            <Select
              label="Priority"
              options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]}
              value={rfqData.priority}
              onChange={e => setRfqData(d => ({ ...d, priority: e.target.value }))}
            />
            <Textarea
              label="Description"
              placeholder="Describe your requirements, specifications, quality standards, and any special conditions..."
              rows={4}
              value={rfqData.description}
              onChange={e => setRfqData(d => ({ ...d, description: e.target.value }))}
            />

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Attachments</label>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                  isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:border-emerald-500/50'
                )}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []).map(f => f.name);
                    setAttachments(prev => [...prev, ...files]);
                  };
                  input.click();
                }}
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop files here or <span className="text-emerald-400">click to upload</span></p>
                <p className="text-xs text-muted-foreground/60 mt-1">PDF, XLSX, DOCX, images up to 10MB</p>
              </div>
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg text-xs">
                      <span className="text-foreground">{f}</span>
                      <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-red-400">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Products & Vendors */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Product / Service Requirements</h3>
                <Button size="sm" variant="secondary" onClick={addItem} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Item Description</th>
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium w-24">Qty</th>
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium w-28">Unit</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-2 px-3">
                          <input
                            className="input-field text-xs"
                            placeholder="Item name / description"
                            value={item.name}
                            onChange={e => updateItem(item.id, 'name', e.target.value)}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            className="input-field text-xs"
                            min="1"
                            value={item.qty}
                            onChange={e => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            className="input-field text-xs appearance-none"
                            value={item.unit}
                            onChange={e => updateItem(item.id, 'unit', e.target.value)}
                          >
                            {['pcs', 'kg', 'ltr', 'box', 'set', 'license', 'hrs'].map(u => (
                              <option key={u} value={u} className="bg-card">{u}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            className="p-1 hover:bg-red-500/10 hover:text-red-400 text-muted-foreground rounded transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errors.items && <p className="text-xs text-red-400 mt-2 px-1">{errors.items}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Select Vendors</h3>
              <p className="text-xs text-muted-foreground">Choose vendors to receive this RFQ</p>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingVendors ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              ) : vendors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active vendors found in database.</p>
              ) : (
                <div className="space-y-4">
                  {matchedVendors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Recommended ({rfqData.category})</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {matchedVendors.map(v => (
                          <div
                            key={v.id}
                            onClick={() => toggleVendor(v.id)}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                              selectedVendors.includes(v.id)
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-border hover:border-emerald-500/30'
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                              {v.name[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-semibold truncate block">{v.name}</span>
                              <span className="text-[10px] text-muted-foreground">{v.email}</span>
                            </div>
                            {selectedVendors.includes(v.id) && (
                              <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 ml-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {otherVendors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Other Active Vendors</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {otherVendors.map(v => (
                          <div
                            key={v.id}
                            onClick={() => toggleVendor(v.id)}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                              selectedVendors.includes(v.id)
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-border hover:border-emerald-500/30'
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                              {v.name[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium truncate block">{v.name}</span>
                              <span className="text-[10px] text-muted-foreground">{v.category || 'General'}</span>
                            </div>
                            {selectedVendors.includes(v.id) && (
                              <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 ml-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {selectedVendors.length > 0 && (
                <p className="text-xs text-emerald-400 mt-3">{selectedVendors.length} vendor(s) selected</p>
              )}
              {errors.vendors && <p className="text-xs text-red-400 mt-2">{errors.vendors}</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader><h3 className="font-semibold">Review RFQ Details</h3></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="text-sm font-medium text-foreground">{rfqData.title || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-medium text-foreground">{rfqData.category || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="text-sm font-medium text-foreground">{rfqData.deadline || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <p className="text-sm font-medium text-foreground capitalize">{rfqData.priority}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Line Items ({items.length})</p>
                <div className="space-y-1">
                  {items.map(i => (
                    <div key={i.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded-md">
                      <span className="text-foreground">{i.name || 'Unnamed item'}</span>
                      <span className="text-muted-foreground">{i.qty} {i.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Selected Vendors ({selectedVendors.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedVendors.map(id => {
                    const name = vendors.find(v => v.id === id)?.name || id;
                    return (
                      <span key={id} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs">
                        {name}
                      </span>
                    );
                  })}
                  {selectedVendors.length === 0 && <span className="text-xs text-muted-foreground">No vendors selected</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setStep(s => s - 1)} disabled={isSubmitting}>
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
          {step < 3 ? (
            <Button rightIcon={<ArrowRight className="w-4 h-4" />} onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              Send to Vendors
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
