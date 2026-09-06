import React, { useState, useEffect } from 'react';

export default function SightingTriage({ session }) {
  const [reports, setReports] = useState([]);
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

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto text-center p-16 font-mono text-xs text-slate-400 animate-pulse">
        Retrieving active campus sighting reports...
      </div>
    );
  }

  const activeQueue = reports.filter(r => r.status !== 'Resolved');

  if (activeQueue.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 bg-white shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-slate-800">Sighting Queue Cleared</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          All campus community animal sightings have been investigated or resolved.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-xs text-slate-700 font-sans pb-12">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
              Community Sighting Triage Center
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
              {activeQueue.length} Active Sightings
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Review community-reported roaming or distressed animals, coordinate physical welfare checks, and archive resolved cases.
          </p>
        </div>

        <button 
          onClick={fetchActiveReports} 
          className="px-4 py-2 border border-slate-200 text-[10px] font-mono font-bold bg-slate-50 text-slate-700 rounded-xl shadow-sm hover:bg-slate-100 transition-colors"
        >
          Refresh Reports
        </button>
      </div>

      {/* Two-Column Responsive Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {activeQueue.map((report) => (
          <div 
            key={report.sighting_id} 
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between text-left border-l-4 border-l-[#5C0612] transition-all hover:shadow-md space-y-4"
          >
            <div>
              {/* Report Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-sm tracking-tight">
                      {report.animal_type || 'Unidentified Animal'}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider border ${
                      report.status === 'Pending' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-400 mt-1">
                    Reported by: <strong className="text-slate-700 font-sans">{report.reporter_email}</strong> &bull; {new Date(report.logged_at).toLocaleString()}
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
                    No Media
                  </div>
                )}

                <div className="space-y-2.5 flex-1 min-w-0">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                      Reported Location Zone
                    </span>
                    <p className="font-semibold text-slate-800 font-sans mt-0.5 bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs">
                      {report.location_details}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                      Physical Features & Condition
                    </span>
                    <p className="italic text-slate-600 mt-0.5 bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px] leading-relaxed">
                      "{report.distinct_features || 'No detailed features specified.'}"
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
        ))}
      </div>

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