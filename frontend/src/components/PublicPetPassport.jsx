import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, PhoneCall, RotateCw, ShieldAlert, X } from 'lucide-react';
import { apiGet } from '../lib/api';
import { getVaccinationBadgeStyles, isPetQuarantined, safeImageUrl } from '../lib/pets';

export default function PublicPetPassport({ petId, isLoggedIn = false, onClose, onGoLogin }) {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  const loadPassport = useCallback(async () => {
    if (!petId) return;
    setLoading(true);
    setError('');
    const res = await apiGet(`/pets/${encodeURIComponent(petId)}/`, { auth: false });
    if (res.ok && res.data) {
      setPet(res.data);
      setNowMs(Date.now());
    } else {
      setPet(null);
      setError(res.error || `Animal record for ID "${petId}" was not found.`);
    }
    setLoading(false);
  }, [petId]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!petId) return;
      setLoading(true);
      setError('');
      const res = await apiGet(`/pets/${encodeURIComponent(petId)}/`, { auth: false });
      if (!active) return;
      if (res.ok && res.data) {
        setPet(res.data);
        setNowMs(Date.now());
      } else {
        setPet(null);
        setError(res.error || `Animal record for ID "${petId}" was not found.`);
      }
      setLoading(false);
    };
    run();
    return () => {
      active = false;
    };
  }, [petId]);

  // Lock background scroll & support Escape to close
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const expiryMs = pet?.quarantine_expiry_date ? new Date(pet.quarantine_expiry_date).getTime() : NaN;
  const hasValidExpiry = !Number.isNaN(expiryMs);
  const isFullyVaccinated = Boolean(pet?.vaccination_status && pet.vaccination_status.toLowerCase().includes('fully'));
  const quarantined = isPetQuarantined(pet);
  const portraitUrl = safeImageUrl(pet?.primary_image);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-passport-title"
      onClick={() => onClose && onClose()}
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: 'calc(100dvh - 1.5rem)' }}
        className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800 text-left animate-scale-up"
      >
        {/* Pinned Institutional Top Header */}
        <div className="bg-[#5C0612] text-white p-4 sm:p-5 flex items-center justify-between gap-2 border-b-4 border-[#D4AF37] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="Wildcat Welfare Portal Logo"
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-md shrink-0 select-none"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#D4AF37] block truncate">
                Task Force Bruno &bull; CIT-U
              </span>
              <h2 id="public-passport-title" className="text-sm sm:text-base font-bold tracking-tight leading-tight truncate">
                Official Campus Animal Passport
              </h2>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close passport"
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-[#5C0612] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Looking up collar tag #{petId}...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Tag Not Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">{error}</p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={loadPassport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          ) : (
            pet && (
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {/* Active Quarantine Caution Notice */}
                {quarantined && (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-rose-900">
                        <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                        <span>14-Day Health Observation (RA 9482)</span>
                      </div>
                      {hasValidExpiry && (
                        <span className="px-2.5 py-0.5 bg-rose-200 text-rose-950 rounded-full font-mono text-[10px] font-bold">
                          {(() => {
                            const diff = expiryMs - nowMs;
                            if (diff <= 0) return 'Observation Completed';
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            return `${days}d ${hours}h remaining`;
                          })()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-rose-900">
                      This animal is under mandatory 14-day rabies observation following a campus incident report. Please{' '}
                      <strong>do not feed, touch, or handle</strong>. Contact Campus Security or MDC if you notice unusual behavior.
                    </p>
                    {hasValidExpiry && (
                      <div className="text-[11px] font-mono text-rose-800 bg-rose-100/80 px-2.5 py-1.5 rounded-lg">
                        Release Date:{' '}
                        <strong>
                          {new Date(expiryMs).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-slate-100 text-center sm:text-left">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm shrink-0 bg-slate-100">
                    {portraitUrl ? (
                      <img src={portraitUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                        No Photo
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{pet.name}</h3>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {pet.pet_id}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                      {pet.species} &bull; {pet.breed || 'Domestic Companion'} &bull; {pet.gender || 'Unknown'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
                          pet.pet_type === 'Campus Pet'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : (pet.pet_type || '').toLowerCase().includes('stray')
                            ? 'bg-orange-50 text-orange-900 border-orange-200'
                            : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                        }`}
                      >
                        {pet.pet_type === 'Campus Pet'
                          ? 'Campus Resident'
                          : (pet.pet_type || '').toLowerCase().includes('stray')
                          ? 'Registered Stray'
                          : 'Available for Adoption'}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${getVaccinationBadgeStyles(
                          pet.vaccination_status
                        )}`}
                      >
                        {isFullyVaccinated
                          ? 'Fully Vaccinated - Rabies Valid'
                          : pet.vaccination_status || 'Not Vaccinated'}
                      </span>

                      {pet.spayed_neutered && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                          TNR Sterilized
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vitals & Territory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Usual Campus Area
                    </span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {pet.found_near || 'CIT-U Campus Grounds'}
                    </span>
                  </div>
                  <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Feeding Station
                    </span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {pet.feeding_area || 'Scheduled Campus Feeding Station'}
                    </span>
                  </div>
                  <div className="sm:col-span-2 pt-2.5 border-t border-slate-200/70">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Temperament &amp; Interaction Tips
                    </span>
                    <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                      {pet.behavior_notes ||
                        'Friendly campus companion. Please do not feed harmful table scraps.'}
                    </p>
                  </div>
                  <div className="sm:col-span-2 pt-2.5 border-t border-slate-200/70">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Physical Description
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pet.description ||
                        pet.about_text ||
                        'Registered companion cared for under CIT-U Task Force Bruno.'}
                    </p>
                  </div>
                </div>

                {/* Emergency Hotline */}
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      Campus Security &amp; Pet Care Hotline
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      If this animal is injured, lost outside campus, or in distress, call MDC immediately:
                    </p>
                    <span className="font-mono font-bold text-slate-900 text-xs block pt-0.5">
                      (032) 261-7741 / loc. 144
                    </span>
                  </div>
                  <a
                    href="tel:0322617741"
                    className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2.5 bg-[#5C0612] hover:bg-[#42040B] text-white font-semibold rounded-xl text-xs shrink-0 shadow-sm transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Call Office</span>
                  </a>
                </div>

                {/* Sign-In Invitation (only when logged out) */}
                {!isLoggedIn && onGoLogin && (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2.5 text-center">
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] block font-bold">
                      CIT-U Community Portal
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                      Sign in with your <strong className="text-white">@cit.edu</strong> account to report sightings, apply for adoption, or join campus discussions.
                    </p>
                    <button
                      type="button"
                      onClick={onGoLogin}
                      className="mt-1 w-full py-2.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#5C0612] font-bold rounded-xl text-xs transition-colors shadow-md"
                    >
                      Sign In with CIT-U Account
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
