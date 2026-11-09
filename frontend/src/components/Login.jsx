import React, { useState } from 'react';
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
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error: Unable to reach authentication server. Please check your internet.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-slate-800">
      {/* Left Column: Branding Overview Content */}
      <div className="hidden md:flex md:w-1/2 bg-[#5C0612] p-12 flex-col justify-between relative overflow-hidden border-r-8 border-[#D4AF37]">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="h-1 w-12 bg-[#D4AF37] mb-3"></div>
          <span className="text-[#D4AF37] tracking-widest text-xs font-semibold uppercase">CIT-U Digital Governance</span>
        </div>

        <div className="relative z-10 my-auto max-w-md">
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
            TASK FORCE <br />
            <span className="text-[#D4AF37]">BRUNO</span>
          </h1>
          <p className="text-stone-200 text-sm mt-4 font-light leading-relaxed">
            Dedicated to campus pet care management, health logging, and community animal welfare coordination.
          </p>
          <div className="mt-6 flex gap-3 text-xs text-stone-300 font-medium">
            <span className="px-2.5 py-1 bg-black/20 rounded-md border border-white/10">Care Registry</span>
            <span className="px-2.5 py-1 bg-black/20 rounded-md border border-white/10">Clinic Tracking</span>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-stone-400 font-mono tracking-wider">
          TASK FORCE BRUNO SYSTEM INFRASTRUCTURE
        </div>
      </div>

      {/* Right Column: Interactive Login Container */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100">
          <div className="mb-8 text-center md:text-left">
            <div className="inline-flex bg-amber-50 border border-[#D4AF37]/30 text-[#5C0612] rounded-xl p-3 mb-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
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
