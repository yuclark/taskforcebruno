import React, { useState } from 'react';

export default function EmergencyProtocolModal({ isOpen, onClose, onNavigateToReport }) {
  const [activeTab, setActiveTab] = useState('first_aid'); // 'first_aid' | 'contacts' | 'quarantine' | 'faqs'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-left animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Maroon Institutional Header */}
        <div className="bg-[#5C0612] px-6 py-4 border-b-2 border-[#D4AF37] flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-400/40 flex items-center justify-center text-rose-300 text-lg shadow-inner">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#D4AF37]">
                  CIT-U Animal Biosecurity & Public Safety
                </span>
                <span className="bg-rose-500/20 text-rose-200 border border-rose-400/30 text-[9px] font-mono px-2 py-0.2 rounded-full font-bold">
                  RA 9482
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Emergency Bite, Scratch & Rescue Protocol
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-200 hover:text-white transition-all text-xs font-mono font-bold"
            title="Close Protocol Guide"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 gap-2 sm:gap-4 overflow-x-auto select-none shrink-0 text-xs">
          {[
            { id: 'first_aid', label: '1. Immediate First-Aid', icon: '🩹' },
            { id: 'contacts', label: '2. Emergency Hotlines', icon: '📞' },
            { id: 'quarantine', label: '3. 14-Day Rabies Protocol', icon: '⏱️' },
            { id: 'faqs', label: '4. Exposure Categories & FAQs', icon: '❓' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
                activeTab === tab.id
                  ? 'border-[#5C0612] text-[#5C0612]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs leading-relaxed">
          
          {/* TAB 1: IMMEDIATE FIRST AID (GOLDEN RULE) */}
          {activeTab === 'first_aid' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="text-sm font-bold text-rose-900">
                    The Critical 15-Minute Rule
                  </h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Immediate wound cleansing with soap and running water for at least <strong>15 continuous minutes</strong> removes up to <strong>90% of the rabies viral load</strong> before it binds to nerve endings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center font-mono">
                    1
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Flush Immediately</h4>
                  <p className="text-[11px] text-slate-500">
                    Hold the bitten or scratched area under gentle running water. Lather copiously with laundry soap or antibacterial soap. Wash for a full 15 minutes.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center font-mono">
                    2
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Apply Antiseptic</h4>
                  <p className="text-[11px] text-slate-500">
                    Disinfect thoroughly with Povidone-Iodine (Betadine) or 70% ethyl/isopropyl alcohol. Leave wound open to air or loosely covered with sterile gauze.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-800 font-bold flex items-center justify-center font-mono">
                    3
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Report & Proceed to Clinic</h4>
                  <p className="text-[11px] text-slate-500">
                    Report straight to the CIT-U Campus Clinic (Admin Bldg) for tetanus toxoid evaluation and anti-rabies vaccine (ARV) referral.
                  </p>
                </div>
              </div>

              {/* Dangerous Folk Practices Warning */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-amber-900 flex items-center gap-2">
                  <span>🚫</span> Strictly Prohibited Harmful Actions (Folk Myths)
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-800 list-disc pl-4">
                  <li><strong>DO NOT suck or squeeze the wound:</strong> Squeezing forces viral particles deeper into capillary beds.</li>
                  <li><strong>DO NOT apply garlic, coins, or battery acid ("Tandok"):</strong> Proven scientifically ineffective and triggers severe secondary sepsis.</li>
                  <li><strong>DO NOT cauterize or burn the tissue:</strong> Damages lymphatic tissue and worsens necrosis.</li>
                  <li><strong>DO NOT kill or discard the animal:</strong> Vital for the 14-day observation window.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: EMERGENCY CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-slate-500">
                Contact these institutional units immediately if bitten, scratched, or if you spot an aggressively disoriented or severely injured animal on campus grounds:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#5C0612] font-bold uppercase tracking-wider block">
                      Primary Campus Care
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">CIT-U Medical Clinic</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ground Floor, Administration Building. Provides immediate wound triage, tetanus toxoid, and official hospital referral slips.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-800">Local Ext: 104 / 105</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-200">
                      Open 7:30 AM - 6:00 PM
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#5C0612] font-bold uppercase tracking-wider block">
                      24/7 Campus Security & Marshals
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">CIT-U Security & Safety Dispatch</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Main Gate 1 & Campus Safety Office. Dispatches officers for immediate animal containment and student escort.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-800">(032) 261-7741 (Gate 1)</span>
                    <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md border border-rose-200">
                      24/7 Active
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
                      City Health Authority
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">Cebu City Animal Bite Center (ABTC)</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Cebu City Health Department / Cebu City Medical Center (CCMC). Provides anti-rabies post-exposure prophylaxis (PEP) vaccines.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-800">(032) 255-7140</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-md">
                      Public ABTC
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
                      Veterinary Care & Rescue
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">MDC Campus Animal Operations</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Task Force Bruno welfare caretakers. Coordinate isolation cages, feeding logs, and partner veterinary clinics.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#5C0612]">taskforcebruno@cit.edu</span>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded-md border border-purple-200">
                      Welfare Lead
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 14-DAY OBSERVATION PROTOCOL */}
          {activeTab === 'quarantine' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#5C0612] text-[#D4AF37] font-mono text-[10px] font-bold">
                    RA 9482 Mandate
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    Why the 14-Day Observation Period is Mandatory
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  Under the <strong>Philippine Anti-Rabies Act of 2007 (RA 9482)</strong> and WHO guidelines, an animal shedding the rabies virus in its saliva will inevitably exhibit unmistakable clinical symptoms and die within 10 to 14 days of viral transmission. 
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                  <h5 className="font-bold text-emerald-900 text-xs">If Animal Remains Healthy after 14 Days:</h5>
                  <p className="text-[11px] text-emerald-800">
                    The animal did <strong>NOT</strong> have communicable rabies at the exact time of the bite or scratch. The victim’s subsequent vaccine series may be adjusted according to physician guidance.
                  </p>
                </div>

                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1">
                  <h5 className="font-bold text-rose-900 text-xs">If Animal Shows Symptoms or Dies:</h5>
                  <p className="text-[11px] text-rose-800">
                    Victim must receive complete Post-Exposure Prophylaxis (PEP) immediately including Rabies Immunoglobulin (RIG). Animal head must be submitted for laboratory fluorescent antibody testing (FAT).
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <h5 className="font-bold text-slate-900 text-xs mb-2">What to Watch for During 14-Day Confinement:</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-medium text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="block text-base mb-1">💧</span>
                    Hydrophobia / Refusing Water
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="block text-base mb-1">🤤</span>
                    Excessive Hypersalivation
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="block text-base mb-1">😡</span>
                    Unprovoked Erratic Aggression
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="block text-base mb-1">🐾</span>
                    Hind Leg Paralysis / Stumbling
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPOSURE CATEGORIES */}
          {activeTab === 'faqs' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="font-bold text-slate-900 text-xs">
                WHO / DOH Rabies Exposure Classification Matrix
              </h4>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs">Category I: Low / No Risk</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      No PEP Required
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Touching or feeding campus pets; licks on intact, unbroken skin without lesions. Wash thoroughly with soap and water.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-900 text-xs">Category II: Moderate Risk</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Vaccine Required
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900">
                    Minor scratches or abrasions without bleeding; nibbling of uncovered skin. Immediate 15-min wash + anti-rabies vaccine regimen.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-rose-900 text-xs">Category III: Severe / High Risk</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      RIG + Vaccine Required
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-900">
                    Single or multiple transdermal bites or scratches; licks on broken skin; contamination of mucous membranes. Requires immediate wash, Rabies Immunoglobulin (RIG), and full vaccine schedule.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 text-center sm:text-left">
            CIT-U Task Force Bruno &bull; Official Emergency Reference
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onNavigateToReport && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToReport();
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>🚨</span>
                <span>Log Urgent Incident Report</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
