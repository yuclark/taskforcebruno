import { useState } from 'react';
import { QrCode, Stethoscope, HeartHandshake, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import CollarQRScanner from './CollarQRScanner';
import { apiPost } from '../lib/api';

export default function Login({
  onLoginSuccess,
  togglePage,
  onScanCollar,
  recoveryToken = '',
  onClearRecovery,
}) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showScanner, setShowScanner] = useState(false);

  const [authMode, setAuthMode] = useState(recoveryToken ? 'reset' : 'login'); // 'login' | 'forgot' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    const emailClean = (forgotEmail || '').trim().toLowerCase();
    if (!emailClean.endsWith('@cit.edu')) {
      setMessage({ type: 'error', text: 'Please enter a valid CIT-U email address ending in @cit.edu.' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiPost('/auth/forgot-password/', { email: emailClean }, { auth: false });
      if (res.ok) {
        setMessage({
          type: 'success',
          text:
            res.data?.message ||
            'If an account exists for that @cit.edu email, a password reset link has been sent.',
        });
      } else {
        setMessage({ type: 'error', text: res.error || 'Unable to send password reset email.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters and include both letters and numbers.',
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiPost(
        '/auth/reset-password/',
        { access_token: recoveryToken, password: newPassword },
        { auth: false }
      );
      if (res.ok) {
        setMessage({
          type: 'success',
          text: res.data?.message || 'Password updated! You can now sign in with your new password.',
        });
        setNewPassword('');
        setConfirmNewPassword('');
        setAuthMode('login');
        if (onClearRecovery) onClearRecovery();
      } else {
        setMessage({ type: 'error', text: res.error || 'Unable to update password.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleInputFocus = (e) => {
    if (window.innerWidth < 768 && typeof e.target.scrollIntoView === 'function') {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const emailClean = (formData.email || '').trim().toLowerCase();
    const passwordClean = formData.password || '';

    if (!emailClean.endsWith('@cit.edu')) {
      setMessage({ type: 'error', text: 'Please enter a valid CIT-U email address ending in @cit.edu.' });
      return;
    }

    if (!passwordClean) {
      setMessage({ type: 'error', text: 'Please enter your password.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiPost(
        '/login/',
        { email: emailClean, password: passwordClean },
        { auth: false }
      );
      if (res.ok && res.data?.session) {
        onLoginSuccess(res.data.session);
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Invalid email or password. Please check your credentials.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-slate-50 text-slate-800">
      {/* Desktop Left Branding Panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#6D0A19] via-[#5C0612] to-[#38030A] p-10 lg:p-16 flex-col justify-between relative overflow-hidden border-r-4 border-[#D4AF37]">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-black/30 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <span className="h-0.5 w-8 bg-[#D4AF37]" />
          <span className="text-[#D4AF37] tracking-[0.2em] text-[11px] font-semibold uppercase">
            Cebu Institute of Technology – University
          </span>
        </div>

        <div className="relative z-10 my-auto max-w-md space-y-7">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Wildcat Welfare Portal Logo"
              className="w-24 h-24 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] select-none shrink-0"
            />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/90 block mb-1">
                Wildcat Welfare Portal
              </span>
              <h1 className="text-4xl font-extrabold text-white tracking-tight leading-[1.05]">
                Task Force <span className="text-[#D4AF37]">Bruno</span>
              </h1>
            </div>
          </div>

          <p className="text-stone-200/90 text-sm font-normal leading-relaxed">
            Campus animal welfare, veterinary health records, and community rescue coordination for CIT-U&apos;s resident cats and dogs.
          </p>

          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-3 text-xs text-stone-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Collar QR Passports</span>
                <span className="text-stone-300/80 text-[11px]">Instant identification and emergency contacts on campus</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Clinical &amp; RA 9482 Records</span>
                <span className="text-stone-300/80 text-[11px]">Verified anti-rabies immunity, TNR sterilization, and health logs</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Adoption &amp; Sighting Triage</span>
                <span className="text-stone-300/80 text-[11px]">Community sighting reports and guided campus adoptions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-stone-300/75 tracking-wide">
          CIT-U Medical-Dental Clinic &bull; Task Force Bruno
        </div>
      </div>

      {/* Mobile Compact Maroon Top Bar */}
      <div className="md:hidden bg-gradient-to-r from-[#6D0A19] to-[#4A050F] text-white px-5 py-4 border-b-2 border-[#D4AF37] flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Wildcat Welfare Portal Logo"
          className="w-11 h-11 object-contain drop-shadow-md select-none shrink-0"
        />
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D4AF37] block">
            CIT-U Wildcat Welfare Portal
          </span>
          <h1 className="text-lg font-extrabold tracking-tight leading-tight">
            Task Force Bruno
          </h1>
        </div>
      </div>

      {/* Interactive Sign-In Column */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16 pb-12">
        <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-lg shadow-slate-200/70 border border-slate-200/80">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {authMode === 'forgot'
                ? 'Reset Password'
                : authMode === 'reset'
                ? 'Choose New Password'
                : 'Sign In'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {authMode === 'forgot' ? (
                'Enter your @cit.edu email and we will send you a secure reset link.'
              ) : authMode === 'reset' ? (
                'Create a new strong password for your CIT-U account.'
              ) : (
                <>
                  Use your official CIT-U institutional account (
                  <span className="font-medium text-slate-700">@cit.edu</span>).
                </>
              )}
            </p>
          </div>

          {/* Public Collar QR Quick Action */}
          {authMode === 'login' && (
          <div className="mb-6 p-3.5 bg-amber-50/70 rounded-xl border border-[#D4AF37]/40 flex items-center justify-between gap-3">
            <div className="text-left min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C0612] block">
                Found a Campus Pet?
              </span>
              <span className="text-xs text-slate-600 block leading-snug mt-0.5">Scan its collar tag—no sign-in needed</span>
            </div>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="px-3.5 py-2.5 bg-[#5C0612] hover:bg-[#42040B] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <QrCode className="w-4 h-4 text-[#D4AF37]" />
              <span>Scan Tag</span>
            </button>
          </div>
          )}

          {showScanner && (
            <CollarQRScanner
              onClose={() => setShowScanner(false)}
              onScanSuccess={(scannedId) => {
                setShowScanner(false);
                if (onScanCollar) onScanCollar(scannedId);
              }}
            />
          )}

          {message.text && (
            <div
              role="alert"
              className={`p-3.5 rounded-xl text-xs mb-5 font-medium border ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {authMode === 'forgot' ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Institutional Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  onFocus={handleInputFocus}
                  required
                  placeholder="name@cit.edu"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-sm bg-slate-50/60 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-60 text-white font-semibold rounded-xl text-sm shadow-md transition-colors border-b-4 border-[#D4AF37] flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <span>{isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessage({ type: '', text: '' });
                  setAuthMode('login');
                }}
                className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </form>
          ) : authMode === 'reset' ? (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={handleInputFocus}
                  required
                  placeholder="At least 8 chars with letters & numbers"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-sm bg-slate-50/60 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label htmlFor="confirm-new-password" className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  onFocus={handleInputFocus}
                  required
                  placeholder="Re-enter your new password"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-sm bg-slate-50/60 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-60 text-white font-semibold rounded-xl text-sm shadow-md transition-colors border-b-4 border-[#D4AF37]"
              >
                {isLoading ? 'Updating Password...' : 'Update Password'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessage({ type: '', text: '' });
                  setAuthMode('login');
                  if (onClearRecovery) onClearRecovery();
                }}
                className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel &amp; Return to Sign In</span>
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                Institutional Email
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={handleInputFocus}
                required
                placeholder="name@cit.edu"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-sm bg-slate-50/60 focus:bg-white transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-[11px] font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMessage({ type: '', text: '' });
                    setForgotEmail(formData.email || '');
                    setAuthMode('forgot');
                  }}
                  className="text-[11px] font-semibold text-[#5C0612] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  required
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-sm bg-slate-50/60 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-60 text-white font-semibold rounded-xl text-sm shadow-md transition-colors border-b-4 border-[#D4AF37] flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
          )}

          <div className="text-center mt-7 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              New to the Wildcat Welfare Portal?{' '}
              <button
                type="button"
                onClick={togglePage}
                className="text-[#5C0612] font-semibold hover:underline"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
