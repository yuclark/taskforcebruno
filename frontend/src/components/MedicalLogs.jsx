import React, { useState, useEffect } from 'react';

export default function MedicalLogs({ pets }) {
  const [selectedMedicalPetId, setSelectedMedicalPetId] = useState('');
  const [medicalLogs, setMedicalLogs] = useState([]);
  const [vaccineLogs, setVaccineLogs] = useState([]);
  
  // --- DETAILED CLINICAL STATE MODELS ---
  const [medType, setMedType] = useState('Check-up');
  const [medNotes, setMedNotes] = useState('');
  const [medDate, setMedDate] = useState(new Date().toISOString().split('T')[0]);
  const [medPrescription, setMedPrescription] = useState('');
  const [medFollowup, setMedFollowup] = useState('');
  const [medWeight, setMedWeight] = useState('');
  const [medVet, setMedVet] = useState('');

  const [vacName, setVacName] = useState('');
  const [vacDate, setVacDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacNextDue, setVacNextDue] = useState('');
  const [vacLot, setVacLot] = useState('');
  const [vacWeight, setVacWeight] = useState('');
  const [vacAdminBy, setVacAdminBy] = useState('');
  const [formMessage, setFormMessage] = useState({ target: '', type: '', text: '' });

  // --- DYNAMIC FORM CONFIGURATIONS BY SCENARIO ---
  const formConfigs = {
    'Check-up': {
      notesLabel: "Symptom Findings & Routine Notes *",
      notesPlaceholder: "Describe general physical condition, behavior, coat quality, and baseline vital inspection notes...",
      prescriptionLabel: "Prescribed Preventatives / Vitamins / Supplements",
      prescriptionPlaceholder: "Ex: Multivitamins, Dewormer tablet dosage tracks",
      followupLabel: "Next Routine Evaluation Date",
      themeClass: "border-slate-200"
    },
    'Clinical Treatment': {
      notesLabel: "Diagnosis & Clinical Treatment Notes *",
      notesPlaceholder: "Specify medical diagnosis, clinical pathology state, and operational medical procedures executed...",
      prescriptionLabel: "Prescribed Pharmacotherapy Treatment Plan",
      prescriptionPlaceholder: "Ex: Amoxicillin 250mg 2x/day for 7 days split loops",
      followupLabel: "Clinical Re-check Return Date",
      themeClass: "border-blue-200"
    },
    'Bite Incident': {
      notesLabel: "Incident Details, Severity & Quarantine Protocol *",
      notesPlaceholder: "Specify victim category (e.g., student/staff ID), exposure classification (Grade I-III), bite location, and active 14-day quarantine parameters...",
      prescriptionLabel: "Wound Management & Post-Exposure Prophylaxis Given",
      prescriptionPlaceholder: "Ex: Immediate antiseptic flushing log, anti-rabies booster recommended",
      followupLabel: "Quarantine Clearance / Observation Release Date",
      themeClass: "border-rose-300 bg-rose-50/10"
    },
    'Scratch Incident': {
      notesLabel: "Incident Context & Wound Disinfection Tracking *",
      notesPlaceholder: "Detail scratch tracking depth, anatomical location, victim category, and immediate sterilization protocol markers implemented...",
      prescriptionLabel: "Antiseptic / Prophylactic Treatment Protocol Administered",
      prescriptionPlaceholder: "Ex: Topical mupirocin application, tetanus toxoid evaluation reference",
      followupLabel: "Wound Healing / Infection Monitoring Re-check Date",
      themeClass: "border-orange-200 bg-orange-50/10"
    }
  };

  const activeConfig = formConfigs[medType] || formConfigs['Check-up'];

  const fetchMedicalLogsForTarget = async (id) => {
    if (!id) return;
    try {
      const medRes = await fetch(`https://taskforcebruno.onrender.com/api/medical/${id}/`);
      const vacRes = await fetch(`https://taskforcebruno.onrender.com/api/vaccinations/${id}/`);
      if (medRes.ok) setMedicalLogs(await medRes.json());
      if (vacRes.ok) setVaccineLogs(await vacRes.json());
    } catch (err) {
      console.error('Error compiling veterinary histories:', err);
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
    }
  }, [selectedMedicalPetId]);

  const handleAddMedicalRecord = async (e) => {
    e.preventDefault();
    if (!medNotes.trim()) return;

    const payload = {
      record_type: medType,
      notes: medNotes.trim(),
      log_date: medDate,
      medication_prescribed: medPrescription.trim() || 'None',
      next_followup_date: medFollowup || null,
      weight_at_log: medWeight.trim() || 'N/A',
      veterinarian: medVet.trim() || 'MDC Staff Veterinarian'
    };

    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/medical/${selectedMedicalPetId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMedNotes('');
        setMedPrescription('');
        setMedFollowup('');
        setMedWeight('');
        setMedVet('');
        setFormMessage({ target: 'med', type: 'success', text: 'Clinical record entry synchronized successfully!' });
        fetchMedicalLogsForTarget(selectedMedicalPetId);
      }
    } catch (err) {
      setFormMessage({ target: 'med', type: 'error', text: 'Server integration timeout failure.' });
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
      weight_at_vaccination: vacWeight.trim() || 'N/A',
      administered_by: vacAdminBy.trim() || 'MDC Attendant'
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
        setVacWeight('');
        setVacAdminBy('');
        setFormMessage({ target: 'vac', type: 'success', text: 'Immunization serum parameters verified and logged.' });
        fetchMedicalLogsForTarget(selectedMedicalPetId);
      }
    } catch (err) {
      setFormMessage({ target: 'vac', type: 'error', text: 'Server integration database timeout failure.' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-xs px-1 sm:px-4">
      
      {/* Top Banner Target Selection Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
        <span className="font-semibold text-[#5C0612] font-mono text-[11px] uppercase tracking-wider">Active Patient Context Node:</span>
        <select value={selectedMedicalPetId} onChange={(e) => setSelectedMedicalPetId(e.target.value)} className="w-full sm:w-auto px-4 py-2 bg-slate-50 border rounded-xl font-mono text-xs focus:outline-none font-semibold text-slate-900 shadow-inner">
          {pets.map(p => <option key={p.pet_id} value={p.pet_id}>{p.name} ({p.pet_id})</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ==========================================
            LEFT SPLIT VIEW: VACCINATION LOG MODULE
           ========================================== */}
        <div className="bg-white border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold font-mono tracking-wider text-[#5C0612] border-b pb-2 uppercase text-[11px]">Immunization History Registry</h3>
            
            {formMessage.target === 'vac' && (
              <div className={`p-2.5 border text-[11px] rounded-xl ${formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>{formMessage.text}</div>
            )}

            <form onSubmit={handleAddVaccine} className="space-y-3 bg-slate-50/60 p-3 sm:p-3.5 border rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Serum Name *</label>
                  <input type="text" required value={vacName} onChange={(e) => setVacName(e.target.value)} placeholder="Ex: DHPP 5-in-1, Anti-Rabies" className="w-full px-2.5 py-1.5 bg-white border rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Administered Date *</label>
                  <input type="date" required value={vacDate} onChange={(e) => setVacDate(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border rounded-lg focus:outline-none font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Batch / Lot #</label>
                  <input type="text" placeholder="Lot B204-X" value={vacLot} onChange={(e) => setVacLot(e.target.value)} className="w-full px-2 py-1.5 bg-white border rounded-lg focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Weight (vitals)</label>
                  <input type="text" placeholder="Ex: 4.2 kg" value={vacWeight} onChange={(e) => setVacWeight(e.target.value)} className="w-full px-2 py-1.5 bg-white border rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Booster Due Date</label>
                  <input type="date" value={vacNextDue} onChange={(e) => setVacNextDue(e.target.value)} className="w-full px-2 py-1 bg-white border rounded-lg focus:outline-none font-mono text-[11px]" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input type="text" placeholder="Administered by (Attendant or Vet Clinician)" value={vacAdminBy} onChange={(e) => setVacAdminBy(e.target.value)} className="w-full sm:flex-1 px-3 py-1.5 bg-white border rounded-lg focus:outline-none text-xs" />
                <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-[#5C0612] text-white rounded-lg font-bold border-b-2 border-[#D4AF37] hover:bg-[#42040B] transition-all shrink-0 text-center whitespace-nowrap">LOG DOSAGE</button>
              </div>
            </form>
          </div>

          <div className="divide-y divide-slate-100 font-mono text-[11px] max-h-[320px] overflow-y-auto pt-2">
            {vaccineLogs.length === 0 ? (
              <p className="text-slate-400 text-center italic py-12 font-sans">No verifiable immunization profiles found for this record.</p>
            ) : (
              vaccineLogs.map(v => (
                <div key={v.log_id} className="py-3 space-y-1 bg-white hover:bg-slate-50/40 px-1 transition-colors">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-xs font-sans">{v.vaccine_name}</span>
                    <span className="text-slate-500 font-bold text-[10px]">{v.administered_date}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 text-[10px] text-slate-400 leading-normal font-sans gap-y-0.5">
                    <span>Batch Code: <strong className="font-mono text-slate-600">{v.batch_lot_number || 'N/A'}</strong></span>
                    <span>Patient Mass: <strong className="text-slate-600">{v.weight_at_vaccination || 'N/A'}</strong></span>
                    <span className="sm:col-span-2">Attendant: <strong className="text-slate-600">{v.administered_by}</strong></span>
                    {v.next_due_date && (
                      <span className="sm:col-span-2 mt-0.5 font-mono text-amber-700 font-bold bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded w-fit text-[9px]">
                        NEXT RE-VACCINATION DUE: {v.next_due_date}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ==========================================
            RIGHT SPLIT VIEW: CLINICAL CASE RECORDS
           ========================================== */}
        <div className="bg-white border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold font-mono tracking-wider text-[#5C0612] border-b pb-2 uppercase text-[11px]">Clinical Procedures & Care Logs</h3>
            
            {formMessage.target === 'med' && (
              <div className={`p-2.5 border text-[11px] rounded-xl ${formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>{formMessage.text}</div>
            )}

            {/* Form dynamically re-themes border borders based on selected option */}
            <form onSubmit={handleAddMedicalRecord} className={`space-y-3 bg-slate-50/60 p-3 sm:p-3.5 border rounded-xl transition-all duration-300 ${activeConfig.themeClass}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Case Type</label>
                  <select value={medType} onChange={(e) => { setMedType(e.target.value); setMedNotes(''); setMedPrescription(''); }} className="w-full p-1.5 bg-white border rounded-lg focus:outline-none font-medium text-slate-900">
                    <option value="Check-up">Routine Check-up</option>
                    <option value="Clinical Treatment">Clinical Treatment</option>
                    <option value="Bite Incident">Bite Incident Log</option>
                    <option value="Scratch Incident">Scratch Incident Log</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Session Date *</label>
                  <input type="date" required value={medDate} onChange={(e) => setMedDate(e.target.value)} className="w-full p-1.5 bg-white border rounded-lg focus:outline-none font-mono text-[11px]" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Pet's Mass</label>
                  <input type="text" placeholder="Ex: 5.1 kg" value={medWeight} onChange={(e) => setMedWeight(e.target.value)} className="w-full p-1.5 bg-white border rounded-lg focus:outline-none" />
                </div>
              </div>

              {/* Dynamic Notes Field Section */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5 transition-colors duration-200">{activeConfig.notesLabel}</label>
                <textarea rows="2" required value={medNotes} onChange={(e) => setMedNotes(e.target.value)} placeholder={activeConfig.notesPlaceholder} className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none text-xs font-sans leading-relaxed text-slate-800" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Dynamic Treatment/Prescription Field Section */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">{activeConfig.prescriptionLabel}</label>
                  <input type="text" value={medPrescription} onChange={(e) => setMedPrescription(e.target.value)} placeholder={activeConfig.prescriptionPlaceholder} className="w-full px-2.5 py-1.5 bg-white border rounded-lg focus:outline-none" />
                </div>
                {/* Dynamic Followup/Due Date Section */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">{activeConfig.followupLabel}</label>
                  <input type="date" value={medFollowup} onChange={(e) => setMedFollowup(e.target.value)} className="w-full p-1.5 bg-white border rounded-lg focus:outline-none font-mono text-[11px]" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input type="text" placeholder="Executing Medical Officer / Veterinarian" value={medVet} onChange={(e) => setMedVet(e.target.value)} className="w-full sm:flex-1 px-3 py-1.5 bg-white border rounded-lg focus:outline-none text-xs" />
                <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-[#5C0612] text-white rounded-lg font-bold border-b-2 border-[#D4AF37] hover:bg-[#42040B] transition-all text-center whitespace-nowrap">COMMIT ENTIRE BLOCK</button>
              </div>
            </form>
          </div>

          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pt-2">
            {medicalLogs.length === 0 ? (
              <p className="text-slate-400 text-center italic py-12 font-sans">No clinical procedures currently indexed inside database lines.</p>
            ) : (
              medicalLogs.map(m => (
                <div key={m.record_id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2 shadow-inner hover:bg-white transition-colors">
                  <div className="flex justify-between items-start font-mono text-[10px] gap-2">
                    <span className={`px-2 py-0.5 rounded font-bold text-[8px] uppercase tracking-wider border ${
                      m.record_type === 'Bite Incident'
                        ? 'bg-rose-100 border-rose-300 text-rose-800 font-black animate-pulse'
                        : m.record_type === 'Scratch Incident'
                        ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold'
                        : m.record_type === 'Clinical Treatment' 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      {m.record_type}
                    </span>
                    <span className="text-slate-400 font-bold shrink-0">{m.log_date}</span>
                  </div>
                  
                  <p className="text-slate-800 text-xs font-medium leading-relaxed font-sans break-words">{m.notes}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100 text-[10px] font-sans text-slate-500">
                    <div className="break-words">Medication: <strong className="text-slate-700">{m.medication_prescribed || 'None'}</strong></div>
                    <div>Vitals Weight: <strong className="font-mono text-slate-700">{m.weight_at_log || 'N/A'}</strong></div>
                    <div className="sm:col-span-2 break-words">Clinician Signature: <strong className="text-slate-600 font-mono text-[9px] uppercase">{m.veterinarian}</strong></div>
                    {m.next_followup_date && (
                      <div className="sm:col-span-2 mt-1 font-mono text-blue-800 bg-blue-50/60 border border-blue-200/40 px-2 py-0.5 rounded w-fit text-[9px] font-bold">
                        REQUIRED RE-CHECKUP MONITORING: {m.next_followup_date}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}