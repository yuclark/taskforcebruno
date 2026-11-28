import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  RotateCw,
  X,
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../lib/api';
import { PHONE_PATTERN, getUserDisplayName } from '../lib/auth';
import {
  DEFAULT_PET_IMAGE,
  getVaccinationBadgeStyles,
  isAdoptablePet,
  safeImageUrl,
} from '../lib/pets';

const DEFAULT_BUDGET = 'Moderate (PHP 2,000 - 5,000)';

export default function AdoptionGallery({ session }) {
  const [pets, setPets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [myApplications, setMyApplications] = useState([]);
  const [loadingTracking, setLoadingTracking] = useState(true);

  const [speciesFilter, setSpeciesFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [actionBanner, setActionBanner] = useState({ type: '', text: '' });

  const [cancelModal, setCancelModal] = useState({ isOpen: false, appId: null, submitting: false });

  const fullNameInputRef = useRef(null);
  const contactInputRef = useRef(null);
  const addressInputRef = useRef(null);
  const housingSelectRef = useRef(null);
  const agreementInputRef = useRef(null);
  const planInputRef = useRef(null);

  const verifiedFullName = getUserDisplayName(session, '');
  const sessionEmail = (session?.email || '').trim().toLowerCase();

  const [applicationForm, setApplicationForm] = useState(() => ({
    fullName: verifiedFullName,
    email: sessionEmail,
    contactNum: (session?.contact_number || '').trim(),
    address: '',
    experience: 'Beginner',
    housingType: 'Owned House',
    hasSecureFence: false,
    householdAgreement: false,
    petCareBudget: DEFAULT_BUDGET,
    planIfMoving: '',
  }));

  const fetchAvailablePlacements = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const res = await apiGet('/pets/');
    if (res.ok && Array.isArray(res.data)) {
      setPets(res.data.filter(isAdoptablePet));
    } else if (!res.aborted) {
      setLoadError(res.error || 'Unable to load available companions.');
    }
    setLoading(false);
  }, []);

  const fetchMyTrackingLogs = useCallback(async () => {
    if (!sessionEmail) {
      setLoadingTracking(false);
      return;
    }
    setLoadingTracking(true);
    const res = await apiGet('/pets/applications/');
    if (res.ok && Array.isArray(res.data)) {
      setMyApplications(res.data);
    }
    setLoadingTracking(false);
  }, [sessionEmail]);

  useEffect(() => {
    const controller = new AbortController();
    const init = async () => {
      setLoading(true);
      setLoadingTracking(true);
      setLoadError('');
      const [petsRes, appsRes] = await Promise.all([
        apiGet('/pets/', { signal: controller.signal }),
        sessionEmail ? apiGet('/pets/applications/', { signal: controller.signal }) : Promise.resolve(null),
      ]);
      if (controller.signal.aborted) return;

      if (petsRes.ok && Array.isArray(petsRes.data)) {
        setPets(petsRes.data.filter(isAdoptablePet));
      } else {
        setLoadError(petsRes.error || 'Unable to load available companions.');
      }

      if (appsRes && appsRes.ok && Array.isArray(appsRes.data)) {
        setMyApplications(appsRes.data);
      }
      setLoading(false);
      setLoadingTracking(false);
    };
    init();
    return () => controller.abort();
  }, [sessionEmail]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!isSubmitting) setShowApplyForm(false);
        if (!cancelModal.submitting) setCancelModal({ isOpen: false, appId: null, submitting: false });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSubmitting, cancelModal.submitting]);

  const filteredPets = useMemo(() => {
    let result = pets;
    if (speciesFilter !== 'All') result = result.filter((p) => p.species === speciesFilter);
    if (sizeFilter !== 'All') result = result.filter((p) => p.size === sizeFilter);
    return result;
  }, [speciesFilter, sizeFilter, pets]);

  const safeIndex = filteredPets.length > 0 ? Math.min(currentIndex, filteredPets.length - 1) : 0;

  const handleNextCard = () => {
    if (filteredPets.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredPets.length);
  };

  const handlePrevCard = () => {
    if (filteredPets.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredPets.length) % filteredPets.length);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setApplicationForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSuccessMessage('');
    setErrorMessage('');
    setFieldErrors({});

    const targetPet = filteredPets[safeIndex];
    if (!targetPet) {
      setErrorMessage('No companion is currently selected.');
      return;
    }

    const errors = {};
    const fullNameClean = (applicationForm.fullName || '').trim();
    const contactNumClean = (applicationForm.contactNum || '').trim();
    const addressClean = (applicationForm.address || '').trim();
    const planClean = (applicationForm.planIfMoving || '').trim();

    if (!fullNameClean || fullNameClean.split(/\s+/).length < 2) {
      errors.fullName = 'Please enter both your first and last name.';
    }
    const cleanDigits = contactNumClean.replace(/[\s-]/g, '');
    if (!contactNumClean) {
      errors.contactNum = 'Contact number is required.';
    } else if (!PHONE_PATTERN.test(cleanDigits)) {
      errors.contactNum = 'Enter a valid Philippine mobile number (e.g., 09171234567).';
    }
    if (!addressClean || addressClean.length < 8) {
      errors.address = 'Please enter your complete residential address.';
    }
    if (!applicationForm.housingType) {
      errors.housingType = 'Please select your residence type.';
    }
    if (!applicationForm.householdAgreement) {
      errors.householdAgreement = 'All household members must agree to adopt this pet.';
    }
    if (!planClean || planClean.length < 10) {
      errors.planIfMoving = 'Please describe your plan if you relocate or graduate (at least 10 characters).';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage('Please review the highlighted fields below.');
      if (errors.fullName) fullNameInputRef.current?.focus();
      else if (errors.contactNum) contactInputRef.current?.focus();
      else if (errors.address) addressInputRef.current?.focus();
      else if (errors.housingType) housingSelectRef.current?.focus();
      else if (errors.householdAgreement) agreementInputRef.current?.focus();
      else if (errors.planIfMoving) planInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    const res = await apiPost('/pets/applications/', {
      pet_id: targetPet.pet_id,
      full_name: fullNameClean,
      contact_number: contactNumClean,
      address: addressClean,
      experience_level: applicationForm.experience,
      housing_type: applicationForm.housingType,
      has_secure_fence: applicationForm.hasSecureFence,
      household_agreement: applicationForm.householdAgreement,
      pet_care_budget: applicationForm.petCareBudget,
      plan_if_moving: planClean,
    });

    if (res.ok) {
      setSuccessMessage(`Application for ${targetPet.name} submitted successfully.`);
      setTimeout(() => {
        setSuccessMessage('');
        setShowApplyForm(false);
        setApplicationForm({
          fullName: getUserDisplayName(session, ''),
          email: sessionEmail,
          contactNum: '',
          address: '',
          experience: 'Beginner',
          housingType: 'Owned House',
          hasSecureFence: false,
          householdAgreement: false,
          petCareBudget: DEFAULT_BUDGET,
          planIfMoving: '',
        });
        fetchAvailablePlacements();
        fetchMyTrackingLogs();
      }, 1800);
    } else {
      setErrorMessage(res.error || 'Could not submit your application. Please try again.');
    }
    setIsSubmitting(false);
  };

  const confirmCancelApplication = async () => {
    const { appId, submitting } = cancelModal;
    if (!appId || submitting) return;

    setCancelModal((prev) => ({ ...prev, submitting: true }));
    setActionBanner({ type: '', text: '' });

    const res = await apiPut(`/pets/applications/${appId}/`, {
      application_status: 'Cancelled',
    });

    if (res.ok) {
      setCancelModal({ isOpen: false, appId: null, submitting: false });
      setActionBanner({ type: 'success', text: `Application #${appId} has been withdrawn.` });
      fetchAvailablePlacements();
      fetchMyTrackingLogs();
    } else {
      setCancelModal({ isOpen: false, appId: null, submitting: false });
      setActionBanner({
        type: 'error',
        text: res.error || 'Unable to withdraw this application right now.',
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs mx-auto flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-[#5C0612] rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading adoptable companions...</p>
      </div>
    );
  }

  const currentPet = filteredPets[safeIndex];
  const progressPercent = filteredPets.length > 0 ? ((safeIndex + 1) / filteredPets.length) * 100 : 0;

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl flex flex-col gap-5 text-xs text-slate-700 mx-auto pb-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C0612] block mb-1">
            Campus Rehoming
          </span>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Adoption Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Browse campus rescues looking for permanent homes, submit adoption applications, and track review status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold">
            {filteredPets.length} Available
          </span>
          <span className="bg-[#5C0612]/10 text-[#5C0612] px-3 py-1.5 rounded-xl border border-[#5C0612]/20 font-semibold">
            {myApplications.length} My Applications
          </span>
        </div>
      </div>

      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={fetchAvailablePlacements}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 rounded-xl font-semibold text-rose-800"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {actionBanner.text && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-medium ${
            actionBanner.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{actionBanner.text}</span>
          <button
            type="button"
            onClick={() => setActionBanner({ type: '', text: '' })}
            aria-label="Dismiss message"
            className="p-1 rounded-lg hover:bg-black/5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filters & Pet Showcase */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-4 w-full">
          <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Filter Companions</span>
              <span className="text-xs text-slate-500 font-mono">
                {filteredPets.length} of {pets.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <span className="text-slate-500 text-[11px] font-semibold block">Species</span>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                  {['All', 'Cat', 'Dog'].map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => {
                        setSpeciesFilter(sp);
                        setCurrentIndex(0);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition-colors font-semibold text-xs text-center whitespace-nowrap ${
                        speciesFilter === sp
                          ? 'bg-[#5C0612] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sp === 'All' ? 'All' : `${sp}s`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-500 text-[11px] font-semibold block">Size</span>
                <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl gap-1">
                  {['All', 'Small', 'Medium', 'Large'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setSizeFilter(sz);
                        setCurrentIndex(0);
                      }}
                      className={`flex-1 min-w-[56px] py-1.5 px-2 rounded-lg transition-colors font-semibold text-xs text-center whitespace-nowrap ${
                        sizeFilter === sz
                          ? 'bg-[#5C0612] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {filteredPets.length === 0 ? (
            <div className="min-h-[360px] w-full bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center justify-center">
              <p className="font-semibold text-slate-700 text-sm">No companions match these filters</p>
              <p className="text-xs text-slate-500 mt-1">
                Try resetting the species or size filters to see all adoptable animals.
              </p>
              {(speciesFilter !== 'All' || sizeFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSpeciesFilter('All');
                    setSizeFilter('All');
                    setCurrentIndex(0);
                  }}
                  className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col">
                <div className="w-full h-56 relative bg-slate-900 overflow-hidden shrink-0">
                  <img
                    src={safeImageUrl(currentPet.primary_image, DEFAULT_PET_IMAGE)}
                    alt={currentPet.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5 font-mono text-[10px] font-bold">
                    <span className="px-2.5 py-1 bg-black/65 backdrop-blur-sm text-white rounded-lg">
                      #{currentPet.pet_id}
                    </span>
                    <span className="px-2.5 py-1 bg-amber-950/85 backdrop-blur-sm text-amber-100 rounded-lg uppercase">
                      {currentPet.pet_id?.startsWith('STRAY-')
                        ? `Stray ${currentPet.species}`
                        : currentPet.pet_type || 'For Adoption'}
                    </span>
                  </div>
                  {currentPet.found_near && (
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/65 backdrop-blur-sm text-white rounded-lg text-[11px] font-medium">
                      {currentPet.found_near}
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="text-xl font-bold text-slate-900 truncate">{currentPet.name}</h4>
                      <span className="font-mono text-[11px] text-slate-600 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg shrink-0">
                        {currentPet.breed || 'Domestic Mix'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-xs text-slate-600">
                      <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        {currentPet.gender}
                      </span>
                      <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        {currentPet.age || 'Adult'}
                      </span>
                      <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        {currentPet.size}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg border font-semibold ${getVaccinationBadgeStyles(
                          currentPet.vaccination_status
                        )}`}
                      >
                        {currentPet.vaccination_status || 'Not Vaccinated'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed border-l-2 border-[#5C0612]/30 pl-3 py-0.5 max-h-24 overflow-y-auto">
                      {currentPet.about_text ||
                        'Campus companion currently under MDC care and ready for a loving home.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setFieldErrors({});
                      setSuccessMessage('');
                      setApplicationForm((prev) => ({
                        ...prev,
                        fullName: verifiedFullName || prev.fullName,
                        contactNum: prev.contactNum || (session?.contact_number || '').trim(),
                      }));
                      setShowApplyForm(true);
                    }}
                    className="w-full py-3 bg-[#5C0612] hover:bg-[#42040B] text-white font-semibold rounded-xl border-b-2 border-[#D4AF37] shadow-sm transition-colors text-xs"
                  >
                    Apply to Adopt {currentPet.name}
                  </button>
                </div>
              </div>

              <div className="w-full space-y-2.5 select-none">
                <div className="flex justify-between items-center px-1">
                  <button
                    type="button"
                    onClick={handlePrevCard}
                    aria-label="Previous companion"
                    className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full flex items-center justify-center shadow-xs transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="font-mono text-xs font-semibold text-slate-500">
                    {safeIndex + 1} of {filteredPets.length}
                  </span>

                  <button
                    type="button"
                    onClick={handleNextCard}
                    aria-label="Next companion"
                    className="w-10 h-10 bg-[#5C0612] hover:bg-[#42040B] text-white rounded-full flex items-center justify-center shadow-sm border-b-2 border-[#D4AF37] transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-[#5C0612] to-[#D4AF37] transition-all duration-300 rounded-full"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: My Applications */}
        <div className="lg:col-span-6 xl:col-span-7 w-full bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-4 w-full">
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">My Adoption Applications</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track review decisions and pickup instructions.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchMyTrackingLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 bg-white rounded-xl transition-colors shrink-0"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Refresh</span>
              </button>
            </div>

            {loadingTracking ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading your applications...</div>
            ) : myApplications.length === 0 ? (
              <div className="text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl p-10 space-y-2">
                <FileText className="w-9 h-9 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700 text-xs">No applications submitted yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select an adoptable pet on the left and submit an application to start the review process.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {myApplications.map((app) => {
                  const isPending = app.application_status === 'Pending';
                  const isApproved = app.application_status === 'Approved';
                  const isCancelled = app.application_status === 'Cancelled';

                  return (
                    <div
                      key={app.application_id}
                      className="p-4 border border-slate-200 rounded-2xl bg-slate-50/70 flex flex-col gap-3 text-left"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs font-mono">
                              Application #{app.application_id}
                            </span>
                            <span className="font-mono text-[11px] bg-slate-200 px-2 py-0.5 rounded text-slate-800 font-bold">
                              {app.pet_id}
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs">
                            Submitted:{' '}
                            {app.submitted_at && !Number.isNaN(new Date(app.submitted_at).getTime())
                              ? new Date(app.submitted_at).toLocaleDateString()
                              : 'Recently'}
                          </p>
                          <p className="text-slate-600 text-xs break-words">
                            Address: <span className="font-medium text-slate-800">{app.address}</span>
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 text-[11px] font-semibold rounded-lg border shrink-0 ${
                            isApproved
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : isPending
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : isCancelled
                              ? 'bg-slate-100 border-slate-200 text-slate-600'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}
                        >
                          {app.application_status}
                        </span>
                      </div>

                      {isApproved && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs leading-relaxed">
                          <strong className="block mb-0.5">Next Steps</strong>
                          Watch for confirmation from MDC coordinators or visit the campus clinic office to complete adoption paperwork and meet your companion.
                        </div>
                      )}

                      {isPending && (
                        <button
                          type="button"
                          onClick={() =>
                            setCancelModal({ isOpen: true, appId: app.application_id, submitting: false })
                          }
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-colors"
                        >
                          Withdraw Application
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-xs text-slate-500">
            Signed in as <strong className="text-slate-800">{sessionEmail}</strong>
          </div>
        </div>
      </div>

      {/* Adoption Form Modal */}
      {showApplyForm && currentPet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="adoption-form-title"
          onClick={() => !isSubmitting && setShowApplyForm(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in text-left"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90dvh] overflow-hidden animate-scale-up"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-start gap-2 shrink-0">
              <div>
                <h3 id="adoption-form-title" className="text-base font-bold text-slate-900">
                  Adoption Application
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Applying for <strong className="text-[#5C0612]">{currentPet.name}</strong> ({currentPet.pet_id})
                </p>
              </div>
              <button
                type="button"
                aria-label="Close application form"
                onClick={() => setShowApplyForm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-center font-semibold text-xs">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div role="alert" className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              {!successMessage && (
                <form onSubmit={handleApplySubmit} noValidate className="space-y-4 text-xs">
                  {/* Section 1 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      1. Applicant Information
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-700">Full Name *</label>
                          {verifiedFullName && (
                            <span className="text-[10px] text-emerald-700 font-semibold inline-flex items-center gap-0.5">
                              <Lock className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <input
                          ref={fullNameInputRef}
                          type="text"
                          name="fullName"
                          readOnly={Boolean(verifiedFullName)}
                          value={applicationForm.fullName}
                          onChange={handleInputChange}
                          placeholder="e.g. Maria Santos"
                          className={`w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs ${
                            fieldErrors.fullName
                              ? 'border-rose-500 bg-rose-50/40'
                              : verifiedFullName
                              ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                              : 'bg-white border-slate-200'
                          }`}
                        />
                        {fieldErrors.fullName && (
                          <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.fullName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Institutional Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          readOnly
                          value={applicationForm.email}
                          className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-base sm:text-xs cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Contact Number *
                        </label>
                        <input
                          ref={contactInputRef}
                          type="tel"
                          name="contactNum"
                          value={applicationForm.contactNum}
                          onChange={handleInputChange}
                          placeholder="09171234567"
                          className={`w-full px-3 py-2.5 border rounded-xl font-mono text-base sm:text-xs ${
                            fieldErrors.contactNum ? 'border-rose-500 bg-rose-50/40' : 'bg-white border-slate-200'
                          }`}
                        />
                        {fieldErrors.contactNum && (
                          <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.contactNum}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Residential Address *
                        </label>
                        <input
                          ref={addressInputRef}
                          type="text"
                          name="address"
                          value={applicationForm.address}
                          onChange={handleInputChange}
                          placeholder="Street, Barangay, Cebu City"
                          className={`w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs ${
                            fieldErrors.address ? 'border-rose-500 bg-rose-50/40' : 'bg-white border-slate-200'
                          }`}
                        />
                        {fieldErrors.address && (
                          <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.address}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      2. Housing &amp; Experience
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Housing Type *
                        </label>
                        <select
                          ref={housingSelectRef}
                          name="housingType"
                          value={applicationForm.housingType}
                          onChange={handleInputChange}
                          className={`w-full p-2.5 bg-white border rounded-xl text-base sm:text-xs ${
                            fieldErrors.housingType ? 'border-rose-500' : 'border-slate-200'
                          }`}
                        >
                          <option value="Owned House">Owned House</option>
                          <option value="Rented House">Rented House (Pet-Friendly)</option>
                          <option value="Condo or Apartment">Condo / Apartment</option>
                        </select>
                        {fieldErrors.housingType && (
                          <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.housingType}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Pet Experience
                        </label>
                        <select
                          name="experience"
                          value={applicationForm.experience}
                          onChange={handleInputChange}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs"
                        >
                          <option value="Beginner">First-time caregiver</option>
                          <option value="Intermediate">Owned 1–2 pets previously</option>
                          <option value="Expert">Experienced multi-pet caregiver</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          name="hasSecureFence"
                          checked={applicationForm.hasSecureFence}
                          onChange={handleInputChange}
                          className="w-4 h-4 accent-[#5C0612] rounded mt-0.5 shrink-0"
                        />
                        <div>
                          <span className="font-semibold text-slate-800 block text-xs">Fenced Yard</span>
                          <span className="text-[11px] text-slate-500">Home has secure perimeter fencing</span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-2.5 cursor-pointer bg-white p-3 rounded-xl border ${
                          fieldErrors.householdAgreement ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'
                        }`}
                      >
                        <input
                          ref={agreementInputRef}
                          type="checkbox"
                          name="householdAgreement"
                          checked={applicationForm.householdAgreement}
                          onChange={handleInputChange}
                          className="w-4 h-4 accent-[#5C0612] rounded mt-0.5 shrink-0"
                        />
                        <div>
                          <span className="font-semibold text-slate-800 block text-xs">
                            Household Agreement *
                          </span>
                          <span className="text-[11px] text-slate-500">All household members agree to adopt</span>
                        </div>
                      </label>
                    </div>
                    {fieldErrors.householdAgreement && (
                      <p className="text-[11px] text-rose-600">{fieldErrors.householdAgreement}</p>
                    )}
                  </div>

                  {/* Section 3 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      3. Care Budget &amp; Relocation Plan
                    </span>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Monthly Care &amp; Vet Budget
                      </label>
                      <select
                        name="petCareBudget"
                        value={applicationForm.petCareBudget}
                        onChange={handleInputChange}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs"
                      >
                        <option value="Basic (Under PHP 2,000)">Under PHP 2,000 / month</option>
                        <option value="Moderate (PHP 2,000 - 5,000)">PHP 2,000 – 5,000 / month</option>
                        <option value="Premium (Above PHP 5,000)">Above PHP 5,000 / month</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Plan if You Relocate or Graduate *
                      </label>
                      <textarea
                        ref={planInputRef}
                        name="planIfMoving"
                        rows="2"
                        value={applicationForm.planIfMoving}
                        onChange={handleInputChange}
                        placeholder="Describe how you will continue caring for your pet if you move..."
                        className={`w-full p-3 border rounded-xl text-base sm:text-xs leading-relaxed ${
                          fieldErrors.planIfMoving ? 'border-rose-500 bg-rose-50/40' : 'bg-white border-slate-200'
                        }`}
                      />
                      {fieldErrors.planIfMoving && (
                        <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.planIfMoving}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setShowApplyForm(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-50 text-white font-semibold border-b-2 border-[#D4AF37] rounded-xl shadow-sm text-xs"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      {cancelModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() =>
            !cancelModal.submitting && setCancelModal({ isOpen: false, appId: null, submitting: false })
          }
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-left"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-scale-up"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Withdraw Application</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to withdraw this adoption request? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={cancelModal.submitting}
                onClick={() => setCancelModal({ isOpen: false, appId: null, submitting: false })}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Keep
              </button>
              <button
                type="button"
                disabled={cancelModal.submitting}
                onClick={confirmCancelApplication}
                className="flex-1 py-2.5 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-50 text-white font-semibold rounded-xl text-xs"
              >
                {cancelModal.submitting ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
