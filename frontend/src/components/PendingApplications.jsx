import React, { useState, useEffect } from 'react';

const SEED_VOLUNTEERS = [
  {
    application_id: 'VOL-2026-01',
    full_name: 'Maria Clarissa Santos',
    student_id: '22-4102-184',
    contact_number: '0917-555-3921',
    program: 'BS Information Technology (CEA)',
    role: 'Feeding Patrol',
    availability: 'Monday, Wednesday, Friday after 4:30 PM',
    email: 'mc.santos@cit.edu',
    status: 'Pending',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    application_id: 'VOL-2026-02',
    full_name: 'Joshua Emmanuel Tan',
    student_id: '23-1109-892',
    contact_number: '0928-341-9012',
    program: 'BS Computer Science (CCS)',
    role: 'Rescue Marshal',
    availability: 'Tuesday / Thursday mornings & weekends',
    email: 'je.tan@cit.edu',
    status: 'Pending',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    application_id: 'VOL-2026-03',
    full_name: 'Andrea Nicole Ramos',
    student_id: '21-3304-451',
    contact_number: '0919-872-6631',
    program: 'BS Nursing (CN)',
    role: 'Clinic Assistant',
    availability: 'Saturday whole day & Sunday afternoons',
    email: 'an.ramos@cit.edu',
    status: 'Approved',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

export default function PendingApplications() {
  const [activeTab, setActiveTab] = useState('adoption'); // 'adoption' | 'volunteer'
  
  // Adoption state
  const [adoptionApplications, setAdoptionApplications] = useState([]);
  const [loadingAdoptions, setLoadingAdoptions] = useState(true);
  const [decisionModal, setDecisionModal] = useState({ isOpen: false, appId: null, status: null, petId: null });

  // Volunteer state
  const [volunteerApplications, setVolunteerApplications] = useState([]);
  const [volunteerFilter, setVolunteerFilter] = useState('all'); // 'all' | 'Pending' | 'Approved' | 'Declined'
  const [volunteerModal, setVolunteerModal] = useState({ isOpen: false, appId: null, status: null, name: null });
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchActiveApplicationsQueue = async () => {
    setLoadingAdoptions(true);
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/pets/applications/');
      if (res.ok) {
        setAdoptionApplications(await res.json());
      }
    } catch (err) {
      console.error('Error fetching adoption applications queue:', err);
    } finally {
      setLoadingAdoptions(false);
    }
  };

  const normalizeVolunteerList = (rawList) => {
    return rawList.map((item, idx) => {
      const id = item.application_id || item.id || `VOL-${idx + 1}-${Date.now().toString().slice(-4)}`;
      return {
        ...item,
        application_id: id,
        full_name: item.full_name || item.name || 'Anonymous Student',
        student_id: item.student_id || item.studentId || 'N/A',
        contact_number: item.contact_number || item.contactNum || 'N/A',
        program: item.program || 'General Student Body',
        role: item.role || 'Feeding Patrol',
        availability: item.availability || 'Flexible schedule',
        status: item.status || 'Pending',
        created_at: item.created_at || item.submittedAt || new Date().toISOString()
      };
    });
  };

  const loadVolunteerApplications = () => {
    try {
      const raw = localStorage.getItem('tfb_volunteer_applications');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = normalizeVolunteerList(parsed);
          setVolunteerApplications(normalized);
          localStorage.setItem('tfb_volunteer_applications', JSON.stringify(normalized));
          return;
        }
      }
      // Seed default entries
      const normalizedSeeds = normalizeVolunteerList(SEED_VOLUNTEERS);
      localStorage.setItem('tfb_volunteer_applications', JSON.stringify(normalizedSeeds));
      setVolunteerApplications(normalizedSeeds);
    } catch (err) {
      console.error('Error loading volunteer applications:', err);
      setVolunteerApplications(SEED_VOLUNTEERS);
    }
  };

  useEffect(() => {
    fetchActiveApplicationsQueue();
    loadVolunteerApplications();
  }, []);

  // Adoption handlers
  const openTriageModal = (appId, status, petId) => {
    setDecisionModal({ isOpen: true, appId, status, petId });
  };

  const confirmTriage = async () => {
    const { appId, status, petId } = decisionModal;
    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/pets/applications/${appId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          application_status: status,
          pet_id: petId 
        })
      });

      if (res.ok) {
        setDecisionModal({ isOpen: false, appId: null, status: null, petId: null });
        showToast(`Adoption application #${appId} successfully marked as ${status}.`);
        fetchActiveApplicationsQueue();
      } else {
        alert('Server rejected application status update.');
      }
    } catch (err) {
      console.error('Error processing application triage mutation:', err);
    }
  };

  // Volunteer handlers
  const openVolunteerModal = (appId, status, name) => {
    setVolunteerModal({ isOpen: true, appId, status, name });
  };

  const executeVolunteerStatusChange = (appId, newStatus) => {
    setVolunteerApplications(prevList => {
      const updatedList = prevList.map(vol => {
        if (vol.application_id === appId || vol.id === appId) {
          return {
            ...vol,
            status: newStatus,
            reviewed_at: new Date().toISOString()
          };
        }
        return vol;
      });
      localStorage.setItem('tfb_volunteer_applications', JSON.stringify(updatedList));
      return updatedList;
    });

    setVolunteerModal({ isOpen: false, appId: null, status: null, name: null });
    showToast(`Volunteer application successfully marked as ${newStatus}.`);
  };

  const pendingAdoptions = adoptionApplications.filter(app => app.application_status === 'Pending');
  const pendingVolunteers = volunteerApplications.filter(vol => (vol.status || 'Pending') === 'Pending');

  const filteredVolunteers = volunteerApplications.filter(vol => {
    const currentStatus = vol.status || 'Pending';
    if (volunteerFilter === 'all') return true;
    return currentStatus.toLowerCase() === volunteerFilter.toLowerCase();
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-xs text-slate-700 animate-fade-in pb-12 text-left font-sans">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between font-medium animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-500 hover:text-emerald-800 text-xs font-bold">✕</button>
        </div>
      )}

      {/* Top Banner Stats & View Mode Switcher */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
              Applications & Screening Management
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Review and triage institutional adoption candidate requests and student volunteer applicants.
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-2xl font-mono text-[11px] font-bold uppercase select-none shrink-0 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('adoption')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'adoption'
                ? 'bg-white text-[#5C0612] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Adoption Placement</span>
            {pendingAdoptions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold">
                {pendingAdoptions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('volunteer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'volunteer'
                ? 'bg-white text-[#5C0612] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Volunteer Applicants</span>
            {pendingVolunteers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 text-[9px] font-bold">
                {pendingVolunteers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. ADOPTION APPLICATIONS VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'adoption' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-mono text-[10px] uppercase font-bold text-slate-500">
                Pending Adoption Reviews ({pendingAdoptions.length})
              </span>
            </div>

            <button
              onClick={fetchActiveApplicationsQueue}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-mono text-[10px] font-bold text-slate-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh Queue
            </button>
          </div>

          {loadingAdoptions ? (
            <div className="w-full p-16 text-center text-xs font-mono text-slate-400 animate-pulse bg-white border border-slate-200 rounded-3xl">
              Retrieving active adoption application screening queue...
            </div>
          ) : pendingAdoptions.length === 0 ? (
            <div className="w-full border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 bg-white animate-fade-in shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-700">Adoption Queue Cleared</h4>
              <p className="text-xs font-normal text-slate-400 mt-1 max-w-md mx-auto">
                No incoming adoption candidate files are currently awaiting staff evaluation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {pendingAdoptions.map((app) => (
                <div 
                  key={app.application_id} 
                  className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 text-left transition-all hover:shadow-md border-l-4 border-l-amber-500 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm md:text-base font-black text-slate-900">{app.full_name}</h3>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            App #{app.application_id}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-slate-500 mt-1">
                          Contact: <strong className="text-slate-800">{app.contact_number}</strong> &bull; Email: <strong className="text-slate-800">{app.email}</strong>
                        </p>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Residence: {app.address}
                        </p>
                      </div>

                      <div className="bg-[#5C0612] text-white font-mono font-bold px-3.5 py-1.5 rounded-xl text-center border-b-2 border-[#D4AF37] shadow-sm shrink-0 self-start sm:self-auto">
                        <span className="text-[9px] text-[#D4AF37] block uppercase tracking-wider font-semibold">Target Animal</span>
                        <span className="text-xs text-white font-bold">{app.pet_id}</span>
                      </div>
                    </div>

                    {/* Comprehensive Triage Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 mt-4 text-[11px]">
                      
                      {/* Yard & Housing */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                          Housing & Space
                        </span>
                        <p className="text-slate-600">Dwelling: <strong className="text-slate-900 font-semibold">{app.housing_type}</strong></p>
                        <p className="text-slate-600">Experience: <strong className="text-slate-900 font-semibold">{app.experience_level}</strong></p>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-slate-500">Fence:</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                            app.has_secure_fence 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {app.has_secure_fence ? 'Enclosed Yard' : 'No Enclosure'}
                          </span>
                        </div>
                      </div>

                      {/* Socio-Economic & Consent */}
                      <div className="space-y-1.5 border-t md:border-t-0 md:border-x px-0 md:px-3.5 border-slate-200/70">
                        <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                          Finances & Household
                        </span>
                        <p className="text-slate-600">Care Budget: <strong className="text-slate-900 font-semibold">{app.pet_care_budget}</strong></p>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-slate-500">Household:</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                            app.household_agreement 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {app.household_agreement ? 'All Members Agree' : 'Consent Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Relocation Plan */}
                      <div className="space-y-1.5 border-t md:border-t-0">
                        <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                          Relocation Contingency
                        </span>
                        <p className="text-slate-600 italic leading-relaxed text-[11px]">
                          "{app.plan_if_moving || 'No relocation contingency specified.'}"
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="flex flex-wrap gap-2.5 justify-end pt-3 border-t border-slate-100">
                    <button 
                      onClick={() => openTriageModal(app.application_id, 'Rejected', app.pet_id)} 
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-all uppercase tracking-wide text-[10px] flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Decline Application
                    </button>

                    <button 
                      onClick={() => openTriageModal(app.application_id, 'Approved', app.pet_id)} 
                      className="px-5 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white font-bold rounded-xl border-b-2 border-[#D4AF37] shadow-sm transition-all uppercase tracking-wide text-[10px] flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Approve & Place Animal
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. VOLUNTEER APPLICATIONS REVIEWER */}
      {/* ===================================================================== */}
      {activeTab === 'volunteer' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[10px] uppercase font-bold text-slate-500">
                Volunteer Screening Register ({filteredVolunteers.length})
              </span>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl font-mono text-[10px] font-bold uppercase">
              {['all', 'Pending', 'Approved', 'Declined'].map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setVolunteerFilter(f)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    volunteerFilter === f
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>

          {filteredVolunteers.length === 0 ? (
            <div className="w-full border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 bg-white animate-fade-in shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-700">No Volunteer Applications Found</h4>
              <p className="text-xs font-normal text-slate-400 mt-1 max-w-md mx-auto">
                There are currently no volunteer applicant files matching the selected filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredVolunteers.map((vol) => {
                const volId = vol.application_id;
                const volStatus = vol.status || 'Pending';
                
                return (
                  <div
                    key={volId}
                    className={`bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 text-left transition-all hover:shadow-md border-l-4 ${
                      volStatus === 'Approved'
                        ? 'border-l-emerald-500'
                        : volStatus === 'Declined'
                        ? 'border-l-rose-500'
                        : 'border-l-amber-500'
                    } flex flex-col justify-between`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm md:text-base font-black text-slate-900">{vol.full_name}</h3>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              ID: {vol.student_id}
                            </span>
                          </div>
                          <p className="font-mono text-[10px] text-slate-500 mt-1">
                            Contact: <strong className="text-slate-800">{vol.contact_number}</strong> &bull; Email: <strong className="text-slate-800">{vol.email}</strong>
                          </p>
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                            Program: {vol.program}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 self-start sm:self-auto">
                          <span className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider border block text-center ${
                            volStatus === 'Approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : volStatus === 'Declined'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {volStatus}
                          </span>
                        </div>
                      </div>

                      {/* Volunteer Specific Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 mt-4 text-[11px]">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                            Requested Assignment
                          </span>
                          <span className="font-bold text-[#5C0612] block mt-0.5">
                            {vol.role}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                            Availability Schedule
                          </span>
                          <p className="text-slate-700 leading-snug mt-0.5">
                            {vol.availability}
                          </p>
                        </div>

                        <div className="sm:col-span-2 border-t border-slate-200/60 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Applied: {new Date(vol.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <a
                            href={`mailto:${vol.email}?subject=Task%20Force%20Bruno%20Volunteer%20Application`}
                            className="text-[#5C0612] font-bold hover:underline flex items-center gap-1"
                          >
                            <span>Contact Student</span>
                            <span>&rarr;</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons & Status State */}
                    <div className="flex flex-wrap gap-2.5 justify-between items-center pt-3 border-t border-slate-100">
                      <div>
                        {volStatus === 'Approved' && (
                          <span className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                            Application Approved & Institutional Clearance Granted
                          </span>
                        )}
                        {volStatus === 'Declined' && (
                          <span className="text-[11px] font-mono text-rose-700 font-bold flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Application Declined
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {volStatus === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openVolunteerModal(volId, 'Declined', vol.full_name)}
                              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-all uppercase tracking-wide text-[10px] flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Decline Applicant
                            </button>

                            <button
                              type="button"
                              onClick={() => openVolunteerModal(volId, 'Approved', vol.full_name)}
                              className="px-5 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white font-bold rounded-xl border-b-2 border-[#D4AF37] shadow-sm transition-all uppercase tracking-wide text-[10px] flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                              Approve Volunteer
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => executeVolunteerStatusChange(volId, 'Pending')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all uppercase tracking-wide text-[9px] font-mono"
                          >
                            Reopen to Pending
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* ADOPTION TRIAGE MODAL */}
      {/* ===================================================================== */}
      {decisionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto border border-amber-200/60 text-amber-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            
            <h3 className="text-base font-black text-slate-900">
              Confirm Application Determination
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to mark Application #{decisionModal.appId} for target animal {decisionModal.petId} as{' '}
              <strong className={`uppercase ${decisionModal.status === 'Approved' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {decisionModal.status}
              </strong>?
              {decisionModal.status === 'Approved' && (
                <span className="block mt-1 font-semibold text-slate-700">
                  This will automatically transition the animal's adoption status to Adopted.
                </span>
              )}
            </p>

            <div className="flex gap-2.5 pt-2">
              <button 
                onClick={() => setDecisionModal({ isOpen: false, appId: null, status: null, petId: null })} 
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wide transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmTriage} 
                className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs uppercase tracking-wide shadow-md transition-all ${
                  decisionModal.status === 'Approved' 
                    ? 'bg-[#5C0612] hover:bg-[#42040B] border-b-2 border-[#D4AF37]' 
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {decisionModal.status}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VOLUNTEER TRIAGE MODAL */}
      {/* ===================================================================== */}
      {volunteerModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-scale-up">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
              volunteerModal.status === 'Approved'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {volunteerModal.status === 'Approved' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            
            <h3 className="text-base font-black text-slate-900">
              Confirm Volunteer Determination
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to mark the volunteer application for <strong>{volunteerModal.name}</strong> ({volunteerModal.appId}) as{' '}
              <strong className={`uppercase ${volunteerModal.status === 'Approved' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {volunteerModal.status}
              </strong>?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setVolunteerModal({ isOpen: false, appId: null, status: null, name: null })} 
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wide transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => executeVolunteerStatusChange(volunteerModal.appId, volunteerModal.status)} 
                className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs uppercase tracking-wide shadow-md transition-all ${
                  volunteerModal.status === 'Approved' 
                    ? 'bg-[#5C0612] hover:bg-[#42040B] border-b-2 border-[#D4AF37]' 
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {volunteerModal.status}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}