import React, { useState, useEffect } from 'react';

export default function PendingApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decisionModal, setDecisionModal] = useState({ isOpen: false, appId: null, status: null, petId: null });

  const fetchActiveApplicationsQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/pets/applications/');
      if (res.ok) {
        setApplications(await res.json());
      }
    } catch (err) {
      console.error('Error fetching applications queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveApplicationsQueue();
  }, []);

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
        fetchActiveApplicationsQueue();
      } else {
        alert('Server rejected application status update.');
      }
    } catch (err) {
      console.error('Error processing application triage mutation:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-16 text-center text-xs font-mono text-slate-400 animate-pulse">
        Retrieving active adoption application screening queue...
      </div>
    );
  }

  const pendingApplications = applications.filter(app => app.application_status === 'Pending');

  if (pendingApplications.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 bg-white animate-fade-in shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-slate-700">Application Queue Cleared</h4>
        <p className="text-xs font-normal text-slate-400 mt-1 max-w-md mx-auto">
          No incoming adoption candidate files are currently awaiting staff evaluation.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-xs text-slate-700 animate-fade-in pb-12">
      
      {/* Top Banner Stats and Queue Controller */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
              Adoption Candidate Screening Portal
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
              {pendingApplications.length} Pending Triage
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Review applicant living environment, caretaker capabilities, and financial readiness before finalizing placement.
          </p>
        </div>

        <button
          onClick={fetchActiveApplicationsQueue}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-mono text-[10px] font-bold text-slate-700 transition-colors shadow-sm self-stretch sm:self-auto text-center"
        >
          Refresh Queue
        </button>
      </div>

      {/* Grid of Pending Applications (Responsive 2-Column on Desktop) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {pendingApplications.map((app) => (
          <div 
            key={app.application_id} 
            className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 text-left transition-all hover:shadow-md border-l-4 border-l-amber-500 flex flex-col justify-between"
          >
            
            {/* Applicant Identity Header */}
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

      {/* Custom Triage Modal */}
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

    </div>
  );
}