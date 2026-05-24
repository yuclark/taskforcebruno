import React, { useState } from 'react';

export default function Register({ togglePage }) {
  const [formData, setFormData] = useState({ id: '', first_name: '', last_name: '', email: '', password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleIdChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); 
    if (value.length > 9) value = value.slice(0, 9); 
    
    let formatted = '';
    if (value.length > 0) formatted += value.substring(0, 2);
    if (value.length > 2) formatted += '-' + value.substring(2, 6);
    if (value.length > 6) formatted += '-' + value.substring(6, 9);
    
    setFormData({ ...formData, id: formatted });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setFormData({ id: '', first_name: '', last_name: '', email: '', password: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Account creation aborted.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Operational error: Connection to registration engine failed.' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row-reverse bg-white text-slate-800">
      {/* Left/Right Mirrored Aspect Layout Branding Column */}
      <div className="hidden md:flex md:w-1/2 bg-[#5C0612] p-12 flex-col justify-between relative overflow-hidden border-l-8 border-[#D4AF37]">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50%" cy="50%" r="40%" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 5" />
          </svg>
        </div>

        <div className="relative z-10 text-right">
          <span className="text-[#D4AF37] tracking-widest text-xs font-semibold uppercase">Community Advocacy Node</span>
          <div className="h-1 w-12 bg-[#D4AF37] mt-3 ml-auto"></div>
        </div>

        <div className="relative z-10 my-auto text-right max-w-md ml-auto">
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
            Register <br />
            <span className="text-[#D4AF37]">Community Account</span>
          </h1>
          <p className="text-stone-200 text-sm mt-4 font-light leading-relaxed">
            Create a verified profile to connect with campus updates, adoption pipelines, and support teams.
          </p>
        </div>

        <div className="relative z-10 text-[11px] text-stone-400 font-mono tracking-wider text-right">
          CIT-U WILDCAT WELFARE INFRASTRUCTURE NODE
        </div>
      </div>

      {/* Main Interactive Account Creation Panel */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100">
          <div className="mb-6">
            <div className="inline-flex bg-amber-50 border border-[#D4AF37]/30 text-[#5C0612] rounded-xl p-3 mb-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-6 1c-2.76 0-5 2.24-5 5v2h10v-2c0-2.76-2.24-5-5-5z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Identity Initialization</h2>
            <p className="text-xs text-slate-500 mt-1">Provide records to verify institutional placement.</p>
          </div>

          {message.text && (
            <div className={`p-3 rounded-xl text-xs mb-5 font-medium border ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">First Name</label>
                <input 
                  type="text" name="first_name" value={formData.first_name} onChange={handleChange} required
                  placeholder="Juan"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612] text-sm bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Last Name</label>
                <input 
                  type="text" name="last_name" value={formData.last_name} onChange={handleChange} required
                  placeholder="Dela Cruz"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612] text-sm bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Institutional ID String</label>
              <input 
                type="text" name="id" value={formData.id} onChange={handleIdChange} required
                placeholder="12-3456-789"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612] font-mono text-sm bg-slate-50/50 tracking-widest"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">CIT Domain Email</label>
              <input 
                type="email" name="email" value={formData.email} onChange={handleChange} required
                placeholder="juandela.cruz@cit.edu"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612] text-sm bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Password Assignment</label>
              <input 
                type="password" name="password" value={formData.password} onChange={handleChange} required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5C0612] text-sm bg-slate-50/50"
              />
            </div>

            <button type="submit" className="w-full py-3 bg-[#5C0612] hover:bg-[#42040B] text-white font-medium rounded-xl tracking-wider text-xs shadow-md transition-colors border-b-4 border-[#D4AF37] mt-2">
              SUBMIT SYSTEM REGISTRATION
            </button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already possess an authenticated token?{" "}
              <button onClick={togglePage} className="text-[#5C0612] font-semibold hover:underline focus:outline-none">Sign In</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}