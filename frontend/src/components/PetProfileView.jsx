import React, { useState, useEffect } from 'react';

export default function PetProfileView({ petId, onBackToScanner }) {
  const [petData, setPetData] = useState(null);
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
        setPetData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading pet profile:', err);
        setError(err.message || 'Unable to connect to campus registry.');
        setLoading(false);
      });
  }, [petId]);

  const isCampus = (pet) => {
    if (!pet) return false;
    const type = (pet.pet_type || '').toLowerCase();
    const status = (pet.adoption_status || '').toLowerCase();
    return type.includes('campus') || type.includes('resident') || status.includes('campus') || status === 'not for adoption';
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-16 px-4 text-center animate-fade-in">
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-10 h-10 border-3 border-t-transparent border-[#5C0612] rounded-full animate-spin mx-auto"></div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Loading Animal Profile</h4>
            <p className="text-xs text-slate-400 mt-1 font-mono">Querying CIT-U Campus Registry for #{petId}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !petData || petData.error) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 text-center animate-fade-in">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Animal Record Not Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {error || `No registered animal matches tag ID #${petId}.`}
            </p>
          </div>
          <button 
            onClick={onBackToScanner} 
            className="px-6 py-2.5 bg-[#5C0612] hover:bg-[#7A0918] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            ← Back to Collar QR Scanner
          </button>
        </div>
      </div>
    );
  }

  const isAdopted = petData.adoption_status === 'Adopted';
  const isCampusResident = isCampus(petData);

  return (
    <div className="w-full max-w-4xl mx-auto py-2 px-2 sm:px-4 animate-fade-in text-slate-800 space-y-5 text-left">
      
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={onBackToScanner}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          <svg className="w-4 h-4 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Scanner
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg">
            TAG #{petData.pet_id}
          </span>
          <span className={`text-[11px] font-bold px-3 py-1 rounded-lg border uppercase tracking-wider ${
            isAdopted 
              ? 'bg-slate-100 text-slate-700 border-slate-300'
              : isCampusResident
              ? 'bg-[#5C0612] text-[#D4AF37] border-[#D4AF37]/30'
              : 'bg-amber-500 text-white border-amber-600'
          }`}>
            {isAdopted ? 'Adopted Alumni' : isCampusResident ? 'Campus Pet' : 'Available for Adoption'}
          </span>
        </div>
      </div>

      {/* Main Profile Showcase Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        
        {/* Maroon Institutional Header Strip */}
        <div className="bg-[#5C0612] px-6 py-4 flex items-center justify-between text-white border-b-2 border-[#D4AF37]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block font-bold">
                Task Force Bruno &bull; Official Profile Record
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {petData.name}’s Verified Medical & Welfare Profile
              </h2>
            </div>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-medium text-white/80 bg-white/10 px-3 py-1 rounded-lg border border-white/10 font-mono">
            CIT-U Animal Welfare
          </span>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          
          {/* Hero Row: Photo + Primary Overview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left Portrait */}
            <div className="md:col-span-5 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] sm:aspect-square relative shadow-inner">
              <img
                src={petData.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'}
                alt={petData.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold rounded-lg border border-white/20">
                  {petData.species} &bull; {petData.gender}
                </span>
                <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold rounded-lg border border-slate-300 font-mono">
                  {petData.age || 'Adult'}
                </span>
              </div>
            </div>

            {/* Right Quick Summary */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {petData.name}
                  </h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {petData.species}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Breed / Physical Strain: <span className="text-slate-800 font-semibold">{petData.breed || 'Domestic Companion Mix'}</span>
                </p>
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender</span>
                  <span className="text-xs font-black text-slate-800 mt-0.5 block">{petData.gender}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age</span>
                  <span className="text-xs font-black text-slate-800 mt-0.5 block">{petData.age || 'Adult'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weight</span>
                  <span className="text-xs font-black text-slate-800 mt-0.5 block font-mono">{petData.weight || 'N/A'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Size Tier</span>
                  <span className="text-xs font-black text-slate-800 mt-0.5 block">{petData.size || 'Medium'}</span>
                </div>
              </div>

              {/* Public Health Quarantine Alert */}
              {petData.is_quarantined ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-800">
                    <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    Campus Health Observation Notice (RA 9482)
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-700">
                    This animal is currently under temporary observation. Please avoid direct handling. Report any concerns to MDC / Security.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="text-xs">
                    <strong className="font-bold text-emerald-950">Verified Active Campus Resident:</strong>
                    <span className="text-emerald-800 block text-[11px]">Monitored and vaccinated under CIT-U Task Force Bruno guidelines.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* Section A: Territory & Campus Care */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                Campus Territory & Care Info
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Frequent Campus Zone</span>
                  <strong className="text-slate-900 font-semibold">{petData.found_near || 'CIT-U Grounds'}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Designated Feeding Station</span>
                  <strong className="text-slate-900 font-semibold">{petData.feeding_area || 'Designated Campus Care Station'}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Rescue / Registration Date</span>
                  <strong className="text-slate-900 font-mono font-semibold">{petData.rescue_date || 'N/A'}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Program Status</span>
                  <strong className="text-slate-900 font-semibold">{petData.adoption_status}</strong>
                </div>
              </div>
            </div>

            {/* Section B: Medical & Behavioral Profile */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                Health & Behavioral Assessment
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Vaccination Status</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                    petData.vaccination_status === 'Fully Vaccinated'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : petData.vaccination_status === 'Partially Vaccinated'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {petData.vaccination_status || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Sterilized (TNR Certified)</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                    petData.spayed_neutered ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {petData.spayed_neutered ? 'Yes (Neutered)' : 'No'}
                  </span>
                </div>
                <div className="py-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium block mb-1">Behavior & Handling Notes</span>
                  <span className="text-slate-800 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200 block">
                    {petData.behavior_notes || 'Friendly campus companion. Calm and cooperative.'}
                  </span>
                </div>
                {petData.current_conditions && petData.current_conditions !== 'None' && (
                  <div className="py-1.5">
                    <span className="text-rose-600 font-bold block mb-0.5">Clinical / Medical Notes</span>
                    <span className="text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 block font-mono text-[11px]">
                      {petData.current_conditions}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Section C: Biography & Visual Identification Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Biography Summary
              </span>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{petData.about_text || 'A beloved CIT-U campus animal cared for by the Task Force Bruno community.'}"
              </p>
            </div>

            <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Visual Identification Features
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {petData.description || 'Standard coat and markings registered in the CIT-U animal directory.'}
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBackToScanner}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            ← Back to Scanner
          </button>

          <span className="text-[11px] text-slate-400 font-mono">
            CIT-U Task Force Bruno &bull; Official Digital Animal ID
          </span>
        </div>

      </div>

    </div>
  );
}