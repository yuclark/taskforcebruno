import React, { useState, useEffect } from 'react';

export default function PendingApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  // NEW: State for custom modal
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
        alert('Server rejected structural status update matrix mutation.');
      }
    } catch (err) {
      console.error('Error processing application dispatch mutation:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-slate-400">
        PULLING DEPLOYED REGISTRY QUEUE SCHEMAS...
      </div>
    );
  }

  const pendingApplications = applications.filter(app => app.application_status === 'Pending');

  if (pendingApplications.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 bg-white max-w-xl mx-auto animate-fade-in">
        <p className="text-xs font-medium tracking-wide">
          No incoming adoption applications currently in the triage review queue.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto text-xs text-slate-700 animate-fade-in">
      <div className="border-b pb-2 flex justify-between items-center">
        <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Active Screening Registries Queue: {pendingApplications.length} cases loaded
        </span>
      </div>

      <div className="space-y-4">
        {pendingApplications.map((app) => (
          <div key={app.application_id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 text-left transition-all hover:shadow-md border-l-4 border-l-amber-500">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
              <div>
                <h3 className="text-sm font-black text-slate-900">{app.full_name}</h3>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                  Contact Line: <strong className="text-slate-700">{app.contact_number}</strong> &bull; Location: {app.address}
                </p>
              </div>
              <div className="bg-slate-900 text-white font-mono font-bold px-3 py-1 rounded-xl text-center border-b border-amber-400 shadow-sm shrink-0">
                Target ID: {app.pet_id}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Home Security Diagnostics:</span>
                <p>Housing: <strong className="text-slate-900 font-semibold">{app.housing_type}</strong></p>
                <p>Caretaker Level: <strong className="text-slate-900 font-semibold">{app.experience_level}</strong></p>
                <p className="flex items-center gap-1.5 pt-0.5">
                  Secure Fence: 
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${app.has_secure_fence ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {app.has_secure_fence ? 'SECURE' : 'UNSECURED'}
                  </span>
                </p>
              </div>

              <div className="space-y-1 border-t md:border-t-0 md:border-x px-0 md:px-4 border-slate-200">
                <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Socio-Economic Factors:</span>
                <p>Budget Capability: <strong className="text-slate-900 font-semibold">{app.pet_care_budget}</strong></p>
                <p className="flex items-center gap-1.5 pt-0.5">
                  Household Consent: 
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${app.household_agreement ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {app.household_agreement ? 'VERIFIED AGREEMENT' : 'PENDING'}
                  </span>
                </p>
              </div>

              <div className="space-y-1 border-t md:border-t-0">
                <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Relocation Safety Blueprint:</span>
                <p className="text-slate-600 italic leading-relaxed font-light font-sans text-[11px]">
                  "{app.plan_if_moving}"
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button 
                onClick={() => openTriageModal(app.application_id, 'Rejected', app.pet_id)} 
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-all uppercase tracking-wide text-[10px]"
              >
                Reject & Deny Profile
              </button>
              <button 
                onClick={() => openTriageModal(app.application_id, 'Approved', app.pet_id)} 
                className="px-5 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white font-bold rounded-xl border-b-2 border-[#D4AF37] shadow-sm transition-all uppercase tracking-wide text-[10px]"
              >
                Grant Approval & Update Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CUSTOM TRIAGE MODAL */}
      {decisionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-scale-up text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">Confirm Triage Action</h3>
            <p className="text-[11px] text-slate-500 mb-6">
              You are about to log this candidate file as <span className="font-bold text-[#5C0612] uppercase">{decisionModal.status}</span>. This action is recorded in the permanent institutional ledger.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDecisionModal({ isOpen: false })} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wide">Cancel</button>
              <button onClick={confirmTriage} className="flex-1 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white font-bold rounded-xl text-xs uppercase tracking-wide shadow-md">Confirm Action</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}