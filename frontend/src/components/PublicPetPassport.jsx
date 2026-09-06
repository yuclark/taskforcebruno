import React, { useState, useEffect } from 'react';

export default function PublicPetPassport({ petId, onClose, onGoLogin }) {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!petId) return;
    setLoading(true);
    setError('');

    fetch(`https://taskforcebruno.onrender.com/api/pets/${encodeURIComponent(petId)}/`)
      .then((res) => {
        if (!res.ok) throw new Error(`Animal record for ID "${petId}" was not found.`);
        return res.json();
      })
      .then((data) => {
        setPet(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Unable to connect to campus registry.');
        setLoading(false);
      });
  }, [petId]);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 text-slate-800 text-left animate-scale-up">
        
        {/* Institutional Top Header */}
        <div className="bg-[#5C0612] text-white p-5 flex items-center justify-between border-b-4 border-[#D4AF37]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] block font-semibold">
                Task Force Bruno &bull; CIT-U
              </span>
              <h2 className="text-sm md:text-base font-black tracking-tight leading-tight">
                Official Campus Animal Passport
              </h2>
            </div>
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Close passport"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
            Verifying collar security tag credentials...
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-800">Unregistered Tag Scan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
            {onClose && (
              <button 
                onClick={onClose}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
              >
                Return
              </button>
            )}
          </div>
        ) : pet && (
          <div className="p-6 space-y-5">
            
            {/* Active Quarantine Caution Alert (If under observation) */}
            {pet.is_quarantined && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 space-y-1.5 animate-pulse">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider font-mono">
                  <svg className="w-4 h-4 text-rose-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  Campus Health Observation Notice (RA 9482)
                </div>
                <p className="text-[11px] leading-relaxed text-rose-800 font-medium">
                  This companion is currently under a routine 14-day observation protocol following a campus incident report. Please <strong>do not feed, touch, or handle</strong>. Report any irregular behavior to Campus Security or MDC.
                </p>
              </div>
            )}

            {/* Profile Header Block */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-slate-100 text-center sm:text-left">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm shrink-0 bg-slate-100">
                {pet.primary_image ? (
                  <img src={pet.primary_image} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 font-mono text-[10px] uppercase font-bold">
                    No Photo
                  </div>
                )}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{pet.name}</h3>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    {pet.pet_id}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  {pet.species} &bull; {pet.breed || 'Domestic Companion'} &bull; {pet.gender || 'Unknown'}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                    pet.pet_type === 'Campus Pet' 
                      ? 'bg-amber-50 text-amber-800 border-amber-200' 
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}>
                    {pet.pet_type === 'Campus Pet' ? 'Permanent Campus Resident' : 'Rescue Animal'}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {pet.vaccination_status || 'Vaccination Tracked'}
                  </span>

                  {pet.spayed_neutered && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      TNR Sterilized
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Vitals and Campus Territory Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Campus Colony Zone</span>
                <span className="font-bold text-slate-800">{pet.found_near || 'CIT-U Campus Grounds'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Registered Weight</span>
                <span className="font-bold text-slate-800">{pet.weight || 'Recorded on file'}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200/50">
                <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block mb-0.5">Physical Identification Notes</span>
                <p className="text-[11px] text-slate-600 italic leading-relaxed">
                  "{pet.description || pet.about_text || 'Registered resident under Task Force Bruno.'}"
                </p>
              </div>
            </div>

            {/* Emergency Campus Contact Card */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold font-mono text-amber-800 uppercase tracking-wider block">
                  Campus Security & Pet Care Hotline
                </span>
                <p className="text-[11px] text-slate-700 font-medium">
                  If this animal is injured, lost outside campus, or in distress, contact MDC immediately:
                </p>
                <span className="font-mono font-bold text-slate-900 text-xs">(032) 261-7741 / loc. 144</span>
              </div>
              <a 
                href="tel:0322617741"
                className="px-3 py-2 bg-[#5C0612] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider shrink-0 shadow-sm"
              >
                Call Office
              </a>
            </div>

            {/* Platform Invitation Banner (Funneling unauthenticated students to log in) */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">
                Student & Faculty Community Access
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed max-w-sm mx-auto">
                Sign in with your official <strong>@cit.edu</strong> institutional account to report animal sightings, apply for pet adoptions, or join community discussions.
              </p>
              <button
                onClick={onGoLogin}
                className="mt-1 w-full py-2.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#5C0612] font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Sign In with CIT-U Account
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
