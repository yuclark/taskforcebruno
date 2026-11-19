import { useState } from 'react';
import { QrCode, Stethoscope, HeartHandshake } from 'lucide-react';
import CollarQRScanner from './CollarQRScanner';

export default function Login({ onLoginSuccess, togglePage, onScanCollar }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showScanner, setShowScanner] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    const emailClean = (formData.email || '').trim().toLowerCase();
    const passwordClean = formData.password || '';

    if (!emailClean.endsWith('@cit.edu')) {
      setMessage({ type: 'error', text: 'Please enter a valid CIT-U institutional email ending in @cit.edu' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailClean, password: passwordClean }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        onLoginSuccess(data.session);
      } else {
        setMessage({ type: 'error', text: data.error || 'Authentication failed. Please verify credentials.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error: Unable to reach authentication server. Please check your internet.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-slate-800">
      {/* Left Column: Branding Overview Content */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#6D0A19] via-[#5C0612] to-[#38030A] p-12 lg:p-16 flex-col justify-between relative overflow-hidden border-r-4 border-[#D4AF37]">
        {/* Subtle Ambient Radial Glow */}
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
              alt="Wildcat Welfare Portal - Task Force Bruno Logo"
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
            Campus animal welfare, veterinary tracking, and community rescue coordination for CIT-U&apos;s resident cats and dogs.
          </p>

          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-3 text-xs text-stone-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Collar QR Passports</span>
                <span className="text-stone-300/80 text-[11px]">Instant identification and safety profiles on campus</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Clinical &amp; RA 9482 Records</span>
                <span className="text-stone-300/80 text-[11px]">Verified anti-rabies immunity, TNR, and health logs</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Adoption &amp; Sighting Triage</span>
                <span className="text-stone-300/80 text-[11px]">Community sighting alerts and guided rehoming</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-stone-300/70 tracking-wide">
          CIT-U Medical-Dental Clinic &bull; Task Force Bruno
        </div>
      </div>

      {/* Right Column: Interactive Login Container */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100">
          <div className="mb-8 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <img
                src="/logo.png"
                alt="Wildcat Welfare Portal Logo"
                className="w-14 h-14 object-contain drop-shadow-md select-none shrink-0"
              />
              <div className="text-left md:hidden">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4AF37] block">CIT-U Task Force Bruno</span>
                <span className="text-sm font-black text-[#5C0612] tracking-tight">Wildcat Welfare Portal</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Authentication</h2>
            <p className="text-xs text-slate-500 mt-1">Sign in using your CIT-U institutional credentials (@cit.edu).</p>
          </div>

          {/* Quick Collar QR Scanner Action for Public Emergency Tag Lookup (TC-QR-001) */}
          <div className="mb-6 p-3 bg-amber-50/60 rounded-xl border border-[#D4AF37]/30 flex items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C0612] block">Found a Campus Pet?</span>
              <span className="text-[11px] text-slate-600">Scan collar tag for instant passport</span>
            </div>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="px-3.5 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white rounded-xl text-xs font-bold tracking-wide transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
              </svg>
              <span>Scan Collar QR</span>
            </button>
          </div>

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
            <div className={`p-3.5 rounded-xl text-xs mb-6 font-medium border ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Institutional Email</label>
              <input 
                type="email" name="email" value={formData.email} onChange={handleChange} required
                placeholder="username@cit.edu"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612] focus:border-transparent text-sm bg-slate-50/50 transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Account Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-medium text-slate-400 hover:text-[#5C0612] focus:outline-none transition-colors"
                >
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </button>
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612] focus:border-transparent text-sm bg-slate-50/50 transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-60 text-white font-medium rounded-xl tracking-wider text-xs shadow-md transition-colors border-b-4 border-[#D4AF37] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <span>LOG IN TO DASHBOARD</span>
              )}
            </button>
          </form>

          <div className="text-center mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              General Community or Volunteer?{" "}
              <button onClick={togglePage} className="text-[#5C0612] font-semibold hover:underline focus:outline-none">Create Account</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
