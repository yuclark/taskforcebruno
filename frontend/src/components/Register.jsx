import { useState } from 'react';
import { ShieldCheck, PawPrint, BellRing, Eye, EyeOff, Check } from 'lucide-react';
import PageBackdrop from './PageBackdrop';
import ThemeToggle from './ThemeToggle';
import { apiPost } from '../lib/api';
import { EMAIL_PATTERN, ID_PATTERN, formatStudentIdInput } from '../lib/auth';

export default function Register({ togglePage, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const handleIdChange = (e) => {
    setFormData((prev) => ({ ...prev, id: formatStudentIdInput(e.target.value) }));
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

  const hasMinLen = formData.password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(formData.password);
  const hasDigit = /\d/.test(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setNeedsEmailConfirm(false);

    const emailClean = (formData.email || '').trim().toLowerCase();
    const idClean = (formData.id || '').trim();
    const firstNameClean = (formData.first_name || '').trim();
    const lastNameClean = (formData.last_name || '').trim();
    const passwordClean = formData.password || '';

    if (!firstNameClean || !lastNameClean) {
      setMessage({ type: 'error', text: 'Both first name and last name are required.' });
      return;
    }

    if (!idClean || !ID_PATTERN.test(idClean)) {
      setMessage({ type: 'error', text: 'Student or employee ID must follow the format XX-XXXX-XXX.' });
      return;
    }

    if (!EMAIL_PATTERN.test(emailClean)) {
      setMessage({
        type: 'error',
        text: 'Registration is restricted to authorized @cit.edu institutional accounts.',
      });
      return;
    }

    if (!hasMinLen || !hasLetter || !hasDigit) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters and include both letters and numbers.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiPost(
        '/register/',
        {
          id: idClean,
          first_name: firstNameClean,
          last_name: lastNameClean,
          email: emailClean,
          password: passwordClean,
        },
        { auth: false }
      );

      if (res.ok) {
        try {
          localStorage.setItem(
            `tfb_user_profile_${emailClean}`,
            JSON.stringify({
              id: idClean,
              student_id: idClean,
              custom_id: idClean,
              first_name: firstNameClean,
              last_name: lastNameClean,
              full_name: `${firstNameClean} ${lastNameClean}`.trim(),
              email: emailClean,
            })
          );
        } catch {
          // Ignore storage quota errors
        }

        if (res.data?.session && onRegisterSuccess) {
          onRegisterSuccess(res.data.session, res.data.message || `Welcome, ${firstNameClean}!`);
          return;
        }

        setNeedsEmailConfirm(true);
        setMessage({
          type: 'success',
          text:
            res.data?.message ||
            'Account created successfully! Please check your @cit.edu inbox to verify your email before signing in.',
        });
        setFormData({ id: '', first_name: '', last_name: '', email: '', password: '' });
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Could not create your account. Please review your details.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col md:flex-row-reverse bg-[#F3EFE9] dark:bg-[#0E0E10] text-slate-800 dark:text-zinc-100">
      {/* Desktop Right Branding Column */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-bl from-[#6D0A19] via-[#5C0612] to-[#38030A] dark:from-[#26080E] dark:via-[#1C060B] dark:to-[#120508] p-10 lg:p-16 flex-col justify-between relative overflow-hidden border-l-4 border-[#D4AF37] dark:border-l dark:border-zinc-800">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none dark:hidden" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-black/30 blur-3xl pointer-events-none dark:hidden" />

        <div className="relative z-10 flex items-center justify-end gap-3">
          <span className="text-[#D4AF37] tracking-[0.2em] text-[11px] font-semibold uppercase">
            Cebu Institute of Technology – University
          </span>
          <span className="h-0.5 w-8 bg-[#D4AF37]" />
        </div>

        <div className="relative z-10 my-auto max-w-md ml-auto space-y-7 text-left">
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
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-[1.08]">
                Join the <span className="text-[#D4AF37]">Community</span>
              </h1>
            </div>
          </div>

          <p className="text-stone-200/90 text-sm font-normal leading-relaxed">
            Create your verified <strong className="text-white">@cit.edu</strong> account to help care for campus pets, report sightings, and apply for adoption.
          </p>

          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-3 text-xs text-stone-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Verified Campus Access</span>
                <span className="text-stone-300/80 text-[11px]">Exclusive to CIT-U students, faculty, and staff</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Real-Time Sighting Alerts</span>
                <span className="text-stone-300/80 text-[11px]">Notify campus responders about injured or stray animals</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <PawPrint className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Adoption &amp; Volunteer Portal</span>
                <span className="text-stone-300/80 text-[11px]">Track applications and join campus feeding patrols</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-stone-300/75 tracking-wide text-right">
          CIT-U Medical-Dental Clinic &bull; Task Force Bruno
        </div>
      </div>

      {/* Mobile Compact Maroon Top Bar */}
      <div className="md:hidden bg-gradient-to-r from-[#6D0A19] to-[#4A050F] text-white px-5 py-4 border-b-2 border-[#D4AF37] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
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
              Create Your Account
            </h1>
          </div>
        </div>
        <ThemeToggle variant="on-maroon" />
      </div>

      {/* Registration Form Column */}
      <div className="flex-1 relative overflow-hidden bg-[#F3EFE9] dark:bg-[#0E0E10] flex items-center justify-center p-4 sm:p-8 md:p-12 pb-12">
        <PageBackdrop variant="auth" />
        <div className="hidden md:block absolute top-5 left-5 z-20">
          <ThemeToggle variant="compact" />
        </div>
        <div className="relative z-10 w-full max-w-md bg-white/95 dark:bg-[#161618] backdrop-blur-xs p-6 sm:p-8 rounded-2xl shadow-lg shadow-slate-200/70 dark:shadow-2xl dark:shadow-black/50 border border-slate-200/80 dark:border-[#26262A]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Register with your CIT-U student or employee details to get started.
            </p>
          </div>

          {message.text && (
            <div
              role="alert"
              className={`p-3.5 rounded-xl text-xs mb-5 font-medium border space-y-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <p>{message.text}</p>
              {needsEmailConfirm && (
                <button
                  type="button"
                  onClick={togglePage}
                  className="inline-flex items-center px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Go to Sign In
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-first" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  First Name
                </label>
                <input
                  id="reg-first"
                  type="text"
                  name="first_name"
                  autoComplete="given-name"
                  value={formData.first_name}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  required
                  placeholder="Juan"
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-sm bg-slate-50/60 focus:bg-white"
                />
              </div>
              <div>
                <label htmlFor="reg-last" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  id="reg-last"
                  type="text"
                  name="last_name"
                  autoComplete="family-name"
                  value={formData.last_name}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  required
                  placeholder="Dela Cruz"
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-sm bg-slate-50/60 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-id" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Student / Employee ID
              </label>
              <input
                id="reg-id"
                type="text"
                name="id"
                inputMode="numeric"
                value={formData.id}
                onChange={handleIdChange}
                onFocus={handleInputFocus}
                required
                placeholder="22-1234-567"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] font-mono text-base sm:text-sm bg-slate-50/60 focus:bg-white tracking-wider"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Format: XX-XXXX-XXX</span>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Institutional Email
              </label>
              <input
                id="reg-email"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={handleInputFocus}
                required
                placeholder="juan.delacruz@cit.edu"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-sm bg-slate-50/60 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  required
                  placeholder="Create a strong password"
                  disabled={isLoading}
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-sm bg-slate-50/60 focus:bg-white"
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
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
                <span className={`inline-flex items-center gap-1 ${hasMinLen ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  <Check className="w-3 h-3" /> 8+ characters
                </span>
                <span className={`inline-flex items-center gap-1 ${hasLetter ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  <Check className="w-3 h-3" /> Letter
                </span>
                <span className={`inline-flex items-center gap-1 ${hasDigit ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  <Check className="w-3 h-3" /> Number
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#5C0612] hover:bg-[#42040B] dark:bg-[#7A1121] dark:hover:bg-[#8E1628] disabled:opacity-60 text-white font-semibold rounded-xl text-sm shadow-md transition-colors border-b-4 border-[#D4AF37] dark:border-b-0 dark:ring-1 dark:ring-white/10 mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={togglePage}
                className="text-[#5C0612] font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
