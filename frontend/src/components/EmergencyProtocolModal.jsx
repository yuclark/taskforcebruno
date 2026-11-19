import { useState } from 'react';
import {
  ShieldAlert,
  HeartPulse,
  PhoneCall,
  Clock,
  HelpCircle,
  AlertTriangle,
  Ban,
  Droplets,
  Activity,
  AlertOctagon,
  Footprints,
  X,
  Siren,
  Stethoscope,
  Building2,
  CheckCircle2
} from 'lucide-react';

export default function EmergencyProtocolModal({ isOpen, onClose, onNavigateToReport }) {
  const [activeTab, setActiveTab] = useState('first_aid'); // 'first_aid' | 'contacts' | 'quarantine' | 'faqs'

  if (!isOpen) return null;

  const tabs = [
    { id: 'first_aid', label: 'First-Aid', Icon: HeartPulse, iconColor: 'text-rose-600' },
    { id: 'contacts', label: 'Hotlines', Icon: PhoneCall, iconColor: 'text-emerald-600' },
    { id: 'quarantine', label: '14-Day Protocol', Icon: Clock, iconColor: 'text-amber-600' },
    { id: 'faqs', label: 'Exposure & FAQs', Icon: HelpCircle, iconColor: 'text-indigo-600' },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-left animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Maroon Institutional Header */}
        <div className="bg-[#5C0612] px-5 sm:px-6 py-4 border-b-2 border-[#D4AF37] flex items-center justify-between gap-3 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                  CIT-U Animal Biosecurity &amp; Public Safety
                </span>
                <span className="bg-rose-500/25 text-rose-100 border border-rose-300/30 text-[9px] font-semibold px-2 py-0.5 rounded-md">
                  RA 9482
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                Emergency Bite, Scratch &amp; Rescue Protocol
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Protocol Guide"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-200 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean 4-Column Tab Navigation (No Horizontal Scrollbar) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 bg-slate-50 px-3 sm:px-5 pt-2 gap-1 select-none shrink-0 text-xs">
          {tabs.map((tab) => {
            const TabIcon = tab.Icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-2.5 font-semibold border-b-2 rounded-t-xl transition-all flex items-center justify-center gap-1.5 text-[11px] sm:text-xs ${
                  isActive
                    ? 'border-[#5C0612] text-[#5C0612] bg-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? tab.iconColor : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-xs leading-relaxed">

          {/* TAB 1: IMMEDIATE FIRST AID */}
          {activeTab === 'first_aid' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">
                    The Critical 15-Minute Rule
                  </h3>
                  <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                    Immediate wound cleansing with soap and running water for at least <strong>15 continuous minutes</strong> removes up to <strong>90% of the rabies viral load</strong> before it binds to nerve endings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Step 1</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Flush Immediately</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Hold the bitten or scratched area under gentle running water. Lather thoroughly with antibacterial or laundry soap for a full 15 minutes.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Step 2</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Apply Antiseptic</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Disinfect with Povidone-Iodine (Betadine) or 70% ethyl/isopropyl alcohol. Leave the wound open to air or loosely covered with sterile gauze.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Step 3</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Report &amp; Proceed to Clinic</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Proceed directly to the CIT-U Campus Clinic (Admin Bldg) for tetanus toxoid evaluation and anti-rabies vaccine (ARV) referral.
                  </p>
                </div>
              </div>

              {/* Prohibited Actions */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Ban className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-amber-950 text-xs">
                    Strictly Prohibited Actions (Unsafe Folk Practices)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[11px] text-amber-900">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <p><strong>Do not suck or squeeze the wound:</strong> Squeezing forces viral particles deeper into capillary beds.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <p><strong>Do not apply garlic, coins, or battery acid (&ldquo;Tandok&rdquo;):</strong> Scientifically ineffective and risks severe secondary sepsis.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <p><strong>Do not cauterize or burn tissue:</strong> Damages lymphatic tissue and worsens wound necrosis.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <p><strong>Do not harm or discard the animal:</strong> Containment is essential for the mandatory 14-day observation period.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMERGENCY CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-slate-500">
                Contact these institutional units immediately if bitten, scratched, or if you encounter an aggressively disoriented or severely injured animal on campus:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-[#5C0612] font-bold uppercase tracking-wider">
                        Primary Campus Care
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">CIT-U Medical Clinic</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ground Floor, Administration Building. Immediate wound triage, tetanus toxoid, and official hospital referral slips.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800">Local Ext: 104 / 105</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-md border border-emerald-200">
                      7:30 AM - 6:00 PM
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-[#5C0612] font-bold uppercase tracking-wider">
                        24/7 Security &amp; Marshals
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">CIT-U Security &amp; Safety Dispatch</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Main Gate 1 &amp; Campus Safety Office. Dispatches officers for immediate animal containment and student escort.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800">(032) 261-7741</span>
                    <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 font-semibold rounded-md border border-rose-200">
                      24/7 Active
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        City Health Authority
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Cebu City Animal Bite Center</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Cebu City Health Department / CCMC. Provides anti-rabies post-exposure prophylaxis (PEP) vaccines.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800">(032) 255-7140</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded-md">
                      Public ABTC
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <HeartPulse className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Veterinary Care &amp; Rescue
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">MDC Campus Animal Operations</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Task Force Bruno welfare caretakers coordinating isolation kennels, feeding logs, and partner clinics.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#5C0612]">taskforcebruno@cit.edu</span>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 font-semibold rounded-md border border-purple-200">
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
                  <span className="px-2 py-0.5 rounded-md bg-[#5C0612] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wide">
                    RA 9482 Mandate
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    Why the 14-Day Observation Period is Mandatory
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  Under the <strong>Philippine Anti-Rabies Act of 2007 (RA 9482)</strong> and WHO guidelines, an animal shedding the rabies virus in its saliva will exhibit clinical symptoms within 10 to 14 days of transmission.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h5 className="font-bold text-xs">If Animal Remains Healthy after 14 Days</h5>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    The animal did <strong>not</strong> have communicable rabies at the time of contact. The victim&apos;s subsequent vaccine series may be adjusted per physician guidance.
                  </p>
                </div>

                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <h5 className="font-bold text-xs">If Animal Shows Symptoms or Dies</h5>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    The victim must complete Post-Exposure Prophylaxis (PEP) immediately, including Rabies Immunoglobulin (RIG), and specimens must be submitted for laboratory FAT testing.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <h5 className="font-bold text-slate-900 text-xs mb-3">Clinical Warning Signs During 14-Day Confinement</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-medium text-[11px]">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <span className="text-slate-700 leading-tight">Hydrophobia / Refusing Water</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-slate-700 leading-tight">Excessive Hypersalivation</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                    <span className="text-slate-700 leading-tight">Unprovoked Erratic Aggression</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Footprints className="w-4 h-4" />
                    </div>
                    <span className="text-slate-700 leading-tight">Hind Leg Paralysis / Stumbling</span>
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
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
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
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
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
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
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
        <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
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
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Siren className="w-4 h-4 shrink-0" />
                <span>Log Urgent Incident Report</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
