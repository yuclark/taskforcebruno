import { useState, useEffect } from 'react';
import { AlertTriangle, Heart, HeartHandshake, QrCode, X } from 'lucide-react';

const GUIDE_STEPS = [
  {
    title: 'Collar QR Scanner & Pet Passport',
    badge: 'Step 1 of 4',
    Icon: QrCode,
    desc: 'All registered campus companions wear safety collars with scannable QR tags.',
    points: [
      'Open the Collar QR Scanner tab and tap "Start Live Viewfinder" or "Take Photo".',
      'Anyone scanning a physical collar tag with their phone camera opens the Public Pet Passport directly—no sign-in needed.',
      'Check vaccination status, TNR sterilization, feeding stations, and temperament notes at a glance.',
    ],
  },
  {
    title: 'Report Roaming or Injured Animals',
    badge: 'Step 2 of 4',
    Icon: AlertTriangle,
    desc: 'Help campus responders locate distressed, injured, or unregistered strays quickly.',
    points: [
      'Open the "Report Sighting" tab whenever you spot an animal needing help.',
      'Pick the nearest CIT-U Campus Zone and add a clear landmark or room reference.',
      'Check "Emergency / Urgent Rescue" if an animal is bleeding, trapped, or in danger for immediate priority alerts.',
      'Verified sightings and urgent alerts appear on the Community Newsfeed for campus awareness.',
    ],
  },
  {
    title: 'Campus Pet Adoption',
    badge: 'Step 3 of 4',
    Icon: Heart,
    desc: 'Give a rescued campus cat or dog a safe, loving home.',
    points: [
      'Browse the Adoption Portal to filter adoptable companions by species and size.',
      'Submit an adoption inquiry with your contact information and living setup.',
      'Track your application status in real time while MDC coordinators review your request.',
    ],
  },
  {
    title: 'Donations & Student Volunteering',
    badge: 'Step 4 of 4',
    Icon: HeartHandshake,
    desc: 'Task Force Bruno relies on caring CIT-U students, faculty, and staff.',
    points: [
      'Visit "Support & Volunteers" to view needed kibble, medical supplies, and drop-off points.',
      'Drop off supplies at the Main Gate Security Post (24/7) or the MDC Office during clinic hours.',
      'Sign up to join campus feeding patrols, rescue coordination, or adoption photography.',
    ],
  },
];

export default function UserGuideModal({ isOpen, onClose }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const step = GUIDE_STEPS[activeStep];
  const StepIcon = step.Icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-guide-title"
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in text-left"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up text-xs text-slate-700"
      >
        {/* Header */}
        <div className="bg-[#5C0612] text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-[#D4AF37] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="Wildcat Welfare Portal Logo"
              className="w-9 h-9 object-contain drop-shadow-md shrink-0 select-none"
            />
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] block font-semibold">
                CIT-U Task Force Bruno
              </span>
              <h3 id="user-guide-title" className="text-sm sm:text-base font-bold tracking-tight truncate">
                Getting Started Guide
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/85 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bars */}
        <div className="flex px-5 sm:px-6 pt-4 gap-1.5 shrink-0">
          {GUIDE_STEPS.map((item, i) => (
            <button
              key={item.title}
              type="button"
              aria-label={`Go to step ${i + 1}: ${item.title}`}
              onClick={() => setActiveStep(i)}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                activeStep === i ? 'bg-[#5C0612]' : activeStep > i ? 'bg-[#D4AF37]' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#5C0612] bg-[#5C0612]/10 px-2.5 py-1 rounded-full">
              {step.badge}
            </span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#5C0612]">
              <StepIcon className="w-5 h-5" />
            </div>
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-900 tracking-tight">{step.title}</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2.5">
            {step.points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono">
                  {idx + 1}
                </span>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:pointer-events-none transition-colors text-xs"
          >
            Previous
          </button>

          {activeStep < GUIDE_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => Math.min(GUIDE_STEPS.length - 1, prev + 1))}
              className="px-5 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white rounded-xl font-semibold border-b-2 border-[#D4AF37] shadow-sm transition-colors text-xs"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold shadow-sm transition-colors text-xs"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
