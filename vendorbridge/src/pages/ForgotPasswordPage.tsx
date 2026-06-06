import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft, Mail, CheckCircle, KeyRound, Eye, EyeOff, RefreshCw, Lock, ShieldCheck } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';

// ─────────────────────────────────────────────────────────
// New-Password Modal Overlay
// ─────────────────────────────────────────────────────────
function NewPasswordModal({
  isOpen,
  email,
  otp,
  onSuccess,
}: {
  isOpen: boolean;
  email: string;
  otp: string;
  onSuccess: () => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const { toast } = useToast();

  // Password strength
  const getStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = getStrength(newPassword);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'][strength];

  const validate = () => {
    const errs: typeof errors = {};
    if (newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.resetPassword({ email, otp, newPassword });
      toast({ type: 'success', title: '🎉 Password Reset!', description: 'You can now sign in with your new password.' });
      onSuccess();
    } catch {
      toast({ type: 'error', title: 'Reset failed', description: 'Invalid or expired OTP. Please start again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Create New Password</h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              OTP verified <span className="text-emerald-400">✓</span> — Set a strong password for{' '}
              <span className="text-foreground font-medium">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-muted border ${
                    errors.newPassword ? 'border-red-500' : 'border-border'
                  } text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-red-400">{errors.newPassword}</p>}

              {/* Strength bar */}
              {newPassword.length > 0 && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= strength ? strengthColor : 'bg-muted-foreground/20'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strength:{' '}
                    <span className="font-medium text-foreground">{strengthLabel}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-muted border ${
                    errors.confirmPassword
                      ? 'border-red-500'
                      : confirmPassword && confirmPassword === newPassword
                      ? 'border-emerald-500'
                      : 'border-border'
                  } text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400">{errors.confirmPassword}</p>
              )}
              {confirmPassword && confirmPassword === newPassword && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full justify-center mt-2"
              isLoading={isLoading}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Set New Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// OTP — 6 individual digit boxes
// ─────────────────────────────────────────────────────────
function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const nd = [...digits];
      if (nd[i]) {
        nd[i] = '';
      } else if (i > 0) {
        nd[i - 1] = '';
        inputs.current[i - 1]?.focus();
      }
      onChange(nd.join('').trimEnd());
    }
  };

  const handleChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const nd = [...digits];
    nd[i] = d;
    onChange(nd.join('').trimEnd());
    if (d && i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(p);
    inputs.current[Math.min(p.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-muted text-foreground focus:outline-none transition-all
            ${digits[i]
              ? 'border-emerald-500 shadow-md shadow-emerald-500/20 text-emerald-400'
              : 'border-border focus:border-emerald-500/60'
            }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [stage, setStage] = useState<'email' | 'otp' | 'done'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = (seconds = 60) => {
    setCountdown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Send OTP ──
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setEmailError('Please enter your email address'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Please enter a valid email'); return; }
    setEmailError('');
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setSentEmail(email);
      toast({ type: 'success', title: 'OTP Sent!', description: 'Check your inbox for the 6-digit code.' });
      setStage('otp');
      startCountdown(60);
    } catch {
      toast({ type: 'error', title: 'Failed to send', description: 'No account found with that email.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await authService.forgotPassword(sentEmail);
      setOtp('');
      setOtpError('');
      toast({ type: 'success', title: 'OTP Resent!', description: 'A new code has been sent.' });
      startCountdown(60);
    } catch {
      toast({ type: 'error', title: 'Error', description: 'Failed to resend OTP.' });
    } finally {
      setIsResending(false);
    }
  };

  // ── Verify OTP → open modal ──
  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setOtpError('Please enter all 6 digits'); return; }
    setOtpError('');
    setShowPasswordModal(true);
  };

  // ── Password reset success ──
  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setStage('done');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* New Password Modal */}
      <NewPasswordModal
        isOpen={showPasswordModal}
        email={sentEmail}
        otp={otp}
        onSuccess={handlePasswordSuccess}
      />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">VendorBridge</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">

          {/* ── Stage: Email ── */}
          {stage === 'email' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center mb-2">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Mail className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Forgot your password?</h2>
                <p className="text-muted-foreground text-sm mt-2">
                  Enter your registered email and we'll send you a 6-digit OTP.
                </p>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoFocus
                    className={`w-full px-4 py-2.5 rounded-lg bg-muted border ${
                      emailError ? 'border-red-500' : 'border-border'
                    } text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all`}
                  />
                  {emailError && <p className="text-xs text-red-400">{emailError}</p>}
                </div>
                <Button type="submit" className="w-full justify-center" isLoading={isLoading}>
                  Send OTP Code
                </Button>
              </form>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* ── Stage: OTP Verify ── */}
          {stage === 'otp' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <KeyRound className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Verify OTP</h2>
                <p className="text-muted-foreground text-sm mt-2">We sent a 6-digit code to</p>
                <p className="text-foreground font-semibold text-sm mt-0.5">{sentEmail}</p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                {/* 6 digit boxes */}
                <div className="space-y-2">
                  <OTPInput value={otp} onChange={v => { setOtp(v); setOtpError(''); }} />
                  {otpError && (
                    <p className="text-xs text-red-400 text-center">{otpError}</p>
                  )}
                </div>

                {/* Resend countdown */}
                <div className="flex flex-col items-center gap-1.5">
                  {countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Resend OTP in{' '}
                      <span className="text-emerald-400 font-bold tabular-nums">
                        {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                      {isResending ? 'Sending...' : 'Resend OTP'}
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">Didn't receive it? Check your spam folder.</p>
                </div>

                <Button
                  type="submit"
                  className="w-full justify-center"
                  disabled={otp.length !== 6}
                >
                  Verify &amp; Continue
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStage('email'); setOtp(''); setOtpError(''); }}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Try a different email
                </button>
              </div>
            </div>
          )}

          {/* ── Stage: Done ── */}
          {stage === 'done' && (
            <div className="flex flex-col items-center text-center space-y-5 py-2">
              <div className="relative">
                <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/10">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">All done! 🎉</h2>
                <p className="text-muted-foreground text-sm">
                  Your password has been reset successfully.<br />
                  Sign in with your new password below.
                </p>
              </div>
              <Button className="w-full justify-center" onClick={() => navigate('/login')}>
                Go to Sign In
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
