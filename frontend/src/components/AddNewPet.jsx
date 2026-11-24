import { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Info, Plus } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import { getLocalTodayIso } from '../lib/dates';
import {
  CAMPUS_LOCATIONS,
  calculateSizeCategory,
  normalizeCampusLocation,
  safeImageUrl,
} from '../lib/pets';

const MAX_IMAGE_MB = 5;

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
    found_near: initialHandoff
      ? normalizeCampusLocation(initialHandoff.found_near)
      : CAMPUS_LOCATIONS[0],
    rescue_date: getLocalTodayIso(),
    current_conditions: 'None',
    behavior_notes: 'Friendly',
    about_text: initialHandoff?.sighting_id
      ? `Admitted from Sighting Report #${initialHandoff.sighting_id}.`
      : '',
    description: initialHandoff?.description || '',
  }));

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(() => initialHandoff?.image_url || null);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchExistingIds = useCallback(async () => {
    const res = await apiGet('/pets/');
    if (res.ok && Array.isArray(res.data)) {
      setExistingPetIds(res.data.map((p) => p.pet_id).filter(Boolean));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadIds = async () => {
      const res = await apiGet('/pets/', { signal: controller.signal });
      if (!controller.signal.aborted && res.ok && Array.isArray(res.data)) {
        setExistingPetIds(res.data.map((p) => p.pet_id).filter(Boolean));
      }
    };
    loadIds();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const isStrayClassification = newPetForm.pet_type === 'Stray';
  const nextAutoPetId = computeNextPetIdPreview(newPetForm.pet_type, existingPetIds);

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    if (name === 'weight') {
      setNewPetForm((prev) => ({
        ...prev,
        weight: value,
        size: calculateSizeCategory(value),
      }));
    } else {
      setNewPetForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setFormMessage({
        type: 'error',
        text: `Image is too large. Please choose a photo under ${MAX_IMAGE_MB} MB.`,
      });
      e.target.value = '';
      return;
    }
    setFormMessage({ type: '', text: '' });
    setImageFile(file);
    setHandedOffImageUrl('');
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setFormMessage({ type: '', text: '' });

    const weightNum = parseFloat(newPetForm.weight);
    if (newPetForm.weight !== '' && (Number.isNaN(weightNum) || weightNum <= 0)) {
      setFormMessage({ type: 'error', text: 'Please enter a valid positive weight in kg.' });
      return;
    }

    if (!isStrayClassification && !newPetForm.name.trim()) {
      setFormMessage({ type: 'error', text: 'Please enter the animal name.' });
      return;
    }

    setSubmitting(true);
    const payload = new FormData();
    const massStr = newPetForm.weight.toString().trim();
    const derivedAdoptionStatus = newPetForm.pet_type === 'Campus Pet' ? 'Campus Pet' : 'Available';

    payload.append('name', newPetForm.name.trim());
    payload.append('species', newPetForm.species);
    payload.append('pet_type', newPetForm.pet_type);
    payload.append(
      'breed',
      newPetForm.breed.trim() ||
        (isStrayClassification ? `Stray ${newPetForm.species}` : 'Domestic Mix')
    );
    payload.append('gender', newPetForm.gender);
    payload.append('age', newPetForm.age.trim() || 'Unknown');
    payload.append('weight', massStr ? `${massStr} kg` : 'Unknown');
    payload.append('size', newPetForm.size);
    payload.append('adoption_status', derivedAdoptionStatus);
    payload.append('found_near', newPetForm.found_near.trim());
    payload.append('rescue_date', newPetForm.rescue_date);
    payload.append('current_conditions', newPetForm.current_conditions.trim() || 'None');
    payload.append('behavior_notes', newPetForm.behavior_notes.trim() || 'Friendly');
    payload.append('about_text', newPetForm.about_text.trim());
    payload.append('description', newPetForm.description.trim());

    if (imageFile) {
      payload.append('image', imageFile);
    } else if (handedOffImageUrl) {
      payload.append('primary_image', handedOffImageUrl);
    }

    const res = await apiPost('/pets/', payload);
    if (res.ok) {
      const createdPet = res.data || {};
      const assignedId = createdPet.pet_id || nextAutoPetId;
      const assignedName = createdPet.name || newPetForm.name.trim() || 'Animal';
      const condClean = (newPetForm.current_conditions || '').trim().toLowerCase();
      const conditionWasLogged =
        condClean && !['none', 'n/a', 'healthy', 'normal', '-'].includes(condClean);

      setFormMessage({
        type: 'success',
        text: `Registered ${assignedName} (${assignedId}).${
          conditionWasLogged ? ' Initial medical condition was also recorded in Medical Logs.' : ''
        }`,
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
        found_near: CAMPUS_LOCATIONS[0],
        rescue_date: getLocalTodayIso(),
        current_conditions: 'None',
        behavior_notes: 'Friendly',
        about_text: '',
        description: '',
      });
      setImageFile(null);
      setHandedOffImageUrl('');
      setImagePreviewUrl(null);
      if (e.target) e.target.reset();
      fetchExistingIds();
      if (onRefresh) onRefresh();
    } else {
      setFormMessage({
        type: 'error',
        text: res.error || 'Unable to register animal profile. Please check your entries.',
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 text-xs text-slate-700 pb-8">
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
            Register New Animal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add a campus pet, adoption rescue, or stray with an auto-assigned ID.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl font-mono text-xs shrink-0">
          <span className="text-slate-500 font-semibold">Next ID:</span>
          <span className="font-bold text-[#5C0612]">{nextAutoPetId}</span>
        </div>
      </div>

      {formMessage.text && (
        <div
          role="alert"
          className={`p-4 border rounded-2xl text-xs font-medium ${
            formMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {formMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Intake Form */}
        <div className="lg:col-span-8 bg-white border border-slate-200 shadow-xs rounded-2xl p-5 md:p-6 text-left">
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                1. Identity &amp; Classification
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Classification *
                  </label>
                  <select
                    name="pet_type"
                    value={newPetForm.pet_type}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm sm:text-xs font-medium"
                  >
                    <option value="Campus Pet">Campus Pet (PET-###)</option>
                    <option value="Pet for Adoption">Pet for Adoption (ADOPT-###)</option>
                    <option value="Stray">Stray (STRAY-###)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Assigned Tag ID
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={nextAutoPetId}
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-sm sm:text-xs text-[#5C0612] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Species *
                  </label>
                  <select
                    name="species"
                    value={newPetForm.species}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm sm:text-xs font-medium"
                  >
                    <option value="Cat">Cat</option>
                    <option value="Dog">Dog</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Name {isStrayClassification ? '(Optional)' : '*'}
                  </label>
                  <input
                    type="text"
                    required={!isStrayClassification}
                    name="name"
                    value={newPetForm.name}
                    onChange={handleCreateChange}
                    placeholder={isStrayClassification ? 'Auto-named if left blank' : 'e.g. Bruno'}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm sm:text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Breed</label>
                  <input
                    type="text"
                    name="breed"
                    value={newPetForm.breed}
                    onChange={handleCreateChange}
                    placeholder="e.g. Puspin, Aspin"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm sm:text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={newPetForm.gender}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm sm:text-xs font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                2. Size &amp; Physical Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Approximate Age
                  </label>
                  <input
                    type="text"
                    name="age"
                    value={newPetForm.age}
                    onChange={handleCreateChange}
                    placeholder="e.g. 2 years, 6 months"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm sm:text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
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
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono text-sm sm:text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Size Category (Auto)
                  </label>
                  <select
                    name="size"
                    value={newPetForm.size}
                    disabled
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm sm:text-xs text-slate-600 cursor-not-allowed"
                  >
                    <option value="Small">Small (&lt; 10 kg)</option>
                    <option value="Medium">Medium (10 - 25 kg)</option>
                    <option value="Large">Large (&gt; 25 kg)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#5C0612] shrink-0 mt-0.5" />
                <span>
                  New animals start as <strong>Not Vaccinated</strong> and <strong>Intact</strong>. Log
                  their Anti-Rabies vaccine or Spay/Neuter procedure in <em>Medical &amp; Vaccines</em> to
                  update their verified status automatically.
                </span>
              </div>
            </div>

            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                3. Campus Location &amp; Intake Date
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Campus Zone *
                  </label>
                  <select
                    name="found_near"
                    value={newPetForm.found_near}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm sm:text-xs"
                  >
                    {CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Intake / Rescue Date
                  </label>
                  <input
                    type="date"
                    name="rescue_date"
                    value={newPetForm.rescue_date}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono text-sm sm:text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                4. Medical Notes, Bio &amp; Visual Traits
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Initial Medical Conditions
                  </label>
                  <input
                    type="text"
                    name="current_conditions"
                    value={newPetForm.current_conditions}
                    onChange={handleCreateChange}
                    placeholder="e.g. None, mild skin rash, limping paw"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm sm:text-xs"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Any condition other than None is automatically logged in Medical Logs.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Temperament *
                  </label>
                  <select
                    name="behavior_notes"
                    value={newPetForm.behavior_notes}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm sm:text-xs font-medium"
                  >
                    <option value="Friendly">Friendly</option>
                    <option value="Not Friendly">Not Friendly</option>
                    <option value="Friendly but be cautious">Friendly but be cautious</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Short Biography
                  </label>
                  <textarea
                    rows="3"
                    name="about_text"
                    value={newPetForm.about_text}
                    onChange={handleCreateChange}
                    placeholder="Friendly intro shown on the community feed and adoption portal..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm sm:text-xs leading-relaxed resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5C0612] mb-1">
                    Visual Identification Traits *
                  </label>
                  <textarea
                    rows="3"
                    required
                    name="description"
                    value={newPetForm.description}
                    onChange={handleCreateChange}
                    placeholder="e.g. orange tabby with white paws, notched left ear, blue collar..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm sm:text-xs leading-relaxed resize-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 border border-dashed border-slate-300 rounded-2xl">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Profile Photo (JPG, PNG, or WebP — max 5 MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="w-full text-slate-600 text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 file:cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-7 py-3 bg-[#5C0612] hover:bg-[#42040B] text-white font-semibold rounded-xl border-b-2 border-[#D4AF37] shadow-sm transition-colors text-xs inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>{submitting ? 'Registering...' : 'Register Animal'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Card Preview */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-3 text-left">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Live Card Preview
          </span>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="w-full h-52 bg-slate-100 relative overflow-hidden flex items-center justify-center">
              {safeImageUrl(imagePreviewUrl) ? (
                <img
                  src={safeImageUrl(imagePreviewUrl)}
                  alt="Pet preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-slate-400 space-y-1.5">
                  <ImageIcon className="w-9 h-9 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-400">Photo Preview</p>
                </div>
              )}

              <span className="absolute top-3 left-3 bg-[#5C0612] text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#D4AF37]/40 shadow-sm">
                {nextAutoPetId}
              </span>

              <span className="absolute top-3 right-3 bg-white/95 text-slate-800 text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                {newPetForm.pet_type}
              </span>
            </div>

            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {newPetForm.name ||
                    (isStrayClassification ? `Stray ${newPetForm.species}` : 'Animal Name')}
                </h3>
                <span className="text-[11px] text-slate-500 shrink-0">
                  {newPetForm.gender} &bull; {newPetForm.age || 'Age unknown'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {newPetForm.species} &bull;{' '}
                {newPetForm.breed ||
                  (isStrayClassification ? `Stray ${newPetForm.species}` : 'Domestic Mix')}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {newPetForm.found_near}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Not Vaccinated
                </span>
              </div>

              {newPetForm.about_text && (
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed border-t border-slate-100 pt-2">
                  {newPetForm.about_text}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
