import React, { useState } from 'react';

export default function ReportSightingView({ session }) {
  const [animalType, setAnimalType] = useState('Cat');
  const [distinctFeatures, setDistinctFeatures] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', isError: false });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!distinctFeatures.trim() || !locationDetails.trim()) {
      setMsg({ text: 'All descriptive parameter blocks are required.', isError: true });
      return;
    }

    setSubmitting(true);
    setMsg({ text: '', isError: false });

    const formData = new FormData();
    formData.append('reporter_email', session?.email || 'anonymous@cit.edu');
    formData.append('animal_type', animalType);
    formData.append('distinct_features', distinctFeatures.trim());
    formData.append('location_details', locationDetails.trim());
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/sightings/', {
        method: 'POST',
        body: formData 
      });

      if (res.ok) {
        setMsg({ text: 'Sighting payload securely logged into institutional servers.', isError: false });
        setDistinctFeatures('');
        setLocationDetails('');
        setImageFile(null);
        setImagePreview(null);
        if (e.target) e.target.reset(); 
      } else {
        setMsg({ text: 'Server rejected core structural parameters alignment validation.', isError: true });
      }
    } catch (err) {
      setMsg({ text: 'Network connection check interface timeout.', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* BALANCED POSITION CARD:
       - Adjusted from 'mt-2' to 'mt-1' to pull the component layout upward.
       - Keeps the card safely decoupled from the top navbar while reclaiming space for the bottom button.
    */
    <div className="w-full max-w-5xl bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden mx-auto animate-fade-in text-xs text-slate-700 font-sans self-start mt-1">
      
      {/* Header Banner Section Layout (Tuned py-4 to py-3 for premium compact styling) */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-left select-none">
        <div>
          <h3 className="font-black text-slate-900 text-sm tracking-tight">Report Campus Animal Sighting Log</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-normal">Log undocumented loose, stray, or distressed animals within the facility parameters for immediate triage screening.</p>
        </div>
        <span className="bg-[#5C0612]/10 text-[#5C0612] border border-[#5C0612]/20 rounded-xl font-mono text-[9px] font-black uppercase tracking-wider px-3 py-1">Telemetry Input</span>
      </div>

      {/* Main Body Padding optimized from p-6 to p-5 */}
      <div className="p-5 shadow-inner">
        {msg.text && (
          <div className={`p-3.5 mb-4 rounded-xl font-medium text-center border ${msg.isError ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN: PARAMETER FORM INPUTS */}
          <div className="lg:col-span-7 space-y-3.5 text-left">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Animal Classification Tier *</label>
              <div className="flex gap-2 font-mono text-[10px] font-bold">
                {['Cat', 'Dog', 'Others'].map((type) => (
                  <button 
                    type="button" 
                    key={type} 
                    onClick={() => setAnimalType(type)} 
                    className={`flex-1 py-2.5 rounded-xl transition-all border ${animalType === type ? 'bg-[#5C0612] border-[#5C0612] text-white font-black shadow-md scale-[1.01]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Location Details or Facility Landmarks *</label>
              <input 
                type="text" 
                value={locationDetails} 
                onChange={(e) => setLocationDetails(e.target.value)} 
                placeholder="e.g., Behind CIT-U Main Library near the access path stairs" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#5C0612] font-medium text-slate-800 transition-all placeholder-slate-400" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Distinguishing Somatic Features *</label>
              <textarea 
                rows="3" 
                value={distinctFeatures} 
                onChange={(e) => setDistinctFeatures(e.target.value)} 
                placeholder="Specify coat colors, coat patterns, visible wounds, tracking collar presence, behavioral traits, or approximate size metrics..." 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#5C0612] font-sans leading-relaxed text-slate-800 transition-all resize-none placeholder-slate-400" 
              />
            </div>
          </div>

          {/* RIGHT COLUMN: EVIDENCE CAMERA & PREVIEW WINDOW */}
          <div className="lg:col-span-5 h-full flex flex-col text-left">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Telemetry Evidence Asset *</label>
            
            <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-4 flex-1 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden">
              {imagePreview ? (
                <div className="w-full h-full min-h-[180px] max-h-[220px] rounded-xl overflow-hidden border shadow-sm bg-slate-900 relative group animate-scale-up">
                  <img src={imagePreview} alt="Sighting Preview Evidence" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => { setImageFile(null); setImagePreview(null); }} 
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white font-mono text-[10px] font-bold p-1 px-2.5 rounded-full shadow transition-all"
                  >
                    ✕ Wipe Asset
                  </button>
                </div>
              ) : (
                <label className="text-center space-y-2 cursor-pointer p-4 group">
                  <div className="w-10 h-10 bg-slate-100 group-hover:bg-slate-200 text-slate-400 group-hover:text-slate-500 rounded-full flex items-center justify-center mx-auto transition-colors shadow-inner">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316A2.192 2.192 0 0015.3 4H8.7a2.192 2.192 0 00-1.658.753l-.822 1.322z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1.5 bg-white border text-slate-600 font-bold font-mono text-[10px] rounded-xl shadow-sm group-hover:bg-slate-50 transition-all">
                      BROWSE SYSTEM STORAGE
                    </span>
                  </div>
                  <p className="text-[10px] font-normal text-slate-400 tracking-normal px-2">Attach camera capture frames or media evidence packets to aid animal identification searches.</p>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* STUDENT LOGGINGS PROTOCOLS COMPLIANCE BAR ROW */}
          <div className="lg:col-span-12 bg-amber-50/20 border border-amber-200/60 rounded-2xl p-4 text-left space-y-2.5 mt-1">
            <div>
              <h5 className="font-black text-amber-900 text-[12px] tracking-tight flex items-center gap-2">
                <span>📋</span> Student Sighting Protocol & Guidelines
              </h5>
              <p className="text-[10px] text-slate-400 font-normal">Please review these operational baselines carefully before executing an engineering log stream dispatch.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-[11px] leading-relaxed text-slate-600 font-normal border-t border-amber-200/40 pt-2.5">
              <div>
                <p className="font-bold text-slate-800 mb-0.5">1. Maintain Tactical Safety Distance</p>
                <p>Never approach or touch a distressed, injured, or unfamiliar animal within facility zones. Log parameters from a safe distance to ensure personal and student safety lines remain intact.</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-0.5">2. Provide High-Fidelity Landmark Strings</p>
                <p>Ensure location metrics include descriptive landmarks (e.g., floor levels, alcoves, or room paths). Avoid brief labels like "near canteen" as it causes response search tracking delays.</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-0.5">3. Submit Clear Evidence Assets</p>
                <p>Strive to attach clear photographic evidence whenever possible. Accurate visuals allow peer facilitators and responders to pre-verify matching tracking records inside the portal deck.</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-0.5">4. Avoid Redundant Case Logging</p>
                <p>Do not file duplicate entries for the same animal within short time windows. Check the community newsfeed first to ensure someone else hasn't already opened an active sighting area.</p>
              </div>
            </div>
          </div>

          {/* Action Trigger Button Section */}
          <div className="lg:col-span-12 pt-1">
            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full py-3 bg-gradient-to-r from-[#5C0612] to-[#7A0918] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 text-white font-black tracking-widest rounded-xl border-b-4 border-[#D4AF37] hover:bg-[#42040B] transition-all uppercase shadow-md text-xs"
            >
              {submitting ? 'Transmitting Evidence Log Packet...' : 'Transmit Sighting Entry File'}
            </button>
          </div>

        </form>
      </div>

      {/* Footer Identity Tracker Layer */}
      <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex font-mono text-[9px] text-slate-400 select-none">
        Reporter Session Digital ID Check sum: <span className="text-slate-600 font-sans font-medium ml-1.5">{session?.email || 'anonymous@cit.edu'}</span>
      </div>

    </div>
  );
}
