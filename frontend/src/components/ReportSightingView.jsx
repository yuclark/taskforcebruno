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
      setMsg({ text: 'Please fill in both the location and distinguishing features.', isError: true });
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
        setMsg({ text: 'Sighting report successfully submitted. Our team and marshals have been notified.', isError: false });
        setDistinctFeatures('');
        setLocationDetails('');
        setImageFile(null);
        setImagePreview(null);
        if (e.target) e.target.reset(); 
      } else {
        setMsg({ text: 'Unable to submit sighting report. Please check required fields.', isError: true });
      }
    } catch (err) {
      setMsg({ text: 'Network connection timeout. Please check your internet connection.', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden mx-auto animate-fade-in text-xs text-slate-700 font-sans my-2">
      
      {/* Header Banner */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-left select-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5C0612]" />
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#5C0612]">
              Community Rescue Dispatch
            </span>
          </div>
          <h3 className="font-black text-slate-900 text-base md:text-lg tracking-tight">
            Report Campus Animal Sighting
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-2xl">
            Report a roaming, injured, or unfamiliar animal on campus. Your report enables marshals and clinic staff to locate and triage companions quickly.
          </p>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#5C0612]/10 text-[#5C0612] border border-[#5C0612]/20 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 shrink-0">
          Community Report
        </span>
      </div>

      {/* Main Body Form */}
      <div className="p-6 md:p-8">
        {msg.text && (
          <div className={`p-4 mb-6 rounded-2xl font-medium text-center border text-xs ${
            msg.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: FORM INPUTS (Col 7) */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Animal Species *
              </label>
              <div className="flex gap-2.5 font-mono text-xs font-bold">
                {['Cat', 'Dog', 'Others'].map((type) => (
                  <button 
                    type="button" 
                    key={type} 
                    onClick={() => setAnimalType(type)} 
                    className={`flex-1 py-3 rounded-xl transition-all border ${
                      animalType === type
                        ? 'bg-[#5C0612] border-[#5C0612] text-white font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Location & Landmarks *
              </label>
              <input 
                type="text" 
                value={locationDetails} 
                onChange={(e) => setLocationDetails(e.target.value)} 
                placeholder="e.g., Behind CIT-U Main Library near the access path stairs" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5C0612]/20 font-medium text-slate-800 transition-all placeholder-slate-400 text-xs" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Appearance & Distinguishing Features *
              </label>
              <textarea 
                rows="4" 
                value={distinctFeatures} 
                onChange={(e) => setDistinctFeatures(e.target.value)} 
                placeholder="Describe coat colors, ear shapes, physical markings, injuries, collar presence, or behavioral traits..." 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5C0612]/20 font-sans leading-relaxed text-slate-800 transition-all resize-none placeholder-slate-400 text-xs" 
              />
            </div>
          </div>

          {/* RIGHT COLUMN: PHOTO UPLOAD & PREVIEW (Col 5) */}
          <div className="lg:col-span-5 flex flex-col text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Photo Evidence (Recommended)
            </label>
            
            <div className="border-2 border-dashed border-slate-200 bg-slate-50/60 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[240px] relative overflow-hidden">
              {imagePreview ? (
                <div className="w-full h-full min-h-[220px] max-h-[260px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 relative group">
                  <img src={imagePreview} alt="Sighting Preview Evidence" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => { setImageFile(null); setImagePreview(null); }} 
                    className="absolute top-2.5 right-2.5 bg-black/75 hover:bg-black text-white font-mono text-[11px] font-bold py-1 px-3 rounded-full shadow transition-all"
                  >
                    ✕ Remove Photo
                  </button>
                </div>
              ) : (
                <label className="text-center space-y-2.5 cursor-pointer p-4 group">
                  <div className="w-12 h-12 bg-white border border-slate-200 group-hover:border-[#5C0612]/40 text-slate-400 group-hover:text-[#5C0612] rounded-2xl flex items-center justify-center mx-auto transition-colors shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316A2.192 2.192 0 0015.3 4H8.7a2.192 2.192 0 00-1.658.753l-.822 1.322z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="inline-block px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm group-hover:bg-slate-50 transition-all">
                      Choose Photo from Device
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 px-4 leading-relaxed">
                    Attach a clear photo of the animal to help responders and rescuers identify them quickly.
                  </p>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* PROTOCOLS COMPLIANCE ROW */}
          <div className="lg:col-span-12 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-3 mt-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#5C0612]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h5 className="font-bold text-slate-900 text-xs tracking-tight">
                Community Sighting Guidelines & Safety Notes
              </h5>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-[11px] leading-relaxed text-slate-600 border-t border-slate-200/60 pt-3">
              <div>
                <p className="font-bold text-slate-800 mb-1">1. Keep a Safe Distance</p>
                <p>Never approach or corner an unfamiliar or distressed animal. Take note of details from a safe vantage point.</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-1">2. Note Specific Landmarks</p>
                <p>Include nearby buildings, floor levels, or landmarks to help responders locate the animal quickly.</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-1">3. Clear Photos Help Triage</p>
                <p>A photo helps volunteers check if the companion is an already registered resident or an untracked stray.</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-1">4. Avoid Duplicate Posts</p>
                <p>Check the Community Newsfeed first to see if another student or staff member recently reported the same sighting.</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="lg:col-span-12 pt-2">
            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full py-3.5 bg-gradient-to-r from-[#5C0612] to-[#7A0918] hover:from-[#6D0816] hover:to-[#8E0B1C] active:scale-[0.99] disabled:opacity-50 text-white font-bold tracking-wider rounded-xl border-b-2 border-[#D4AF37] shadow-md transition-all uppercase text-xs"
            >
              {submitting ? 'Submitting Sighting Report...' : 'Submit Sighting Report'}
            </button>
          </div>

        </form>
      </div>

      {/* Footer info */}
      <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between font-mono text-[10px] text-slate-400 select-none">
        <span>Campus Animal Safety Network</span>
        <span>Signed in as: <strong className="font-sans text-slate-700">{session?.email || 'anonymous@cit.edu'}</strong></span>
      </div>

    </div>
  );
}
