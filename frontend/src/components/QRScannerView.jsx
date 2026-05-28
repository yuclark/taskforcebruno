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

  // Custom modal state trigger for cancellations
  const [cancelModal, setCancelModal] = useState({ isOpen: false, appId: null });

  const fetchAvailablePlacements = () => {
    setLoading(true);
    fetch('https://taskforcebruno.onrender.com/api/pets/')
      .then((res) => res.json())
      .then((data) => {
        // Enforce parsing compliance for both standard profiles and raw uncollared stray assets
        const adoptionPlacements = data.filter(p => 
          (p.pet_type === 'For Adoption' || p.pet_id?.startsWith('STRAY-')) && 
          p.adoption_status === 'Available'
        );
        setPets(adoptionPlacements);
        setFilteredPets(adoptionPlacements);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Adoption query exception:', err);
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
        setLoadingTracking(false)
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
        alert("System gateway rejected tracking cancellation request.");
      }
    } catch (err) {
      console.error('Cancellation communication runtime exception:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-[24px] p-16 text-center shadow-[0_10px_40px_rgba(0,0,0,0.03)] mx-auto flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-[#5C0612] rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Resolving placement clusters...</p>
      </div>
    );
  }

  const currentPet = filteredPets[currentIndex];
  const progressPercent = filteredPets.length > 0 ? ((currentIndex + 1) / filteredPets.length) * 100 : 0;

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fade-in text-xs text-slate-700 mx-auto px-4 py-2">
      
      {/* LEFT SECTION: FILTERS & PLACEMENT SWIPER CARD PLATFORM */}
      <div className="space-y-6 flex flex-col items-center w-full">
        <div className="w-full bg-white border border-slate-200/60 p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.01)] flex flex-col items-center gap-3">
          <div className="text-center">
            <h3 className="font-black text-slate-900 tracking-tight text-sm">Adoption Placement Portal</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-normal">Review active rescue cases initialized for rehoming tracks.</p>
          </div>
          <div className="w-full flex flex-col gap-2 font-mono text-[9px] font-bold">
            <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 pl-1 uppercase tracking-wider text-[8px]">Classification</span>
              <div className="flex gap-1">
                {['All', 'Cat', 'Dog'].map(sp => (
                  <button key={sp} onClick={() => setSpeciesFilter(sp)} className={`px-2.5 py-1 rounded-md transition-all duration-300 ${speciesFilter === sp ? 'bg-[#5C0612] text-white shadow-sm font-black' : 'text-slate-600 hover:bg-white'}`}>{sp}s</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 pl-1 uppercase tracking-wider text-[8px]">Scale Target</span>
              <div className="flex gap-1">
                {['All', 'Small', 'Medium', 'Large'].map(sz => (
                  <button key={sz} onClick={() => setSizeFilter(sz)} className={`px-2.5 py-1 rounded-md transition-all duration-300 ${sizeFilter === sz ? 'bg-[#5C0612] text-white shadow-sm font-black' : 'text-slate-600 hover:bg-white'}`}>{sz}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {filteredPets.length === 0 ? (
          <div className="h-[440px] w-full bg-white border border-dashed border-slate-200 rounded-[32px] p-8 text-center text-slate-400 flex flex-col items-center justify-center shadow-sm">
            <p className="font-medium">No companion files match active configuration tags.</p>
          </div>
        ) : (
          <div className="h-[450px] w-full bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.03)] flex flex-col relative group shrink-0 transition-all duration-300">
            <div className="w-full h-[46%] relative bg-slate-950 overflow-hidden shrink-0 border-b border-slate-100">
              <img src={currentPet.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'} alt="" className="w-full h-full object-cover select-none pointer-events-none brightness-[0.96]" />
              <div className="absolute top-4 left-4 flex gap-1.5 font-mono text-[9px] font-bold select-none">
                <span className="px-2.5 py-1 bg-slate-950/70 backdrop-blur-md text-white rounded-lg border border-white/10 shadow-sm">#{currentPet.pet_id}</span>
                <span className={`px-2.5 py-1 backdrop-blur-md rounded-lg border shadow-sm tracking-wide uppercase ${
                  currentPet.pet_id?.startsWith('STRAY-')
                    ? 'bg-rose-950/80 text-rose-200 border-rose-800'
                    : 'bg-amber-950/80 text-amber-200 border-amber-800'
                }`}>
                  {currentPet.pet_id?.startsWith('STRAY-') ? `Stray ${currentPet.species}` : (currentPet.pet_type || 'For Adoption')}
                </span>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between bg-white overflow-hidden">
              <div className="overflow-hidden flex flex-col space-y-2">
                <div className="flex justify-between items-baseline shrink-0">
                  <h4 className="text-lg font-black tracking-tight text-slate-900 truncate pr-2">{currentPet.name}</h4>
                  <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-50 border px-2 py-0.5 rounded-md uppercase truncate max-w-[110px]">{currentPet.breed}</span>
                </div>
                <div className="flex gap-1 font-mono text-[8px] font-bold text-slate-500 uppercase select-none shrink-0 tracking-wide">
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">{currentPet.gender}</span>
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">{currentPet.age}</span>
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">{currentPet.size} Scale</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-normal overflow-y-auto pr-1 border-l-2 border-slate-100 pl-2 grow max-h-[110px]">
                  {currentPet.about_text}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3 shrink-0">
                <div className="grid grid-cols-2 text-[9px] font-mono text-slate-400 leading-none">
                  <div>COLONY ORIGIN:<span className="text-slate-700 font-sans font-bold block mt-1 truncate max-w-[130px]">{currentPet.found_near}</span></div>
                  <div>HEALTH TRACK:<span className="text-emerald-600 bg-emerald-50 border border-emerald-200/40 px-2 py-0.5 rounded text-[8px] font-black block mt-1 w-fit uppercase tracking-wider">{currentPet.vaccination_status}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {filteredPets.length > 0 && (
          <div className="w-full space-y-3 shrink-0 select-none">
            <div className="flex justify-between items-center px-1">
              <button onClick={handlePrevCard} className="w-10 h-10 bg-white hover:bg-slate-50 border text-slate-700 rounded-full flex items-center justify-center font-bold shadow-sm transition-all active:scale-90 focus:outline-none">&larr;</button>
              <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Record {currentIndex + 1} of {filteredPets.length}</span>
              <button onClick={handleNextCard} className="w-10 h-10 bg-[#5C0612] text-white rounded-full flex items-center justify-center font-bold shadow-md border-b-2 border-[#D4AF37] transition-all active:scale-90 focus:outline-none">&rarr;</button>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div style={{ width: `${progressPercent}%` }} className="h-full bg-gradient-to-r from-[#5C0612] to-[#D4AF37] transition-all duration-500 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SECTION: REAL-TIME TRACKING LEAD MATRIX */}
      <div className="w-full bg-white border border-slate-200 rounded-[28px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.01)] min-h-[520px] flex flex-col justify-between">
        <div className="space-y-4 w-full">
          <div className="border-b pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900">Live Case Tracking Matrix</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time status updates synced straight from institutional reviewers.</p>
            </div>
            <button onClick={fetchMyTrackingLogs} className="px-2.5 py-1 border text-[9px] font-mono font-bold text-slate-600 hover:bg-slate-50 bg-white shadow-sm rounded-lg">SYNC</button>
          </div>

          {loadingTracking ? (
            <div className="p-12 text-center font-mono text-slate-400 animate-pulse">Syncing tracking array parameters...</div>
          ) : !Array.isArray(myApplications) || myApplications.length === 0 ? (
            <div className="text-center text-slate-400 border border-dashed rounded-2xl p-12 mt-12">
              <p className="font-medium text-slate-400 text-[11px]">No adoption requests submitted under your institutional email signature profile yet.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
              {myApplications.map((app) => {
                const isPending = app.application_status === 'Pending';
                const isApproved = app.application_status === 'Approved';
                const isCancelled = app.application_status === 'Cancelled'; 
                
                return (
                  <div key={app.application_id} className="p-4 border rounded-xl bg-slate-50/60 flex flex-col gap-3 shadow-sm hover:bg-slate-50 transition-colors text-left">
                    <div className="flex items-center justify-between w-full">
                      <div className="space-y-1 max-w-[65%]">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-xs font-mono">Case #{app.application_id}</span>
                          <span className="font-mono text-[9px] bg-slate-200 px-1.5 py-0.2 rounded text-slate-500 font-bold tracking-wide uppercase">{app.pet_id}</span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-mono leading-none">Submitted: {new Date(app.submitted_at).toLocaleDateString()}</p>
                        <p className="text-slate-500 truncate text-[11px] font-medium block pt-0.5">Registered Address: <span className="text-slate-800">{app.address}</span></p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`inline-block px-3 py-1 text-[9px] font-black tracking-widest uppercase rounded-lg border shadow-sm ${
                          isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          isPending ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse' :
                          isCancelled ? 'bg-slate-50 border-slate-200 text-slate-500' : 
                          'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          {app.application_status}
                        </span>
                      </div>
                    </div>

                    {isApproved && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200/60 text-emerald-900 rounded-xl text-[11.5px] leading-relaxed font-normal animate-fade-in">
                        <span className="font-black text-emerald-800 block mb-1">🚀 NEXT STEPS PROTOCOL REQUIRED:</span>
                        Please wait for an official text confirmation from our triage coordinators, or visit the **Task Force Bruno Head Office** directly to claim your companion and settle paperwork hand-off details!
                      </div>
                    )}

                    {isPending && (
                      <button
                        type="button"
                        onClick={() => openCancelModal(app.application_id)}
                        className="w-full mt-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-mono font-bold text-[9px] uppercase tracking-wider rounded-lg border border-rose-200 transition-all text-center focus:outline-none cursor-pointer"
                      >
                        Cancel Application File
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl font-mono text-[10px] text-slate-400 leading-tight mt-4">
          Verified User Session Signature: <span className="text-slate-600 block truncate font-sans font-medium mt-0.5">{session?.email}</span>
        </div>
      </div>

      {/* DYNAMIC TRANSITION OVERLAY MODAL FOR APPLICATION WITHDRAWALS */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-scale-up text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">Withdraw Application</h3>
            <p className="text-[11px] text-slate-500 mb-6 font-normal">
              Are you absolutely sure you want to withdraw and cancel this adoption request file? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-2 font-mono text-[10px] font-bold uppercase select-none">
              <button 
                type="button" 
                onClick={() => setCancelModal({ isOpen: false, appId: null })} 
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer focus:outline-none tracking-wide"
              >
                Abort
              </button>
              <button 
                type="button" 
                onClick={confirmCancelApplication} 
                className="flex-1 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white rounded-xl transition-all shadow-md cursor-pointer focus:outline-none tracking-wide border-b border-[#D4AF37]/40"
              >
                Withdraw File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}