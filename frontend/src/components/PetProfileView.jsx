import React, { useState, useEffect } from 'react';

export default function PetProfileView({ petId, onBackToScanner }) {
  const [petData, setPetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicationForm, setApplicationForm] = useState({ fullName: '', contactNum: '', address: '', experience: 'Beginner' });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!petId) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/pets/${petId}/`)
      .then((res) => res.json())
      .then((data) => {
        setPetData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading verified pet data matrix:', err);
        setLoading(false);
      });
  }, [petId]);

  const handleApplySubmit = (e) => {
    e.preventDefault();
    setSuccessMessage(`Application for ${petData.name} successfully transmitted to the review board!`);
    setTimeout(() => {
      setSuccessMessage('');
      setShowApplyForm(false);
      setApplicationForm({ fullName: '', contactNum: '', address: '', experience: 'Beginner' });
    }, 3000);
  };

  if (loading) {
    return (
      <div className="w-full max-w-md bg-gradient-to-b from-slate-950 to-slate-900 rounded-[32px] p-12 text-center border-4 border-[#5C0612] text-slate-400 font-mono text-xs mx-auto">
        <div className="w-6 h-6 border-2 border-t-transparent border-[#D4AF37] rounded-full animate-spin mx-auto mb-3"></div>
        <span>RESOLVING DIGITAL ARCHIVE LINK...</span>
      </div>
    );
  }

  if (!petData || petData.error) {
    return (
      <div className="w-full max-w-sm bg-slate-950 rounded-[32px] p-6 text-center border-4 border-[#5C0612] text-white space-y-4 mx-auto">
        <p className="text-xs font-mono text-rose-400">UNRESOLVED SIGNATURE: INVALID REFERENCE KEY</p>
        <button onClick={onBackToScanner} className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-mono transition-all">
          RETURN TO OPTICAL TERMINAL
        </button>
      </div>
    );
  }

  const isEligibleForAdoption = petData.pet_type === 'For Adoption' && petData.adoption_status === 'Available';

  return (
    <div className="max-w-md w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-[32px] overflow-hidden shadow-[0_30px_70px_-15px_rgba(56,4,10,0.4)] border-4 border-[#5C0612] p-5 text-white flex flex-col justify-between relative h-[680px] animate-fade-in mx-auto">
      
      {/* Top System Header */}
      <div className="flex justify-between items-center text-[10px] opacity-40 font-mono tracking-widest border-b border-white/5 pb-2.5 mb-3 shrink-0">
        <span>DECRYPTED_NODE: #{petData.pet_id}</span>
        <span className="uppercase text-[#D4AF37] font-bold">{petData.pet_type || 'Campus Pet'}</span>
      </div>

      {/* COMPREHENSIVE FULL DATA WORKSPACE (Scrollable for mobile support) */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1 mb-3 text-left">
        
        {/* Media Frame Container */}
        <div className="w-full h-40 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden relative shadow-inner shrink-0">
          <img src={petData.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'} alt="" className="w-full h-full object-cover" />
          <span className={`absolute bottom-3 left-3 px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-widest border uppercase ${
            petData.pet_type === 'For Adoption' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-[#5C0612] text-[#D4AF37] border-[#D4AF37]/30'
          }`}>
            {petData.pet_type || 'Campus Pet'}
          </span>
        </div>

        {/* Identity Headings */}
        <div>
          <h3 className="text-xl font-black text-slate-100 tracking-tight leading-none">{petData.name}</h3>
          <p className="text-[10px] font-mono text-slate-500 font-bold uppercase mt-1">{petData.species} &bull; {petData.breed || 'Mixed Breed Line'}</p>
        </div>

        {/* BLOCK SECTION 1: Standardized Form Vitals Block */}
        <div className="grid grid-cols-4 gap-1 text-[9px] font-mono font-bold text-slate-400 uppercase text-center select-none">
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-white/5"><span className="text-[8px] text-slate-600 block mb-0.5">SEX</span>{petData.gender}</div>
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-white/5"><span className="text-[8px] text-slate-600 block mb-0.5">AGE</span>{petData.age || 'Adult'}</div>
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-white/5"><span className="text-[8px] text-slate-600 block mb-0.5">MASS</span>{petData.weight || 'N/A'}</div>
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-white/5"><span className="text-[8px] text-slate-600 block mb-0.5">SCALE</span>{petData.size || 'Medium'}</div>
        </div>

        {/* BLOCK SECTION 2: Environmental Sighting Tracking Fields */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-1.5 font-sans text-[11px] text-slate-400">
          <span className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Environmental Rescue Tracking:</span>
          <div className="flex justify-between"><span>Frequent Colony Zone:</span><strong className="text-slate-200 font-mono font-normal text-[10px]">{petData.found_near}</strong></div>
          <div className="flex justify-between"><span>Rescue Document Date:</span><strong className="text-slate-200 font-mono font-normal text-[10px]">{petData.rescue_date || 'N/A'}</strong></div>
          <div className="flex justify-between"><span>Pipeline Status Stage:</span><strong className="text-slate-200 font-mono font-normal text-[10px]">{petData.adoption_status}</strong></div>
        </div>

        {/* BLOCK SECTION 3: Detailed Clinical Diagnostic Variables */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-2 text-[11px]">
          <span className="text-[9px] font-bold font-mono text-[#D4AF37] uppercase tracking-wider block">Clinical Diagnostics Metrics:</span>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>Immunization: <strong className="text-emerald-400 block font-sans font-semibold mt-0.5">{petData.vaccination_status}</strong></div>
            <div>Sterilization: <strong className="text-blue-400 block font-sans font-semibold mt-0.5">{petData.spayed_neutered ? 'Yes (Neutered)' : 'Pending Neutering'}</strong></div>
          </div>
          <div className="pt-2 border-t border-white/5 text-slate-400">
            Medical Monitoring Logs:
            <span className="text-rose-400 font-mono block mt-0.5 text-[10px] bg-rose-950/20 px-2 py-1 rounded border border-rose-900/30">{petData.current_conditions || 'None registered.'}</span>
          </div>
          <div className="text-slate-400">
            Behavioral Evaluation Notes:
            <p className="text-slate-200 block mt-0.5 font-light leading-relaxed">{petData.behavior_notes || 'Stable behavior baseline configuration.'}</p>
          </div>
        </div>

        {/* BLOCK SECTION 4: Biography Paragraph Text */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Biography Summary:</span>
          <p className="text-[11px] leading-relaxed text-slate-300 font-light font-sans mt-1 italic">
            "{petData.about_text || 'No comprehensive history logged inside active system archives.'}"
          </p>
        </div>

      </div>

      {/* Context Actions Base Footer */}
      <div className="space-y-2 pt-2 border-t border-white/5 shrink-0">
        {isEligibleForAdoption ? (
          <button 
            onClick={() => setShowApplyForm(true)} 
            className="w-full py-2.5 bg-[#5C0612] hover:bg-[#42040B] text-white font-bold tracking-widest rounded-xl border-b-2 border-[#D4AF37] transition-all text-center text-[10px] uppercase shadow-md"
          >
            Submit Placement Application
          </button>
        ) : (
          <div className="w-full py-2.5 bg-slate-900/40 border border-white/5 text-slate-500 rounded-xl text-[10px] font-mono tracking-wider uppercase text-center select-none font-semibold">
            Institutional Protected Animal Asset
          </div>
        )}

        <button 
          onClick={onBackToScanner} 
          className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all uppercase"
        >
          Disconnect Asset Session
        </button>
      </div>

      {/* OVERLAY APPLICATION FORM (Unchanged logic loops) */}
      {showApplyForm && isEligibleForAdoption && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md p-5 flex flex-col justify-between z-40 rounded-[28px] animate-fade-in text-left">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Placement Application Form</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Target Companion Entity: {petData.name}</p>
            </div>

            {successMessage ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-xl text-center font-medium animate-pulse font-sans mt-12 text-xs leading-relaxed shadow-inner">
                {successMessage}
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-2 text-[11px]">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5 font-mono">Full Applicant Name</label>
                  <input type="text" required value={applicationForm.fullName} onChange={(e) => setApplicationForm({...applicationForm, fullName: e.target.value})} placeholder="Vince Clark Lanticse" className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5 font-mono">Contact Number</label>
                  <input type="text" required value={applicationForm.contactNum} onChange={(e) => setApplicationForm({...applicationForm, contactNum: e.target.value})} placeholder="09---------" className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5 font-mono">Residential Address</label>
                  <input type="text" required value={applicationForm.address} onChange={(e) => setApplicationForm({...applicationForm, address: e.target.value})} placeholder="Mandaue City, Cebu" className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5 font-mono">Caretaking Background</label>
                  <select value={applicationForm.experience} onChange={(e) => setApplicationForm({...applicationForm, experience: e.target.value})} className="w-full p-1.5 bg-slate-900 border border-white/10 rounded-lg text-slate-300 text-xs focus:outline-none">
                    <option value="Beginner">First-time Companion Caretaker</option>
                    <option value="Intermediate">Have managed 1-2 pets previously</option>
                    <option value="Expert">Experienced Multi-Animal Caretaker</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setShowApplyForm(false)} className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 font-semibold rounded-xl border border-white/5 font-mono text-[10px]">CANCEL</button>
                  <button type="submit" className="flex-1 py-2 bg-[#5C0612] text-white font-bold border-b-2 border-[#D4AF37] rounded-xl font-mono text-[10px]">TRANSMIT</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}