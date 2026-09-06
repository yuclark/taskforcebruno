import React, { useState, useEffect } from 'react';

export default function AdoptionGallery({ session }) {
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Real-time tracking ledger array state
  const [myApplications, setMyApplications] = useState([]);
  const [loadingTracking, setLoadingTracking] = useState(true);

  // Filter states
  const [speciesFilter, setSpeciesFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');

  // Popup overlay configurations
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Custom modal state trigger for cancellations
  const [cancelModal, setCancelModal] = useState({ isOpen: false, appId: null });

  const [applicationForm, setApplicationForm] = useState({
    fullName: '', 
    email: session?.email || '', 
    contactNum: '',
    address: '',
    experience: 'Beginner',
    housingType: 'Owned House',
    hasSecureFence: false,
    householdAgreement: false,
    petCareBudget: 'Moderate',
    planIfMoving: ''
  });

  const fetchAvailablePlacements = () => {
    setLoading(true);
    fetch('https://taskforcebruno.onrender.com/api/pets/')
      .then((res) => res.json())
      .then((data) => {
        const adoptionPlacements = data.filter(p => 
          (p.pet_type === 'For Adoption' || p.pet_id?.startsWith('STRAY-')) && 
          p.adoption_status === 'Available'
        );
        setPets(adoptionPlacements);
        setFilteredPets(adoptionPlacements);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Adoption fetch error:', err);
        setLoading(false);
      });
  };

  const fetchMyTrackingLogs = () => {
    if (!session?.email) return;
    setLoadingTracking(true);
    fetch(`https://taskforcebruno.onrender.com/api/pets/applications/?email=${encodeURIComponent(session.email)}`)
      .then((res) => res.json())
      .then((data) => {
        setMyApplications(Array.isArray(data) ? data : []);
        setLoadingTracking(false);
      })
      .catch((err) => {
        console.error('Tracking log error:', err);
        setMyApplications([]); 
        setLoadingTracking(false);
      });
  };

  useEffect(() => {
    fetchAvailablePlacements();
    fetchMyTrackingLogs();
  }, [session]);

  useEffect(() => {
    let result = pets;
    if (speciesFilter !== 'All') result = result.filter(p => p.species === speciesFilter);
    if (sizeFilter !== 'All') result = result.filter(p => p.size === sizeFilter);
    setFilteredPets(result);
    setCurrentIndex(0); 
  }, [speciesFilter, sizeFilter, pets]);

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
    setApplicationForm({
      ...applicationForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const payload = {
      pet_id: filteredPets[currentIndex].pet_id,
      full_name: applicationForm.fullName.trim(), 
      email: applicationForm.email, 
      contact_number: applicationForm.contactNum.trim(),
      address: applicationForm.address.trim(),
      experience_level: applicationForm.experience,
      housing_type: applicationForm.housingType,
      has_secure_fence: applicationForm.hasSecureFence,
      household_agreement: applicationForm.householdAgreement,
      pet_care_budget: applicationForm.petCareBudget,
      plan_if_moving: applicationForm.planIfMoving.trim()
    };

    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/pets/applications/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMessage(`Application for ${filteredPets[currentIndex].name} has been submitted successfully.`);
        setTimeout(() => {
          setSuccessMessage('');
          setShowApplyForm(false);
          setApplicationForm({
            fullName: '', 
            email: session?.email || '', 
            contactNum: '', address: '', experience: 'Beginner',
            housingType: 'Owned House', hasSecureFence: false, householdAgreement: false,
            petCareBudget: 'Moderate', planIfMoving: ''
          });
          fetchAvailablePlacements();
          fetchMyTrackingLogs(); 
        }, 2200);
      } else {
        setErrorMessage('Server could not process your application submission. Please verify all fields.');
      }
    } catch (err) {
      setErrorMessage('Network error connecting to server. Please try again.');
    }
  };

  const openCancelModal = (appId) => {
    setCancelModal({ isOpen: true, appId });
  };

  const confirmCancelApplication = async () => {
    const { appId } = cancelModal;
    if (!appId) return;

    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/pets/applications/${appId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_status: 'Cancelled' })
      });
      
      if (res.ok) {
        setCancelModal({ isOpen: false, appId: null });
        fetchAvailablePlacements();
        fetchMyTrackingLogs();
      } else {
        alert("Unable to cancel application at this time.");
      }
    } catch (err) {
      console.error('Cancellation error:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm mx-auto flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-[#5C0612] rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Loading available pets...</p>
      </div>
    );
  }

  const currentPet = filteredPets[currentIndex];
  const progressPercent = filteredPets.length > 0 ? ((currentIndex + 1) / filteredPets.length) * 100 : 0;

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl flex flex-col gap-6 animate-fade-in text-xs text-slate-700 mx-auto px-2 sm:px-4 py-2">
      
      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5C0612]" />
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#5C0612]">
              Rehoming & Community Care
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Adoption Placement Portal
          </h2>
          <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Browse verified campus companions looking for permanent homes. Submit adoption inquiries and track application progress in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs shrink-0">
          <span className="bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold">
            {filteredPets.length} Available Companions
          </span>
          <span className="bg-[#5C0612]/10 text-[#5C0612] px-3.5 py-1.5 rounded-xl border border-[#5C0612]/20 font-semibold">
            {myApplications.length} My Applications
          </span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT SECTION: FILTERS & PET SHOWCASE (Col 5 on desktop) */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-5 flex flex-col items-center w-full">
          
          {/* Filter Bar */}
          <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Filter Companions</span>
              <span className="text-[11px] text-slate-400 font-mono">
                Showing {filteredPets.length} of {pets.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 pl-2 text-[10px] font-bold uppercase tracking-wider font-mono">Species</span>
                <div className="flex gap-1">
                  {['All', 'Cat', 'Dog'].map(sp => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSpeciesFilter(sp)}
                      className={`px-2.5 py-1 rounded-lg transition-all font-medium text-xs ${
                        speciesFilter === sp
                          ? 'bg-[#5C0612] text-white font-bold shadow-sm'
                          : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      {sp === 'All' ? 'All' : `${sp}s`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 pl-2 text-[10px] font-bold uppercase tracking-wider font-mono">Size</span>
                <div className="flex gap-1">
                  {['All', 'Small', 'Medium', 'Large'].map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSizeFilter(sz)}
                      className={`px-2 py-1 rounded-lg transition-all font-medium text-xs ${
                        sizeFilter === sz
                          ? 'bg-[#5C0612] text-white font-bold shadow-sm'
                          : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pet Showcase Card */}
          {filteredPets.length === 0 ? (
            <div className="h-[480px] w-full bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center justify-center shadow-sm">
              <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="font-semibold text-slate-600 text-sm">No companions match these filters</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the species or size filters to view available animals.</p>
            </div>
          ) : (
            <div className="w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col relative transition-all">
              
              {/* Pet Image Frame */}
              <div className="w-full h-56 relative bg-slate-950 overflow-hidden shrink-0 border-b border-slate-100">
                <img
                  src={currentPet.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'}
                  alt={currentPet.name}
                  className="w-full h-full object-cover select-none brightness-[0.96]"
                />
                
                <div className="absolute top-3 left-3 flex gap-1.5 font-mono text-[10px] font-bold select-none">
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white rounded-lg border border-white/10 shadow-sm">
                    #{currentPet.pet_id}
                  </span>
                  <span className={`px-2.5 py-1 backdrop-blur-md rounded-lg border shadow-sm tracking-wide uppercase font-semibold ${
                    currentPet.pet_id?.startsWith('STRAY-')
                      ? 'bg-rose-950/80 text-rose-200 border-rose-800'
                      : 'bg-amber-950/80 text-amber-200 border-amber-800'
                  }`}>
                    {currentPet.pet_id?.startsWith('STRAY-') ? `Stray ${currentPet.species}` : (currentPet.pet_type || 'For Adoption')}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3">
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-slate-200 rounded-lg text-[10px] font-medium border border-white/10">
                    {currentPet.found_near}
                  </span>
                </div>
              </div>

              {/* Pet Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-xl font-bold tracking-tight text-slate-900 truncate pr-2">
                      {currentPet.name}
                    </h4>
                    <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg uppercase">
                      {currentPet.breed || 'Domestic Line'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 font-medium text-xs text-slate-600">
                    <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">{currentPet.gender}</span>
                    <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">{currentPet.age || 'Adult'}</span>
                    <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">{currentPet.size} Size</span>
                    <span className={`px-2.5 py-1 rounded-lg border font-semibold ${
                      currentPet.vaccination_status?.toLowerCase().includes('fully')
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {currentPet.vaccination_status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal border-l-2 border-[#5C0612]/30 pl-3 py-0.5 max-h-[80px] overflow-y-auto">
                    {currentPet.about_text || 'Active campus companion currently under care and ready for adoption.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3 shrink-0">
                  <button
                    onClick={() => setShowApplyForm(true)}
                    className="w-full py-3 bg-gradient-to-r from-[#5C0612] to-[#7A0918] hover:from-[#6D0816] hover:to-[#8E0B1C] text-white font-bold tracking-wide rounded-xl border-b-2 border-[#D4AF37] shadow-md transition-all text-xs uppercase"
                  >
                    Apply for Adoption
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Carousel Controls */}
          {filteredPets.length > 0 && (
            <div className="w-full space-y-2.5 shrink-0 select-none">
              <div className="flex justify-between items-center px-1">
                <button
                  type="button"
                  onClick={handlePrevCard}
                  className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full flex items-center justify-center font-bold shadow-sm transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Companion {currentIndex + 1} of {filteredPets.length}
                </span>

                <button
                  type="button"
                  onClick={handleNextCard}
                  className="w-10 h-10 bg-[#5C0612] hover:bg-[#720817] text-white rounded-full flex items-center justify-center font-bold shadow-md border-b-2 border-[#D4AF37] transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-[#5C0612] to-[#D4AF37] transition-all duration-300 rounded-full"
                />
              </div>
            </div>
          )}

        </div>

        {/* RIGHT SECTION: APPLICATION TRACKING (Col 7 on desktop) */}
        <div className="lg:col-span-6 xl:col-span-7 w-full bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm min-h-[580px] flex flex-col justify-between">
          <div className="space-y-4 w-full">
            
            {/* Card Header */}
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold tracking-tight text-slate-900">My Adoption Applications</h3>
                <p className="text-xs text-slate-500 mt-0.5">Track reviews, statuses, and hand-off instructions.</p>
              </div>

              <button
                type="button"
                onClick={fetchMyTrackingLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 bg-white shadow-sm rounded-xl transition-all"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>

            {/* List */}
            {loadingTracking ? (
              <div className="p-16 text-center text-slate-400 animate-pulse text-xs">
                Syncing application records...
              </div>
            ) : !Array.isArray(myApplications) || myApplications.length === 0 ? (
              <div className="text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl p-12 mt-6">
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-semibold text-slate-700 text-xs">No active applications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Select a companion on the left and submit an adoption inquiry to start the review process.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
                {myApplications.map((app) => {
                  const isPending = app.application_status === 'Pending';
                  const isApproved = app.application_status === 'Approved';
                  const isCancelled = app.application_status === 'Cancelled'; 
                  
                  return (
                    <div
                      key={app.application_id}
                      className="p-4 border border-slate-200/80 rounded-2xl bg-slate-50/70 flex flex-col gap-3 shadow-sm hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="space-y-1 max-w-[70%]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs font-mono">Case #{app.application_id}</span>
                            <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold uppercase">
                              {app.pet_id}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">
                            Submitted: {new Date(app.submitted_at).toLocaleDateString()}
                          </p>
                          <p className="text-slate-600 truncate text-[11px]">
                            Address: <span className="font-medium text-slate-800">{app.address}</span>
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase rounded-lg border shadow-sm ${
                            isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                            isPending ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse' :
                            isCancelled ? 'bg-slate-100 border-slate-200 text-slate-500' : 
                            'bg-rose-50 border-rose-200 text-rose-800'
                          }`}>
                            {app.application_status}
                          </span>
                        </div>
                      </div>

                      {isApproved && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200/80 text-emerald-900 rounded-xl text-xs leading-relaxed font-normal">
                          <span className="font-bold text-emerald-800 block mb-1">Next Steps:</span>
                          Please watch for an official confirmation SMS/email from our clinic coordinators, or visit the Task Force Bruno clinic office to finalize adoption paperwork and meet your companion.
                        </div>
                      )}

                      {isPending && (
                        <button
                          type="button"
                          onClick={() => openCancelModal(app.application_id)}
                          className="w-full mt-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs rounded-xl border border-rose-200 transition-all text-center"
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

          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-[11px] text-slate-500 mt-4">
            Signed in as: <span className="text-slate-800 font-medium ml-1">{session?.email}</span>
          </div>
        </div>

      </div>

      {/* ADOPTION APPLICATION MODAL */}
      {showApplyForm && filteredPets.length > 0 && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up max-h-[88vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Adoption Inquiry Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitting inquiry for: <strong className="text-[#5C0612]">{filteredPets[currentIndex].name}</strong> ({filteredPets[currentIndex].pet_id})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1"
              >
                ✕
              </button>
            </div>

            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-center font-medium">
                {successMessage}
              </div>
            )}
            
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-center font-medium">
                {errorMessage}
              </div>
            )}

            {!successMessage && (
              <form onSubmit={handleApplySubmit} className="space-y-3.5 text-xs">
                
                {/* Section 1 */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                    1. Applicant Information
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={applicationForm.fullName}
                        onChange={handleInputChange}
                        placeholder="e.g. Maria Santos"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C0612]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Institutional Email</label>
                      <input
                        type="email"
                        name="email"
                        readOnly
                        value={applicationForm.email}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed select-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Phone / Contact Number *</label>
                      <input
                        type="text"
                        name="contactNum"
                        required
                        value={applicationForm.contactNum}
                        onChange={handleInputChange}
                        placeholder="09XXXXXXXXX"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#5C0612]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Residential Address *</label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={applicationForm.address}
                        onChange={handleInputChange}
                        placeholder="Cebu City, Cebu"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C0612]/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                    2. Housing & Experience
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Housing Type</label>
                      <select
                        name="housingType"
                        value={applicationForm.housingType}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="Owned House">Owned Residential House</option>
                        <option value="Rented House">Rented House (Landlord Permitted)</option>
                        <option value="Condo or Apartment">Condo / Apartment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Pet Ownership Experience</label>
                      <select
                        name="experience"
                        value={applicationForm.experience}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="Beginner">First-time Pet Caretaker</option>
                        <option value="Intermediate">Owned 1-2 pets previously</option>
                        <option value="Expert">Experienced Multi-Pet Caregiver</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="hasSecureFence"
                        checked={applicationForm.hasSecureFence}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-[#5C0612] rounded mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Fenced Perimeter</span>
                        <span className="text-[10px] text-slate-400 block font-normal">Home has secure boundary fencing</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="householdAgreement"
                        checked={applicationForm.householdAgreement}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-[#5C0612] rounded mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Household Agreement</span>
                        <span className="text-[10px] text-slate-400 block font-normal">All family/housemates agree to adopt</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Section 3 */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                    3. Care Budget & Relocation Plan
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Monthly Care & Veterinary Budget *</label>
                    <select
                      name="petCareBudget"
                      value={applicationForm.petCareBudget}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="Basic (Under PHP 2,000)">Basic Tier (Under PHP 2,000 / month)</option>
                      <option value="Moderate (PHP 2,000 - 5,000)">Moderate Tier (PHP 2,000 - 5,000 / month)</option>
                      <option value="Premium (Above PHP 5,000)">Comprehensive Tier (Above PHP 5,000 / month)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Plan if You Relocate / Move *</label>
                    <textarea
                      name="planIfMoving"
                      required
                      rows="2"
                      value={applicationForm.planIfMoving}
                      onChange={handleInputChange}
                      placeholder="Explain your plans to keep and accommodate your pet if you move to a new home..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800 leading-relaxed font-sans"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl uppercase tracking-wider text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#5C0612] hover:bg-[#720817] text-white font-bold border-b-2 border-[#D4AF37] rounded-xl shadow-md uppercase tracking-wider text-xs transition-all"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* WITHDRAW APPLICATION CONFIRMATION MODAL */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 text-rose-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            
            <div>
              <h3 className="text-base font-bold text-slate-900">Withdraw Application</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to withdraw this adoption request? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setCancelModal({ isOpen: false, appId: null })} 
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all"
              >
                Keep Application
              </button>
              <button 
                type="button" 
                onClick={confirmCancelApplication} 
                className="flex-1 py-2.5 bg-[#5C0612] hover:bg-[#720817] text-white font-semibold rounded-xl transition-all shadow-md text-xs border-b border-[#D4AF37]/40"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}