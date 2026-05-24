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

    // Multi-part data payload generation pipeline
    const formData = new FormData();
    formData.append('reporter_email', session?.email || 'anonymous@cit.edu');
    formData.append('animal_type', animalType);
    formData.append('distinct_features', distinctFeatures.trim());
    formData.append('location_details', locationDetails.trim());
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const res = await fetch('http://localhost:8000/api/sightings/', {
        method: 'POST',
        body: formData // Boundaries are set automatically by the fetch API handler
      });

      if (res.ok) {
        setMsg({ text: 'Sighting payload securely logged into institutional servers.', isError: false });
        setDistinctFeatures('');
        setLocationDetails('');
        setImageFile(null);
        setImagePreview(null);
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
    <div className="w-full max-w-xl bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm mx-auto text-xs text-slate-700 font-sans">
      <div className="text-center border-b pb-4 mb-5 space-y-1">
        <h3 className="font-black text-slate-900 text-base tracking-tight">Report Animal Sighting</h3>
        <p className="text-[11px] text-slate-400">Log undocumented loose or distressed animals within the facility parameters.</p>
      </div>

      {msg.text && (
        <div className={`p-3.5 mb-4 rounded-xl font-medium text-center border ${msg.isError ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-3">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Animal Classification Tier</label>
            <div className="flex gap-2 font-mono text-[10px] font-bold">
              {['Cat', 'Dog', 'Unknown'].map((type) => (
                <button type="button" key={type} onClick={() => setAnimalType(type)} className={`flex-1 py-2 rounded-xl transition-all border ${animalType === type ? 'bg-[#5C0612] border-[#5C0612] text-white font-black shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location Details or Facility Landmarks *</label>
            <input type="text" value={locationDetails} onChange={(e) => setLocationDetails(e.target.value)} placeholder="e.g., Behind CIT-U Main Library near the access path stairs" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#5C0612] transition-colors" />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Distinguishing Somatic Features *</label>
            <textarea rows="3" value={distinctFeatures} onChange={(e) => setDistinctFeatures(e.target.value)} placeholder="Specify coat colors, physical wounds, tracking collar statuses, behavior characteristics, or size metrics..." className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#5C0612] font-sans leading-relaxed text-slate-800" />
          </div>
        </div>

        {/* IMAGE UPLOAD INTERFACE WINDOW */}
        <div className="border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/30 text-center space-y-3">
          <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block tracking-wider">Telemetry Evidence Log Attachment</span>
          
          <label className="block cursor-pointer">
            <span className="inline-block px-4 py-2 bg-white border text-slate-600 font-bold font-mono text-[10px] rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
              SELECT IMAGE FILE FROM DISK
            </span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          {imagePreview && (
            <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border border-slate-200 relative shadow-inner bg-slate-900 animate-scale-up">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center font-mono text-[9px] font-bold hover:bg-black">X</button>
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-[#5C0612] to-[#7A0918] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 text-white font-black tracking-widest rounded-xl border-b-2 border-[#D4AF37] transition-all shadow-md uppercase text-[10px]">
          {submitting ? 'Transmitting Log Packet...' : 'Transmit Sighting Entry File'}
        </button>
      </form>
    </div>
  );
}