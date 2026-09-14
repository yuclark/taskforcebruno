import React, { useState } from 'react';

export default function UserGuideModal({ isOpen, onClose }) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const GUIDE_STEPS = [
    {
      title: 'Collar QR Scanner & Pet Passport',
      badge: 'Step 1 of 4',
      type: 'scanner',
      desc: 'All registered campus companions wear safety collars with engraved QR tags.',
      points: [
        'Open the Collar QR Scanner tab and tap "Start Live Viewfinder" or "Take Photo".',
        'Alternatively, any phone camera scanning the physical collar tag opens the Public Pet Passport directly in your browser without logging in.',
        'View the animal\'s vaccination tier, TNR status, feeding routine, and behavior tips.'
      ]
    },
    {
      title: 'Report Roaming or Injured Animals',
      badge: 'Step 2 of 4',
      type: 'report',
      desc: 'Help campus marshals locate distressed, sick, or unregistered strays quickly.',
      points: [
        'Use the "Report Sighting" tab whenever you encounter an animal needing attention.',
        'Select the Campus Zone (e.g. Library, Canteen, GLE) and provide a landmark description.',
        'If the pet is bleeding, trapped, or sick, check "Urgent Rescue" to alert responders immediately.',
        'Reports are vetted by clinic staff to maintain a verified campus animal ledger.'
      ]
    },
    {
      title: 'Digital Adoption & Rehoming',
      badge: 'Step 3 of 4',
      type: 'adoption',
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
      type: 'volunteer',
      desc: 'Task Force Bruno thrives thanks to compassionate CIT-U students and faculty.',
      points: [
        'Check the "Support & Action" tab for active food and medicine wishlists.',
        'Drop physical kibble or medical donations at the Main Gate Security Office 24/7.',
        'Sign up as a student volunteer for morning feeding patrols or TNR clinic assistance.'
      ]
    }
  ];

  const renderStepIcon = (type) => {
    switch (type) {
      case 'scanner':
        return (
          <svg className="w-6 h-6 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
        );
      case 'report':
        return (
          <svg className="w-6 h-6 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        );
      case 'adoption':
        return (
          <svg className="w-6 h-6 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        );
      case 'volunteer':
        return (
          <svg className="w-6 h-6 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-left">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up text-xs text-slate-700">
        
        {/* Modal Header */}
        <div className="bg-[#5C0612] text-white p-5 flex items-center justify-between border-b-4 border-[#D4AF37]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#D4AF37]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
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
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {renderStepIcon(GUIDE_STEPS[activeStep].type)}
            </div>
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
                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono">
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
              Got it, Explore System
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
