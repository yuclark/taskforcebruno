import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  User,
  FileText,
  Plus,
  Check,
  Search,
  RefreshCw,
  AlertCircle,
  Edit3,
  Syringe,
  X,
  List,
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../lib/api';
import { parseLocalDate, computeQuarantineReleaseDate } from '../lib/dates';
import { safeImageUrl, getVaccinationBadgeStyles } from '../lib/pets';

function generateVaccineLotCode() {
  return `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
}

const VACCINE_PRESETS = [
  { label: 'Anti-Rabies (Annual)', name: 'Anti-Rabies Inactivated Vaccine', dueMonths: 12, species: 'both' },
  { label: 'Canine 5-in-1 (DHPP)', name: 'DHPP 5-in-1 (Distemper, Hepatitis, Parvo, Parainfluenza)', dueMonths: 12, species: 'dog' },
  { label: 'Canine 8-in-1 (DHPPiL)', name: 'DHPPiL 8-in-1 (Canine Core + Leptospirosis)', dueMonths: 12, species: 'dog' },
  { label: 'Kennel Cough (Bordetella)', name: 'Bordetella Bronchiseptica (Canine Kennel Cough)', dueMonths: 12, species: 'dog' },
  { label: 'Feline 3-in-1 (FVRCP)', name: 'FVRCP 3-in-1 Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia', dueMonths: 12, species: 'cat' },
  { label: 'Feline 4-in-1 (FVRCP-C)', name: 'FVRCP-C 4-in-1 Feline Core + Chlamydia', dueMonths: 12, species: 'cat' },
  { label: 'Feline Leukemia (FeLV)', name: 'FeLV (Feline Leukemia Virus Vaccine)', dueMonths: 12, species: 'cat' },
  { label: 'Deworming (Anthelmintic)', name: 'Broad-Spectrum Dewormer (Pyrantel / Praziquantel)', dueMonths: 3, species: 'both' },
];

function getPresetsForSpecies(speciesStr) {
  const sp = (speciesStr || '').trim().toLowerCase();
  if (sp === 'cat' || sp === 'feline') {
    return VACCINE_PRESETS.filter((p) => p.species === 'both' || p.species === 'cat');
  }
  if (sp === 'dog' || sp === 'canine') {
    return VACCINE_PRESETS.filter((p) => p.species === 'both' || p.species === 'dog');
  }
  return VACCINE_PRESETS;
}

function isNonVaccineDewormer(vaccineName) {
  const n = (vaccineName || '').toLowerCase();
  return (
    !n.trim() ||
    n.includes('deworm') ||
    n.includes('anthelmintic') ||
    n.includes('pyrantel') ||
    n.includes('praziquantel') ||
    n.includes('flea') ||
    n.includes('tick') ||
    n.includes('heartworm')
  );
}

function computeVaccinationStatus(vacs) {
  const realVacs = (vacs || []).filter((v) => !isNonVaccineDewormer(v.vaccine_name));
  if (realVacs.length === 0) return 'Not Vaccinated';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isActive = (v) => {
    const due = parseLocalDate(v.next_due_date || v.expiration_date);
    if (due) {
      due.setHours(0, 0, 0, 0);
      return due.getTime() >= today.getTime();
    }
    const admin = parseLocalDate(v.administered_date);
    if (admin) {
      admin.setHours(0, 0, 0, 0);
      const expiry = new Date(admin.getTime() + 365 * 24 * 60 * 60 * 1000);
      return expiry.getTime() >= today.getTime();
    }
    return false;
  };

  const rabies = realVacs.filter((v) => (v.vaccine_name || '').toLowerCase().includes('rabies'));
  const core = realVacs.filter((v) => !(v.vaccine_name || '').toLowerCase().includes('rabies'));

  if (rabies.some(isActive)) return 'Fully Vaccinated';
  if (core.some(isActive)) return 'Core Only (No Anti-Rabies)';
  return 'Booster Overdue';
}

export default function MedicalLogs({ pets = [], onRefresh }) {
  const [selectedMedicalPetId, setSelectedMedicalPetId] = useState(() => pets[0]?.pet_id || '');
  const [medicalLogs, setMedicalLogs] = useState([]);
  const [vaccineLogs, setVaccineLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [submittingMed, setSubmittingMed] = useState(false);
  const [editingMedLog, setEditingMedLog] = useState(null);
  const [editingVacLog, setEditingVacLog] = useState(null);
  const [savingRecordEdit, setSavingRecordEdit] = useState(false);
  const [editRecordError, setEditRecordError] = useState('');
  const [submittingVac, setSubmittingVac] = useState(false);

  const [workspaceView, setWorkspaceView] = useState('patient');
  const [allVaccinationsMap, setAllVaccinationsMap] = useState({});
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [matrixError, setMatrixError] = useState('');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixFilter, setMatrixFilter] = useState('all');

  const [logFilter, setLogFilter] = useState('all');

  // Clinical consultation state
  const [medType, setMedType] = useState('Check-up');
  const [medDate, setMedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [medWeight, setMedWeight] = useState('');
  const [medVet, setMedVet] = useState('');

  // Check-up fields
  const [bodyCondition, setBodyCondition] = useState('Ideal (BCS 4-5/9)');
  const [temperature, setTemperature] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medPrescription, setMedPrescription] = useState('');
  const [medFollowup, setMedFollowup] = useState('');

  // Spay / Neuter (TNR) fields
  const [spayProcedure, setSpayProcedure] = useState('Spay (Ovariohysterectomy)');
  const [earTipApplied, setEarTipApplied] = useState(true);

  // Rabies Bite / Scratch Protocol (RA 9482)
  const [exposureCategory, setExposureCategory] = useState(
    'Category II - Minor scratch/abrasion without bleeding'
  );
  const [victimType, setVictimType] = useState('CIT-U Student');
  const [incidentLocation, setIncidentLocation] = useState('NGE Building Ground');
  const [quarantineStatus, setQuarantineStatus] = useState('Active 14-Day Rabies Observation');

  // Vaccine form state
  const [vacName, setVacName] = useState('');
  const [vacDate, setVacDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vacNextDue, setVacNextDue] = useState('');
  const [vacLot, setVacLot] = useState('');
  const [vacWeight, setVacWeight] = useState('');
  const [vacAdminBy, setVacAdminBy] = useState('');

  const [formMessage, setFormMessage] = useState({ target: '', type: '', text: '' });

  const effectivePetId = selectedMedicalPetId || pets[0]?.pet_id || '';
  const activePet = pets.find((p) => p.pet_id === effectivePetId) || pets[0] || null;

  const applyVaccinePreset = (preset, targetPetOverride = null) => {
    setVacName(preset.name);
    const d = parseLocalDate(vacDate) || new Date();
    d.setMonth(d.getMonth() + preset.dueMonths);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setVacNextDue(`${yyyy}-${mm}-${dd}`);
    if (!vacLot) setVacLot(generateVaccineLotCode());
    const petForWeight = targetPetOverride || activePet;
    if (petForWeight?.weight) {
      setVacWeight(String(petForWeight.weight).replace(/[^\d.]/g, '') || '');
    }
  };

  const handleTypeChange = (newType) => {
    setMedType(newType);
    setClinicalNotes('');
    setMedPrescription('');
    if (newType === 'Spay / Neuter') {
      const genderLower = (activePet?.gender || '').toLowerCase();
      setSpayProcedure(genderLower === 'male' ? 'Neuter (Castration)' : 'Spay (Ovariohysterectomy)');
      setMedFollowup('');
    } else if (newType === 'Bite Incident' || newType === 'Scratch Incident') {
      setMedFollowup(computeQuarantineReleaseDate(medDate));
    } else {
      setMedFollowup('');
    }
  };

  const handleMedDateChange = (nextDate) => {
    setMedDate(nextDate);
    if (medType === 'Bite Incident' || medType === 'Scratch Incident') {
      setMedFollowup(computeQuarantineReleaseDate(nextDate));
    }
  };

  const fetchMedicalLogsForTarget = useCallback(async (id) => {
    if (!id) return;
    setLoadingLogs(true);
    setLogsError('');
    try {
      const [medRes, vacRes] = await Promise.all([
        apiGet(`/medical/${encodeURIComponent(id)}/`),
        apiGet(`/vaccinations/${encodeURIComponent(id)}/`),
      ]);
      if (medRes.ok) {
        setMedicalLogs(Array.isArray(medRes.data) ? medRes.data : []);
      } else {
        setLogsError(medRes.error || 'Could not load clinical records.');
      }
      if (vacRes.ok) {
        setVaccineLogs(Array.isArray(vacRes.data) ? vacRes.data : []);
      } else if (!medRes.ok) {
        setLogsError(vacRes.error || 'Could not load clinical records.');
      }
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const fetchAllVaccinations = useCallback(async () => {
    if (!pets || pets.length === 0) return;
    setLoadingMatrix(true);
    setMatrixError('');
    try {
      const res = await apiGet('/vaccinations/all/');
      if (res.ok && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach((v) => {
          if (!map[v.pet_id]) map[v.pet_id] = [];
          map[v.pet_id].push(v);
        });
        setAllVaccinationsMap(map);
        return;
      }
      setMatrixError(res.error || 'Unable to load booster tracking data.');
    } finally {
      setLoadingMatrix(false);
    }
  }, [pets]);

  useEffect(() => {
    if (!pets || pets.length === 0) return;
    const controller = new AbortController();
    apiGet('/vaccinations/all/', { signal: controller.signal }).then((res) => {
      if (res.aborted) return;
      if (res.ok && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach((v) => {
          if (!map[v.pet_id]) map[v.pet_id] = [];
          map[v.pet_id].push(v);
        });
        setAllVaccinationsMap(map);
      }
    });
    return () => controller.abort();
  }, [pets]);

  useEffect(() => {
    if (!effectivePetId) return;
    const controller = new AbortController();
    Promise.all([
      apiGet(`/medical/${encodeURIComponent(effectivePetId)}/`, { signal: controller.signal }),
      apiGet(`/vaccinations/${encodeURIComponent(effectivePetId)}/`, { signal: controller.signal }),
    ]).then(([medRes, vacRes]) => {
      if (medRes.aborted || vacRes.aborted) return;
      if (medRes.ok) {
        setMedicalLogs(Array.isArray(medRes.data) ? medRes.data : []);
        setLogsError('');
      } else {
        setLogsError(medRes.error || 'Could not load clinical records.');
      }
      if (vacRes.ok) {
        setVaccineLogs(Array.isArray(vacRes.data) ? vacRes.data : []);
      }
      setLoadingLogs(false);
    });
    return () => controller.abort();
  }, [effectivePetId]);

  const handleSelectPatient = (nextId) => {
    setSelectedMedicalPetId(nextId);
    setLoadingLogs(true);
    setLogsError('');
    setFormMessage({ target: '', type: '', text: '' });
    setVacName('');
    setVacNextDue('');
    const current = pets.find((p) => p.pet_id === nextId);
    if (current?.weight) {
      const cleanWeight = String(current.weight).replace(/[^\d.]/g, '');
      setMedWeight(cleanWeight);
      setVacWeight(cleanWeight);
    } else {
      setMedWeight('');
      setVacWeight('');
    }
  };

  const handleAddMedicalRecord = async (e) => {
    e.preventDefault();
    if (submittingMed || !clinicalNotes.trim() || !effectivePetId) return;

    const isBiteOrScratch =
      medType === 'Bite Incident' ||
      medType === 'Scratch Incident' ||
      medType.includes('Bite') ||
      medType.includes('Scratch');
    const isSpayNeuter = medType === 'Spay / Neuter';
    const computedExpiryDateStr = isBiteOrScratch ? computeQuarantineReleaseDate(medDate) : null;

    let compiledNotes = clinicalNotes.trim();
    if (medType === 'Check-up') {
      const vitalsSummary = `[VITALS] Temp: ${temperature || 'Normal'} | BCS: ${bodyCondition}`;
      compiledNotes = `${vitalsSummary}\n${clinicalNotes.trim()}`;
    } else if (isSpayNeuter) {
      const tnrSummary = `[SPAY / NEUTER — TNR STERILIZATION] Procedure: ${spayProcedure} | Ear-Tip Notch: ${earTipApplied ? 'Applied (TNR Marked)' : 'Not Applied'}`;
      compiledNotes = `${tnrSummary}\n${clinicalNotes.trim()}`;
    } else if (isBiteOrScratch) {
      const protocolSummary = `[INCIDENT TRIAGE] ${exposureCategory} | Victim: ${victimType} | Zone: ${incidentLocation} | Protocol: ${quarantineStatus} (14-Day Mandatory Quarantine)`;
      compiledNotes = `${protocolSummary}\n${clinicalNotes.trim()}`;
    }

    const payload = {
      record_type: medType,
      notes: compiledNotes,
      log_date: medDate,
      medication_prescribed: medPrescription.trim() || 'None / Supportive Care',
      next_followup_date: medFollowup || computedExpiryDateStr || null,
      weight_at_log: medWeight ? `${medWeight} kg` : 'N/A',
      veterinarian: medVet.trim() || 'MDC Attending Clinician',
    };

    setSubmittingMed(true);
    try {
      const res = await apiPost(`/medical/${encodeURIComponent(effectivePetId)}/`, payload);
      if (res.ok) {
        setClinicalNotes('');
        setMedPrescription('');
        setTemperature('');
        setFormMessage({
          target: 'med',
          type: 'success',
          text: isSpayNeuter
            ? 'Spay / Neuter surgical record saved. Patient is now marked TNR Sterilized.'
            : isBiteOrScratch
            ? 'Incident record saved. 14-day RA 9482 quarantine protocol is now active.'
            : 'Clinical record saved to patient medical history.',
        });
        fetchMedicalLogsForTarget(effectivePetId);
        if ((isBiteOrScratch || isSpayNeuter) && onRefresh) {
          onRefresh();
        }
      } else if (res.status === 403) {
        setFormMessage({
          target: 'med',
          type: 'error',
          text: 'Access Denied: You do not have permission to perform this action (MDC Personnel Only).',
        });
      } else {
        setFormMessage({
          target: 'med',
          type: 'error',
          text: res.error || 'Unable to save clinical record. Please check your entries.',
        });
      }
    } finally {
      setSubmittingMed(false);
    }
  };

  const handleAddVaccine = async (e) => {
    e.preventDefault();
    if (submittingVac || !vacName.trim() || !effectivePetId) return;

    const speciesLower = (activePet?.species || '').trim().toLowerCase();
    const vacLower = vacName.trim().toLowerCase();
    const canineOnlyTerms = [
      'canine',
      'dhpp',
      'da2pp',
      'parvo',
      'distemper',
      'kennel cough',
      'bordetella',
      'leptospirosis',
      '5-in-1',
      '8-in-1',
    ];
    const felineOnlyTerms = [
      'feline',
      'fvrcp',
      'tricat',
      'felv',
      'fiv',
      'panleukopenia',
      'rhinotracheitis',
      'calicivirus',
      '3-in-1',
      '4-in-1',
    ];

    if (speciesLower === 'cat' && canineOnlyTerms.some((t) => vacLower.includes(t))) {
      setFormMessage({
        target: 'vac',
        type: 'error',
        text: `"${vacName.trim()}" is a canine vaccine and cannot be logged for a Cat patient.`,
      });
      return;
    }
    if (speciesLower === 'dog' && felineOnlyTerms.some((t) => vacLower.includes(t))) {
      setFormMessage({
        target: 'vac',
        type: 'error',
        text: `"${vacName.trim()}" is a feline vaccine and cannot be logged for a Dog patient.`,
      });
      return;
    }

    const payload = {
      vaccine_name: vacName.trim(),
      administered_date: vacDate,
      next_due_date: vacNextDue || null,
      batch_lot_number: vacLot.trim() || 'N/A',
      weight_at_vaccination: vacWeight ? `${vacWeight} kg` : 'N/A',
      administered_by: vacAdminBy.trim() || 'MDC Licensed Staff',
    };

    setSubmittingVac(true);
    try {
      const res = await apiPost(`/vaccinations/${encodeURIComponent(effectivePetId)}/`, payload);
      if (res.ok) {
        setVacName('');
        setVacNextDue('');
        setVacLot('');
        setVacAdminBy('');
        setFormMessage({
          target: 'vac',
          type: 'success',
          text: 'Vaccination record saved successfully.',
        });
        fetchMedicalLogsForTarget(effectivePetId);
        fetchAllVaccinations();
        if (onRefresh) onRefresh();
      } else if (res.status === 403) {
        setFormMessage({
          target: 'vac',
          type: 'error',
          text: 'Access Denied: You do not have permission to perform this action (MDC Personnel Only).',
        });
      } else {
        setFormMessage({
          target: 'vac',
          type: 'error',
          text: res.error || 'Unable to save vaccination record.',
        });
      }
    } finally {
      setSubmittingVac(false);
    }
  };

  const getVaccineDueBadge = (dueDateStr) => {
    const due = parseLocalDate(dueDateStr);
    if (!due) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          OVERDUE ({Math.abs(diffDays)}d ago)
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          DUE SOON ({diffDays}d)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        CURRENT (Due: {dueDateStr})
      </span>
    );
  };

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
        minDays: null,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rabiesList = list
      .filter((v) => (v.vaccine_name || '').toLowerCase().includes('rabies'))
      .sort((a, b) => new Date(b.administered_date || 0) - new Date(a.administered_date || 0));
    const latestRabies = rabiesList[0] || null;

    const coreList = list
      .filter(
        (v) =>
          !(v.vaccine_name || '').toLowerCase().includes('rabies') &&
          !isNonVaccineDewormer(v.vaccine_name)
      )
      .sort((a, b) => new Date(b.administered_date || 0) - new Date(a.administered_date || 0));
    const latestCore = coreList[0] || null;

    let minDays = Infinity;
    let rabiesDays = null;
    if (latestRabies?.next_due_date) {
      const d = parseLocalDate(latestRabies.next_due_date);
      if (d) {
        d.setHours(0, 0, 0, 0);
        rabiesDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (rabiesDays < minDays) minDays = rabiesDays;
      }
    }

    let coreDays = null;
    if (latestCore?.next_due_date) {
      const d = parseLocalDate(latestCore.next_due_date);
      if (d) {
        d.setHours(0, 0, 0, 0);
        coreDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (coreDays < minDays) minDays = coreDays;
      }
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
        minDays: null,
      };
    }

    if (minDays < 0) {
      return {
        status: 'overdue',
        label: `OVERDUE (${Math.abs(minDays)}d ago)`,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        latestRabies,
        rabiesDays,
        latestCore,
        coreDays,
        minDays,
      };
    }

    if (minDays <= 30) {
      return {
        status: 'duesoon',
        label: `DUE SOON (${minDays}d)`,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        latestRabies,
        rabiesDays,
        latestCore,
        coreDays,
        minDays,
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
      minDays,
    };
  };

  const jumpToInoculatePet = (pet, targetPresetName) => {
    handleSelectPatient(pet.pet_id);
    setWorkspaceView('patient');
    const speciesPresets = getPresetsForSpecies(pet.species);
    const preset =
      speciesPresets.find((p) =>
        p.label.toLowerCase().includes(targetPresetName?.toLowerCase() || 'rabies')
      ) || speciesPresets[0];
    applyVaccinePreset(preset, pet);
    setTimeout(() => {
      const el = document.getElementById('vaccine-registration-form');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const matrixStats = pets.reduce(
    (acc, p) => {
      const analysis = getPetBoosterAnalysis(p.pet_id);
      if (analysis.status === 'overdue') acc.overdue += 1;
      else if (analysis.status === 'duesoon') acc.dueSoon += 1;
      else if (analysis.status === 'uptodate') acc.upToDate += 1;
      else acc.none += 1;
      return acc;
    },
    { overdue: 0, dueSoon: 0, upToDate: 0, none: 0 }
  );

  const filteredMatrixPets = pets.filter((p) => {
    const query = matrixSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
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

  const filteredMedicalLogs = medicalLogs.filter((m) => {
    if (logFilter === 'all') return true;
    if (logFilter === 'clinical') {
      return (
        m.record_type === 'Check-up' ||
        m.record_type === 'Clinical Treatment' ||
        m.record_type === 'Spay / Neuter'
      );
    }
    if (logFilter === 'quarantine') {
      return m.record_type === 'Bite Incident' || m.record_type === 'Scratch Incident';
    }
    return true;
  });

  const activePetBooster = activePet ? getPetBoosterAnalysis(activePet.pet_id) : null;
  const activePetLiveVacs =
    vaccineLogs.length > 0 ? vaccineLogs : activePet ? allVaccinationsMap[activePet.pet_id] || [] : [];
  const activePetVaccinationStatus = activePet
    ? activePetLiveVacs.length > 0
      ? computeVaccinationStatus(activePetLiveVacs)
      : activePet.vaccination_status || 'Not Vaccinated'
    : 'Not Vaccinated';
  const activeSpeciesPresets = getPresetsForSpecies(activePet?.species);
  const activePetImg = safeImageUrl(activePet?.primary_image);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 sm:space-y-6 animate-fade-in text-xs text-slate-700 pb-8">
      {/* Top View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#5C0612]/10 border border-[#5C0612]/20 flex items-center justify-center text-[#5C0612] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B69020]">
              CIT-U Veterinary Registry
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Clinical Records &amp; Booster Tracker
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setWorkspaceView('patient')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              workspaceView === 'patient'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#5C0612]" />
            <span>Patient Care</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setWorkspaceView('matrix');
              fetchAllVaccinations();
            }}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              workspaceView === 'matrix'
                ? 'bg-[#5C0612] text-white shadow-sm border border-[#5C0612]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Syringe className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Booster Matrix</span>
            {matrixStats.overdue + matrixStats.dueSoon > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full font-black">
                {matrixStats.overdue + matrixStats.dueSoon}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* PATIENT CARE VIEW */}
      {workspaceView === 'patient' && (
        <>
          {/* Patient Summary Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                {activePetImg ? (
                  <img
                    src={activePetImg}
                    alt={activePet?.name || 'Patient'}
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 font-mono font-bold text-xs">
                    {activePet?.species?.[0] || 'P'}
                  </div>
                )}

                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                      {activePet?.name || 'No Patient Selected'}
                    </h2>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                      {activePet?.pet_id || 'N/A'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getVaccinationBadgeStyles(
                        activePetVaccinationStatus
                      )}`}
                    >
                      {activePetVaccinationStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {activePet?.spayed_neutered ? 'TNR Sterilized' : 'Intact'}
                    </span>
                    {activePetBooster && (
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${activePetBooster.badgeClass}`}
                      >
                        {activePetBooster.label}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-slate-500 text-[11px] font-medium pt-0.5">
                    <span>
                      Species: <strong className="text-slate-800">{activePet?.species || 'N/A'} ({activePet?.breed || 'Domestic'})</strong>
                    </span>
                    <span>
                      Sex: <strong className="text-slate-800">{activePet?.gender || 'N/A'}</strong>
                    </span>
                    <span>
                      Weight: <strong className="text-slate-800">{activePet?.weight || 'N/A'}</strong>
                    </span>
                    <span>
                      Zone: <strong className="text-slate-800">{activePet?.found_near || 'Campus Ground'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 border-t lg:border-t-0 pt-3.5 lg:pt-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                    Active Patient
                  </span>
                  <span className="text-[11px] text-slate-500">Switch to load history</span>
                </div>
                <select
                  value={effectivePetId}
                  onChange={(e) => handleSelectPatient(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl font-medium text-slate-900 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-[#5C0612]/20 shadow-sm"
                >
                  {pets.map((p) => (
                    <option key={p.pet_id} value={p.pet_id}>
                      {p.name} [{p.species}] — {p.pet_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Clinical Logs</span>
                <span className="text-sm font-black text-slate-900 font-mono">{medicalLogs.length} Records</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Vaccinations</span>
                <span className="text-sm font-black text-slate-900 font-mono">{vaccineLogs.length} Doses</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Rabies Incidents</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {medicalLogs.filter((m) => m.record_type?.includes('Incident')).length} Tracked
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Last Visit</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {medicalLogs[0]?.log_date || vaccineLogs[0]?.administered_date || 'None'}
                </span>
              </div>
            </div>
          </div>

          {logsError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-800">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{logsError}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchMedicalLogsForTarget(effectivePetId)}
                className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-[11px] font-bold hover:bg-rose-100 transition-colors shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Main Clinical Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* Left Column (7 cols): Clinical Log Form & History */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm text-left">
                <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#5C0612]" />
                      Record Clinical Consultation
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Log wellness exams, treatments, TNR surgeries, or bite/scratch quarantines.
                    </p>
                  </div>

                  <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl font-mono text-[10px] font-bold gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('Check-up')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all ${
                        medType === 'Check-up' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Wellness
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('Clinical Treatment')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all ${
                        medType === 'Clinical Treatment' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Treatment
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('Spay / Neuter')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all ${
                        medType === 'Spay / Neuter' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-500 hover:text-purple-700'
                      }`}
                    >
                      Spay / Neuter
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('Bite Incident')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all ${
                        medType === 'Bite Incident' || medType.includes('Bite')
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-rose-600'
                      }`}
                    >
                      Log Incident Report
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('Scratch Incident')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all ${
                        medType === 'Scratch Incident' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-700'
                      }`}
                    >
                      Scratch
                    </button>
                  </div>
                </div>

                {formMessage.target === 'med' && (
                  <div
                    className={`p-3 border text-xs rounded-xl mb-4 font-medium ${
                      formMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {formMessage.text}
                  </div>
                )}

                <form onSubmit={handleAddMedicalRecord} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Exam / Incident Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={medDate}
                        onChange={(e) => handleMedDateChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-base sm:text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Patient Weight (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="e.g. 4.25"
                        value={medWeight}
                        onChange={(e) => setMedWeight(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-base sm:text-xs text-slate-800"
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
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-base sm:text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {medType === 'Check-up' && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                      <span className="text-[10px] font-bold text-slate-600 font-mono uppercase tracking-wider block">
                        Physical Vitals Assessment
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                            Body Condition Score (BCS)
                          </label>
                          <select
                            value={bodyCondition}
                            onChange={(e) => setBodyCondition(e.target.value)}
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-base sm:text-xs"
                          >
                            <option value="Under ideal (BCS 1-3/9)">Under ideal (BCS 1-3/9 - Thin)</option>
                            <option value="Ideal (BCS 4-5/9)">Ideal (BCS 4-5/9 - Healthy weight)</option>
                            <option value="Over ideal (BCS 6-7/9)">Over ideal (BCS 6-7/9 - Overweight)</option>
                            <option value="Obese (BCS 8-9/9)">Obese (BCS 8-9/9 - Severely Overweight)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                            Rectal Temperature (°C)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 38.4 °C (Normal 38–39.2)"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-base sm:text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {medType === 'Spay / Neuter' && (
                    <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3 text-purple-900">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/60 pb-2">
                        <span className="text-[10px] font-black text-purple-800 font-mono uppercase tracking-wider">
                          TNR Sterilization Surgical Log
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-mono">
                          UPDATES TNR STATUS
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[9px] font-bold text-purple-700 uppercase mb-1">
                            Surgical Procedure *
                          </label>
                          <select
                            value={spayProcedure}
                            onChange={(e) => setSpayProcedure(e.target.value)}
                            className="w-full px-2.5 py-2 bg-white border border-purple-200 rounded-lg text-base sm:text-xs font-semibold text-slate-800"
                          >
                            <option value="Spay (Ovariohysterectomy)">Spay (Ovariohysterectomy — Female)</option>
                            <option value="Neuter (Castration)">Neuter (Castration — Male)</option>
                          </select>
                        </div>
                        <div className="pt-1 sm:pt-4">
                          <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-2 rounded-lg border border-purple-200">
                            <input
                              type="checkbox"
                              checked={earTipApplied}
                              onChange={(e) => setEarTipApplied(e.target.checked)}
                              className="w-4 h-4 accent-purple-700 rounded"
                            />
                            <span className="text-[11px] font-semibold text-purple-900">
                              TNR Ear-Tip Notch Applied
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {(medType === 'Bite Incident' ||
                    medType === 'Scratch Incident' ||
                    medType.includes('Bite') ||
                    medType.includes('Scratch')) && (
                    <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3 text-rose-900">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/60 pb-2">
                        <span className="text-[10px] font-black text-rose-800 font-mono uppercase tracking-wider">
                          Campus Rabies Control Protocol (RA 9482)
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
                            onChange={(e) => handleTypeChange(e.target.value)}
                            className="w-full px-2.5 py-2 bg-white border border-rose-200 rounded-lg text-base sm:text-xs font-semibold"
                          >
                            <option value="Bite Incident">Bite — Human Skin Contact</option>
                            <option value="Scratch Incident">Scratch — Human Skin Contact</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-rose-700 uppercase mb-1">
                            Exposure Classification
                          </label>
                          <select
                            value={exposureCategory}
                            onChange={(e) => setExposureCategory(e.target.value)}
                            className="w-full px-2.5 py-2 bg-white border border-rose-200 rounded-lg text-base sm:text-xs"
                          >
                            <option value="Category I - Touching/feeding, intact skin">
                              Category I: Intact skin contact (Low risk)
                            </option>
                            <option value="Category II - Minor scratch/abrasion without bleeding">
                              Category II: Minor scratch without bleeding (Moderate)
                            </option>
                            <option value="Category III - Transdermal bite, scratch, or saliva on mucosa">
                              Category III: Transdermal bite / bleeding (Immediate PEP)
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-rose-700 uppercase mb-1">
                            Affected Person
                          </label>
                          <select
                            value={victimType}
                            onChange={(e) => setVictimType(e.target.value)}
                            className="w-full px-2.5 py-2 bg-white border border-rose-200 rounded-lg text-base sm:text-xs"
                          >
                            <option value="CIT-U Student">CIT-U Student</option>
                            <option value="CIT-U Faculty / Academic Staff">CIT-U Faculty / Academic Staff</option>
                            <option value="Campus Maintenance / Security Staff">Campus Maintenance / Security</option>
                            <option value="Campus Visitor / Guest">Campus Visitor / Guest</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-rose-700 uppercase mb-1">
                            Incident Location
                          </label>
                          <input
                            type="text"
                            value={incidentLocation}
                            onChange={(e) => setIncidentLocation(e.target.value)}
                            placeholder="e.g. Near NGE Canteen walkway"
                            className="w-full px-2.5 py-2 bg-white border border-rose-200 rounded-lg text-base sm:text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-bold text-rose-700 uppercase mb-1">
                            Quarantine Status
                          </label>
                          <select
                            value={quarantineStatus}
                            onChange={(e) => setQuarantineStatus(e.target.value)}
                            className="w-full px-2.5 py-2 bg-white border border-rose-200 rounded-lg text-base sm:text-xs font-semibold"
                          >
                            <option value="Active 14-Day Rabies Observation">Active 14-Day Rabies Observation</option>
                            <option value="Quarantine Completed - Cleared Healthy">
                              Quarantine Completed - Cleared Healthy
                            </option>
                            <option value="Isolated at Quarantine Kennel">Isolated at Quarantine Kennel</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {medType === 'Check-up'
                        ? 'Clinical Findings & Observations *'
                        : medType === 'Clinical Treatment'
                        ? 'Diagnosis & Procedures Performed *'
                        : medType === 'Spay / Neuter'
                        ? 'Surgical & Post-Op Notes *'
                        : 'Incident Assessment & Wound Care *'}
                    </label>
                    <textarea
                      rows="3"
                      required
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder={
                        medType === 'Check-up'
                          ? 'Describe coat, eyes, ears, hydration, and demeanor...'
                          : medType === 'Clinical Treatment'
                          ? 'Specify diagnosis, symptoms, and procedures performed...'
                          : medType === 'Spay / Neuter'
                          ? 'Document anesthesia, incision closure, suture type, and recovery...'
                          : 'Document wound care, flushing, and referral to the animal bite center...'
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-base sm:text-xs text-slate-800 leading-relaxed resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Prescribed Medication / Care
                      </label>
                      <input
                        type="text"
                        value={medPrescription}
                        onChange={(e) => setMedPrescription(e.target.value)}
                        placeholder="e.g. Amoxicillin 250mg BID for 7 days"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-base sm:text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {medType === 'Bite Incident' || medType === 'Scratch Incident'
                          ? 'Quarantine Clearance Date (Day 14)'
                          : 'Next Follow-up Recheck Date'}
                      </label>
                      <input
                        type="date"
                        value={medFollowup}
                        onChange={(e) => setMedFollowup(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-base sm:text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingMed || !effectivePetId}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-50 text-white font-bold rounded-xl border-b-2 border-[#D4AF37] shadow-sm transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      {submittingMed ? 'Saving Record...' : 'Save Clinical Record'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Clinical Records History */}
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">Clinical Medical History</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Chronological record of examinations, treatments, and quarantine logs.
                    </p>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl font-mono text-[10px] font-semibold select-none">
                    <button
                      type="button"
                      onClick={() => setLogFilter('all')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        logFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All ({medicalLogs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogFilter('clinical')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        logFilter === 'clinical' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Exams &amp; Rx
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogFilter('quarantine')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        logFilter === 'quarantine' ? 'bg-white text-rose-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Incidents
                    </button>
                  </div>
                </div>

                {loadingLogs ? (
                  <div className="py-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-[#5C0612] rounded-full animate-spin" />
                    <span>Loading clinical history...</span>
                  </div>
                ) : filteredMedicalLogs.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    No clinical records found for this filter.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMedicalLogs.map((log) => {
                      const isIncident =
                        log.record_type === 'Bite Incident' || log.record_type === 'Scratch Incident';
                      const isSpayLog =
                        (log.record_type || '').toLowerCase().includes('spay') ||
                        (log.record_type || '').toLowerCase().includes('neuter') ||
                        (log.notes || '').toLowerCase().includes('[spay / neuter');
                      const isIntakeCondLog =
                        (log.notes || '').toLowerCase().includes('[intake medical condition]') ||
                        (log.notes || '').toLowerCase().includes('[condition update]');
                      return (
                        <div
                          key={log.record_id}
                          className={`p-4 rounded-2xl border transition-all ${
                            log.record_type === 'Bite Incident'
                              ? 'bg-rose-50/40 border-rose-200 border-l-4 border-l-rose-600'
                              : log.record_type === 'Scratch Incident'
                              ? 'bg-amber-50/40 border-amber-200 border-l-4 border-l-amber-500'
                              : isSpayLog
                              ? 'bg-purple-50/40 border-purple-200 border-l-4 border-l-purple-600'
                              : 'bg-white border-slate-200 border-l-4 border-l-slate-700'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider ${
                                  log.record_type === 'Bite Incident'
                                    ? 'bg-rose-100 text-rose-800'
                                    : log.record_type === 'Scratch Incident'
                                    ? 'bg-amber-100 text-amber-800'
                                    : isSpayLog
                                    ? 'bg-purple-100 text-purple-800'
                                    : isIntakeCondLog
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : log.record_type === 'Clinical Treatment'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {isSpayLog
                                  ? 'Spay / Neuter (TNR)'
                                  : isIntakeCondLog
                                  ? 'Intake / Condition Log'
                                  : log.record_type}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {log.log_date}
                              </span>
                            </div>

                            <div className="text-[10px] font-mono text-slate-500 flex flex-wrap items-center gap-3">
                              {log.weight_at_log && log.weight_at_log !== 'N/A' && (
                                <span>
                                  Weight: <strong className="text-slate-800">{log.weight_at_log}</strong>
                                </span>
                              )}
                              <span>
                                Clinician: <strong className="text-slate-800">{log.veterinarian || 'Staff Vet'}</strong>
                              </span>
                              {log.record_id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditRecordError('');
                                    setEditingMedLog({
                                      record_id: log.record_id,
                                      log_date: log.log_date || '',
                                      next_followup_date: log.next_followup_date || '',
                                      notes: log.notes || '',
                                      medication_prescribed: log.medication_prescribed || '',
                                      weight_at_log: log.weight_at_log || '',
                                      veterinarian: log.veterinarian || '',
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-sans font-semibold transition-colors"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="py-2.5 space-y-2">
                            <p className="text-slate-800 text-xs whitespace-pre-line leading-relaxed">
                              {log.notes}
                            </p>

                            {log.medication_prescribed && log.medication_prescribed !== 'None' && (
                              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2 text-[11px]">
                                <span className="font-bold text-slate-600 font-mono text-[10px] uppercase shrink-0 pt-0.5">
                                  Rx:
                                </span>
                                <span className="text-slate-800 font-medium">{log.medication_prescribed}</span>
                              </div>
                            )}
                          </div>

                          {log.next_followup_date && (
                            <div
                              className={`mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] ${
                                isIncident ? 'text-rose-700' : 'text-blue-700'
                              }`}
                            >
                              <span className="font-bold">
                                {isIncident ? 'QUARANTINE RELEASE / RECHECK:' : 'SCHEDULED RECHECK:'}
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

            {/* Right Column (5 cols): Vaccinations */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm text-left space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#5C0612]" />
                    Record Vaccination
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Log administered vaccines, lot numbers, and upcoming booster dates.
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block mb-2">
                    Quick Presets {activePet?.species ? `(${activePet.species})` : ''}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSpeciesPresets.map((preset) => (
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
                  <div
                    className={`p-3 border text-xs rounded-xl font-medium ${
                      formMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {formMessage.text}
                  </div>
                )}

                <form id="vaccine-registration-form" onSubmit={handleAddVaccine} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Vaccine Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={vacName}
                      onChange={(e) => setVacName(e.target.value)}
                      placeholder="e.g. Anti-Rabies Inactivated, DHPP 5-in-1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-base sm:text-xs text-slate-800 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Date Administered *
                      </label>
                      <input
                        type="date"
                        required
                        value={vacDate}
                        onChange={(e) => setVacDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-base sm:text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Next Booster Due
                      </label>
                      <input
                        type="date"
                        value={vacNextDue}
                        onChange={(e) => setVacNextDue(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-base sm:text-xs text-slate-800"
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
                        placeholder="e.g. LOT-2026-882"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-base sm:text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={vacWeight}
                        onChange={(e) => setVacWeight(e.target.value)}
                        placeholder="e.g. 4.2"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-base sm:text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Administering Veterinarian / Staff
                    </label>
                    <input
                      type="text"
                      value={vacAdminBy}
                      onChange={(e) => setVacAdminBy(e.target.value)}
                      placeholder="e.g. MDC Veterinarian / Clinician"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-base sm:text-xs text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingVac || !effectivePetId}
                    className="w-full py-2.5 bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-[#D4AF37]" />
                    {submittingVac ? 'Saving Dose...' : 'Register Vaccination Dose'}
                  </button>
                </form>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm text-left">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Vaccination History</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Logged doses and active booster schedules for this patient.
                  </p>
                </div>

                {loadingLogs ? (
                  <div className="py-8 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-[#5C0612] rounded-full animate-spin" />
                    <span>Loading vaccinations...</span>
                  </div>
                ) : vaccineLogs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    No vaccinations recorded for this patient yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {vaccineLogs.map((vac, idx) => (
                      <div
                        key={vac.log_id || vac.vaccine_id || vac.id || idx}
                        className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl hover:bg-white transition-all space-y-2 shadow-sm"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">{vac.vaccine_name}</h4>
                            <span className="text-[10px] font-mono text-slate-500">
                              Given: {vac.administered_date}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {getVaccineDueBadge(vac.next_due_date)}
                            {vac.log_id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditRecordError('');
                                  setEditingVacLog({
                                    log_id: vac.log_id,
                                    vaccine_name: vac.vaccine_name || '',
                                    administered_date: vac.administered_date || '',
                                    next_due_date: vac.next_due_date || '',
                                    batch_lot_number: vac.batch_lot_number || '',
                                    weight_at_vaccination: vac.weight_at_vaccination || '',
                                    administered_by: vac.administered_by || '',
                                  });
                                }}
                                aria-label="Edit vaccination log"
                                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-600 hover:text-amber-900 transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/50">
                          <div>
                            Lot: <strong className="text-slate-700">{vac.batch_lot_number || 'N/A'}</strong>
                          </div>
                          <div>
                            Weight: <strong className="text-slate-700">{vac.weight_at_vaccination || 'N/A'}</strong>
                          </div>
                          <div className="col-span-2">
                            Clinician:{' '}
                            <strong className="text-slate-700 font-sans">
                              {vac.administered_by || 'MDC Staff'}
                            </strong>
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

      {/* BOOSTER ALERT MATRIX VIEW */}
      {workspaceView === 'matrix' && (
        <div className="space-y-5">
          {matrixError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-800">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{matrixError}</span>
              </div>
              <button
                type="button"
                onClick={fetchAllVaccinations}
                className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-[11px] font-bold hover:bg-rose-100 shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800">
                  Overdue
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-rose-950 font-mono">
                  {matrixStats.overdue}
                </span>
                <span className="text-[11px] font-bold text-rose-700">Animals</span>
              </div>
              <p className="text-[11px] text-rose-700/80 mt-1">Priority booster needed (RA 9482)</p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">
                  Due Soon
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
                  {matrixStats.dueSoon}
                </span>
                <span className="text-[11px] font-bold text-amber-700">&le; 30 Days</span>
              </div>
              <p className="text-[11px] text-amber-700/80 mt-1">Upcoming booster renewal</p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
                  Up to Date
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
                  {matrixStats.upToDate}
                </span>
                <span className="text-[11px] font-bold text-emerald-700">Animals</span>
              </div>
              <p className="text-[11px] text-emerald-700/80 mt-1">Active rabies &amp; core coverage</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Total Tracked
                </span>
                <span className="text-[10px] font-mono font-bold text-[#5C0612]">CIT-U</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {pets.length}
                </span>
                <span className="text-[11px] font-bold text-slate-600">Registered</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Campus animal registry</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 shadow-sm text-left flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, ID, species, or zone..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C0612]/20 text-base sm:text-xs text-slate-800"
              />
              {matrixSearch && (
                <button
                  type="button"
                  onClick={() => setMatrixSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl font-mono text-[10px] font-bold overflow-x-auto">
                {[
                  { key: 'all', label: `All (${pets.length})` },
                  { key: 'urgent', label: `Urgent (${matrixStats.overdue + matrixStats.dueSoon})` },
                  { key: 'dogs', label: 'Dogs' },
                  { key: 'cats', label: 'Cats' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMatrixFilter(opt.key)}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                      matrixFilter === opt.key
                        ? opt.key === 'urgent'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white text-slate-900 shadow-sm'
                        : opt.key === 'urgent'
                        ? 'text-rose-700 hover:text-rose-900'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={fetchAllVaccinations}
                disabled={loadingMatrix}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMatrix ? 'animate-spin text-[#5C0612]' : 'text-slate-500'}`} />
                {loadingMatrix ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Booster Matrix Card (Mobile Cards + Desktop Table) */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden text-left">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <List className="w-4 h-4 text-[#5C0612]" />
                  Campus Booster Schedule
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tracks RA 9482 anti-rabies and core vaccine due dates across all registered pets.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">
                Showing {filteredMatrixPets.length} of {pets.length} animals
              </span>
            </div>

            {loadingMatrix ? (
              <div className="py-14 text-center text-slate-400 font-mono text-xs">
                <div className="w-6 h-6 border-2 border-t-transparent border-[#5C0612] rounded-full animate-spin mx-auto mb-2" />
                Loading booster schedule...
              </div>
            ) : filteredMatrixPets.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                No animals matched the active search or filter criteria.
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredMatrixPets.map((pet) => {
                    const analysis = getPetBoosterAnalysis(pet.pet_id);
                    const imgUrl = safeImageUrl(pet.primary_image);
                    const isDog = (pet.species || '').toLowerCase() === 'dog';
                    return (
                      <div
                        key={pet.pet_id}
                        className={`p-4 space-y-3 ${analysis.status === 'overdue' ? 'bg-rose-50/25' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={pet.name}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0 font-mono">
                                {pet.species?.[0] || 'P'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 text-sm truncate">{pet.name}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {pet.pet_id}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {pet.species} &bull; {pet.found_near || 'CIT-U Grounds'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">
                              Anti-Rabies
                            </span>
                            {analysis.latestRabies ? (
                              <span className="font-mono font-bold text-slate-800">
                                Due {analysis.latestRabies.next_due_date || 'N/A'}
                              </span>
                            ) : (
                              <span className="text-rose-600 font-medium">No Record</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">
                              Core Vaccine
                            </span>
                            {analysis.latestCore ? (
                              <span className="font-semibold text-slate-800 truncate block">
                                {analysis.latestCore.vaccine_name}
                              </span>
                            ) : (
                              <span className="text-slate-400">{isDog ? 'Pending DHPP' : 'Pending FVRCP'}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border ${analysis.badgeClass}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                analysis.status === 'overdue'
                                  ? 'bg-rose-600'
                                  : analysis.status === 'duesoon'
                                  ? 'bg-amber-500'
                                  : analysis.status === 'uptodate'
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {analysis.label}
                          </span>

                          <button
                            type="button"
                            onClick={() => jumpToInoculatePet(pet, 'rabies')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 ${
                              analysis.status === 'overdue'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : analysis.status === 'duesoon'
                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                : 'bg-slate-900 hover:bg-black text-white'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Log Dose
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Campus Zone</th>
                        <th className="py-3 px-4">Anti-Rabies (RA 9482)</th>
                        <th className="py-3 px-4">Core Vaccine</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredMatrixPets.map((pet) => {
                        const analysis = getPetBoosterAnalysis(pet.pet_id);
                        const isDog = (pet.species || '').toLowerCase() === 'dog';
                        const imgUrl = safeImageUrl(pet.primary_image);
                        return (
                          <tr
                            key={pet.pet_id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              analysis.status === 'overdue' ? 'bg-rose-50/20' : ''
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
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
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                      {pet.pet_id}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                                    {pet.species} &bull; {pet.gender} &bull; {pet.breed || 'Mix'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-800 block">
                                {pet.found_near || 'CIT-U Grounds'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {pet.feeding_area || 'Campus Feeding Station'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {analysis.latestRabies ? (
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                                      Due: {analysis.latestRabies.next_due_date || 'No Date'}
                                    </span>
                                    {analysis.rabiesDays !== null && (
                                      <span
                                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                          analysis.rabiesDays < 0
                                            ? 'bg-rose-100 text-rose-800'
                                            : analysis.rabiesDays <= 30
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                      >
                                        {analysis.rabiesDays < 0
                                          ? `${Math.abs(analysis.rabiesDays)}d overdue`
                                          : `${analysis.rabiesDays}d left`}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    Given: {analysis.latestRabies.administered_date}{' '}
                                    {analysis.latestRabies.batch_lot_number
                                      ? `(${analysis.latestRabies.batch_lot_number})`
                                      : ''}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                  No Rabies Record
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {analysis.latestCore ? (
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-slate-800 text-[11px] block">
                                    {analysis.latestCore.vaccine_name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    Due: {analysis.latestCore.next_due_date || 'N/A'} &bull; Given:{' '}
                                    {analysis.latestCore.administered_date}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">
                                  {isDog ? 'Pending DHPP 5-in-1' : 'Pending FVRCP'}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border ${analysis.badgeClass}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    analysis.status === 'overdue'
                                      ? 'bg-rose-600'
                                      : analysis.status === 'duesoon'
                                      ? 'bg-amber-500'
                                      : analysis.status === 'uptodate'
                                      ? 'bg-emerald-500'
                                      : 'bg-slate-400'
                                  }`}
                                />
                                {analysis.label}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => jumpToInoculatePet(pet, 'rabies')}
                                className={`px-3 py-1.5 rounded-xl font-bold font-mono text-[10px] transition-all inline-flex items-center gap-1.5 uppercase tracking-wider ${
                                  analysis.status === 'overdue'
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                                    : analysis.status === 'duesoon'
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                                    : 'bg-slate-900 hover:bg-black text-white shadow-sm'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                                Log Dose
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Medical Record Modal */}
      {editingMedLog && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !savingRecordEdit && setEditingMedLog(null)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => {
              e.preventDefault();
              if (savingRecordEdit) return;
              setEditRecordError('');
              setSavingRecordEdit(true);
              const res = await apiPut(
                `/medical/record/${encodeURIComponent(editingMedLog.record_id)}/`,
                {
                  log_date: editingMedLog.log_date,
                  next_followup_date: editingMedLog.next_followup_date || null,
                  notes: editingMedLog.notes,
                  medication_prescribed: editingMedLog.medication_prescribed,
                  weight_at_log: editingMedLog.weight_at_log,
                  veterinarian: editingMedLog.veterinarian,
                }
              );
              setSavingRecordEdit(false);
              if (res.ok) {
                setEditingMedLog(null);
                fetchMedicalLogsForTarget(selectedMedicalPetId);
                if (onRefresh) onRefresh();
              } else {
                setEditRecordError(res.error || 'Unable to update medical record.');
              }
            }}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-md w-full p-5 space-y-3.5 text-left animate-scale-up"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Edit Clinical Record #{editingMedLog.record_id}</h3>
              <button
                type="button"
                onClick={() => setEditingMedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editRecordError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {editRecordError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Log Date</label>
                <input
                  type="date"
                  value={editingMedLog.log_date}
                  onChange={(e) => setEditingMedLog((p) => ({ ...p, log_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Next Follow-Up</label>
                <input
                  type="date"
                  value={editingMedLog.next_followup_date}
                  onChange={(e) => setEditingMedLog((p) => ({ ...p, next_followup_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Weight</label>
                <input
                  type="text"
                  value={editingMedLog.weight_at_log}
                  onChange={(e) => setEditingMedLog((p) => ({ ...p, weight_at_log: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Clinician</label>
                <input
                  type="text"
                  value={editingMedLog.veterinarian}
                  onChange={(e) => setEditingMedLog((p) => ({ ...p, veterinarian: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Medication Prescribed</label>
              <input
                type="text"
                value={editingMedLog.medication_prescribed}
                onChange={(e) => setEditingMedLog((p) => ({ ...p, medication_prescribed: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Clinical Notes</label>
              <textarea
                rows="3"
                required
                value={editingMedLog.notes}
                onChange={(e) => setEditingMedLog((p) => ({ ...p, notes: e.target.value }))}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setEditingMedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingRecordEdit}
                className="px-4 py-2 rounded-xl bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-50 text-white font-semibold text-xs"
              >
                {savingRecordEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Vaccination Log Modal */}
      {editingVacLog && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !savingRecordEdit && setEditingVacLog(null)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => {
              e.preventDefault();
              if (savingRecordEdit) return;
              setEditRecordError('');
              setSavingRecordEdit(true);
              const res = await apiPut(
                `/vaccinations/record/${encodeURIComponent(editingVacLog.log_id)}/`,
                {
                  vaccine_name: editingVacLog.vaccine_name,
                  administered_date: editingVacLog.administered_date,
                  next_due_date: editingVacLog.next_due_date || null,
                  batch_lot_number: editingVacLog.batch_lot_number,
                  weight_at_vaccination: editingVacLog.weight_at_vaccination,
                  administered_by: editingVacLog.administered_by,
                }
              );
              setSavingRecordEdit(false);
              if (res.ok) {
                setEditingVacLog(null);
                fetchMedicalLogsForTarget(selectedMedicalPetId);
                fetchAllVaccinations();
                if (onRefresh) onRefresh();
              } else {
                setEditRecordError(res.error || 'Unable to update vaccination record.');
              }
            }}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-md w-full p-5 space-y-3.5 text-left animate-scale-up"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Edit Vaccination Log #{editingVacLog.log_id}</h3>
              <button
                type="button"
                onClick={() => setEditingVacLog(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editRecordError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {editRecordError}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Vaccine Name</label>
              <input
                type="text"
                required
                value={editingVacLog.vaccine_name}
                onChange={(e) => setEditingVacLog((p) => ({ ...p, vaccine_name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Date Given</label>
                <input
                  type="date"
                  value={editingVacLog.administered_date}
                  onChange={(e) => setEditingVacLog((p) => ({ ...p, administered_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Next Booster Due</label>
                <input
                  type="date"
                  value={editingVacLog.next_due_date}
                  onChange={(e) => setEditingVacLog((p) => ({ ...p, next_due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Batch / Lot #</label>
                <input
                  type="text"
                  value={editingVacLog.batch_lot_number}
                  onChange={(e) => setEditingVacLog((p) => ({ ...p, batch_lot_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Administered By</label>
                <input
                  type="text"
                  value={editingVacLog.administered_by}
                  onChange={(e) => setEditingVacLog((p) => ({ ...p, administered_by: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setEditingVacLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingRecordEdit}
                className="px-4 py-2 rounded-xl bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-50 text-white font-semibold text-xs"
              >
                {savingRecordEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
