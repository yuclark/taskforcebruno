import { useState, useEffect } from 'react';
import {
  Siren,
  HeartPulse,
  PhoneCall,
  ShieldAlert,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  ClipboardList,
  X,
} from 'lucide-react';
import EmergencyProtocolModal from './EmergencyProtocolModal';
import { apiPost } from '../lib/api';
import { SIGHTING_CAMPUS_ZONES } from '../lib/pets';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function ReportSightingView({ session }) {
  const [animalType, setAnimalType] = useState('Cat');
  const [campusZone, setCampusZone] = useState(SIGHTING_CAMPUS_ZONES[0]);
  const [locationDetails, setLocationDetails] = useState('');
  const [distinctFeatures, setDistinctFeatures] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showProtocolModal, setShowProtocolModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', isError: false });

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMsg({ text: 'Please select a valid image file (JPG, PNG, WebP, or GIF).', isError: true });
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMsg({ text: 'Photo must be 5 MB or smaller. Please choose a smaller image.', isError: true });
      e.target.value = '';
      return;
    }

    setMsg({ text: '', isError: false });
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!distinctFeatures.trim() || !locationDetails.trim()) {
      setMsg({
        text: 'Please provide both the specific location and distinguishing features.',
        isError: true,
      });
      return;
    }

    setSubmitting(true);
    setMsg({ text: '', isError: false });

    const formData = new FormData();
    formData.append('animal_type', animalType);
    formData.append('campus_zone', campusZone);
    formData.append('is_emergency', isEmergency ? 'true' : 'false');
    formData.append('distinct_features', distinctFeatures.trim());
    formData.append('location_details', locationDetails.trim());
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const res = await apiPost('/sightings/', formData);

      if (res.ok) {
        setMsg({
          text: isEmergency
            ? 'Urgent rescue alert submitted. Campus responders and MDC staff have been notified.'
            : 'Sighting report submitted. Thank you for helping keep campus animals safe.',
          isError: false,
        });
        setDistinctFeatures('');
        setLocationDetails('');
        setIsEmergency(false);
        setImageFile(null);
        setImagePreview(null);
        if (e.target) e.target.reset();
      } else {
        setMsg({
          text: res.error || 'Unable to submit sighting report. Please check your entries.',
          isError: true,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl bg-white border border-slate-200 shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden mx-auto animate-fade-in text-xs text-slate-700 font-sans my-2">
      <EmergencyProtocolModal
        isOpen={showProtocolModal}
        onClose={() => setShowProtocolModal(false)}
      />

      {/* Header Banner */}
      <div
        className={`px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left select-none transition-colors ${
          isEmergency ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isEmergency ? (
              <Siren className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#5C0612] shrink-0" />
            )}
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                isEmergency ? 'text-rose-700 font-bold' : 'text-[#5C0612]'
              }`}
            >
              {isEmergency ? 'Urgent Rescue Alert' : 'Campus Animal Sighting'}
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-base md:text-lg tracking-tight">
            Report a Campus Animal Sighting
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-2xl">
            Report a roaming, injured, or unfamiliar animal on campus so MDC responders and volunteers can assist quickly.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowProtocolModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-[11px] font-semibold transition-colors shadow-sm"
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Bite &amp; First-Aid Protocol (RA 9482)</span>
          </button>

          <span
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl text-[11px] font-semibold px-3 py-1.5 shrink-0 border ${
              isEmergency
                ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                : 'bg-[#5C0612]/10 text-[#5C0612] border-[#5C0612]/20'
            }`}
          >
            {isEmergency && <ShieldAlert className="w-3.5 h-3.5 shrink-0" />}
            <span>{isEmergency ? 'Priority Alert' : 'Standard Report'}</span>
          </span>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-4 sm:p-6 md:p-8">
        {msg.text && (
          <div
            className={`p-3.5 mb-6 rounded-2xl font-bold text-center border text-xs shadow-sm ${
              msg.isError
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsEmergency(!isEmergency)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsEmergency((prev) => !prev);
                }
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isEmergency
                  ? 'bg-rose-50 border-rose-300 shadow-sm'
                  : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isEmergency ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Siren className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className={`text-xs font-bold ${isEmergency ? 'text-rose-900' : 'text-slate-800'}`}>
                      Is this an Emergency / Urgent Rescue?
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Animal is injured, trapped, severely ill, or in immediate danger.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Mark as urgent emergency"
                  className="w-5 h-5 rounded-lg accent-rose-600 cursor-pointer shrink-0"
                />
              </div>

              {isEmergency && (
                <div className="mt-3 pt-3 border-t border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-rose-800">
                  <span>
                    <strong>First Aid:</strong> If someone was bitten or scratched, wash the wound with soap and running water for <strong>15 minutes</strong> immediately.
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProtocolModal(true);
                    }}
                    className="underline font-bold text-rose-900 hover:text-rose-950 shrink-0 text-left"
                  >
                    View 4-Step Protocol &rarr;
                  </button>
                </div>
              )}
            </div>

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
                Campus Zone *
              </label>
              <select
                value={campusZone}
                onChange={(e) => setCampusZone(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5C0612]/20 font-semibold text-slate-800 transition-all text-base sm:text-xs"
              >
                {SIGHTING_CAMPUS_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Specific Landmark or Nearest Room *
              </label>
              <input
                type="text"
                required
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="e.g. Ground floor stairs near Room 108, or behind the canteen"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5C0612]/20 font-medium text-slate-800 transition-all placeholder-slate-400 text-base sm:text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Appearance &amp; Distinguishing Features *
              </label>
              <textarea
                rows="4"
                required
                value={distinctFeatures}
                onChange={(e) => setDistinctFeatures(e.target.value)}
                placeholder="Describe coat colors, ear notch, visible injuries, collar, or behavior..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5C0612]/20 font-sans leading-relaxed text-slate-800 transition-all resize-none placeholder-slate-400 text-base sm:text-xs"
              />
            </div>
          </div>

          {/* Right Column: Photo Upload */}
          <div className="lg:col-span-5 flex flex-col text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Photo (Optional, Max 5 MB)
            </label>

            <div className="border-2 border-dashed border-slate-200 bg-slate-50/60 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[240px] relative overflow-hidden">
              {imagePreview ? (
                <div className="w-full h-full min-h-[220px] max-h-[280px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 relative">
                  <img src={imagePreview} alt="Sighting preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2.5 right-2.5 bg-black/75 hover:bg-black text-white font-mono text-[11px] font-bold py-1.5 px-3 rounded-full shadow inline-flex items-center gap-1 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-3 p-2 w-full">
                  <div className="w-12 h-12 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Camera className="w-6 h-6" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-[#5C0612] border border-[#D4AF37]/50 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all">
                      <Camera className="w-4 h-4 text-[#B69020]" />
                      <span>Take Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm hover:bg-slate-50 cursor-pointer transition-all">
                      <ImageIcon className="w-4 h-4 text-slate-500" />
                      <span>Upload Photo</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-400 px-2 leading-relaxed">
                    Clear photos help responders identify registered campus pets vs. new strays.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-slate-700 space-y-1 text-left">
              <span className="text-[10px] font-bold font-mono text-amber-900 uppercase tracking-wider block">
                Campus Safety Hotline
              </span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                For severe bites, attacks, or immediate emergencies, contact CIT-U Safety &amp; Security directly:
              </p>
              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-xs pt-0.5">
                <PhoneCall className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>(032) 261-7741 &bull; local 144 / Safety Office</span>
              </div>
            </div>
          </div>

          {/* Guidelines Row */}
          <div className="lg:col-span-12 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-left space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#5C0612]" />
              <h5 className="font-bold text-slate-900 text-xs tracking-tight">
                Sighting &amp; Safety Guidelines
              </h5>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-[11px] leading-relaxed text-slate-600 border-t border-slate-200/60 pt-3">
              <div>
                <p className="font-bold text-slate-800 mb-0.5">1. Keep a Safe Distance</p>
                <p>Never corner an unfamiliar or distressed animal. Observe from a safe vantage point.</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-0.5">2. Note Exact Landmarks</p>
                <p>Include the building, floor, or nearest room so responders can find the animal faster.</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-0.5">3. Attach a Clear Photo</p>
                <p>Photos help staff check whether the animal is already registered in the campus directory.</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-0.5">4. Avoid Duplicates</p>
                <p>Check the Community Feed first to see if someone recently reported the same animal.</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="lg:col-span-12">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3.5 text-white font-bold tracking-wider rounded-xl border-b-2 shadow-md transition-all uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-60 ${
                isEmergency
                  ? 'bg-rose-700 hover:bg-rose-800 border-b-rose-950 shadow-rose-200'
                  : 'bg-gradient-to-r from-[#5C0612] to-[#7A0918] hover:from-[#6D0816] hover:to-[#8E0B1C] border-[#D4AF37]'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Report...</span>
                </>
              ) : (
                <>
                  {isEmergency && <Siren className="w-4 h-4 shrink-0" />}
                  <span>{isEmergency ? 'Submit Emergency Sighting Alert' : 'Submit Sighting Report'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-slate-400 select-none">
        <span>CIT-U Campus Animal Safety</span>
        <span>
          Signed in as: <strong className="font-sans text-slate-700">{session?.email || 'CIT-U Member'}</strong>
        </span>
      </div>
    </div>
  );
}
