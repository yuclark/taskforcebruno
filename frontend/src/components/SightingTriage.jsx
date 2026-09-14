import React, { useState, useEffect } from 'react';

export default function SightingTriage({ session }) {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('Active'); // 'Active', 'Urgent', 'Pending', 'Investigated', 'All'
  const [loading, setLoading] = useState(true);
  const [triageModal, setTriageModal] = useState({ isOpen: false, reportId: null, targetStatus: null });

  const fetchActiveReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/sightings/');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching sightings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveReports();
  }, []);

  const openConfirmModal = (reportId, targetStatus) => {
    setTriageModal({ isOpen: true, reportId, targetStatus });
  };

  const handleStatusMutation = async () => {
    const { reportId, targetStatus } = triageModal;
    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/sightings/${reportId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });
      if (res.ok) {
        setTriageModal({ isOpen: false, reportId: null, targetStatus: null });
        fetchActiveReports();
      }
    } catch (err) {
      console.error('Status sync error:', err);
    }
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(isoString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto text-center p-16 font-mono text-xs text-slate-400 animate-pulse">
        Retrieving campus community animal sighting telemetry...
      </div>
    );
  }

  // Sort: Emergencies first, then by date descending
  const sortedReports = [...reports].sort((a, b) => {
    const aUrgent = (a.distinct_features || '').includes('[🚨 URGENT EMERGENCY]');
    const bUrgent = (b.distinct_features || '').includes('[🚨 URGENT EMERGENCY]');
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;
    return new Date(b.logged_at || 0) - new Date(a.logged_at || 0);
  });

  const displayedReports = sortedReports.filter((r) => {
    const isUrgent = (r.distinct_features || '').includes('[🚨 URGENT EMERGENCY]');
    if (filter === 'Urgent') return isUrgent;
    if (filter === 'Active') return r.status !== 'Resolved';
    if (filter === 'Pending') return r.status === 'Pending';
    if (filter === 'Investigated') return r.status === 'Investigated';
    return true; // 'All'
  });

  const urgentCount = reports.filter(r => (r.distinct_features || '').includes('[🚨 URGENT EMERGENCY]') && r.status !== 'Resolved').length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-xs text-slate-700 font-sans pb-12">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
              Community Sighting Triage Center
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono text-[10px] font-bold">
              {reports.filter(r => r.status !== 'Resolved').length} Active Cases
            </span>
            {urgentCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold animate-pulse">
                {urgentCount} Urgent Emergency
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Review and triage community-reported roaming or injured animals, dispatch field response, and archive resolved cases.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button 
            onClick={fetchActiveReports} 
            className="px-4 py-2 border border-slate-200 text-[10px] font-mono font-bold bg-slate-50 text-slate-700 rounded-xl shadow-sm hover:bg-slate-100 transition-colors shrink-0"
          >
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 overflow-x-auto pb-1 font-mono text-[11px] font-bold">
        {[
          { key: 'Active', label: 'Active Queue' },
          { key: 'Urgent', label: `Urgent Only (${urgentCount})` },
          { key: 'Pending', label: 'Pending Review' },
          { key: 'Investigated', label: 'Investigated' },
          { key: 'All', label: 'All Archived' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
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
        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 bg-white shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Reports in this View</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            All reports matching current filter criteria have been addressed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {displayedReports.map((report) => {
            const isUrgent = (report.distinct_features || '').includes('[🚨 URGENT EMERGENCY]');
            return (
              <div 
                key={report.sighting_id} 
                className={`bg-white border rounded-3xl p-5 shadow-sm flex flex-col justify-between text-left transition-all hover:shadow-md space-y-4 ${
                  isUrgent 
                    ? 'border-rose-400 border-l-8 border-l-rose-600 shadow-rose-100' 
                    : 'border-slate-200 border-l-4 border-l-[#5C0612]'
                }`}
              >
                <div>
                  {/* Report Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-slate-900 text-sm tracking-tight">
                          {report.animal_type || 'Unidentified Animal'}
                        </h3>
                        {isUrgent && (
                          <span className="px-2.5 py-0.5 rounded-lg font-mono text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                            URGENT EMERGENCY
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider border ${
                          report.status === 'Pending' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : report.status === 'Investigated'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-slate-400 mt-1">
                        Reported by: <strong className="text-slate-700 font-sans">{report.reporter_email}</strong> &bull; {getRelativeTime(report.logged_at)} ({new Date(report.logged_at).toLocaleString()})
                      </p>
                    </div>
                    <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-xl font-bold text-[10px] text-slate-600 shrink-0">
                      Case #{report.sighting_id}
                    </span>
                  </div>

                  {/* Photo & Description Body */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-3 items-start">
                    {report.image_url ? (
                      <div className="w-full sm:w-40 h-36 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-sm relative group">
                        <img 
                          src={report.image_url} 
                          alt="Sighting Attachment" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                      </div>
                    ) : (
                      <div className="w-full sm:w-40 h-36 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 shrink-0 select-none font-mono text-[10px] font-bold uppercase tracking-wider">
                        <svg className="w-6 h-6 mb-1 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
                        </svg>
                        No Media Attached
                      </div>
                    )}

                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                          Reported Campus Location
                        </span>
                        <p className="font-semibold text-slate-800 font-sans mt-0.5 bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs">
                          {report.location_details}
                        </p>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                          Physical Observations & Somatic Notes
                        </span>
                        <p className={`mt-0.5 p-2 rounded-xl border text-[11px] leading-relaxed ${
                          isUrgent ? 'bg-rose-50/70 border-rose-200 text-rose-900 font-medium' : 'bg-slate-50 border-slate-100 text-slate-600 italic'
                        }`}>
                          "{report.distinct_features || 'No detailed somatic features logged.'}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-slate-100">
                  {report.status === 'Pending' && (
                    <button 
                      onClick={() => openConfirmModal(report.sighting_id, 'Investigated')} 
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl tracking-wide text-[10px] uppercase transition-colors"
                    >
                      Mark as Investigated
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      sessionStorage.setItem('tfb_stray_handoff', JSON.stringify({
                        found_near: report.location_details,
                        description: report.distinct_features,
                        species: report.animal_type?.toLowerCase().includes('dog') ? 'Dog' : 'Cat',
                        sighting_id: report.sighting_id
                      }));
                      localStorage.setItem('tfb_staff_tab', 'Add New Pet');
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold rounded-xl tracking-wide text-[10px] uppercase transition-colors flex items-center gap-1.5"
                    title="Animal caught and admitted to clinic for full veterinary intake"
                  >
                    <svg className="w-3.5 h-3.5 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Admit & Intake Stray
                  </button>
                  <button 
                    onClick={() => openConfirmModal(report.sighting_id, 'Resolved')} 
                    className="px-5 py-2 bg-[#5C0612] hover:bg-[#42040B] border-b-2 border-[#D4AF37] text-white font-bold rounded-xl tracking-wide text-[10px] uppercase shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Resolve & Archive
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {triageModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 text-center space-y-4 shadow-2xl animate-scale-up">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Confirm Status Update</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transition Sighting Report <strong>#{triageModal.reportId}</strong> to status{' '}
              <strong className="text-[#5C0612] uppercase font-bold">{triageModal.targetStatus}</strong>?
            </p>
            <div className="flex gap-2.5 font-sans font-bold pt-2">
              <button 
                onClick={() => setTriageModal({ isOpen: false, reportId: null, targetStatus: null })} 
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] uppercase transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleStatusMutation} 
                className="flex-1 py-2.5 bg-[#5C0612] hover:bg-[#42040B] text-white rounded-xl text-[11px] uppercase shadow-md border-b-2 border-[#D4AF37] transition-all"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl font-mono text-[10px] text-slate-400 text-left">
        Staff Clearance Session: <span className="text-slate-700 font-sans font-medium">{session?.email || 'MDC Staff Operational Desk'}</span>
      </div>
    </div>
  );
}