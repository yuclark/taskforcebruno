import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Heart,
  HeartPulse,
  MapPin,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import EmergencyProtocolModal from './EmergencyProtocolModal';
import { apiGet } from '../lib/api';
import { parseLocalDate } from '../lib/dates';
import {
  DEFAULT_PET_IMAGE,
  getVaccinationBadgeStyles,
  isCampusPet,
  isPetQuarantined,
  safeImageUrl,
} from '../lib/pets';

export default function PetProfileView({ petId, onBackToScanner }) {
  const [petData, setPetData] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const loadProfile = useCallback(async () => {
    if (!petId) return;
    setLoading(true);
    setError('');
    const [petRes, vacRes] = await Promise.all([
      apiGet(`/pets/${encodeURIComponent(petId)}/`),
      apiGet(`/vaccinations/${encodeURIComponent(petId)}/`),
    ]);

    if (petRes.ok && petRes.data) {
      setPetData(petRes.data);
      setVaccinations(vacRes.ok && Array.isArray(vacRes.data) ? vacRes.data : []);
      setNowMs(Date.now());
    } else {
      setPetData(null);
      setError(petRes.error || `Animal record for ID "${petId}" was not found.`);
    }
    setLoading(false);
  }, [petId]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!petId) return;
      setLoading(true);
      setError('');
      const [petRes, vacRes] = await Promise.all([
        apiGet(`/pets/${encodeURIComponent(petId)}/`, { signal: controller.signal }),
        apiGet(`/vaccinations/${encodeURIComponent(petId)}/`, { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;

      if (petRes.ok && petRes.data) {
        setPetData(petRes.data);
        setVaccinations(vacRes.ok && Array.isArray(vacRes.data) ? vacRes.data : []);
        setNowMs(Date.now());
      } else {
        setPetData(null);
        setError(petRes.error || `Animal record for ID "${petId}" was not found.`);
      }
      setLoading(false);
    };
    run();
    return () => controller.abort();
  }, [petId]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xs max-w-md mx-auto space-y-3">
          <div className="w-9 h-9 border-3 border-slate-200 border-t-[#5C0612] rounded-full animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-slate-900">Loading Animal Profile</h4>
          <p className="text-xs text-slate-500">Retrieving record #{petId}...</p>
        </div>
      </div>
    );
  }

  if (error || !petData) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Animal Record Not Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              {error || `No registered animal matches tag ID #${petId}.`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={loadProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={onBackToScanner}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#5C0612] hover:bg-[#42040B] text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Scanner</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdopted = petData.adoption_status === 'Adopted';
  const isCampusResident =
    isCampusPet(petData.pet_type) || isCampusPet(petData.adoption_status);
  const quarantined = isPetQuarantined(petData);

  const rabiesList = vaccinations
    .filter((v) => (v.vaccine_name || '').toLowerCase().includes('rabies'))
    .sort((a, b) => new Date(b.administered_date || 0) - new Date(a.administered_date || 0));
  const latestRabies = rabiesList[0] || null;

  let rabiesDays = null;
  if (latestRabies?.next_due_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(latestRabies.next_due_date);
    if (due) {
      due.setHours(0, 0, 0, 0);
      rabiesDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    }
  }

  const expiryMs = petData.quarantine_expiry_date
    ? new Date(petData.quarantine_expiry_date).getTime()
    : NaN;
  const hasValidExpiry = !Number.isNaN(expiryMs);

  return (
    <div className="w-full max-w-4xl mx-auto pb-8 animate-fade-in text-slate-800 space-y-5 text-left">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={onBackToScanner}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#5C0612]" />
          <span>Back to Scanner</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-50 text-amber-950 border border-amber-200 rounded-lg">
            #{petData.pet_id}
          </span>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
              isAdopted
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : isCampusResident
                ? 'bg-[#5C0612] text-[#D4AF37] border-[#D4AF37]/30'
                : 'bg-amber-500 text-white border-amber-600'
            }`}
          >
            {isAdopted ? 'Adopted Alumni' : isCampusResident ? 'Campus Pet' : 'Available for Adoption'}
          </span>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#5C0612] px-5 sm:px-6 py-4 flex items-center justify-between gap-3 text-white border-b-2 border-[#D4AF37]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-wider block">
                Task Force Bruno &bull; Official Profile
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">
                {petData.name}&apos;s Medical &amp; Welfare Record
              </h2>
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs font-medium text-white/85 bg-white/10 px-3 py-1 rounded-lg border border-white/10 shrink-0">
            CIT-U Animal Welfare
          </span>
        </div>

        <div className="p-5 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-5 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] sm:aspect-square relative">
              <img
                src={safeImageUrl(petData.primary_image, DEFAULT_PET_IMAGE)}
                alt={petData.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 bg-black/65 backdrop-blur-sm text-white text-xs font-semibold rounded-lg">
                  {petData.species} &bull; {petData.gender}
                </span>
                <span className="px-2.5 py-1 bg-white/90 text-slate-800 text-xs font-bold rounded-lg font-mono">
                  {petData.age || 'Adult'}
                </span>
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {petData.name}
                  </h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {petData.species}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Breed:{' '}
                  <span className="text-slate-800 font-semibold">
                    {petData.breed || 'Domestic Mix'}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Gender', value: petData.gender || 'Unknown' },
                  { label: 'Age', value: petData.age || 'Adult' },
                  { label: 'Weight', value: petData.weight || 'N/A', mono: true },
                  { label: 'Size', value: petData.size || 'Medium' },
                ].map((v) => (
                  <div
                    key={v.label}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center"
                  >
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      {v.label}
                    </span>
                    <span className={`text-xs font-bold text-slate-900 mt-0.5 block ${v.mono ? 'font-mono' : ''}`}>
                      {v.value}
                    </span>
                  </div>
                ))}
              </div>

              {quarantined ? (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-950 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase text-rose-900">
                      <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>Quarantine / Rabies Observation (RA 9482)</span>
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
                  <p className="text-xs leading-relaxed text-rose-800">
                    Currently under 14-day clinical observation. Please avoid direct handling and report any concerns to MDC or Campus Security.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <strong className="font-bold block">Active Monitored Companion</strong>
                    <span className="text-emerald-800">
                      Tracked under CIT-U Task Force Bruno care guidelines.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#5C0612]" />
                <span>Campus Territory &amp; Care</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between gap-2 py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Frequent Zone</span>
                  <strong className="text-slate-900 text-right">{petData.found_near || 'CIT-U Grounds'}</strong>
                </div>
                <div className="flex justify-between gap-2 py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Feeding Station</span>
                  <strong className="text-slate-900 text-right">
                    {petData.feeding_area || 'Campus Feeding Station'}
                  </strong>
                </div>
                <div className="flex justify-between gap-2 py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Rescue Date</span>
                  <strong className="text-slate-900 font-mono">{petData.rescue_date || 'N/A'}</strong>
                </div>
                <div className="flex justify-between gap-2 py-1.5">
                  <span className="text-slate-500">Status</span>
                  <strong className="text-slate-900">{petData.adoption_status}</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#5C0612]" />
                <span>Health &amp; Behavior</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center gap-2 py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Vaccination Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${getVaccinationBadgeStyles(
                      petData.vaccination_status
                    )}`}
                  >
                    {petData.vaccination_status || 'Not Vaccinated'}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2 py-1.5 border-b border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Rabies Booster</span>
                    {latestRabies && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Given: {latestRabies.administered_date}
                      </span>
                    )}
                  </div>
                  {latestRabies ? (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono border ${
                        rabiesDays !== null && rabiesDays < 0
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : rabiesDays !== null && rabiesDays <= 30
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {rabiesDays !== null && rabiesDays < 0
                        ? `OVERDUE (${Math.abs(rabiesDays)}d)`
                        : rabiesDays !== null && rabiesDays <= 30
                        ? `DUE SOON (${rabiesDays}d)`
                        : `CURRENT (${latestRabies.next_due_date || 'Valid'})`}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      No Rabies Log
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center gap-2 py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Sterilized (TNR)</span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                      petData.spayed_neutered
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {petData.spayed_neutered ? 'Yes (Sterilized)' : 'No'}
                  </span>
                </div>

                <div className="py-1.5">
                  <span className="text-slate-500 block mb-1">Temperament &amp; Notes</span>
                  <span className="text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-200 block leading-relaxed">
                    {petData.behavior_notes || 'Friendly campus companion.'}
                  </span>
                </div>

                {petData.current_conditions && petData.current_conditions !== 'None' && (
                  <div className="py-1">
                    <span className="text-rose-700 font-semibold block mb-1">Medical Conditions</span>
                    <span className="text-rose-900 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 block font-mono text-xs">
                      {petData.current_conditions}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-xs text-rose-950">
                    Bite or Scratch Incident With This Animal?
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-200 text-rose-950 rounded font-bold">
                    RA 9482
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                  Wash the wound with soap and running water for 15 minutes immediately, then follow campus clinic protocol.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shrink-0 inline-flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Open First-Aid Protocol</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Biography
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {petData.about_text || 'A CIT-U campus companion cared for by Task Force Bruno.'}
              </p>
            </div>
            <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                Visual Identification Features
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {petData.description || 'Standard markings registered in the CIT-U directory.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <EmergencyProtocolModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />
    </div>
  );
}
