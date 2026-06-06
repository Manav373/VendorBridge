import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Upload, ArrowRight, ArrowLeft, User, CheckCircle } from 'lucide-react';
import { useAuth, type RegisterData } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';

const schema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  country: z.string().min(1, 'Country is required'),
  role: z.string().min(1, 'Role is required'),
  additionalInfo: z.string().optional(),
});

const countries = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AE', label: 'UAE' },
];

const roles = [
  { value: 'procurement_manager', label: 'Procurement Manager' },
  { value: 'procurement_officer', label: 'Procurement Officer' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'vendor', label: 'Vendor / Supplier' },
  { value: 'approver', label: 'Approver' },
  { value: 'admin', label: 'System Administrator' },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { register: registerUser, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(schema),
  });

  const steps = [
    { num: 1, label: 'Personal Info' },
    { num: 2, label: 'Account Details' },
    { num: 3, label: 'Confirmation' },
  ];

  const handleNext = async () => {
    const fields = step === 1
      ? ['firstName', 'lastName', 'email'] as const
      : ['phone', 'country', 'role'] as const;
    const valid = await trigger(fields);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = async (data: RegisterData) => {
    try {
      await registerUser(data);
      toast({ type: 'success', title: 'Account created!', description: 'You can now sign in.' });
      navigate('/login');
    } catch {
      toast({ type: 'error', title: 'Registration failed', description: 'Please try again.' });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">VendorBridge</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Create Your Account</h2>
          <p className="text-muted-foreground text-sm mt-1">Join the VendorBridge ERP platform</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step > s.num ? 'bg-emerald-500 text-white' :
                  step === s.num ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400' :
                  'bg-muted border border-border text-muted-foreground'
                }`}>
                  {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 hidden sm:block">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-20 h-0.5 mx-2 transition-all ${step > s.num ? 'bg-emerald-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-base font-semibold mb-4">Personal Information</h3>
                
                {/* Avatar upload */}
                <div className="flex flex-col items-center gap-3 mb-6">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border hover:border-emerald-500 cursor-pointer flex items-center justify-center overflow-hidden transition-colors group"
                  >
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground group-hover:text-emerald-400 transition-colors">
                        <User className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">Upload Photo</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Upload profile photo
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input {...register('firstName')} label="First Name" placeholder="Alex" error={errors.firstName?.message} />
                  <Input {...register('lastName')} label="Last Name" placeholder="Johnson" error={errors.lastName?.message} />
                </div>
                <Input {...register('email')} type="email" label="Email Address" placeholder="alex@company.com" error={errors.email?.message} />
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-base font-semibold mb-4">Account Details</h3>
                <Input {...register('phone')} label="Phone Number" placeholder="+91 98765 43210" error={errors.phone?.message} />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    {...register('country')}
                    label="Country"
                    options={countries}
                    placeholder="Select country"
                    error={errors.country?.message}
                  />
                  <Select
                    {...register('role')}
                    label="Role"
                    options={roles}
                    placeholder="Select role"
                    error={errors.role?.message}
                  />
                </div>
                <Textarea
                  {...register('additionalInfo')}
                  label="Additional Information"
                  placeholder="Tell us about your company, procurement volume, or specific requirements..."
                  rows={4}
                />
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="animate-fade-in text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Almost done!</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                  Your account will be reviewed and activated within 24 hours.
                </p>
                <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">What happens next?</p>
                  {[
                    'Your account details will be verified',
                    'You\'ll receive an activation email',
                    'Access to all procurement modules',
                    'Onboarding session with our team',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">
                        {i + 1}
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {step > 1 ? (
                <Button type="button" variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setStep(s => s - 1)}>
                  Back
                </Button>
              ) : (
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Already have an account?
                </Link>
              )}

              {step < 3 ? (
                <Button type="button" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={handleNext}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Create Account
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
