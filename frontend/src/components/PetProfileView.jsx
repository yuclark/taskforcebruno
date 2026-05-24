import React, { useEffect, useState } from 'react';

export default function PetProfileView({ petId, onBackToScanner }) {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPetDataModel = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8000/api/pets/${petId}/`);
        if (!response.ok) {
          throw new Error('Identified lookup index is not cataloged within database registry tables.');
        }
        const data = await response.json();
        setPet(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (petId) fetchPetDataModel();
  }, [petId]);

  if (loading) {
    return (
      <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-[#5C0612] border-t-[#D4AF37] rounded-full animate-spin mb-2"></div>
        <p className="text-xs font-mono text-slate-400 tracking-wider">RESOLVING SCHEMA DATA BLOCKS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-md p-6 text-center space-y-4">
        <div className="w-10 h-10 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl flex items-center justify-center mx-auto">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/></svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">Registry Exception Encountered</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{error}</p>
        </div>
        <button onClick={onBackToScanner} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors focus:outline-none">
          Re-initialize Scanner Optic
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row aspect-none md:aspect-[16/10]">
      
      {/* Media Display Branding Frame Block Left */}
      <div className="w-full md:w-2/5 bg-slate-900 relative min-h-[240px] md:min-h-full">
        <img 
          src={pet.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'} 
          alt={pet.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Absolute Floating Return Button Action */}
        <button 
          onClick={onBackToScanner}
          className="absolute top-4 left-4 bg-white hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1 transition-colors"
        >
          ← Return
        </button>

        {/* Identity Tags Overlay Dock */}
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <span className="text-[9px] font-bold tracking-widest font-mono uppercase bg-[#5C0612] text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/30">
            {pet.pet_id}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white mt-2 leading-none">{pet.name}</h2>
          <p className="text-xs text-stone-300 font-light mt-1.5">{pet.species} • {pet.breed}</p>
        </div>
      </div>

      {/* Structured Informational Data Sheets Block Right */}
      <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto max-h-[500px] md:max-h-full">
        <div className="space-y-5">
          
          {/* Quick Metrics Grid Matrix */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
              <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Gender</span>
              <span className="text-xs font-semibold text-slate-800">{pet.gender}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
              <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Scale Age</span>
              <span className="text-xs font-semibold text-slate-800">{pet.age}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
              <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Weight Mass</span>
              <span className="text-xs font-semibold text-slate-800">{pet.weight}</span>
            </div>
          </div>

          {/* At a Glance Metadata Zone */}
          <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 text-xs grid grid-cols-2 gap-2 text-slate-600">
            <div>
              <span className="block font-bold text-[8px] uppercase tracking-wider text-stone-400">Territory Colony</span>
              <span className="font-semibold text-slate-800 truncate block">{pet.found_near}</span>
            </div>
            <div>
              <span className="block font-bold text-[8px] uppercase tracking-wider text-stone-400">Rescue Timeline</span>
              <span className="font-semibold text-slate-800 block">{pet.rescue_date}</span>
            </div>
          </div>

          {/* Descriptive Block */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Ecosystem Status Background</h4>
            <p className="text-xs leading-relaxed text-slate-600 font-light">{pet.about_text}</p>
          </div>

          {/* MDC Medical Compliance Logs Section */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">MDC Clinical Logs Registry</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Vaccination Verification</span>
                <span className="font-semibold text-emerald-700">{pet.vaccination_status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">CNVR Operational Status</span>
                <span className="font-medium text-slate-800">{pet.spayed_neutered ? 'Sterilized / Castrated' : 'Intact'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Last Check-up Verification</span>
                <span className="font-mono text-slate-800">{pet.last_checkup}</span>
              </div>
            </div>
          </div>

          {/* Behavioral Profiles Component Block */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Behavior Analytics Log</h4>
            <p className="text-xs leading-relaxed text-slate-600 font-light italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              "{pet.behavior_notes}"
            </p>
          </div>

        </div>

        {/* Action Call Pipeline Control Button Area */}
        <div className="pt-4 border-t border-slate-100 flex gap-2 mt-4">
          <button className="flex-1 py-2.5 bg-[#5C0612] hover:bg-[#42040B] text-white text-xs font-semibold tracking-wider rounded-xl border-b-4 border-[#D4AF37] transition-all">
            SUBMIT APPLICATION APPLICATION
          </button>
          <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all">
            Log Donation
          </button>
        </div>
      </div>

    </div>
  );
}