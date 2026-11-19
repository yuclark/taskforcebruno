import { useState } from 'react';
import { ShieldCheck, PawPrint, BellRing } from 'lucide-react';

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

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const emailClean = (formData.email || '').trim().toLowerCase();
    const idClean = (formData.id || '').trim();
    const firstNameClean = (formData.first_name || '').trim();
    const lastNameClean = (formData.last_name || '').trim();
    const passwordClean = formData.password || '';

    if (!firstNameClean || !lastNameClean) {
      setMessage({ type: 'error', text: 'Both First Name and Last Name are required.' });
      return;
    }

    if (!idClean || !/^\d{2}-\d{4}-\d{3}$/.test(idClean)) {
      setMessage({ type: 'error', text: 'Institutional ID format mismatch. Must be XX-XXXX-XXX.' });
      return;
    }

    if (!emailClean.endsWith('@cit.edu')) {
      setMessage({ type: 'error', text: 'Registration requires an active CIT-U email address ending in @cit.edu' });
      return;
    }

    if (passwordClean.length < 6) {
      setMessage({ type: 'error', text: 'Password must contain at least 6 characters.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: idClean,
          first_name: firstNameClean,
          last_name: lastNameClean,
          email: emailClean,
          password: passwordClean
        }),
      });
      const data = await res.json();
      if (res.ok) {
        try {
          localStorage.setItem(`tfb_user_profile_${emailClean}`, JSON.stringify({
            id: idClean,
            student_id: idClean,
            custom_id: idClean,
            first_name: firstNameClean,
            last_name: lastNameClean,
            full_name: `${firstNameClean} ${lastNameClean}`.trim(),
            email: emailClean
          }));
        } catch {
          // Ignore storage quota errors
        }
        setMessage({ type: 'success', text: data.message || 'Account initialized successfully! You may now sign in.' });
        setFormData({ id: '', first_name: '', last_name: '', email: '', password: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Account creation failed. Please check inputs.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error: Unable to reach registration server. Please check your internet.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row-reverse bg-white text-slate-800">
      {/* Right Mirrored Branding Column */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-bl from-[#6D0A19] via-[#5C0612] to-[#38030A] p-12 lg:p-16 flex-col justify-between relative overflow-hidden border-l-4 border-[#D4AF37]">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-black/30 blur-3xl pointer-events-none" />

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
              alt="Wildcat Welfare Portal - Task Force Bruno Logo"
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

          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-3 text-xs text-stone-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Verified Institutional Access</span>
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

        <div className="relative z-10 text-[11px] text-stone-300/70 tracking-wide text-right">
          CIT-U Medical-Dental Clinic &bull; Task Force Bruno
        </div>
      </div>

      {/* Main Interactive Account Creation Panel */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="Wildcat Welfare Portal Logo"
                className="w-12 h-12 object-contain drop-shadow-md select-none shrink-0"
              />
              <div className="md:hidden">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4AF37] block">CIT-U Task Force Bruno</span>
                <span className="text-sm font-black text-[#5C0612] tracking-tight">Wildcat Welfare Portal</span>
              </div>
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

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-60 text-white font-medium rounded-xl tracking-wider text-xs shadow-md transition-colors border-b-4 border-[#D4AF37] mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>INITIALIZING ACCOUNT...</span>
                </>
              ) : (
                <span>SUBMIT SYSTEM REGISTRATION</span>
              )}
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