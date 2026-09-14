import React, { useState } from 'react';

export default function UserGuideModal({ isOpen, onClose }) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const GUIDE_STEPS = [
    {
      title: 'Collar QR Scanner & Pet Passport',
      badge: 'Step 1 of 4',
      icon: '📷',
      desc: 'All registered campus companions (like Bruno!) wear safety collars with engraved QR tags.',
      points: [
        'Open the Collar QR Scanner tab and tap "Start Live Viewfinder" or "Take Photo".',
        'Alternatively, any phone camera scanning the physical collar tag opens the Public Pet Passport directly in your browser without logging in.',
        'View the animal\'s vaccination tier, TNR status, feeding routine, and behavior tips.'
      ]
    },
    {
      title: 'Report Roaming or Injured Animals',
      badge: 'Step 2 of 4',
      icon: '🚨',
      desc: 'Help campus marshals locate distressed, sick, or unregistered strays quickly.',
      points: [
        'Use the "Report Sighting" tab whenever you encounter an animal needing attention.',
        'Select the Campus Zone (e.g. Library, Canteen, GLE) and provide a landmark description.',
        'If the pet is bleeding, trapped, or sick, check "🚨 Urgent Rescue" to alert responders immediately.',
        'Reports are vetted by clinic staff to maintain a verified campus animal ledger.'
      ]
    },
    {
      title: 'Digital Adoption & Rehoming',
      badge: 'Step 3 of 4',
      icon: '🐾',
      desc: 'Give a rescued campus dog or cat a loving, permanent home.',
      points: [
        'Browse the Adoption Placement Portal to view adoptable pets, bios, and health records.',
        'Fill out the verified adoption application form with complete contact details.',
        'MDC staff will review your living arrangements and schedule a friendly campus meet-and-greet.'
      ]
    },
    {
      title: 'Support, Feeding Patrols & Volunteering',
      badge: 'Step 4 of 4',
      icon: '🥣',
      desc: 'Task Force Bruno thrives thanks to compassionate CIT-U students and faculty.',
      points: [
        'Check the "Support & Action" tab for active food and medicine wishlists.',
        'Drop physical kibble or medical donations at the Main Gate Security Office 24/7.',
        'Sign up as a student volunteer for morning feeding patrols or TNR clinic assistance.'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-left">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up text-xs text-slate-700">
        
        {/* Modal Header */}
        <div className="bg-[#5C0612] text-white p-5 flex items-center justify-between border-b-4 border-[#D4AF37]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-base">
              🧭
            </span>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">
                CIT-U Task Force Bruno
              </span>
              <h3 className="text-sm font-black tracking-tight leading-none">
                Interactive System Navigation Guide
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="flex px-6 pt-4 gap-1.5">
          {GUIDE_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                activeStep === i ? 'bg-[#5C0612]' : activeStep > i ? 'bg-[#D4AF37]' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5C0612] bg-[#5C0612]/10 px-2.5 py-0.5 rounded-full">
              {GUIDE_STEPS[activeStep].badge}
            </span>
            <span className="text-2xl">{GUIDE_STEPS[activeStep].icon}</span>
          </div>

          <div>
            <h4 className="text-base font-black text-slate-900 tracking-tight">
              {GUIDE_STEPS[activeStep].title}
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {GUIDE_STEPS[activeStep].desc}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
            {GUIDE_STEPS[activeStep].points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all uppercase text-[10px]"
          >
            Previous
          </button>

          {activeStep < GUIDE_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep(prev => Math.min(GUIDE_STEPS.length - 1, prev + 1))}
              className="px-5 py-2 bg-[#5C0612] hover:bg-[#720817] text-white rounded-xl font-bold border-b-2 border-[#D4AF37] shadow-sm transition-all uppercase text-[10px]"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-sm transition-all uppercase text-[10px]"
            >
              Got it, Explore System!
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
