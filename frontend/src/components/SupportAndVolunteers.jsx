import React, { useState } from 'react';

export default function SupportAndVolunteers({ session }) {
  const [volunteerForm, setVolunteerForm] = useState({
    name: '',
    studentId: '',
    contactNum: '',
    program: '',
    role: 'Feeding Patrol',
    availability: '',
    notes: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const WISHLIST_ITEMS = [
    { 
      name: 'Cat Kibble / Dry Food', 
      tier: 'Urgent', 
      desc: 'Adult cat maintenance or mother & kitten formula',
      category: 'Nutrition'
    },
    { 
      name: 'Dog Kibble / Dry Food', 
      tier: 'Urgent', 
      desc: 'All-breed dog maintenance kibble for campus canine companions',
      category: 'Nutrition'
    },
    { 
      name: 'Canned Wet Recovery Food', 
      tier: 'High', 
      desc: 'Chicken/tuna loaf for sick, recovering, or post-surgery pets',
      category: 'Clinical Care'
    },
    { 
      name: 'Antiseptic & Wound Care', 
      tier: 'High', 
      desc: 'Povidone-iodine (Betadine), sterile gauze, medical tape, cotton',
      category: 'First Aid'
    },
    { 
      name: 'Anti-Flea & Tick Treatment', 
      tier: 'Moderate', 
      desc: 'Topical drops (Frontline/NexGard) or antiparasitic dog soaps',
      category: 'Preventive'
    },
    { 
      name: 'Clumping Cat Litter', 
      tier: 'Moderate', 
      desc: 'Bentonite or tofu cat litter for hospital and observation crates',
      category: 'Sanitation'
    },
    { 
      name: 'Reflective Safety Collars', 
      tier: 'Ongoing', 
      desc: 'Breakaway safety collars for tagging registered companions',
      category: 'Tagging'
    },
  ];

  const DROP_OFF_POINTS = [
    {
      location: 'CIT-U Main Gate Security Post',
      hours: 'Open 24 Hours / 7 Days a week',
      instructions: 'Label package with "ATTN: Task Force Bruno Pet Welfare" and deposit with on-duty safety marshals.',
      tag: 'Security Post'
    },
    {
      location: 'MDC Office / Campus Clinic',
      hours: 'Monday – Friday: 8:00 AM – 5:00 PM',
      instructions: 'Student Affairs Complex. Hand directly to the animal welfare officer or nurse on duty.',
      tag: 'Clinic Center'
    }
  ];

  const handleVolunteerSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!volunteerForm.name.trim() || !volunteerForm.contactNum.trim() || !volunteerForm.availability.trim()) {
      setError('Please provide your name, contact number, and general availability.');
      return;
    }

    // Save in localStorage so staff reviewer can screen and approve
    const existing = JSON.parse(localStorage.getItem('tfb_volunteer_applications') || '[]');
    existing.unshift({
      application_id: `VOL-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`,
      full_name: volunteerForm.name.trim(),
      student_id: volunteerForm.studentId.trim() || 'N/A',
      contact_number: volunteerForm.contactNum.trim(),
      program: volunteerForm.program.trim() || 'General Student Body',
      role: volunteerForm.role,
      availability: volunteerForm.availability.trim(),
      email: session?.email || 'student@cit.edu',
      status: 'Pending',
      created_at: new Date().toISOString()
    });
    localStorage.setItem('tfb_volunteer_applications', JSON.stringify(existing));

    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 font-sans text-xs text-slate-700 pb-16 animate-fade-in text-left">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#5C0612]">
              Community Advocacy & Welfare Support
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Support Task Force Bruno
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Task Force Bruno is a volunteer-led campus initiative for the care, nutrition, immunization, and ethical protection of all resident cats, dogs, and rescued companions across CIT-U.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0 font-mono text-[10px] font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            100% Volunteer Driven
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Veterinary Care Funded
          </span>
        </div>
      </div>

      {/* THREE-COLUMN OVERVIEW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 7 COLS: WISHLIST & DONATION CHANNELS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Physical Supplies Wishlist */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Needed Supplies & Nutrition Wishlist</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Physical donations are distributed directly to campus feeding stations.</p>
              </div>
              <span className="font-mono text-[10px] bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-bold">
                Open Requests
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WISHLIST_ITEMS.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors flex items-start gap-3">
                  <div className="shrink-0 p-2 bg-white rounded-xl shadow-xs border border-slate-200 text-[#5C0612]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-slate-800 text-xs truncate">{item.name}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                        item.tier === 'Urgent' 
                          ? 'bg-rose-100 text-rose-800' 
                          : item.tier === 'High' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.tier}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Drop-off stations */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase font-mono tracking-wider">
                Official Campus Drop-off Locations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DROP_OFF_POINTS.map((dp, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <svg className="w-3.5 h-3.5 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <span>{dp.location}</span>
                    </div>
                    <p className="font-mono text-[10px] text-amber-800 font-medium">{dp.hours}</p>
                    <p className="text-[11px] text-slate-600 leading-snug pt-0.5">{dp.instructions}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Official GCash & Direct Veterinary Fund Card */}
          <div className="bg-gradient-to-br from-[#5C0612] to-[#3B030B] text-white p-6 rounded-3xl shadow-lg border-2 border-[#D4AF37]/50 relative overflow-hidden space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold block">
                  Veterinary Care & Emergency Fund
                </span>
                <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                  Official Community Donation Account
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white font-mono text-[10px] font-bold border border-white/20">
                100% Transparent
              </span>
            </div>

            <p className="text-stone-200 text-xs leading-relaxed max-w-xl">
              All financial donations strictly support veterinary clinical procedures: Trap-Neuter-Return (TNR) surgeries, annual anti-rabies vaccinations, antibiotic wound treatments, and emergency hospitalization for injured animals.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase block font-semibold">
                  Official GCash Care Account
                </span>
                <p className="font-mono text-base font-black tracking-wider text-white">0917-849-2810</p>
                <p className="text-[11px] text-stone-300">Account: Task Force Bruno / MDC Coordinator</p>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase block font-semibold">
                  Donation Receipts & Inquiries
                </span>
                <p className="font-sans text-xs font-bold text-white">taskforcebruno@cit.edu</p>
                <p className="text-[11px] text-stone-300">Send screenshots to receive official acknowledgment</p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT 5 COLS: VOLUNTEER SIGN-UP PIPELINE */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              <h3 className="font-bold text-slate-900 text-sm">Join the Volunteer Taskforce</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Help us feed campus pets, conduct welfare checks, or support TNR vaccination missions.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h4 className="font-bold text-emerald-900 text-sm">Volunteer Application Received!</h4>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Thank you for offering your time and care for CIT-U companions. The Task Force Bruno staff committee will review your application and reach out via your CIT-U email.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setVolunteerForm({
                    name: '',
                    studentId: '',
                    contactNum: '',
                    program: '',
                    role: 'Feeding Patrol',
                    availability: '',
                    notes: ''
                  });
                }}
                className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Submit Another Application
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
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Juan Dela Cruz"
                  value={volunteerForm.name}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5C0612]/20 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    placeholder="XX-XXXX-XXX"
                    value={volunteerForm.studentId}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, studentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="09XXXXXXXXX"
                    value={volunteerForm.contactNum}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, contactNum: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Department / Degree Program
                </label>
                <input
                  type="text"
                  placeholder="e.g., BS Information Technology / CEA"
                  value={volunteerForm.program}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, program: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Preferred Volunteer Role *
                </label>
                <select
                  value={volunteerForm.role}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-xs font-semibold text-slate-800"
                >
                  <option value="Feeding Patrol">Campus Daily Feeding Patrol (Morning/Late Afternoon)</option>
                  <option value="Clinic Assistant">Clinic & TNR Surgical Recovery Assistant</option>
                  <option value="Rescue Marshal">Emergency Sighting & Rescue Marshal</option>
                  <option value="Media & Photography">Pet Photography & Adoption Gallery Content</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Availability / Free Schedule *
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g., MWF after 4:00 PM, or Saturday mornings"
                  value={volunteerForm.availability}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, availability: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#5C0612] hover:bg-[#720817] text-white font-bold rounded-xl border-b-2 border-[#D4AF37] shadow-sm transition-all text-xs uppercase tracking-wider"
              >
                Submit Volunteer Application
              </button>
            </form>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-400 font-mono">
            Institutional Clearance: Task Force Bruno Student Guild & CIT-U MDC
          </div>
        </div>

      </div>

    </div>
  );
}
