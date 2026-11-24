import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  RotateCw,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { apiDelete, apiGet, apiPut } from '../lib/api';

function normalizeVolunteerList(rawList) {
  return rawList.map((item, idx) => ({
    ...item,
    application_id: item.application_id || item.id || idx + 1,
    full_name: item.full_name || item.name || 'Student Applicant',
    student_id: item.student_id || item.studentId || 'N/A',
    contact_number: item.contact_number || item.contactNum || 'N/A',
    program: item.program || 'CIT-U Student',
    role: item.role || 'Feeding Patrol',
    availability: item.availability || 'Flexible schedule',
    status: item.status || 'Pending',
    created_at: item.created_at || item.submittedAt || new Date().toISOString(),
  }));
}

export default function PendingApplications({ onRefresh }) {
  const [activeTab, setActiveTab] = useState('adoption');

  const [adoptionApplications, setAdoptionApplications] = useState([]);
  const [loadingAdoptions, setLoadingAdoptions] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    appId: null,
    status: null,
    petId: null,
  });

  const [volunteerApplications, setVolunteerApplications] = useState([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(true);
  const [updatingVolunteer, setUpdatingVolunteer] = useState(false);
  const [volunteerFilter, setVolunteerFilter] = useState('all');
  const [volunteerModal, setVolunteerModal] = useState({
    isOpen: false,
    appId: null,
    status: null,
    name: null,
  });
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: 'success', text: '' });

  const showToast = (text, type = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage({ type: 'success', text: '' }), 4500);
  };

  const fetchVolunteerApplications = useCallback(async () => {
    setLoadingVolunteers(true);
    const res = await apiGet('/volunteers/');
    if (res.ok && Array.isArray(res.data)) {
      setVolunteerApplications(normalizeVolunteerList(res.data));
    }
    setLoadingVolunteers(false);
  }, []);

  const fetchActiveApplicationsQueue = useCallback(async () => {
    setLoadingAdoptions(true);
    setLoadError('');
    const [adoptRes, volRes] = await Promise.all([
      apiGet('/pets/applications/'),
      apiGet('/volunteers/'),
    ]);
    if (adoptRes.ok && Array.isArray(adoptRes.data)) {
      setAdoptionApplications(adoptRes.data);
    } else if (!adoptRes.aborted) {
      setLoadError(adoptRes.error || 'Unable to load adoption applications.');
    }
    if (volRes.ok && Array.isArray(volRes.data)) {
      setVolunteerApplications(normalizeVolunteerList(volRes.data));
    }
    setLoadingAdoptions(false);
    setLoadingVolunteers(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const init = async () => {
      setLoadingAdoptions(true);
      setLoadingVolunteers(true);
      setLoadError('');
      const [res, volRes] = await Promise.all([
        apiGet('/pets/applications/', { signal: controller.signal }),
        apiGet('/volunteers/', { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      if (res.ok && Array.isArray(res.data)) {
        setAdoptionApplications(res.data);
      } else {
        setLoadError(res.error || 'Unable to load adoption applications.');
      }
      if (volRes.ok && Array.isArray(volRes.data)) {
        setVolunteerApplications(normalizeVolunteerList(volRes.data));
      }
      setLoadingAdoptions(false);
      setLoadingVolunteers(false);
    };
    init();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!submittingDecision) setDecisionModal({ isOpen: false, appId: null, status: null, petId: null });
        if (!updatingVolunteer) setVolunteerModal({ isOpen: false, appId: null, status: null, name: null });
        setIsClearModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [submittingDecision, updatingVolunteer]);

  const confirmTriage = async () => {
    if (submittingDecision) return;
    const { appId, status, petId } = decisionModal;
    setSubmittingDecision(true);

    const res = await apiPut(`/pets/applications/${encodeURIComponent(appId)}/`, {
      application_status: status,
      pet_id: petId,
    });

    if (res.ok) {
      setDecisionModal({ isOpen: false, appId: null, status: null, petId: null });
      showToast(`Application #${appId} marked as ${status}.`, 'success');
      fetchActiveApplicationsQueue();
      if (onRefresh) onRefresh();
    } else {
      setDecisionModal({ isOpen: false, appId: null, status: null, petId: null });
      showToast(res.error || 'Failed to update application status.', 'error');
    }
    setSubmittingDecision(false);
  };

  const confirmClearAllVolunteers = async () => {
    if (updatingVolunteer) return;
    setUpdatingVolunteer(true);
    const targets = volunteerApplications.filter((v) =>
      ['Declined', 'Cancelled'].includes(v.status || '')
    );
    const toDelete = targets.length > 0 ? targets : volunteerApplications;
    await Promise.all(
      toDelete.map((v) => apiDelete(`/volunteers/${encodeURIComponent(v.application_id)}/`))
    );
    setIsClearModalOpen(false);
    setUpdatingVolunteer(false);
    await fetchVolunteerApplications();
    if (onRefresh) onRefresh();
    showToast('Volunteer application records cleared from database.');
  };

  const executeVolunteerStatusChange = async (appId, newStatus) => {
    if (updatingVolunteer) return;
    setUpdatingVolunteer(true);
    const res = await apiPut(`/volunteers/${encodeURIComponent(appId)}/`, { status: newStatus });
    setUpdatingVolunteer(false);
    setVolunteerModal({ isOpen: false, appId: null, status: null, name: null });

    if (res.ok) {
      await fetchVolunteerApplications();
      if (onRefresh) onRefresh();
      showToast(`Volunteer application #${appId} marked as ${newStatus}.`);
    } else {
      showToast(res.error || 'Failed to update volunteer status.', 'error');
    }
  };

  const pendingAdoptions = adoptionApplications.filter((app) => app.application_status === 'Pending');
  const pendingVolunteers = volunteerApplications.filter((vol) => (vol.status || 'Pending') === 'Pending');
  const filteredVolunteers = volunteerApplications.filter((vol) => {
    const currentStatus = vol.status || 'Pending';
    if (volunteerFilter === 'all') return true;
    return currentStatus.toLowerCase() === volunteerFilter.toLowerCase();
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 text-xs text-slate-700 pb-8 text-left">
      {toastMessage.text && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-2 font-medium border ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage({ type: 'success', text: '' })}
            aria-label="Dismiss"
            className="p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-900">
            Adoption &amp; Volunteer Applications
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review incoming adoption inquiries and student volunteer sign-ups.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('adoption')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'adoption' ? 'bg-white text-[#5C0612] shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Adoptions</span>
            {pendingAdoptions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                {pendingAdoptions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('volunteer')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'volunteer' ? 'bg-white text-[#5C0612] shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Volunteers</span>
            {pendingVolunteers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                {pendingVolunteers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Adoption Tab */}
      {activeTab === 'adoption' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Pending Adoption Reviews ({pendingAdoptions.length})
            </span>
            <button
              type="button"
              onClick={fetchActiveApplicationsQueue}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          </div>

          {loadError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between gap-2">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={fetchActiveApplicationsQueue}
                className="px-3 py-1 bg-white border border-rose-200 rounded-lg font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {loadingAdoptions ? (
            <div className="w-full p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl">
              Loading adoption queue...
            </div>
          ) : pendingAdoptions.length === 0 ? (
            <div className="w-full border border-dashed border-slate-300 rounded-2xl p-12 text-center bg-white space-y-2">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">All Caught Up</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No pending adoption applications are awaiting review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {pendingAdoptions.map((app) => (
                <div
                  key={app.application_id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 border-l-4 border-l-amber-500 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">{app.full_name}</h3>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            #{app.application_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 break-all">
                          <strong className="text-slate-800">{app.contact_number}</strong> &bull;{' '}
                          <strong className="text-slate-800">{app.email}</strong>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{app.address}</p>
                      </div>

                      <div className="bg-[#5C0612] text-white font-mono px-3 py-1.5 rounded-xl text-center border-b-2 border-[#D4AF37] shrink-0 self-start">
                        <span className="text-[9px] text-[#D4AF37] block uppercase font-semibold">
                          Target Pet
                        </span>
                        <span className="text-xs font-bold">{app.pet_id}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Housing</span>
                        <p className="text-slate-700 font-semibold">{app.housing_type}</p>
                        <p className="text-slate-500">{app.experience_level}</p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            app.has_secure_fence
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {app.has_secure_fence ? 'Fenced Yard' : 'No Fence'}
                        </span>
                      </div>

                      <div className="space-y-1 border-t sm:border-t-0 sm:border-x sm:px-3 pt-2 sm:pt-0 border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Budget &amp; Consent
                        </span>
                        <p className="text-slate-700 font-semibold">{app.pet_care_budget}</p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            app.household_agreement
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {app.household_agreement ? 'Household Agrees' : 'Consent Pending'}
                        </span>
                      </div>

                      <div className="space-y-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Relocation Plan
                        </span>
                        <p className="text-slate-600 leading-relaxed">
                          {app.plan_if_moving || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        setDecisionModal({
                          isOpen: true,
                          appId: app.application_id,
                          status: 'Denied',
                          petId: app.pet_id,
                        })
                      }
                      className="flex-1 sm:flex-initial px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs inline-flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDecisionModal({
                          isOpen: true,
                          appId: app.application_id,
                          status: 'Approved',
                          petId: app.pet_id,
                        })
                      }
                      className="flex-1 sm:flex-initial px-5 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white font-semibold rounded-xl border-b-2 border-[#D4AF37] text-xs inline-flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Approve Placement</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Volunteer Tab */}
      {activeTab === 'volunteer' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">
              Volunteer Sign-ups ({filteredVolunteers.length})
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {['all', 'Pending', 'Approved', 'Declined'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setVolunteerFilter(f)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      volunteerFilter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>

              {volunteerApplications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(true)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {loadingVolunteers ? (
            <div className="w-full p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl">
              Loading volunteer applications from Supabase...
            </div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="w-full border border-dashed border-slate-300 rounded-2xl p-12 text-center bg-white space-y-2">
              <Users className="w-9 h-9 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Volunteer Applications</h4>
              <p className="text-xs text-slate-500">
                No volunteer applications match the current filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredVolunteers.map((vol) => {
                const volStatus = vol.status || 'Pending';
                return (
                  <div
                    key={vol.application_id}
                    className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 border-l-4 flex flex-col justify-between ${
                      volStatus === 'Approved'
                        ? 'border-l-emerald-500'
                        : volStatus === 'Declined'
                        ? 'border-l-rose-500'
                        : 'border-l-amber-500'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900">{vol.full_name}</h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {vol.student_id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 break-all">
                            {vol.contact_number} &bull; {vol.email}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">{vol.program}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                            volStatus === 'Approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : volStatus === 'Declined'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}
                        >
                          {volStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Role</span>
                          <span className="font-semibold text-[#5C0612]">{vol.role}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">
                            Availability
                          </span>
                          <span className="text-slate-700">{vol.availability}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-slate-100">
                      {volStatus === 'Pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setVolunteerModal({
                                isOpen: true,
                                appId: vol.application_id,
                                status: 'Declined',
                                name: vol.full_name,
                              })
                            }
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setVolunteerModal({
                                isOpen: true,
                                appId: vol.application_id,
                                status: 'Approved',
                                name: vol.full_name,
                              })
                            }
                            className="px-4 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white font-semibold rounded-xl border-b-2 border-[#D4AF37] text-xs"
                          >
                            Approve Volunteer
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => executeVolunteerStatusChange(vol.application_id, 'Pending')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                        >
                          Move Back to Pending
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Adoption Decision Modal */}
      {decisionModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() =>
            !submittingDecision &&
            setDecisionModal({ isOpen: false, appId: null, status: null, petId: null })
          }
          className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-scale-up"
          >
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Confirm Decision</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mark Application #{decisionModal.appId} for <strong>{decisionModal.petId}</strong> as{' '}
              <strong className={decisionModal.status === 'Approved' ? 'text-emerald-700' : 'text-rose-700'}>
                {decisionModal.status}
              </strong>
              ?
              {decisionModal.status === 'Approved' && (
                <span className="block mt-1 font-medium text-slate-700">
                  This will mark the companion as Adopted and close other pending applications for it.
                </span>
              )}
            </p>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                disabled={submittingDecision}
                onClick={() =>
                  setDecisionModal({ isOpen: false, appId: null, status: null, petId: null })
                }
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={confirmTriage}
                className={`flex-1 py-2.5 text-white font-semibold rounded-xl text-xs disabled:opacity-50 ${
                  decisionModal.status === 'Approved'
                    ? 'bg-[#5C0612] hover:bg-[#42040B]'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submittingDecision ? 'Saving...' : `Confirm ${decisionModal.status}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Decision Modal */}
      {volunteerModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setVolunteerModal({ isOpen: false, appId: null, status: null, name: null })}
          className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-scale-up"
          >
            <h3 className="text-base font-bold text-slate-900">Confirm Decision</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mark <strong>{volunteerModal.name}</strong>&apos;s volunteer application as{' '}
              <strong className={volunteerModal.status === 'Approved' ? 'text-emerald-700' : 'text-rose-700'}>
                {volunteerModal.status}
              </strong>
              ?
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setVolunteerModal({ isOpen: false, appId: null, status: null, name: null })
                }
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeVolunteerStatusChange(volunteerModal.appId, volunteerModal.status)}
                className={`flex-1 py-2.5 text-white font-semibold rounded-xl text-xs ${
                  volunteerModal.status === 'Approved'
                    ? 'bg-[#5C0612] hover:bg-[#42040B]'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Volunteers Modal */}
      {isClearModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsClearModalOpen(false)}
          className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-scale-up"
          >
            <h3 className="text-base font-bold text-slate-900">Clear All Volunteer Records?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This permanently removes all volunteer applications from the clinic database.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearAllVolunteers}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
