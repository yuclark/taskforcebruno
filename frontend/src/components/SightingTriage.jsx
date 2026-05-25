import React, { useState, useEffect } from 'react';

// FIXED LINE: Receives session directly from parent routing engine parameters
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
      <div className="w-full text-center p-12 font-mono text-xs text-slate-400 animate-pulse">
        PULLING TELEMETRY STREAMS FROM CENTRAL DATABASE...
      </div>
    );
  }

  const activeQueue = reports.filter(r => r.status !== 'Resolved');

  if (activeQueue.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 bg-white max-w-xl mx-auto my-8">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 mb-1">Queue Cleared</p>
        <p className="text-[11px] text-slate-400 font-normal">All incoming campus animal sighting files are currently resolved.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-4xl mx-auto text-xs text-slate-700 font-sans p-2">
      <div className="border-b pb-2 flex justify-between items-center">
        <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Sighting Triage Matrix Loop &bull; {activeQueue.length} Active Records Pending
        </span>
        <button onClick={fetchActiveReports} className="px-3 py-1 border text-[9px] font-mono font-bold bg-white text-slate-600 rounded-lg shadow-sm hover:bg-slate-50">RELOAD</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeQueue.map((report) => (
          <div key={report.sighting_id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-5 items-start text-left border-l-4 border-l-[#5C0612] transition-all hover:shadow-md">
            
            {report.image_url ? (
              <div className="w-full md:w-36 h-36 rounded-2xl overflow-hidden bg-slate-900 shrink-0 border border-slate-100 shadow-inner group relative">
                <img src={report.image_url} alt="Sighting Attachment" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
            ) : (
              <div className="w-full md:w-36 h-36 rounded-2xl bg-slate-50 border border-dashed flex flex-col items-center justify-center text-slate-300 shrink-0 select-none font-mono text-[9px] font-bold uppercase tracking-wider">
                No Media Attached
              </div>
            )}

            <div className="flex-1 space-y-3 w-full">
              <div className="flex justify-between items-start border-b pb-2 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-900 text-sm tracking-tight">Classification Focus: {report.animal_type}</h4>
                    <span className={`px-2 py-0.5 rounded-lg font-mono text-[8px] font-black tracking-wider uppercase border ${report.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200/60 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200/60'}`}>{report.status}</span>
                  </div>
                  <p className="font-mono text-[9px] text-slate-400 mt-1">Logged by: <span className="text-slate-600 font-sans font-medium">{report.reporter_email}</span> &bull; {new Date(report.logged_at).toLocaleString()}</p>
                </div>
                <span className="font-mono bg-slate-50 px-2 py-1 border rounded-xl font-bold text-[9px] text-slate-400">ID: #{report.sighting_id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] leading-relaxed">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 font-mono block uppercase tracking-wider">Reported Landmark Zone</span>
                  <p className="font-medium text-slate-800 font-sans mt-1 bg-slate-50/50 p-2 rounded-xl border border-slate-100">{report.location_details}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 font-mono block uppercase tracking-wider">Somatic Features / Metrics</span>
                  <p className="italic font-normal text-slate-600 mt-1 bg-slate-50/50 p-2 rounded-xl border border-slate-100">"{report.distinct_features}"</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                {report.status === 'Pending' && (
                  <button onClick={() => openConfirmModal(report.sighting_id, 'Investigated')} className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold font-mono rounded-xl tracking-wide text-[9px] uppercase transition-colors">
                    Mark as Investigated
                  </button>
                )}
                <button onClick={() => openConfirmModal(report.sighting_id, 'Resolved')} className="px-5 py-1.5 bg-[#5C0612] hover:bg-[#42040B] border-b-2 border-[#D4AF37] text-white font-black rounded-xl tracking-wide text-[9px] uppercase shadow-sm transition-colors">
                  Mark as Resolved & Archive
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {triageModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full border border-slate-100 text-center space-y-4 shadow-2xl animate-scale-up">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Confirm Status Update</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Are you sure you want to transition Sighting ID <strong>#{triageModal.reportId}</strong> status parameters to <strong className="text-[#5C0612] uppercase font-bold">{triageModal.targetStatus}</strong>?
            </p>
            <div className="flex gap-2 font-sans font-bold">
              <button onClick={() => setTriageModal({ isOpen: false, reportId: null, targetStatus: null })} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] uppercase">Cancel</button>
              <button onClick={handleStatusMutation} className="flex-1 py-2 bg-[#5C0612] text-white rounded-xl text-[10px] uppercase shadow-md border-b-2 border-[#D4AF37]">Confirm Transition</button>
            </div>
          </div>
        </div>
      )}

      {/* FIXED BOUNDARY AREA: Added optional chaining verification signature safety */}
      <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl font-mono text-[10px] text-slate-400 leading-tight mt-4">
        Verified Authority Session Track: <span className="text-slate-600 font-sans font-medium">{session?.email || 'Active Sandbox Engine'}</span>
      </div>
    </div>
  );
}