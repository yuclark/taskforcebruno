import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Box,
  Cat,
  CheckCircle2,
  Clock,
  Cross,
  Dog,
  Lock,
  MapPin,
  Package,
  Shield,
  Tag,
  Users,
  Utensils,
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../lib/api';
import {
  ID_PATTERN,
  PHONE_PATTERN,
  formatStudentIdInput,
} from '../lib/auth';

function resolveUserIdentity(session) {
  let name = session?.full_name || '';
  if (!name && (session?.first_name || session?.last_name)) {
    name = `${session.first_name || ''} ${session.last_name || ''}`.trim();
  }

  let studentId = session?.student_id || session?.custom_id || session?.user_id || '';
  if (studentId && !ID_PATTERN.test(studentId)) {
    studentId = '';
  }

  const emailKey = (session?.email || '').trim().toLowerCase();
  if (!name && emailKey) {
    const userPart = emailKey.split('@')[0];
    const segments = userPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1));
    name = segments.join(' ').trim();
  }

  return { name, studentId };
}

const DEFAULT_WISHLIST_ITEMS = [
  {
    name: 'Cat Kibble / Dry Food',
    tier: 'Urgent',
    desc: 'Adult cat maintenance or mother & kitten formula',
    icon: Cat,
    color: 'text-amber-700',
  },
  {
    name: 'Dog Kibble / Dry Food',
    tier: 'Urgent',
    desc: 'All-breed dog maintenance kibble for campus canine companions',
    icon: Dog,
    color: 'text-indigo-700',
  },
  {
    name: 'Canned Wet Recovery Food',
    tier: 'High',
    desc: 'Chicken/tuna loaf for sick, recovering, or post-surgery pets',
    icon: Utensils,
    color: 'text-rose-700',
  },
  {
    name: 'Antiseptic & Wound Care',
    tier: 'High',
    desc: 'Povidone-iodine (Betadine), sterile gauze, medical tape, cotton',
    icon: Cross,
    color: 'text-emerald-700',
  },
  {
    name: 'Anti-Flea & Tick Treatment',
    tier: 'Moderate',
    desc: 'Topical drops (Frontline/NexGard) or antiparasitic pet soaps',
    icon: Shield,
    color: 'text-cyan-700',
  },
  {
    name: 'Clumping Cat Litter',
    tier: 'Moderate',
    desc: 'Bentonite or tofu cat litter for clinic and observation crates',
    icon: Box,
    color: 'text-amber-800',
  },
  {
    name: 'Reflective Safety Collars',
    tier: 'Ongoing',
    desc: 'Breakaway safety collars for tagging registered campus companions',
    icon: Tag,
    color: 'text-purple-700',
  },
];

const DROP_OFF_POINTS = [
  {
    location: 'CIT-U Main Gate Security Post',
    hours: 'Open 24 Hours / 7 Days a week',
    instructions:
      'Label package with "ATTN: Task Force Bruno Pet Welfare" and hand over to on-duty safety personnel.',
  },
  {
    location: 'GLE Building — MDC Office / Campus Clinic',
    hours: 'Monday – Friday: 8:00 AM – 5:00 PM',
    instructions:
      'Hand directly to the animal welfare coordinator or clinic nurse on duty.',
  },
];

export default function SupportAndVolunteers({ session }) {
  const initialIdentity = resolveUserIdentity(session);
  const hasVerifiedName = Boolean(initialIdentity.name);
  const hasVerifiedStudentId = ID_PATTERN.test(initialIdentity.studentId);

  const [volunteerForm, setVolunteerForm] = useState(() => ({
    name: initialIdentity.name,
    studentId: initialIdentity.studentId,
    contactNum: '',
    program: '',
    role: 'Feeding Patrol',
    availability: '',
    notes: '',
  }));

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [myApplications, setMyApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const [lowStockNeeds, setLowStockNeeds] = useState([]);

  const fetchSupportData = useCallback(async (signal) => {
    setLoadingApps(true);
    const [volRes, invRes] = await Promise.all([
      apiGet('/volunteers/', { signal }),
      apiGet('/inventory/', { signal }),
    ]);
    if (signal?.aborted) return;

    if (volRes.ok && Array.isArray(volRes.data)) {
      setMyApplications(volRes.data);
    }

    if (invRes.ok && Array.isArray(invRes.data)) {
      const lowItems = invRes.data
        .filter((item) => Number(item.quantity || 0) <= Number(item.min_threshold || 10))
        .map((item) => ({
          id: item.item_id,
          name: item.item_name,
          category: item.category || 'Supplies',
          quantity: Number(item.quantity || 0),
          unit: item.unit || 'pcs',
          threshold: Number(item.min_threshold || 10),
          tier: Number(item.quantity || 0) === 0 ? 'Out of Stock' : 'Low Stock',
        }));
      setLowStockNeeds(lowItems);
    }

    setLoadingApps(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const [volRes, invRes] = await Promise.all([
        apiGet('/volunteers/', { signal: controller.signal }),
        apiGet('/inventory/', { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;

      if (volRes.ok && Array.isArray(volRes.data)) {
        setMyApplications(volRes.data);
      }

      if (invRes.ok && Array.isArray(invRes.data)) {
        const lowItems = invRes.data
          .filter((item) => Number(item.quantity || 0) <= Number(item.min_threshold || 10))
          .map((item) => ({
            id: item.item_id,
            name: item.item_name,
            category: item.category || 'Supplies',
            quantity: Number(item.quantity || 0),
            unit: item.unit || 'pcs',
            threshold: Number(item.min_threshold || 10),
            tier: Number(item.quantity || 0) === 0 ? 'Out of Stock' : 'Low Stock',
          }));
        setLowStockNeeds(lowItems);
      }

      setLoadingApps(false);
    };
    load();
    return () => controller.abort();
  }, []);

  const handleStudentIdChange = (e) => {
    setVolunteerForm((prev) => ({
      ...prev,
      studentId: formatStudentIdInput(e.target.value),
    }));
  };

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    const trimmedName = volunteerForm.name.trim();
    const trimmedId = volunteerForm.studentId.trim();
    const trimmedContact = volunteerForm.contactNum.trim().replace(/[-\s]/g, '');
    const trimmedProgram = volunteerForm.program.trim();
    const trimmedAvailability = volunteerForm.availability.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please provide your full name.');
      return;
    }
    if (!trimmedId || !ID_PATTERN.test(trimmedId)) {
      setError('Student ID must follow CIT-U format XX-XXXX-XXX (e.g., 22-4102-184).');
      return;
    }
    if (!trimmedContact || !PHONE_PATTERN.test(trimmedContact)) {
      setError('Please enter a valid Philippine mobile number (e.g., 09171234567).');
      return;
    }
    if (!trimmedProgram || trimmedProgram.length < 2) {
      setError('Please enter your department or degree program (e.g., BSIT / CCS).');
      return;
    }
    if (!trimmedAvailability || trimmedAvailability.length < 5) {
      setError('Please describe your general availability (e.g., MWF after 4:00 PM).');
      return;
    }

    setSubmitting(true);
    const res = await apiPost('/volunteers/', {
      full_name: trimmedName,
      student_id: trimmedId,
      contact_number: volunteerForm.contactNum.trim(),
      program: trimmedProgram,
      role: volunteerForm.role,
      availability: trimmedAvailability,
      notes: volunteerForm.notes.trim(),
    });
    setSubmitting(false);

    if (res.ok) {
      setSubmitted(true);
      await fetchSupportData();
    } else {
      setError(res.error || 'Unable to submit volunteer application. Please try again.');
    }
  };

  const handleWithdrawApplication = async (appId) => {
    if (withdrawingId) return;
    setWithdrawingId(appId);
    const res = await apiPut(`/volunteers/${encodeURIComponent(appId)}/`, { status: 'Cancelled' });
    setWithdrawingId(null);
    if (res.ok) {
      await fetchSupportData();
    } else {
      setError(res.error || 'Unable to withdraw application.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 font-sans text-xs text-slate-700 pb-10 animate-fade-in text-left">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#5C0612]">
              Community Advocacy &amp; Support
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Support Task Force Bruno
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Task Force Bruno is a volunteer-led CIT-U initiative supporting daily feeding, immunization, TNR sterilization, and rescue care for campus animals.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0 font-mono text-[10px] font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-700" />
            100% Volunteer Driven
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Live Clinic Inventory Sync
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left 7 Cols: Live Wishlist & Donations */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#5C0612]" />
                  Needed Supplies &amp; Food Wishlist
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Physical donations go directly to CIT-U feeding stations and clinic care.
                </p>
              </div>
              <span className="font-mono text-[10px] bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-bold shrink-0">
                {lowStockNeeds.length > 0 ? `${lowStockNeeds.length} Live Shortages` : 'Open Needs'}
              </span>
            </div>

            {/* Live Low-Stock Needs Pulled From Clinic Inventory */}
            {lowStockNeeds.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Priority Clinic Shortages (Live Inventory)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {lowStockNeeds.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white border border-rose-200/80 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-xs leading-snug break-words">{item.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.category} &bull; Only{' '}
                          <strong className="text-rose-700">
                            {item.quantity} {item.unit}
                          </strong>{' '}
                          left
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-mono font-bold uppercase shrink-0 mt-0.5">
                        {item.tier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_WISHLIST_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors flex items-start gap-3"
                  >
                    <div className="shrink-0 p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-bold text-slate-800 text-xs leading-snug">{item.name}</h4>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                            item.tier === 'Urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : item.tier === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase font-mono tracking-wider">
                Campus Drop-off Locations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DROP_OFF_POINTS.map((dp) => (
                  <div
                    key={dp.location}
                    className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-[#5C0612] shrink-0" />
                      <span>{dp.location}</span>
                    </div>
                    <p className="font-mono text-[10px] text-amber-800 font-medium">{dp.hours}</p>
                    <p className="text-[11px] text-slate-600 leading-snug pt-0.5">{dp.instructions}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Veterinary Fund Card */}
          <div className="bg-gradient-to-br from-[#5C0612] to-[#3B030B] text-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg border-2 border-[#D4AF37]/50 relative overflow-hidden space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold block">
                  Veterinary Care &amp; Emergency Fund
                </span>
                <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                  Community Donation Account
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white font-mono text-[10px] font-bold border border-white/20 shrink-0">
                Verified MDC Channel
              </span>
            </div>

            <p className="text-stone-200 text-xs leading-relaxed max-w-xl">
              Financial donations directly fund TNR sterilization surgeries, annual anti-rabies vaccinations, wound treatments, and emergency hospitalization for injured campus animals.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase block font-semibold">
                  GCash Care Account
                </span>
                <p className="font-mono text-base font-black tracking-wider text-white">0917-849-2810</p>
                <p className="text-[11px] text-stone-300">Task Force Bruno / MDC Coordinator</p>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase block font-semibold">
                  Receipts &amp; Inquiries
                </span>
                <p className="font-sans text-xs font-bold text-white">taskforcebruno@cit.edu</p>
                <p className="text-[11px] text-stone-300">Send transfer screenshots for official acknowledgment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Volunteer Sign-up & My Applications */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5C0612]" />
                <h3 className="font-bold text-slate-900 text-sm">Join the Volunteer Team</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Applications are synced directly to the CIT-U MDC Staff portal for review.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-emerald-900 text-sm">Volunteer Application Saved</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Your application is now in the MDC Staff review queue. Track its status below or check your CIT-U email for updates.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    const resetId = resolveUserIdentity(session);
                    setVolunteerForm({
                      name: resetId.name,
                      studentId: resetId.studentId,
                      contactNum: '',
                      program: '',
                      role: 'Feeding Patrol',
                      availability: '',
                      notes: '',
                    });
                  }}
                  className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Apply for Another Role
                </button>
              </div>
            ) : (
              <form onSubmit={handleVolunteerSubmit} className="space-y-3.5">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                    {error}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase text-slate-600">
                      Full Name *
                    </label>
                    {hasVerifiedName && (
                      <span className="text-[9px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        Verified Profile
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    readOnly={hasVerifiedName}
                    required
                    placeholder="e.g. Juan Dela Cruz"
                    value={volunteerForm.name}
                    onChange={(e) => setVolunteerForm((prev) => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold text-base sm:text-xs focus:outline-none ${
                      hasVerifiedName
                        ? 'bg-slate-100 cursor-not-allowed select-none'
                        : 'bg-slate-50 focus:bg-white'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-600">
                        Student ID *
                      </label>
                      {hasVerifiedStudentId && (
                        <span className="text-[9px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      readOnly={hasVerifiedStudentId}
                      required
                      placeholder="XX-XXXX-XXX"
                      value={volunteerForm.studentId}
                      onChange={handleStudentIdChange}
                      className={`w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-slate-700 font-bold text-base sm:text-xs focus:outline-none ${
                        hasVerifiedStudentId
                          ? 'bg-slate-100 cursor-not-allowed select-none'
                          : 'bg-slate-50 focus:bg-white'
                      }`}
                    />
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                      Format: 22-4102-184
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="09XXXXXXXXX"
                      value={volunteerForm.contactNum}
                      onChange={(e) => setVolunteerForm((prev) => ({ ...prev, contactNum: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white font-mono text-base sm:text-xs"
                    />
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                      11-digit PH mobile
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Department / Degree Program *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BS Information Technology / CCS"
                    value={volunteerForm.program}
                    onChange={(e) => setVolunteerForm((prev) => ({ ...prev, program: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-base sm:text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Preferred Volunteer Role *
                  </label>
                  <select
                    value={volunteerForm.role}
                    onChange={(e) => setVolunteerForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-base sm:text-xs font-semibold text-slate-800"
                  >
                    <option value="Feeding Patrol">Campus Daily Feeding Patrol</option>
                    <option value="Clinic Assistant">Clinic &amp; TNR Recovery Assistant</option>
                    <option value="Rescue Marshal">Emergency Sighting &amp; Rescue Marshal</option>
                    <option value="Media & Photography">Pet Photography &amp; Adoption Content</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Availability / Free Schedule *
                  </label>
                  <textarea
                    rows="2"
                    required
                    placeholder="e.g. MWF after 4:00 PM, or Saturday mornings"
                    value={volunteerForm.availability}
                    onChange={(e) => setVolunteerForm((prev) => ({ ...prev, availability: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-base sm:text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#5C0612] hover:bg-[#720817] disabled:opacity-60 text-white font-bold rounded-xl border-b-2 border-[#D4AF37] shadow-sm transition-all text-xs uppercase tracking-wider"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Volunteer Application'}
                </button>
              </form>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-400 font-mono">
              Coordinated by Task Force Bruno &amp; CIT-U Medical &amp; Dental Clinic
            </div>
          </div>

          {/* Applicant Self-Service Volunteer Status Tracker */}
          {!loadingApps && myApplications.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#5C0612]" />
                  My Volunteer Applications ({myApplications.length})
                </span>
              </div>

              <div className="space-y-2.5">
                {myApplications.map((app) => {
                  const st = app.status || 'Pending';
                  return (
                    <div
                      key={app.application_id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs">{app.role}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{app.availability}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            st === 'Approved' || st === 'Active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : st === 'Declined' || st === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {st}
                        </span>
                        {st === 'Pending' && (
                          <button
                            type="button"
                            disabled={withdrawingId === app.application_id}
                            onClick={() => handleWithdrawApplication(app.application_id)}
                            className="text-[10px] font-semibold text-rose-600 hover:underline disabled:opacity-50"
                          >
                            {withdrawingId === app.application_id ? 'Withdrawing...' : 'Withdraw'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
