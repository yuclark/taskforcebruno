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

  const [applicationForm, setApplicationForm] = useState({
    fullName: '', // Clear field for full user name entry tracking
    email: session?.email || '', // Locked auto-fill validation map
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
    fetch('http://localhost:8000/api/pets/')
      .then((res) => res.json())
      .then((data) => {
        const adoptionPlacements = data.filter(p => p.pet_type === 'For Adoption' && p.adoption_status === 'Available');
        setPets(adoptionPlacements);
        setFilteredPets(adoptionPlacements);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Adoption query exception:', err);
        setLoading(false);
      });
  };

  // Live tracker query script function
  const fetchMyTrackingLogs = () => {
    if (!session?.email) return;
    setLoadingTracking(true);
    fetch(`http://localhost:8000/api/pets/applications/?email=${encodeURIComponent(session.email)}`)
      .then((res) => res.json())
      .then((data) => {
        // FIXED: Checks if data payload structure is an array type to stop objects from breaking map runtime states
        setMyApplications(Array.isArray(data) ? data : []);
        setLoadingTracking(false);
      })
      .catch((err) => {
        console.error('Tracking log error:', err);
        setMyApplications([]); // Fallback to safe array literal structure boundary
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
      full_name: applicationForm.fullName.trim(), // Send manual legal identity entry values
      email: applicationForm.email, // Send locked institutional account tracking parameters
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
      const res = await fetch('http://localhost:8000/api/pets/applications/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMessage(`Application for ${filteredPets[currentIndex].name} successfully transmitted to triage routers.`);
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
          fetchMyTrackingLogs(); // Instantly pushes case mapping into tracking deck list
        }, 2500);
      } else {
        setErrorMessage('Database gateway rejected payload data structure validation.');
      }
    } catch (err) {
      setErrorMessage('Communication check timeout with remote server frameworks.');
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
        
        {/* Dynamic Filter Element */}
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

        {/* Dynamic Card Body element */}
        {filteredPets.length === 0 ? (
          <div className="h-[440px] w-full bg-white border border-dashed border-slate-200 rounded-[32px] p-8 text-center text-slate-400 flex flex-col items-center justify-center shadow-sm">
            <p className="font-medium">No companion files match active configuration tags.</p>
          </div>
        ) : (
          <div className="h-[450px] w-full bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.03)] flex flex-col relative group shrink-0 transition-all duration-300">
            <div className="w-full h-[46%] relative bg-slate-950 overflow-hidden shrink-0 border-b border-slate-100">
              <img src={currentPet.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'} alt="" className="w-full h-full object-cover select-none pointer-events-none brightness-[0.96]" />
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 font-mono text-[9px] font-bold">
                <span className="px-2.5 py-1 bg-slate-950/70 backdrop-blur-md text-white rounded-lg border border-white/10 shadow-sm">#{currentPet.pet_id}</span>
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
                <p className="text-[#64748B] leading-relaxed text-[11px] font-normal overflow-y-auto pr-1 border-l-2 border-slate-100 pl-2 grow max-h-[70px]">
                  {currentPet.about_text}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3 shrink-0">
                <div className="grid grid-cols-2 text-[9px] font-mono text-slate-400 leading-none">
                  <div>COLONY ORIGIN:<span className="text-slate-700 font-sans font-bold block mt-1 truncate max-w-[130px]">{currentPet.found_near}</span></div>
                  <div>HEALTH TRACK:<span className="text-emerald-600 bg-emerald-50 border border-emerald-200/40 px-2 py-0.5 rounded text-[8px] font-black block mt-1 w-fit uppercase tracking-wider">{currentPet.vaccination_status}</span></div>
                </div>
                <button onClick={() => setShowApplyForm(true)} className="w-full py-2.5 bg-gradient-to-r from-[#5C0612] to-[#7A0918] hover:brightness-110 active:scale-[0.99] text-white font-black tracking-widest rounded-xl border-b-2 border-[#D4AF37] transition-all shadow-sm text-[9px] uppercase">
                  Initiate Placement Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Carousel Flow Navigation Bar Tracker */}
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

      {/* RIGHT SECTION: REAL-TIME STUDENT APPLICATION TRACKING LEAD MATRIX */}
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
              {/* FIXED BOUNDARY: wrapped maps execution directly to check structure arrays */}
              {Array.isArray(myApplications) && myApplications.map((app) => {
                const isPending = app.application_status === 'Pending';
                const isApproved = app.application_status === 'Approved';
                
                return (
                  <div key={app.application_id} className="p-3 border rounded-xl bg-slate-50/60 flex items-center justify-between shadow-sm hover:bg-slate-50 transition-colors">
                    <div className="space-y-1 max-w-[65%]">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs font-mono">Case #{app.application_id}</span>
                        <span className="font-mono text-[9px] bg-slate-200 px-1.5 py-0.2 rounded text-slate-500 font-bold tracking-wide uppercase">{app.pet_id}</span>
                      </div>
                      <p className="text-slate-400 text-[10px] font-mono leading-none">Submitted: {new Date(app.submitted_at).toLocaleDateString()}</p>
                      <p className="text-slate-500 truncate text-[11px] font-medium block pt-0.5">Registered Address: <span className="text-slate-800">{app.address}</span></p>
                    </div>

                    {/* DYNAMIC TIMELINE STATUS TOKEN CHIP VALUE */}
                    <div className="shrink-0 text-right">
                      <span className={`inline-block px-3 py-1 text-[9px] font-black tracking-widest uppercase rounded-lg border shadow-sm ${
                        isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        isPending ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse' :
                        'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        {app.application_status}
                      </span>
                    </div>
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

      {/* MULTI-SECTION VETTING POPUP MATRIX MODAL */}
      {showApplyForm && filteredPets.length > 0 && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up max-h-[85vh] overflow-y-auto">
            <div className="border-b pb-2.5 flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Placement Clearance Protocol</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Vetting safety constraints for companion: <strong className="text-[#5C0612] font-bold">{filteredPets[currentIndex].name}</strong></p>
              </div>
              <button type="button" onClick={() => setShowApplyForm(false)} className="text-slate-400 hover:text-slate-900 font-mono text-xs p-1">Close</button>
            </div>

            {successMessage && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-center font-medium shadow-inner">{successMessage}</div>}
            {errorMessage && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-center font-medium shadow-inner">{errorMessage}</div>}

            {!successMessage && (
              <form onSubmit={handleApplySubmit} className="space-y-3 text-[11px]">
                
                {/* Section 1 */}
                <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/50 space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block tracking-wider">Section 1: Applicant Metrics</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Full Legal Name *</label>
                      <input type="text" name="fullName" required value={applicationForm.fullName} onChange={handleInputChange} placeholder="Vince Clark Bajenting" className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Registered Email Address</label>
                      <input type="email" name="email" readOnly value={applicationForm.email} className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed select-none focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Secure Contact Line *</label>
                      <input type="text" name="contactNum" required value={applicationForm.contactNum} onChange={handleInputChange} placeholder="09---------" className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Residential Address Block *</label>
                      <input type="text" name="address" required value={applicationForm.address} onChange={handleInputChange} placeholder="Mandaue City, Cebu" className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/50 space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block tracking-wider">Section 2: Habitat Feasibility Checks</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Housing Framework</label>
                      <select name="housingType" value={applicationForm.housingType} onChange={handleInputChange} className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none">
                        <option value="Owned House">Owned Residential House</option>
                        <option value="Rented House">Rented House (Landlord Terms Apply)</option>
                        <option value="Condo or Apartment">Condo / High-Rise Apartment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Caretaker Level</label>
                      <select name="experience" value={applicationForm.experience} onChange={handleInputChange} className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none">
                        <option value="Beginner">First-time Pet Caretaker</option>
                        <option value="Intermediate">Have owned 1-2 companions previously</option>
                        <option value="Expert">Experienced Multi-Animal Caregiver</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" name="hasSecureFence" checked={applicationForm.hasSecureFence} onChange={handleInputChange} className="w-4 h-4 accent-[#5C0612] rounded mt-0.5" />
                      <div><span className="font-bold text-slate-800 block">Boundary Fencing</span><span className="text-[9px] text-slate-400 block font-normal">Perimeter structure intact</span></div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" name="householdAgreement" checked={applicationForm.householdAgreement} onChange={handleInputChange} className="w-4 h-4 accent-[#5C0612] rounded mt-0.5" />
                      <div><span className="font-bold text-slate-800 block">Family Consent</span><span className="text-[9px] text-slate-400 block font-normal">Unified household approval</span></div>
                    </label>
                  </div>
                </div>

                {/* Section 3 */}
                <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/50 space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block tracking-wider">Section 3: Financial Clearance & Strategy</span>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Monthly Nutrition & Vet Allocation *</label>
                    <select name="petCareBudget" value={applicationForm.petCareBudget} onChange={handleInputChange} className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none">
                      <option value="Basic (Under PHP 2,000)">Basic Tier Allocation (Under 2,000 PHP/mo)</option>
                      <option value="Moderate (PHP 2,000 - 5,000)">Moderate Veterinary Capability (2,000 - 5,000 PHP/mo)</option>
                      <option value="Premium (Above PHP 5,000)">Full Clinical Clearance Depth (Above 5,000 PHP/mo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Relocation Contingency Plan *</label>
                    <textarea name="planIfMoving" required rows="2" value={applicationForm.planIfMoving} onChange={handleInputChange} placeholder="Detail housing contingency safety buffers planned if you move out of your current residence..." className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800 leading-relaxed font-sans"></textarea>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowApplyForm(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl uppercase tracking-wider text-[10px]">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-[#5C0612] text-white font-bold border-b-2 border-[#D4AF37] rounded-xl hover:bg-[#42040B] shadow-md uppercase tracking-wider text-[10px]">Submit Application File</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}