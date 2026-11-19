import { useState, useEffect, useCallback } from 'react';

const ALLOWED_LOCATIONS = [
  "Wildcat Innovation Labs",
  "NGE Building 1st Floor",
  "GLE Building 1st Floor",
  "Espacio",
  "CIT-U Basketball Court",
  "CIT-U Canteen",
  "SAL Building",
  "CIT-U Gymnasium",
  "Elementary Building"
];

function matchAllowedLocation(rawLoc) {
  if (!rawLoc) return ALLOWED_LOCATIONS[0];
  const s = rawLoc.toLowerCase();
  if (s.includes('wildcat') || s.includes('innovation') || s.includes('lab')) return "Wildcat Innovation Labs";
  if (s.includes('nge')) return "NGE Building 1st Floor";
  if (s.includes('gle') || s.includes('science')) return "GLE Building 1st Floor";
  if (s.includes('espacio')) return "Espacio";
  if (s.includes('court') || s.includes('basketball')) return "CIT-U Basketball Court";
  if (s.includes('canteen') || s.includes('engineering') || s.includes('cafeteria')) return "CIT-U Canteen";
  if (s.includes('sal')) return "SAL Building";
  if (s.includes('gym') || s.includes('gymnasium')) return "CIT-U Gymnasium";
  if (s.includes('elementary') || s.includes('high school')) return "Elementary Building";
  return ALLOWED_LOCATIONS.includes(rawLoc) ? rawLoc : ALLOWED_LOCATIONS[0];
}

function consumeStrayHandoff() {
  try {
    const raw = sessionStorage.getItem('tfb_stray_handoff');
    if (raw) {
      sessionStorage.removeItem('tfb_stray_handoff');
      return JSON.parse(raw);
    }
  } catch {
    // Ignore malformed handoff payload
  }
  return null;
}

function getPrefixForClassification(petType) {
  const s = (petType || '').toLowerCase();
  if (s.includes('stray')) return 'STRAY';
  if (s.includes('adopt')) return 'ADOPT';
  return 'PET';
}

function computeNextPetIdPreview(petType, existingIds) {
  const prefix = getPrefixForClassification(petType);
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  let maxNum = 0;
  for (const pid of existingIds) {
    const match = pattern.exec(String(pid || '').trim());
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}

export default function AddNewPet({ onRefresh }) {
  const [initialHandoff] = useState(() => consumeStrayHandoff());
  const [handedOffImageUrl, setHandedOffImageUrl] = useState(() => initialHandoff?.image_url || '');
  const [existingPetIds, setExistingPetIds] = useState([]);

  const [newPetForm, setNewPetForm] = useState(() => ({
    name: '',
    species: initialHandoff?.species || 'Cat',
    pet_type: initialHandoff ? 'Stray' : 'Campus Pet',
    breed: '',
    gender: 'Male',
    age: '',
    weight: '',
    size: 'Small',
    found_near: initialHandoff ? matchAllowedLocation(initialHandoff.found_near) : 'Wildcat Innovation Labs',
    rescue_date: new Date().toISOString().split('T')[0],
    current_conditions: 'None',
    behavior_notes: 'Friendly',
    about_text: initialHandoff?.sighting_id ? `Admitted via Sighting Report #${initialHandoff.sighting_id}.` : '',
    description: initialHandoff?.description || ''
  }));

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(() => initialHandoff?.image_url || null);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchExistingIds = useCallback(async () => {
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/pets/');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setExistingPetIds(data.map((p) => p.pet_id).filter(Boolean));
        }
      }
    } catch {
      // Preview falls back to -001 if offline; server remains authoritative
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadIds = async () => {
      try {
        const res = await fetch('https://taskforcebruno.onrender.com/api/pets/');
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setExistingPetIds(data.map((p) => p.pet_id).filter(Boolean));
          }
        }
      } catch {
        // Ignore preview fetch errors
      }
    };
    loadIds();
    return () => {
      cancelled = true;
    };
  }, []);

  // Revoke locally created blob URLs on change or unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const isStrayClassification = newPetForm.pet_type === 'Stray';
  const nextAutoPetId = computeNextPetIdPreview(newPetForm.pet_type, existingPetIds);

  const calculateSizeCategory = (weightVal) => {
    const num = parseFloat(weightVal);
    if (isNaN(num) || num <= 0) return 'Small';
    if (num < 10) return 'Small';
    if (num <= 25) return 'Medium';
    return 'Large';
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    if (name === 'weight') {
      const calculatedSize = calculateSizeCategory(value);
      setNewPetForm(prev => ({
        ...prev,
        weight: value,
        size: calculatedSize
      }));
    } else {
      setNewPetForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setHandedOffImageUrl('');
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    const weightNum = parseFloat(newPetForm.weight);
    if (newPetForm.weight !== '' && (Number.isNaN(weightNum) || weightNum <= 0)) {
      setFormMessage({ type: 'error', text: 'Please enter a valid positive weight in kg.' });
      return;
    }

    if (!isStrayClassification && !newPetForm.name.trim()) {
      setFormMessage({ type: 'error', text: 'Please provide the animal name.' });
      return;
    }

    setSubmitting(true);

    const multiPartFormPayload = new FormData();
    const massValueString = newPetForm.weight.toString().trim();
    const formattedWeightPayload = massValueString ? `${massValueString} kg` : 'Unknown';

    const finalizedSpecies = newPetForm.species;
    const finalizedPetType = newPetForm.pet_type;
    const derivedAdoptionStatus =
      finalizedPetType === 'Pet for Adoption'
        ? 'Available'
        : finalizedPetType === 'Stray'
        ? 'Stray'
        : 'Campus Pet';

    multiPartFormPayload.append('name', newPetForm.name.trim());
    multiPartFormPayload.append('species', finalizedSpecies);
    multiPartFormPayload.append('pet_type', finalizedPetType);
    multiPartFormPayload.append(
      'breed',
      newPetForm.breed.trim() || (isStrayClassification ? `Stray ${finalizedSpecies}` : 'Domestic Mix')
    );
    multiPartFormPayload.append('gender', newPetForm.gender);
    multiPartFormPayload.append('age', newPetForm.age.trim() || 'Unknown');
    multiPartFormPayload.append('weight', formattedWeightPayload);
    multiPartFormPayload.append('size', newPetForm.size);
    multiPartFormPayload.append('adoption_status', derivedAdoptionStatus);
    multiPartFormPayload.append('found_near', newPetForm.found_near.trim());
    multiPartFormPayload.append('rescue_date', newPetForm.rescue_date);
    multiPartFormPayload.append('current_conditions', newPetForm.current_conditions.trim() || 'None');
    multiPartFormPayload.append('behavior_notes', newPetForm.behavior_notes.trim() || 'Friendly');
    multiPartFormPayload.append('about_text', newPetForm.about_text.trim());
    multiPartFormPayload.append('description', newPetForm.description.trim());

    if (imageFile) {
      multiPartFormPayload.append('image', imageFile);
    } else if (handedOffImageUrl) {
      multiPartFormPayload.append('primary_image', handedOffImageUrl);
    }

    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/pets/', {
        method: 'POST',
        body: multiPartFormPayload
      });

      if (res.ok) {
        const createdPet = await res.json().catch(() => ({}));
        const assignedId = createdPet.pet_id || nextAutoPetId;
        const assignedName = createdPet.name || newPetForm.name.trim() || 'Animal';
        const condClean = (newPetForm.current_conditions || '').trim().toLowerCase();
        const conditionWasLogged = condClean && !['none', 'n/a', 'healthy', 'normal', '-'].includes(condClean);

        setFormMessage({
          type: 'success',
          text: `Animal profile registered for ${assignedName} (${assignedId})!${conditionWasLogged ? ' Intake medical condition was automatically logged to Medical Logs.' : ''}`
        });
        setNewPetForm({
          name: '',
          species: 'Cat',
          pet_type: 'Campus Pet',
          breed: '',
          gender: 'Male',
          age: '',
          weight: '',
          size: 'Small',
          found_near: 'Wildcat Innovation Labs',
          rescue_date: new Date().toISOString().split('T')[0],
          current_conditions: 'None',
          behavior_notes: 'Friendly',
          about_text: '',
          description: ''
        });
        setImageFile(null);
        setHandedOffImageUrl('');
        setImagePreviewUrl(null);
        if (e.target) e.target.reset();
        fetchExistingIds();
        if (onRefresh) onRefresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setFormMessage({ type: 'error', text: errorData.error || 'Failed to register animal record.' });
      }
    } catch {
      setFormMessage({ type: 'error', text: 'Network connection failure with animal registry server.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-xs text-slate-700 animate-fade-in pb-12">
      
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
            Animal Registry Intake Portal
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Register campus pets, adoption rescues, or unidentified strays with auto-assigned sequential IDs and clinical audit integrity.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl font-mono text-[10px] shrink-0">
          <span className="text-slate-400 uppercase font-bold">Auto-Assigned ID:</span>
          <span className="font-black text-[#5C0612] tracking-wider">{nextAutoPetId}</span>
        </div>
      </div>

      {formMessage.text && (
        <div className={`p-4 border rounded-2xl text-xs font-medium ${
          formMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {formMessage.text}
        </div>
      )}

      {/* Main Two-Column Layout (Form on Left, Live Card Preview on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: COMPREHENSIVE INTAKE FORM (8 COLS) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 shadow-sm rounded-3xl p-5 md:p-6 text-left">
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            
            {/* 1. Identity & Classification */}
            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                1. Identification & Classification
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Classification Status *
                  </label>
                  <select
                    name="pet_type"
                    value={newPetForm.pet_type}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 font-semibold"
                  >
                    <option value="Campus Pet">Campus Pet (PET-###)</option>
                    <option value="Pet for Adoption">Pet for Adoption (ADOPT-###)</option>
                    <option value="Stray">Stray (STRAY-###)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Auto-Assigned Pet ID
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={nextAutoPetId}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-xs text-[#5C0612] cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Species *
                  </label>
                  <select
                    name="species"
                    value={newPetForm.species}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 font-semibold"
                  >
                    <option value="Cat">Cat (Feline)</option>
                    <option value="Dog">Dog (Canine)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Animal Name {isStrayClassification ? '(Optional)' : '*'}
                  </label>
                  <input
                    type="text"
                    required={!isStrayClassification}
                    name="name"
                    value={newPetForm.name}
                    onChange={handleCreateChange}
                    placeholder={isStrayClassification ? 'Auto-generates Stray # if blank' : 'e.g. Bruno'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Breed / Physical Strain
                  </label>
                  <input
                    type="text"
                    name="breed"
                    value={newPetForm.breed}
                    onChange={handleCreateChange}
                    placeholder="e.g. Domestic Shorthair, Aspin"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={newPetForm.gender}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Biometrics & Sizing */}
            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                2. Biometrics & Sizing
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Approximate Age
                  </label>
                  <input
                    type="text"
                    name="age"
                    value={newPetForm.age}
                    onChange={handleCreateChange}
                    placeholder="e.g. 2 years, 6 months"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    name="weight"
                    value={newPetForm.weight}
                    onChange={handleCreateChange}
                    placeholder="e.g. 4.5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Size Category (Auto)
                  </label>
                  <select
                    name="size"
                    value={newPetForm.size}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold cursor-not-allowed opacity-90 select-none"
                  >
                    <option value="Small">Small (&lt; 10 kg)</option>
                    <option value="Medium">Medium (10 - 25 kg)</option>
                    <option value="Large">Large (&gt; 25 kg)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[#5C0612] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <span>
                  <strong>Clinical Record Integrity:</strong> Newly registered animals start as <strong>Not Vaccinated</strong> and <strong>Not Sterilized</strong>. Log their active <strong>Anti-Rabies Vaccine</strong> or <strong>Spay / Neuter (TNR)</strong> record in <em>Medical Logs</em> to automatically update their verified badges.
                </span>
              </div>
            </div>

            {/* 3. Campus Location & Rescue Context */}
            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                3. Campus Colony Location & Rescue Record
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Campus Colony Zone *
                  </label>
                  <select
                    name="found_near"
                    value={newPetForm.found_near}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                  >
                    {ALLOWED_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Intake / Rescue Date
                  </label>
                  <input
                    type="date"
                    name="rescue_date"
                    value={newPetForm.rescue_date}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* 4. Medical Notes, Bio & Search Description */}
            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                4. Descriptive Narrative & AI Search Match Keys
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Current Medical Conditions
                  </label>
                  <input
                    type="text"
                    name="current_conditions"
                    value={newPetForm.current_conditions}
                    onChange={handleCreateChange}
                    placeholder="e.g. None, Minor coat dermatitis, Limping left paw"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Any condition entered (other than None) is automatically logged in Medical Logs.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Behavioral Assessment Notes *
                  </label>
                  <select
                    name="behavior_notes"
                    value={newPetForm.behavior_notes}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 font-medium"
                  >
                    <option value="Friendly">Friendly</option>
                    <option value="Not Friendly">Not Friendly</option>
                    <option value="Friendly but be cautious">Friendly but be cautious</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Narrative Biography Summary
                  </label>
                  <textarea
                    rows="3"
                    name="about_text"
                    value={newPetForm.about_text}
                    onChange={handleCreateChange}
                    placeholder="Provide a warm introductory bio for student engagement..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 leading-relaxed resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#5C0612] uppercase tracking-wider mb-1">
                    Physical Search Description (AI Sighting Matching) *
                  </label>
                  <textarea
                    rows="3"
                    required
                    name="description"
                    value={newPetForm.description}
                    onChange={handleCreateChange}
                    placeholder="List distinct visual traits (e.g. orange tabby with white paws, notched left ear, blue collar)..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Photo Upload Input */}
              <div className="bg-slate-50 p-4 border border-dashed border-slate-200 rounded-2xl">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Primary Profile Photograph
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-slate-500 font-mono text-[11px] file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-mono file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 file:cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-[#5C0612] hover:bg-[#42040B] text-white font-bold rounded-xl border-b-2 border-[#D4AF37] shadow-md transition-all text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {submitting ? 'Registering Animal File...' : 'Complete Registration & Save Record'}
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: LIVE PET CARD PREVIEW (4 COLS - STICKY) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4 text-left">
          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
            Live Public Card Preview
          </span>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm transition-all hover:shadow-md">
            {/* Image Preview Container */}
            <div className="w-full h-52 bg-slate-100 relative overflow-hidden flex items-center justify-center">
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt="Pet Preview"
                  className="w-full h-full object-cover animate-fade-in"
                />
              ) : (
                <div className="text-center text-slate-400 space-y-1">
                  <svg className="w-10 h-10 mx-auto text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1.75 0Z" />
                  </svg>
                  <p className="text-[10px] font-mono uppercase font-bold text-slate-400">Photo Preview</p>
                </div>
              )}

              <div className="absolute top-3 left-3 bg-[#5C0612] text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded-lg border border-[#D4AF37]/40 shadow-sm">
                {nextAutoPetId}
              </div>

              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-slate-800 font-mono text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                {newPetForm.pet_type}
              </div>
            </div>

            {/* Preview Card Body */}
            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">
                    {newPetForm.name || (isStrayClassification ? `Stray ${newPetForm.species}` : 'Animal Name')}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {newPetForm.gender} &bull; {newPetForm.age || 'Age Unknown'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {newPetForm.species} &bull; {newPetForm.breed || (isStrayClassification ? `Stray ${newPetForm.species}` : 'Domestic Mix')}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                  {newPetForm.found_near}
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Not Vaccinated
                </span>
              </div>

              {newPetForm.about_text && (
                <p className="text-[11px] text-slate-600 italic line-clamp-3 leading-relaxed border-t border-slate-100 pt-2">
                  "{newPetForm.about_text}"
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
