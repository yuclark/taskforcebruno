import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Check,
  AlertCircle,
} from 'lucide-react';
import { apiGet, apiPut } from '../lib/api';
import { isUrgentSightingText, stripUrgentPrefix, safeImageUrl } from '../lib/pets';
import { formatRelativeTime } from '../lib/dates';

export default function SightingTriage({ session, onAdmitStray, onSummaryRefresh }) {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('Active');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [triageModal, setTriageModal] = useState({
    isOpen: false,
    reportId: null,
    targetStatus: null,
  });

  const fetchActiveReports = useCallback(async (signal) => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await apiGet('/sightings/', { signal });
      if (res.aborted) return;
      if (res.ok) {
        setReports(Array.isArray(res.data) ? res.data : []);
        setNowMs(Date.now());
      } else {
        setLoadError(res.error || 'Unable to load sighting reports.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    apiGet('/sightings/', { signal: controller.signal }).then((res) => {
      if (res.aborted) return;
      if (res.ok) {
        setReports(Array.isArray(res.data) ? res.data : []);
        setNowMs(Date.now());
        setLoadError('');
      } else {
        setLoadError(res.error || 'Unable to load sighting reports.');
      }
      setLoading(false);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!triageModal.isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !submittingStatus) {
        setTriageModal({ isOpen: false, reportId: null, targetStatus: null });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triageModal.isOpen, submittingStatus]);

  const openConfirmModal = (reportId, targetStatus) => {
    setStatusError('');
    setTriageModal({ isOpen: true, reportId, targetStatus });
  };

  const handleStatusMutation = async () => {
    if (submittingStatus) return;
    const { reportId, targetStatus } = triageModal;
    setSubmittingStatus(true);
    setStatusError('');
    try {
      const res = await apiPut(`/sightings/${encodeURIComponent(reportId)}/`, {
        status: targetStatus,
      });
      if (res.ok) {
        setTriageModal({ isOpen: false, reportId: null, targetStatus: null });
        fetchActiveReports();
        if (onSummaryRefresh) onSummaryRefresh();
      } else {
        setStatusError(res.error || 'Failed to update sighting status.');
      }
    } finally {
      setSubmittingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto text-center p-16 font-mono text-xs text-slate-400 flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-[#5C0612] rounded-full animate-spin" />
        <span>Loading campus sighting reports...</span>
      </div>
    );
  }

  const sortedReports = [...reports].sort((a, b) => {
    const aUrgent = isUrgentSightingText(a.distinct_features);
    const bUrgent = isUrgentSightingText(b.distinct_features);
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;
    return new Date(b.logged_at || 0) - new Date(a.logged_at || 0);
  });

  const displayedReports = sortedReports.filter((r) => {
    const isUrgent = isUrgentSightingText(r.distinct_features);
    if (filter === 'Urgent') return isUrgent && r.status !== 'Resolved';
    if (filter === 'Active') return r.status !== 'Resolved';
    if (filter === 'Pending') return r.status === 'Pending';
    if (filter === 'Investigated') return r.status === 'Investigated';
    if (filter === 'Archived') return r.status === 'Resolved';
    return true;
  });

  const urgentCount = reports.filter(
    (r) => isUrgentSightingText(r.distinct_features) && r.status !== 'Resolved'
  ).length;
  const archivedCount = reports.filter((r) => r.status === 'Resolved').length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 sm:space-y-6 text-xs text-slate-700 font-sans pb-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
              Sighting Triage Queue
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono text-[10px] font-bold">
              {reports.filter((r) => r.status !== 'Resolved').length} Active
            </span>
            {urgentCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold">
                {urgentCount} Urgent
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Review community sightings, admit rescued strays into the registry, and close resolved cases.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchActiveReports()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 rounded-xl shadow-sm hover:bg-slate-100 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh
        </button>
      </div>

      {loadError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchActiveReports()}
            className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-[11px] font-bold hover:bg-rose-100 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-1 font-mono text-[11px] font-bold">
        {[
          { key: 'Active', label: 'Active Queue' },
          { key: 'Urgent', label: `Urgent Only (${urgentCount})` },
          { key: 'Pending', label: 'Pending Review' },
          { key: 'Investigated', label: 'Investigated' },
          { key: 'Archived', label: `Resolved (${archivedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap ${
              filter === tab.key
                ? 'bg-[#5C0612] text-white border-[#5C0612] shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sighting Cards */}
      {displayedReports.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-14 text-center text-slate-400 bg-white shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Reports in this View</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            All sighting reports matching the selected filter have been addressed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {displayedReports.map((report) => {
            const isUrgent = isUrgentSightingText(report.distinct_features);
            const cleanFeatures = stripUrgentPrefix(report.distinct_features);
            const isResolved = report.status === 'Resolved';
            const imgUrl = safeImageUrl(report.image_url);
            return (
              <div
                key={report.sighting_id}
                className={`bg-white border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col justify-between text-left transition-all hover:shadow-md space-y-4 ${
                  isUrgent && !isResolved
                    ? 'border-rose-400 border-l-8 border-l-rose-600 shadow-rose-100'
                    : isResolved
                    ? 'border-slate-200 border-l-4 border-l-emerald-500 opacity-90'
                    : 'border-slate-200 border-l-4 border-l-[#5C0612]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3 gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-black text-slate-900 text-sm tracking-tight">
                          {report.animal_type || 'Unidentified Animal'}
                        </h3>
                        {isUrgent && !isResolved && (
                          <span className="px-2 py-0.5 rounded-lg font-mono text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white">
                            URGENT EMERGENCY
                          </span>
                        )}
                        {isUrgent && isResolved && (
                          <span className="px-2 py-0.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                            Urgent (Closed)
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider border ${
                            report.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : report.status === 'Investigated'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-slate-400 mt-1 break-words">
                        Reported by:{' '}
                        <strong className="text-slate-700 font-sans">{report.reporter_email}</strong> &bull;{' '}
                        {formatRelativeTime(report.logged_at, nowMs)}
                      </p>
                    </div>
                    <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-xl font-bold text-[10px] text-slate-600 shrink-0">
                      #{report.sighting_id}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-3 items-start">
                    {imgUrl ? (
                      <div className="w-full sm:w-40 h-40 sm:h-36 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-sm">
                        <img
                          src={imgUrl}
                          alt="Sighting attachment"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full sm:w-40 h-28 sm:h-36 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 shrink-0 select-none font-mono text-[10px] font-bold uppercase tracking-wider">
                        <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                        No Photo
                      </div>
                    )}

                    <div className="space-y-2.5 flex-1 min-w-0 w-full">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                          Reported Location
                        </span>
                        <p className="font-semibold text-slate-800 font-sans mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                          {report.location_details}
                        </p>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                          Physical Description &amp; Notes
                        </span>
                        <p
                          className={`mt-0.5 p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                            isUrgent
                              ? 'bg-rose-50/70 border-rose-200 text-rose-900 font-medium'
                              : 'bg-slate-50 border-slate-100 text-slate-600'
                          }`}
                        >
                          {cleanFeatures || 'No additional notes provided.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap gap-2 justify-end items-center pt-3 border-t border-slate-100">
                  {isResolved ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl tracking-wide text-[10px] uppercase font-mono">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Resolved &amp; Archived
                    </span>
                  ) : (
                    <>
                      {report.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => openConfirmModal(report.sighting_id, 'Investigated')}
                          className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl tracking-wide text-[10px] uppercase transition-colors"
                        >
                          Mark Investigated
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          sessionStorage.setItem(
                            'tfb_stray_handoff',
                            JSON.stringify({
                              found_near: report.location_details,
                              description: cleanFeatures,
                              species: report.animal_type?.toLowerCase().includes('dog') ? 'Dog' : 'Cat',
                              image_url: imgUrl || '',
                              sighting_id: report.sighting_id,
                            })
                          );
                          if (onAdmitStray) {
                            onAdmitStray();
                          } else {
                            localStorage.setItem('tfb_staff_tab', 'Add New Pet');
                            window.location.reload();
                          }
                        }}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold rounded-xl tracking-wide text-[10px] uppercase transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#5C0612]" />
                        Admit Stray
                      </button>
                      <button
                        type="button"
                        onClick={() => openConfirmModal(report.sighting_id, 'Resolved')}
                        className="px-4 py-2 bg-[#5C0612] hover:bg-[#42040B] border-b-2 border-[#D4AF37] text-white font-bold rounded-xl tracking-wide text-[10px] uppercase shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Resolve
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {triageModal.isOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-[90] animate-fade-in"
          >
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 text-center space-y-4 shadow-2xl animate-scale-up">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Confirm Status Update</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Update Sighting Report <strong>#{triageModal.reportId}</strong> to{' '}
                <strong className="text-[#5C0612] uppercase font-bold">{triageModal.targetStatus}</strong>?
              </p>
              {statusError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-medium">
                  {statusError}
                </div>
              )}
              <div className="flex gap-2.5 font-sans font-bold pt-2">
                <button
                  type="button"
                  onClick={() => setTriageModal({ isOpen: false, reportId: null, targetStatus: null })}
                  disabled={submittingStatus}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-[11px] uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStatusMutation}
                  disabled={submittingStatus}
                  className="flex-1 py-2.5 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-50 text-white rounded-xl text-[11px] uppercase shadow-md border-b-2 border-[#D4AF37] transition-all"
                >
                  {submittingStatus ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl font-mono text-[10px] text-slate-400 text-left">
        Signed in as:{' '}
        <span className="text-slate-700 font-sans font-medium">
          {session?.email || 'MDC Staff'}
        </span>
      </div>
    </div>
  );
}
