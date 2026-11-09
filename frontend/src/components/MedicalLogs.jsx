import React, { useState, useEffect } from 'react';

export default function MedicalLogs({ pets = [] }) {
  const [selectedMedicalPetId, setSelectedMedicalPetId] = useState('');
  const [medicalLogs, setMedicalLogs] = useState([]);
  const [vaccineLogs, setVaccineLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Active workspace view: 'patient' (individual consultation) or 'matrix' (campus booster matrix)
  const [workspaceView, setWorkspaceView] = useState('patient');
  const [allVaccinationsMap, setAllVaccinationsMap] = useState({});
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixFilter, setMatrixFilter] = useState('all'); // 'all' | 'urgent' | 'dogs' | 'cats'

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
  const [incidentLocation, setIncidentLocation] = useState('NGE Building Ground');
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

  const fetchAllVaccinations = async () => {
    if (!pets || pets.length === 0) return;
    setLoadingMatrix(true);
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/vaccinations/all/');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const map = {};
          data.forEach(v => {
            if (!map[v.pet_id]) map[v.pet_id] = [];
            map[v.pet_id].push(v);
          });
          setAllVaccinationsMap(map);
          setLoadingMatrix(false);
          return;
        }
      }
      // Fallback: parallel query per pet
      const map = {};
      await Promise.all(pets.map(async (p) => {
        try {
          const r = await fetch(`https://taskforcebruno.onrender.com/api/vaccinations/${p.pet_id}/`);
          if (r.ok) {
            map[p.pet_id] = await r.json();
          }
        } catch {}
      }));
      setAllVaccinationsMap(map);
    } catch (err) {
      console.error('Matrix load error:', err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  useEffect(() => {
    fetchAllVaccinations();
  }, [pets]);

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

    const isBiteOrScratch = medType === 'Bite Incident' || medType === 'Scratch Incident' || medType.includes('Bite') || medType.includes('Scratch');
    let computedQuarantineExpiry = null;
    if (isBiteOrScratch) {
      const baseDate = medDate ? new Date(medDate) : new Date();
      const expiry = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      computedQuarantineExpiry = expiry.toISOString();
    }

    // Build realistic veterinary notes string combining clinical parameters
    let compiledNotes = clinicalNotes.trim();
    if (medType === 'Check-up') {
      const vitalsSummary = `[VITALS] Temp: ${temperature || 'Normal'} | BCS: ${bodyCondition}`;
      compiledNotes = `${vitalsSummary}\n${clinicalNotes.trim()}`;
    } else if (isBiteOrScratch) {
      const protocolSummary = `[INCIDENT TRIAGE] ${exposureCategory} | Victim: ${victimType} | Zone: ${incidentLocation} | Protocol: ${quarantineStatus} (14-Day Mandatory Quarantine)`;
      compiledNotes = `${protocolSummary}\n${clinicalNotes.trim()}`;
    }

    const payload = {
      record_type: medType,
      notes: compiledNotes,
      log_date: medDate,
      medication_prescribed: medPrescription.trim() || 'None / Supportive Care',
      next_followup_date: medFollowup || (computedQuarantineExpiry ? computedQuarantineExpiry.split('T')[0] : null),
      weight_at_log: medWeight ? `${medWeight} kg` : 'N/A',
      veterinarian: medVet.trim() || 'MDC Attending Clinician',
      quarantine_expiry_date: computedQuarantineExpiry,
      is_quarantine: isBiteOrScratch
    };

    const savedSession = JSON.parse(localStorage.getItem('tfb_session') || '{}');
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(savedSession?.access_token ? { 'Authorization': `Bearer ${savedSession.access_token}` } : {})
    };

    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/medical/${selectedMedicalPetId}/`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setClinicalNotes('');
        setMedPrescription('');
        setTemperature('');
        setFormMessage({ target: 'med', type: 'success', text: 'Clinical examination record committed to patient medical history.' });

        // TC-MED-002: Update target pet profile to Quarantine Observation status in database
        if (isBiteOrScratch && selectedMedicalPetId) {
          try {
            await fetch(`https://taskforcebruno.onrender.com/api/pets/${selectedMedicalPetId}/`, {
              method: 'PUT',
              headers: authHeaders,
              body: JSON.stringify({
                status: 'Quarantine / Rabies Observation',
                is_quarantined: true,
                quarantine_expiry_date: computedQuarantineExpiry
              })
            });
          } catch (petErr) {
            console.warn('Could not propagate quarantine status to pet profile:', petErr);
          }
        }

        fetchMedicalLogsForTarget(selectedMedicalPetId);
      } else if (res.status === 403) {
        setFormMessage({ target: 'med', type: 'error', text: 'Access Denied: You do not have permission to perform this action (MDC Personnel Only).' });
      } else {
        const errJson = await res.json().catch(() => ({}));
        setFormMessage({ target: 'med', type: 'error', text: errJson.detail || errJson.error || 'Unable to commit clinical record. Please verify entries.' });
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

    const savedSession = JSON.parse(localStorage.getItem('tfb_session') || '{}');
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(savedSession?.access_token ? { 'Authorization': `Bearer ${savedSession.access_token}` } : {})
    };

    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/vaccinations/${selectedMedicalPetId}/`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setVacName('');
        setVacNextDue('');
        setVacLot('');
        setVacAdminBy('');
        setFormMessage({ target: 'vac', type: 'success', text: 'Immunization certificate successfully registered.' });
        fetchMedicalLogsForTarget(selectedMedicalPetId);
        fetchAllVaccinations();
      } else if (res.status === 403) {
        setFormMessage({ target: 'vac', type: 'error', text: 'Access Denied: You do not have permission to perform this action (MDC Personnel Only).' });
      } else {
        const errJson = await res.json().catch(() => ({}));
        setFormMessage({ target: 'vac', type: 'error', text: errJson.detail || errJson.error || 'Unable to record immunization certificate.' });
      }
    } catch (err) {
      setFormMessage({ target: 'vac', type: 'error', text: 'Network communication failure.' });
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

  // Comprehensive booster health analysis for any pet across the campus
  const getPetBoosterAnalysis = (petId) => {
    const list = allVaccinationsMap[petId] || [];
    if (!list || list.length === 0) {
      return {
        status: 'none',
        label: 'No Booster on Record',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        latestRabies: null,
        rabiesDays: null,
        latestCore: null,
        coreDays: null,
        minDays: null
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rabiesList = list.filter(v => (v.vaccine_name || '').toLowerCase().includes('rabies'));
    rabiesList.sort((a, b) => new Date(b.administered_date || 0) - new Date(a.administered_date || 0));
    const latestRabies = rabiesList[0] || null;

    const coreList = list.filter(v => !(v.vaccine_name || '').toLowerCase().includes('rabies'));
    coreList.sort((a, b) => new Date(b.administered_date || 0) - new Date(a.administered_date || 0));
    const latestCore = coreList[0] || null;

    let minDays = Infinity;
    let rabiesDays = null;
    if (latestRabies && latestRabies.next_due_date) {
      const d = new Date(latestRabies.next_due_date);
      d.setHours(0, 0, 0, 0);
      rabiesDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (rabiesDays < minDays) minDays = rabiesDays;
    }

    let coreDays = null;
    if (latestCore && latestCore.next_due_date) {
      const d = new Date(latestCore.next_due_date);
      d.setHours(0, 0, 0, 0);
      coreDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (coreDays < minDays) minDays = coreDays;
    }

    if (minDays === Infinity) {
      return {
        status: 'none',
        label: 'No Due Date Set',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        latestRabies,
        rabiesDays,
        latestCore,
        coreDays,
        minDays: null
      };
    }

    if (minDays < 0) {
      return {
        status: 'overdue',
        label: `BOOSTER OVERDUE (${Math.abs(minDays)}d ago)`,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        latestRabies,
        rabiesDays,
        latestCore,
        coreDays,
        minDays
      };
    }

    if (minDays <= 30) {
      return {
        status: 'duesoon',
        label: `BOOSTER DUE SOON (${minDays}d)`,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        latestRabies,
        rabiesDays,
        latestCore,
        coreDays,
        minDays
      };
    }

    return {
      status: 'uptodate',
      label: `CURRENT (Due in ${minDays}d)`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      latestRabies,
      rabiesDays,
      latestCore,
      coreDays,
      minDays
    };
  };

  const jumpToInoculatePet = (pet, targetPresetName) => {
    setSelectedMedicalPetId(pet.pet_id);
    setWorkspaceView('patient');
    const preset = vaccinePresets.find(p => p.label.toLowerCase().includes(targetPresetName?.toLowerCase() || 'rabies')) || vaccinePresets[0];
    applyVaccinePreset(preset);
    setTimeout(() => {
      const el = document.getElementById('vaccine-registration-form');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const matrixStats = pets.reduce((acc, p) => {
    const analysis = getPetBoosterAnalysis(p.pet_id);
    if (analysis.status === 'overdue') acc.overdue += 1;
    else if (analysis.status === 'duesoon') acc.dueSoon += 1;
    else if (analysis.status === 'uptodate') acc.upToDate += 1;
    else acc.none += 1;
    return acc;
  }, { overdue: 0, dueSoon: 0, upToDate: 0, none: 0 });

  const filteredMatrixPets = pets.filter(p => {
    const query = matrixSearch.toLowerCase().trim();
    const matchesSearch = !query || 
      p.name?.toLowerCase().includes(query) || 
      p.pet_id?.toLowerCase().includes(query) || 
      p.found_near?.toLowerCase().includes(query) ||
      p.species?.toLowerCase().includes(query);
    if (!matchesSearch) return false;

    if (matrixFilter === 'all') return true;
    const analysis = getPetBoosterAnalysis(p.pet_id);
    if (matrixFilter === 'urgent') return analysis.status === 'overdue' || analysis.status === 'duesoon';
    if (matrixFilter === 'dogs') return (p.species || '').toLowerCase() === 'dog';
    if (matrixFilter === 'cats') return (p.species || '').toLowerCase() === 'cat';
    return true;
  });

  // Filtered medical records
  const filteredMedicalLogs = medicalLogs.filter(m => {
    if (logFilter === 'all') return true;
    if (logFilter === 'clinical') return m.record_type === 'Check-up' || m.record_type === 'Clinical Treatment';
    if (logFilter === 'quarantine') return m.record_type === 'Bite Incident' || m.record_type === 'Scratch Incident';
    return true;
  });

  const activePetBooster = activePet ? getPetBoosterAnalysis(activePet.pet_id) : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-xs text-slate-700 pb-12">
      
      {/* Top View Switcher: Individual Consultation vs Campus Vaccination & Booster Matrix */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#5C0612]/10 border border-[#5C0612]/20 flex items-center justify-center text-[#5C0612] shrink-0">
            <svg className="w-5 h-5 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
              CIT-U Veterinary & Campus Herd Health Registry
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Clinical Workspace & Booster Surveillance
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl font-mono text-xs">
          <button
            type="button"
            onClick={() => setWorkspaceView('patient')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              workspaceView === 'patient'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Patient Consultation & Logs
          </button>
          <button
            type="button"
            onClick={() => {
              setWorkspaceView('matrix');
              fetchAllVaccinations();
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              workspaceView === 'matrix'
                ? 'bg-[#5C0612] text-white shadow-sm border border-[#5C0612]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            Booster Alert Matrix
            {(matrixStats.overdue > 0 || matrixStats.dueSoon > 0) && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] rounded-full font-black animate-pulse">
                {matrixStats.overdue + matrixStats.dueSoon}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          WORKSPACE VIEW: PATIENT CONSULTATION & INDIVIDUAL RECORDS
         ========================================================================= */}
      {workspaceView === 'patient' && (
        <>
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
                    {activePetBooster && (
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${activePetBooster.badgeClass}`}>
                        {activePetBooster.label}
                      </span>
                    )}
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
              <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl font-mono text-[10px] font-bold">
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
                  onClick={() => handleTypeChange('Bite — Human Skin Contact')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${medType.includes('Bite') ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-rose-600'}`}
                >
                  Log Incident Report
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
                    Exam / Incident Date *
                  </label>
                  <input
                    type="text"
                    required
                    value={medDate}
                    onChange={(e) => setMedDate(e.target.value)}
                    placeholder="YYYY-MM-DD or 2026-10-01 09:30 AM"
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
              {(medType === 'Bite Incident' || medType === 'Scratch Incident' || medType.includes('Bite') || medType.includes('Scratch')) && (
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
                      <label className="block text-[9px] font-bold text-rose-700 uppercase mb-1">Incident Type</label>
                      <select
                        value={medType}
                        onChange={(e) => setMedType(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="Bite — Human Skin Contact">Bite — Human Skin Contact</option>
                        <option value="Scratch Incident">Scratch — Human Skin Contact</option>
                        <option value="Bite Incident">Bite Incident (Other)</option>
                      </select>
                    </div>

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

            <form id="vaccine-registration-form" onSubmit={handleAddVaccine} className="space-y-3">
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
    </>
  )}

  {/* =========================================================================
      WORKSPACE VIEW: VACCINATION EXPIRY & ANNUAL BOOSTER ALERT MATRIX
     ========================================================================= */}
  {workspaceView === 'matrix' && (
    <div className="space-y-6">

      {/* Matrix Surveillance Metrics Ticker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Overdue Boosters */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800">
              Booster Overdue
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-950 font-mono">
              {matrixStats.overdue}
            </span>
            <span className="text-xs font-bold text-rose-700">Animals</span>
          </div>
          <p className="text-[11px] text-rose-600/90 mt-1 font-medium">
            Lapsed immunity • Priority inoculation needed under RA 9482
          </p>
        </div>

        {/* Metric 2: Due Soon (<= 30 Days) */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">
              Booster Due Soon
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-950 font-mono">
              {matrixStats.dueSoon}
            </span>
            <span className="text-xs font-bold text-amber-700">Within 30 Days</span>
          </div>
          <p className="text-[11px] text-amber-600/90 mt-1 font-medium">
            Scheduled for renewal in current clinical cycle
          </p>
        </div>

        {/* Metric 3: Active Immunity Current */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
              Active Immunity
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-950 font-mono">
              {matrixStats.upToDate}
            </span>
            <span className="text-xs font-bold text-emerald-700">Animals</span>
          </div>
          <p className="text-[11px] text-emerald-600/90 mt-1 font-medium">
            Verified anti-rabies & core biological protection
          </p>
        </div>

        {/* Metric 4: Total Campus Herd */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Monitored Herd
            </span>
            <span className="text-[10px] font-mono font-bold text-[#5C0612]">CIT-U</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {pets.length}
            </span>
            <span className="text-xs font-bold text-slate-600">Total Animals</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            100% campus resident registry coverage
          </p>
        </div>

      </div>

      {/* Search, Filter & Refresh Control Toolbar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm text-left flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search by animal name, tag ID, breed, or campus colony zone..."
            value={matrixSearch}
            onChange={(e) => setMatrixSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C0612]/20 text-xs text-slate-800"
          />
          {matrixSearch && (
            <button
              onClick={() => setMatrixSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold font-mono"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & Sync Button */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex bg-slate-100 p-1 rounded-xl font-mono text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setMatrixFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                matrixFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({pets.length})
            </button>
            <button
              type="button"
              onClick={() => setMatrixFilter('urgent')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                matrixFilter === 'urgent'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              Urgent ({matrixStats.overdue + matrixStats.dueSoon})
            </button>
            <button
              type="button"
              onClick={() => setMatrixFilter('dogs')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                matrixFilter === 'dogs'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Canines
            </button>
            <button
              type="button"
              onClick={() => setMatrixFilter('cats')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                matrixFilter === 'cats'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Felines
            </button>
          </div>

          <button
            type="button"
            onClick={fetchAllVaccinations}
            disabled={loadingMatrix}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold font-mono text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Refresh vaccination logs from database"
          >
            <svg className={`w-3.5 h-3.5 ${loadingMatrix ? 'animate-spin text-[#5C0612]' : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {loadingMatrix ? 'Syncing...' : 'Sync Registry'}
          </button>

        </div>

      </div>

      {/* Main Booster Alert Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left">
        
        {/* Table Header Banner */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <svg className="w-4 h-4 text-[#5C0612]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
              </svg>
              Campus-Wide Booster Expiration & Surveillance Ledger
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live date comparison against Philippine RA 9482 compliance standards • 1-click jump to vaccine administration
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold">
            Showing {filteredMatrixPets.length} of {pets.length} animals
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Patient Profile</th>
                <th className="py-3 px-4">Colony Territory</th>
                <th className="py-3 px-4">Rabies Protection (RA 9482)</th>
                <th className="py-3 px-4">Core Biologicals</th>
                <th className="py-3 px-4">Booster Urgency</th>
                <th className="py-3 px-4 text-right">Inoculation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loadingMatrix ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-mono">
                    <div className="w-6 h-6 border-2 border-t-transparent border-[#5C0612] rounded-full animate-spin mx-auto mb-2"></div>
                    Calculating campus-wide booster expiry matrix...
                  </td>
                </tr>
              ) : filteredMatrixPets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 italic">
                    No animals matched the active search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMatrixPets.map((pet) => {
                  const analysis = getPetBoosterAnalysis(pet.pet_id);
                  const isDog = (pet.species || '').toLowerCase() === 'dog';
                  return (
                    <tr 
                      key={pet.pet_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        analysis.status === 'overdue' ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Column 1: Patient Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {pet.primary_image ? (
                            <img
                              src={pet.primary_image}
                              alt={pet.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-[10px] shrink-0 font-mono">
                              {pet.species?.[0] || 'P'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{pet.name}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {pet.pet_id}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                              {pet.species} • {pet.gender} • {pet.breed || 'Mix'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Colony Territory */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {pet.found_near || 'CIT-U Grounds'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {pet.feeding_area || 'Standard Feeding Station'}
                        </span>
                      </td>

                      {/* Column 3: Rabies Protection */}
                      <td className="py-3.5 px-4">
                        {analysis.latestRabies ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-800 text-[11px]">
                                Due: {analysis.latestRabies.next_due_date || 'No Date'}
                              </span>
                              {analysis.rabiesDays !== null && (
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                  analysis.rabiesDays < 0 
                                    ? 'bg-rose-100 text-rose-800' 
                                    : analysis.rabiesDays <= 30
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {analysis.rabiesDays < 0 
                                    ? `${Math.abs(analysis.rabiesDays)}d overdue`
                                    : `${analysis.rabiesDays}d left`}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              Administered: {analysis.latestRabies.administered_date} {analysis.latestRabies.batch_lot_number ? `(${analysis.latestRabies.batch_lot_number})` : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-400 italic text-[11px]">
                            <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                            No Rabies Record
                          </div>
                        )}
                      </td>

                      {/* Column 4: Core Biologicals */}
                      <td className="py-3.5 px-4">
                        {analysis.latestCore ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-800 text-[11px] block">
                              {analysis.latestCore.vaccine_name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              Due: {analysis.latestCore.next_due_date || 'N/A'} • Given: {analysis.latestCore.administered_date}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            {isDog ? 'Pending DHPP 5-in-1' : 'Pending Tricat FVRCP'}
                          </span>
                        )}
                      </td>

                      {/* Column 5: Booster Urgency Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border ${analysis.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            analysis.status === 'overdue' ? 'bg-rose-600 animate-ping' :
                            analysis.status === 'duesoon' ? 'bg-amber-500' :
                            analysis.status === 'uptodate' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}></span>
                          {analysis.label}
                        </span>
                      </td>

                      {/* Column 6: Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => jumpToInoculatePet(pet, 'rabies')}
                          className={`px-3 py-1.5 rounded-xl font-bold font-mono text-[10px] transition-all flex items-center gap-1.5 ml-auto uppercase tracking-wider ${
                            analysis.status === 'overdue'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                              : analysis.status === 'duesoon'
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-black text-white shadow-sm'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Inoculate Dose
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  )}

</div>
);
}