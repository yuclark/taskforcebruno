import React, { useState } from 'react';

export default function Login({ onLoginSuccess, togglePage }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        // Direct session object distribution callback pipeline
        onLoginSuccess(data.session);
      } else {
        setMessage({ type: 'error', text: data.error || 'Authentication failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Operational error: Connection to authentication server refused.' });
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
            Wildcat Welfare <br />
            <span className="text-[#D4AF37]">Portal</span>
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
            <p className="text-xs text-slate-500 mt-1">Sign in to access the administrator tracking utility and animal profiles dashboard.</p>
          </div>

          {message.text && (
            <div className={`p-3 rounded-xl text-xs mb-6 font-medium border ${
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612] focus:border-transparent text-sm bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Account Password</label>
              <input 
                type="password" name="password" value={formData.password} onChange={handleChange} required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612] focus:border-transparent text-sm bg-slate-50/50"
              />
            </div>

            <button type="submit" className="w-full py-3 bg-[#5C0612] hover:bg-[#42040B] text-white font-medium rounded-xl tracking-wider text-xs shadow-md transition-colors border-b-4 border-[#D4AF37]">
              LOG IN TO DASHBOARD
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