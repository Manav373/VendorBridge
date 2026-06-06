import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Zap, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'alex@vendorbridge.com', password: 'password123' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast({ type: 'success', title: 'Welcome back!', description: 'Logged in successfully.' });
      navigate('/dashboard');
    } catch {
      toast({ type: 'error', title: 'Login failed', description: 'Invalid credentials.' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-emerald-900/40 via-background to-background border-r border-border p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/3 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">VendorBridge</span>
              <p className="text-xs text-muted-foreground">Enterprise ERP Platform</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
            Streamline Your<br />
            <span className="text-emerald-400">Procurement</span> Process
          </h1>
          <p className="text-muted-foreground text-lg mb-12 leading-relaxed">
            Manage vendors, automate RFQs, compare quotations, and track purchase orders — all in one powerful platform.
          </p>

          <div className="space-y-4">
            {[
              { icon: '🏢', title: 'Multi-vendor Management', desc: 'Centralized vendor portal with performance tracking' },
              { icon: '📊', title: 'Smart Analytics', desc: 'Real-time procurement insights and spending analysis' },
              { icon: '⚡', title: 'Automated Workflows', desc: 'Streamlined approval and purchase order generation' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border border-border/50">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Enterprise-grade security · SOC 2 Type II certified</span>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">VendorBridge</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              {...register('email')}
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
            />
            <Input
              {...register('password')}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              error={errors.password?.message}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border accent-emerald-500" />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full justify-center"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground font-medium mb-2">Demo Credentials</p>
            <p className="text-xs text-muted-foreground">Email: <span className="text-foreground">alex@vendorbridge.com</span></p>
            <p className="text-xs text-muted-foreground">Password: <span className="text-foreground">password123</span></p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
