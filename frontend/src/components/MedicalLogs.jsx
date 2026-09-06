import React, { useState, useEffect } from 'react';

export default function MedicalLogs({ pets = [] }) {
  const [selectedMedicalPetId, setSelectedMedicalPetId] = useState('');
  const [medicalLogs, setMedicalLogs] = useState([]);
  const [vaccineLogs, setVaccineLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Active sub-view tab for clinical logs: 'all', 'clinical', 'quarantine', 'vaccines'
  const [logFilter, setLogFilter] = useState('all');

  // --- REALISTIC CLINICAL STATE MODELS ---
  const [medType, setMedType] = useState('Check-up');
  const [medDate, setMedDate] = useState(new Date().toISOString().split('T')[0]);
  const [medWeight, setMedWeight] = useState('');
  const [medVet, setMedVet] = useState('');

  // Clinical check-up specific
  const [bodyCondition, setBodyCondition] = useState('Ideal (BCS 4-5/9)');
  const [temperature, setTemperature] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medPrescription, setMedPrescription] = useState('');
  const [medFollowup, setMedFollowup] = useState('');

  // Rabies Bite/Scratch Protocol specific (Philippine RA 9482 / Campus Public Safety)
  const [exposureCategory, setExposureCategory] = useState('Category II - Minor scratch/abrasion');
  const [victimType, setVictimType] = useState('CIT-U Student');
  const [incidentLocation, setIncidentLocation] = useState('Wildcat Innovation Labs');
  const [quarantineStatus, setQuarantineStatus] = useState('Active 14-Day Rabies Observation');

  // Vaccine form state
  const [vacName, setVacName] = useState('');
  const [vacDate, setVacDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacNextDue, setVacNextDue] = useState('');
  const [vacLot, setVacLot] = useState('');
  const [vacWeight, setVacWeight] = useState('');
  const [vacAdminBy, setVacAdminBy] = useState('');

  const [formMessage, setFormMessage] = useState({ target: '', type: '', text: '' });

  // Selected pet object
  const activePet = pets.find(p => p.pet_id === selectedMedicalPetId) || pets[0] || null;

  // 1-Click Vaccine Presets for realistic clinical workflows
  const vaccinePresets = [
    { label: 'Anti-Rabies (Annual)', name: 'Anti-Rabies Inactivated Vaccine', dueMonths: 12 },
    { label: 'Canine 5-in-1 (DHPP)', name: 'DHPP 5-in-1 (Distemper, Hepatitis, Parvo, Parainfluenza)', dueMonths: 12 },
    { label: 'Feline 3-in-1 (FVRCP)', name: 'FVRCP 3-in-1 Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia', dueMonths: 12 },
    { label: 'Deworming (Anthelmintic)', name: 'Broad-Spectrum Dewormer (Pyrantel / Praziquantel)', dueMonths: 3 },
    { label: 'Kennel Cough (Bordetella)', name: 'Bordetella Bronchiseptica Inhalation/Injectable', dueMonths: 12 },
  ];

  const applyVaccinePreset = (preset) => {
    setVacName(preset.name);
    const d = new Date(vacDate || new Date());
    d.setMonth(d.getMonth() + preset.dueMonths);
    setVacNextDue(d.toISOString().split('T')[0]);
    if (!vacLot) setVacLot(`LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    if (activePet && activePet.weight && !vacWeight) {
      setVacWeight(activePet.weight.replace(/[^\d.]/g, '') || '');
    }
  };

  // Pre-fill 14-day observation release date when Bite Incident is selected
  const handleTypeChange = (newType) => {
    setMedType(newType);
    setClinicalNotes('');
    setMedPrescription('');
    if (newType === 'Bite Incident' || newType === 'Scratch Incident') {
      const releaseDate = new Date();
      releaseDate.setDate(releaseDate.getDate() + 14);
      setMedFollowup(releaseDate.toISOString().split('T')[0]);
    } else {
      setMedFollowup('');
    }
  };

  const fetchMedicalLogsForTarget = async (id) => {
    if (!id) return;
    setLoadingLogs(true);
    try {
      const medRes = await fetch(`https://taskforcebruno.onrender.com/api/medical/${id}/`);
      const vacRes = await fetch(`https://taskforcebruno.onrender.com/api/vaccinations/${id}/`);
      if (medRes.ok) setMedicalLogs(await medRes.json());
      if (vacRes.ok) setVaccineLogs(await vacRes.json());
    } catch (err) {
      console.error('Error fetching clinical history:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (pets.length > 0 && !selectedMedicalPetId) {
      setSelectedMedicalPetId(pets[0].pet_id);
    }
  }, [pets]);

  useEffect(() => {
    if (selectedMedicalPetId) {
      fetchMedicalLogsForTarget(selectedMedicalPetId);
      setFormMessage({ target: '', type: '', text: '' });
      // Pre-fill pet weight
      const current = pets.find(p => p.pet_id === selectedMedicalPetId);
      if (current && current.weight) {
        const cleanWeight = current.weight.replace(/[^\d.]/g, '');
        setMedWeight(cleanWeight);
        setVacWeight(cleanWeight);
      }
    }
  }, [selectedMedicalPetId]);

  const handleAddMedicalRecord = async (e) => {
    e.preventDefault();
    if (!clinicalNotes.trim()) return;

    // Build realistic veterinary notes string combining clinical parameters
    let compiledNotes = clinicalNotes.trim();
    if (medType === 'Check-up') {
      const vitalsSummary = `[VITALS] Temp: ${temperature || 'Normal'} | BCS: ${bodyCondition}`;
      compiledNotes = `${vitalsSummary}\n${clinicalNotes.trim()}`;
    } else if (medType === 'Bite Incident' || medType === 'Scratch Incident') {
      const protocolSummary = `[INCIDENT TRIAGE] ${exposureCategory} | Victim: ${victimType} | Zone: ${incidentLocation} | Protocol: ${quarantineStatus} (14-Day Mandatory Quarantine)`;
      compiledNotes = `${protocolSummary}\n${clinicalNotes.trim()}`;
    }

    const payload = {
      record_type: medType,
      notes: compiledNotes,
      log_date: medDate,
      medication_prescribed: medPrescription.trim() || 'None / Supportive Care',
      next_followup_date: medFollowup || null,
      weight_at_log: medWeight ? `${medWeight} kg` : 'N/A',
      veterinarian: medVet.trim() || 'MDC Attending Clinician'
    };

    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/medical/${selectedMedicalPetId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setClinicalNotes('');
        setMedPrescription('');
        setTemperature('');
        setFormMessage({ target: 'med', type: 'success', text: 'Clinical examination record committed to patient medical history.' });
        fetchMedicalLogsForTarget(selectedMedicalPetId);
      } else {
        setFormMessage({ target: 'med', type: 'error', text: 'Unable to commit clinical record. Please verify entries.' });
      }
    } catch (err) {
      setFormMessage({ target: 'med', type: 'error', text: 'Network communication failure.' });
    }
  };

  const handleAddVaccine = async (e) => {
    e.preventDefault();
    if (!vacName.trim()) return;

    const payload = {
      vaccine_name: vacName.trim(),
      administered_date: vacDate,
      next_due_date: vacNextDue || null,
      batch_lot_number: vacLot.trim() || 'N/A',
      weight_at_vaccination: vacWeight ? `${vacWeight} kg` : 'N/A',
      administered_by: vacAdminBy.trim() || 'MDC Licensed Staff'
    };

    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/vaccinations/${selectedMedicalPetId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setVacName('');
        setVacNextDue('');
        setVacLot('');
        setVacAdminBy('');
        setFormMessage({ target: 'vac', type: 'success', text: 'Immunization certificate successfully registered.' });
        fetchMedicalLogsForTarget(selectedMedicalPetId);
      } else {
        setFormMessage({ target: 'vac', type: 'error', text: 'Immunization entry rejected by server.' });
      }
    } catch (err) {
      setFormMessage({ target: 'vac', type: 'error', text: 'Database connectivity error.' });
    }
  };

  // Helper to evaluate vaccine due status
  const getVaccineDueBadge = (dueDateStr) => {
    if (!dueDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          BOOSTER OVERDUE ({Math.abs(diffDays)}d ago)
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          BOOSTER DUE SOON ({diffDays}d)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        CURRENT (Due: {dueDateStr})
      </span>
    );
  };

  // Filtered medical records
  const filteredMedicalLogs = medicalLogs.filter(m => {
    if (logFilter === 'all') return true;
    if (logFilter === 'clinical') return m.record_type === 'Check-up' || m.record_type === 'Clinical Treatment';
    if (logFilter === 'quarantine') return m.record_type === 'Bite Incident' || m.record_type === 'Scratch Incident';
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-xs text-slate-700 pb-12">
      
      {/* =========================================================================
          PATIENT SUMMARY BANNER (FULL WIDTH & CONTEXT-RICH)
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Active Patient Identity */}
          <div className="flex items-start sm:items-center gap-4">
            {activePet?.primary_image ? (
              <img
                src={activePet.primary_image}
                alt={activePet.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0 font-mono font-bold text-xs">
                <svg className="w-8 h-8 text-slate-300 mb-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                NO PIC
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  {activePet?.name || 'No Patient Selected'}
                </h2>
                <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                  ID: {activePet?.pet_id || 'N/A'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                  activePet?.vaccination_status === 'Fully Vaccinated' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : activePet?.vaccination_status === 'Partially Vaccinated'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {activePet?.vaccination_status || 'Unvaccinated'}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  {activePet?.spayed_neutered ? 'TNR Sterilized' : 'Intact'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px] font-medium pt-0.5">
                <span>Species: <strong className="text-slate-800">{activePet?.species || 'N/A'} ({activePet?.breed || 'Domestic'})</strong></span>
                <span>Sex: <strong className="text-slate-800">{activePet?.gender || 'N/A'}</strong></span>
                <span>Weight: <strong className="text-slate-800">{activePet?.weight || 'N/A'}</strong></span>
                <span>Colony Zone: <strong className="text-slate-800">{activePet?.found_near || 'Campus Ground'}</strong></span>
              </div>
            </div>
          </div>

          {/* Patient Selector Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Select Clinical Patient</span>
              <span className="text-xs text-slate-600 font-medium">Switching loads complete history</span>
            </div>
            <select
              value={selectedMedicalPetId}
              onChange={(e) => setSelectedMedicalPetId(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl font-medium text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#5C0612]/20 shadow-sm transition-all"
            >
              {pets.map(p => (
                <option key={p.pet_id} value={p.pet_id}>
                  {p.name} [{p.species}] — {p.pet_id}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Quick Clinical Metrics Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-100 text-slate-600">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Total Clinical Logs</span>
            <span className="text-sm font-black text-slate-900 font-mono">{medicalLogs.length} Records</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Vaccine Inoculations</span>
            <span className="text-sm font-black text-slate-900 font-mono">{vaccineLogs.length} Doses</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Rabies Incidents</span>
            <span className="text-sm font-black text-slate-900 font-mono">
              {medicalLogs.filter(m => m.record_type?.includes('Incident')).length} Tracked
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Last Recorded Exam</span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              {medicalLogs[0]?.log_date || vaccineLogs[0]?.administered_date || 'No recent log'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN CLINICAL WORKSPACE: TWO COLUMN BALANCED GRID (7/5 RATIO)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─────────────────────────────────────────────────────────────────────────
            LEFT COLUMN (7 COLS): CLINICAL CARE, WELLNESS & INCIDENT PROTOCOLS
           ───────────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Clinical Log Form Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm text-left">
            <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  Record Clinical Consultation & Examination
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Document routine wellness exams, illness diagnoses, or campus bite/scratch quarantine logs.</p>
              </div>

              {/* Case Type Segmented Selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl font-mono text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => handleTypeChange('Check-up')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${medType === 'Check-up' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Wellness
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('Clinical Treatment')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${medType === 'Clinical Treatment' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Treatment
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('Bite Incident')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${medType === 'Bite Incident' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-rose-600'}`}
                >
                  Bite Protocol
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('Scratch Incident')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${medType === 'Scratch Incident' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-700'}`}
                >
                  Scratch
                </button>
              </div>
            </div>

            {formMessage.target === 'med' && (
              <div className={`p-3 border text-xs rounded-xl mb-4 font-medium ${
                formMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {formMessage.text}
              </div>
            )}

            <form onSubmit={handleAddMedicalRecord} className="space-y-4">
              
              {/* Vitals / Session Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Exam Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={medDate}
                    onChange={(e) => setMedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Patient Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 4.25"
                    value={medWeight}
                    onChange={(e) => setMedWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Attending Clinician *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Santos / Clinician"
                    value={medVet}
                    onChange={(e) => setMedVet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* SPECIFIC WORKFLOW FIELDS: WELLNESS CHECK-UP */}
              {medType === 'Check-up' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                  <span className="text-[10px] font-bold text-slate-600 font-mono uppercase tracking-wider block">
                    Routine Physical Vitals Assessment
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Body Condition Score (BCS)</label>
                      <select
                        value={bodyCondition}
                        onChange={(e) => setBodyCondition(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Under ideal (BCS 1-3/9)">Under ideal (BCS 1-3/9 - Thin/Emaciated)</option>
                        <option value="Ideal (BCS 4-5/9)">Ideal (BCS 4-5/9 - Healthy weight)</option>
                        <option value="Over ideal (BCS 6-7/9)">Over ideal (BCS 6-7/9 - Overweight)</option>
                        <option value="Obese (BCS 8-9/9)">Obese (BCS 8-9/9 - Severely Overweight)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Rectal Temperature (°C)</label>
                      <input
                        type="text"
                        placeholder="e.g. 38.4 °C (Normal range 38-39.2)"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SPECIFIC WORKFLOW FIELDS: BITE OR SCRATCH INCIDENT PROTOCOL */}
              {(medType === 'Bite Incident' || medType === 'Scratch Incident') && (
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3 text-rose-900">
                  <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
                    <span className="text-[10px] font-black text-rose-800 font-mono uppercase tracking-wider">
                      Campus Rabies Control Protocol (Philippine RA 9482)
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-mono">
                      MANDATORY 14-DAY OBSERVATION
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-rose-700 uppercase mb-1">Exposure Classification</label>
                      <select
                        value={exposureCategory}
                        onChange={(e) => setExposureCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs"
                      >
                        <option value="Category I - Touching/feeding, intact skin">Category I: Intact skin contact (Low risk)</option>
                        <option value="Category II - Minor scratch/abrasion without bleeding">Category II: Minor scratch without bleeding (Moderate risk)</option>
                        <option value="Category III - Transdermal bite, scratch, or saliva on mucosa">Category III: Transdermal bite / bleeding (High risk - Immediate PEP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-rose-700 uppercase mb-1">Victim Demographics</label>
                      <select
                        value={victimType}
                        onChange={(e) => setVictimType(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs"
                      >
                        <option value="CIT-U Student">CIT-U Student</option>
                        <option value="CIT-U Faculty / Academic Staff">CIT-U Faculty / Academic Staff</option>
                        <option value="Campus Maintenance / Security Staff">Campus Maintenance / Security Staff</option>
                        <option value="Campus Visitor / Guest">Campus Visitor / Guest</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-rose-700 uppercase mb-1">Campus Incident Location</label>
                      <input
                        type="text"
                        value={incidentLocation}
                        onChange={(e) => setIncidentLocation(e.target.value)}
                        placeholder="e.g. Near NGE Canteen walkway"
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-rose-700 uppercase mb-1">Quarantine Status</label>
                      <select
                        value={quarantineStatus}
                        onChange={(e) => setQuarantineStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="Active 14-Day Rabies Observation">Active 14-Day Rabies Observation</option>
                        <option value="Quarantine Completed - Cleared Healthy">Quarantine Completed - Cleared Healthy</option>
                        <option value="Isolated at Quarantine Kennel">Isolated at Quarantine Kennel</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Clinical Notes Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {medType === 'Check-up' ? 'Clinical Findings & Physical Observations *' :
                   medType === 'Clinical Treatment' ? 'Diagnostic Assessment & Procedures Performed *' :
                   'Incident Assessment & Immediate Wound Management *'}
                </label>
                <textarea
                  rows="3"
                  required
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder={
                    medType === 'Check-up' ? "Describe physical condition (coat, eyes, ears, dentition, hydration status, behavior)..." :
                    medType === 'Clinical Treatment' ? "Specify primary diagnosis, symptoms presented, clinical procedures performed..." :
                    "Document wound severity, immediate sterilization/flushing protocol, victim referral to animal bite center..."
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 leading-relaxed resize-none"
                />
              </div>

              {/* Medication Prescribed and Follow-up Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Prescribed Medication / Prophylaxis
                  </label>
                  <input
                    type="text"
                    value={medPrescription}
                    onChange={(e) => setMedPrescription(e.target.value)}
                    placeholder="e.g. Amoxicillin 250mg BID for 7 days, Antiseptic wash"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {medType === 'Bite Incident' || medType === 'Scratch Incident' ? 'Quarantine Clearance Date (Day 14)' : 'Next Follow-up Recheck Date'}
                  </label>
                  <input
                    type="date"
                    value={medFollowup}
                    onChange={(e) => setMedFollowup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5C0612] hover:bg-[#42040B] text-white font-bold rounded-xl border-b-2 border-[#D4AF37] shadow-sm transition-all text-xs uppercase tracking-wider flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Commit Clinical Record
                </button>
              </div>

            </form>
          </div>

          {/* Clinical Records Timeline History */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Clinical Medical History Timeline</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Chronological record of examinations, interventions, and quarantine releases.</p>
              </div>

              {/* Filter Pills */}
              <div className="flex bg-slate-100 p-1 rounded-xl font-mono text-[10px] font-semibold select-none">
                <button
                  onClick={() => setLogFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${logFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  All ({medicalLogs.length})
                </button>
                <button
                  onClick={() => setLogFilter('clinical')}
                  className={`px-3 py-1 rounded-lg transition-all ${logFilter === 'clinical' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Exams & Rx
                </button>
                <button
                  onClick={() => setLogFilter('quarantine')}
                  className={`px-3 py-1 rounded-lg transition-all ${logFilter === 'quarantine' ? 'bg-white text-rose-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Rabies Incidents
                </button>
              </div>
            </div>

            {loadingLogs ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                Retrieving patient medical timeline...
              </div>
            ) : filteredMedicalLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                No clinical records found for the selected criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMedicalLogs.map((log) => {
                  const isIncident = log.record_type === 'Bite Incident' || log.record_type === 'Scratch Incident';
                  return (
                    <div
                      key={log.record_id}
                      className={`p-4 rounded-2xl border transition-all hover:shadow-md ${
                        log.record_type === 'Bite Incident'
                          ? 'bg-rose-50/40 border-rose-200 border-l-4 border-l-rose-600'
                          : log.record_type === 'Scratch Incident'
                          ? 'bg-amber-50/40 border-amber-200 border-l-4 border-l-amber-500'
                          : 'bg-white border-slate-200 border-l-4 border-l-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider ${
                            log.record_type === 'Bite Incident'
                              ? 'bg-rose-100 text-rose-800'
                              : log.record_type === 'Scratch Incident'
                              ? 'bg-amber-100 text-amber-800'
                              : log.record_type === 'Clinical Treatment'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {log.record_type}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            Recorded on {log.log_date}
                          </span>
                        </div>

                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-3">
                          {log.weight_at_log && log.weight_at_log !== 'N/A' && (
                            <span>Weight: <strong className="text-slate-800">{log.weight_at_log}</strong></span>
                          )}
                          <span>Clinician: <strong className="text-slate-800">{log.veterinarian || 'Staff Vet'}</strong></span>
                        </div>
                      </div>

                      {/* Clinical Content */}
                      <div className="py-2.5 space-y-2">
                        <p className="text-slate-800 text-xs whitespace-pre-line leading-relaxed font-sans">
                          {log.notes}
                        </p>

                        {log.medication_prescribed && log.medication_prescribed !== 'None' && (
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2 text-[11px]">
                            <span className="font-bold text-slate-600 font-mono text-[10px] uppercase shrink-0 pt-0.5">
                              Rx Treatment:
                            </span>
                            <span className="text-slate-800 font-medium">
                              {log.medication_prescribed}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Follow-up / Clearance Notice */}
                      {log.next_followup_date && (
                        <div className={`mt-2 pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-[10px] ${
                          isIncident ? 'text-rose-700' : 'text-blue-700'
                        }`}>
                          <span className="font-bold">
                            {isIncident ? 'MANDATORY QUARANTINE RELEASE / RECHECK DATE:' : 'SCHEDULED RECHECK DATE:'}
                          </span>
                          <span className="font-black px-2 py-0.5 rounded bg-white border border-slate-200 shadow-sm">
                            {log.next_followup_date}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ─────────────────────────────────────────────────────────────────────────
            RIGHT COLUMN (5 COLS): IMMUNIZATION & PREVENTATIVE HEALTH REGISTRY
           ───────────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Record Vaccination Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm text-left space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <svg className="w-4 h-4 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                Record Vaccination / Immunization
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Register licensed biologicals, vaccine lot numbers, and auto-scheduled boosters.</p>
            </div>

            {/* Quick 1-Click Clinical Presets */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block mb-2">
                Quick Biological Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {vaccinePresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyVaccinePreset(preset)}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 hover:text-slate-900 transition-colors text-left"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {formMessage.target === 'vac' && (
              <div className={`p-3 border text-xs rounded-xl font-medium ${
                formMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {formMessage.text}
              </div>
            )}

            <form onSubmit={handleAddVaccine} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Vaccine / Biological Name *
                </label>
                <input
                  type="text"
                  required
                  value={vacName}
                  onChange={(e) => setVacName(e.target.value)}
                  placeholder="e.g. Anti-Rabies Inactivated, DHPP 5-in-1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Administered Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={vacDate}
                    onChange={(e) => setVacDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Next Booster Due Date
                  </label>
                  <input
                    type="date"
                    value={vacNextDue}
                    onChange={(e) => setVacNextDue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Batch / Lot Number
                  </label>
                  <input
                    type="text"
                    value={vacLot}
                    onChange={(e) => setVacLot(e.target.value)}
                    placeholder="e.g. LOT-2024-B882"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Weight at Inoculation (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={vacWeight}
                    onChange={(e) => setVacWeight(e.target.value)}
                    placeholder="e.g. 4.2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Administering Staff / Licensed Veterinarian
                </label>
                <input
                  type="text"
                  value={vacAdminBy}
                  onChange={(e) => setVacAdminBy(e.target.value)}
                  placeholder="e.g. MDC Veterinarian / Clinician"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-sm transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Register Immunization Dose
              </button>
            </form>
          </div>

          {/* Immunization Registry Ledger */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm text-left">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Active Immunization Registry</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Verified certificates and active biological protection status.</p>
            </div>

            {loadingLogs ? (
              <div className="py-8 text-center text-slate-400 font-mono text-xs">
                Synchronizing immunization ledgers...
              </div>
            ) : vaccineLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                No verified vaccinations on file for this patient.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {vaccineLogs.map((vac) => (
                  <div
                    key={vac.log_id}
                    className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl hover:bg-white transition-all space-y-2 shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{vac.vaccine_name}</h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          Administered: {vac.administered_date}
                        </span>
                      </div>
                      {getVaccineDueBadge(vac.next_due_date)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/50">
                      <div>Lot: <strong className="text-slate-700">{vac.batch_lot_number || 'N/A'}</strong></div>
                      <div>Weight: <strong className="text-slate-700">{vac.weight_at_vaccination || 'N/A'}</strong></div>
                      <div className="col-span-2">
                        Clinician: <strong className="text-slate-700 font-sans">{vac.administered_by || 'MDC Staff'}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}