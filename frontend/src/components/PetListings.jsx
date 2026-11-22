import React, { useState, useEffect } from 'react';
import {
  Archive,
  ChevronRight,
  Download,
  Edit3,
  Printer,
  QrCode,
  RotateCcw,
  RotateCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { PUBLIC_APP_URL, apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import {
  CAMPUS_LOCATIONS,
  DEFAULT_PET_IMAGE,
  calculateSizeCategory,
  getCanonicalClassification,
  getVaccinationBadgeStyles,
  isCampusPet,
  isPetQuarantined,
  isStrayPet,
  normalizeCampusLocation,
  safeImageUrl,
} from '../lib/pets';
import { renderBrandedCollarTagPng } from '../lib/qr';

export default function PetListings({
  pets = [],
  loadingPets = false,
  loadError = '',
  onRefresh,
  readOnly = false,
  includeArchived = false,
  onToggleArchived,
}) {
  const [expandedPetId, setExpandedPetId] = useState(null);
  const [expandedPetData, setExpandedPetData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditingId, setIsEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [petIdToDelete, setPetIdToDelete] = useState(null);
  const [deletingPet, setDeletingPet] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLocationsExpanded, setIsLocationsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('All');
  const [qrTagModal, setQrTagModal] = useState({
    isOpen: false,
    pet: null,
    qrDataUrl: '',
    badgeDataUrl: '',
    targetUrl: '',
  });

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!deletingPet) setPetIdToDelete(null);
        setQrTagModal({ isOpen: false, pet: null, qrDataUrl: '', badgeDataUrl: '', targetUrl: '' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deletingPet]);

  const handleGenerateQrTag = async (pet) => {
    try {
      const targetUrl = `${PUBLIC_APP_URL}/?pet=${encodeURIComponent(pet.pet_id)}`;
      const { qrDataUrl, badgeDataUrl } = await renderBrandedCollarTagPng(pet, targetUrl);
      setQrTagModal({ isOpen: true, pet, qrDataUrl, badgeDataUrl, targetUrl });
    } catch {
      setErrorMessage('Could not generate the collar QR tag. Please try again.');
    }
  };

  const handleRowClick = async (petId) => {
    if (isEditingId) return;
    if (expandedPetId === petId) {
      setExpandedPetId(null);
      setExpandedPetData(null);
      return;
    }
    setExpandedPetId(petId);
    setExpandedPetData(null);
    setLoadingDetails(true);
    const res = await apiGet(`/pets/${encodeURIComponent(petId)}/`);
    if (res.ok && res.data) {
      setExpandedPetData(res.data);
    }
    setLoadingDetails(false);
  };

  const startEditing = (pet) => {
    if (readOnly) return;
    setIsEditingId(pet.pet_id);
    const numericWeight = pet.weight ? pet.weight.toString().replace(/[^0-9.]/g, '') : '';
    const initialSize = pet.size || calculateSizeCategory(numericWeight);
    const canonicalType = getCanonicalClassification(pet);
    const derivedStatus =
      pet.adoption_status === 'Adopted'
        ? 'Adopted'
        : canonicalType === 'Campus Pet'
        ? 'Campus Pet'
        : 'Available';
    setEditFormData({
      ...pet,
      pet_type: canonicalType,
      adoption_status: derivedStatus,
      weight: numericWeight,
      size: initialSize,
      found_near: normalizeCampusLocation(pet.found_near, pet.pet_id),
      behavior_notes: pet.behavior_notes || 'Friendly',
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedValue = type === 'checkbox' ? checked : value;

    if (name === 'weight') {
      setEditFormData((prev) => ({
        ...prev,
        weight: updatedValue,
        size: calculateSizeCategory(updatedValue),
      }));
    } else if (name === 'pet_type') {
      const nextStatus = updatedValue === 'Campus Pet' ? 'Campus Pet' : 'Available';
      setEditFormData((prev) => ({
        ...prev,
        pet_type: updatedValue,
        adoption_status: prev.adoption_status === 'Adopted' ? 'Adopted' : nextStatus,
      }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: updatedValue }));
    }
  };

  const submitUpdatePatch = async (e) => {
    e.preventDefault();
    if (readOnly || savingEdit) return;
    setErrorMessage('');

    const {
      is_quarantined: _q,
      quarantine_until: _qu,
      quarantine_expiry_date: _qe,
      created_at: _ca,
      pet_id: _pid,
      vaccination_status: _vs,
      spayed_neutered: _sn,
      ...cleanFormFields
    } = editFormData;
    void _q;
    void _qu;
    void _qe;
    void _ca;
    void _pid;
    void _vs;
    void _sn;

    const canonicalType = editFormData.pet_type || 'Campus Pet';
    const derivedStatus =
      editFormData.adoption_status === 'Adopted'
        ? 'Adopted'
        : canonicalType === 'Campus Pet'
        ? 'Campus Pet'
        : 'Available';

    const finalizedPayload = {
      ...cleanFormFields,
      pet_type: canonicalType,
      adoption_status: derivedStatus,
      weight: editFormData.weight ? `${editFormData.weight.toString().trim()} kg` : 'N/A',
    };

    setSavingEdit(true);
    const res = await apiPut(`/pets/${encodeURIComponent(isEditingId)}/`, finalizedPayload);
    if (res.ok) {
      if (res.data && expandedPetId === isEditingId) {
        setExpandedPetData((prev) => ({ ...prev, ...res.data }));
      }
      setIsEditingId(null);
      if (onRefresh) onRefresh();
    } else {
      setErrorMessage(res.error || 'Failed to save changes.');
    }
    setSavingEdit(false);
  };

  const handleDeletePet = async (permanent = false) => {
    if (readOnly || !petIdToDelete || deletingPet) return;
    setErrorMessage('');
    setDeletingPet(true);

    const url = permanent
      ? `/pets/${encodeURIComponent(petIdToDelete)}/?permanent=true`
      : `/pets/${encodeURIComponent(petIdToDelete)}/`;
    const res = await apiDelete(url);
    if (res.ok) {
      setPetIdToDelete(null);
      setExpandedPetId(null);
      if (onRefresh) onRefresh();
    } else {
      setErrorMessage(res.error || 'Failed to archive animal profile.');
    }
    setDeletingPet(false);
  };

  const handleRestorePet = async (petId) => {
    if (readOnly || !petId) return;
    setErrorMessage('');
    const res = await apiPost(`/pets/${encodeURIComponent(petId)}/restore/`, {});
    if (res.ok) {
      if (onRefresh) onRefresh();
    } else {
      setErrorMessage(res.error || 'Failed to restore animal profile.');
    }
  };

  const requestSortAction = (columnKey) => {
    setSortConfig((prev) => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const applySort = (items) => {
    if (!sortConfig.key) return items;
    return [...items].sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';

      if (sortConfig.key === 'weight') {
        aVal = parseFloat(aVal.toString().replace(/[^0-9.]/g, '')) || 0;
        bVal = parseFloat(bVal.toString().replace(/[^0-9.]/g, '')) || 0;
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const renderSortArrow = (columnKey) => {
    if (sortConfig.key !== columnKey) return <span className="text-slate-300 ml-1">↕</span>;
    return sortConfig.direction === 'asc' ? (
      <span className="text-[#5C0612] ml-1">▲</span>
    ) : (
      <span className="text-[#5C0612] ml-1">▼</span>
    );
  };

  const filteredPets = pets.filter((pet) => {
    if (speciesFilter !== 'All' && (pet.species || '').toLowerCase() !== speciesFilter.toLowerCase()) {
      return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (pet.name || '').toLowerCase().includes(q) ||
      (pet.pet_id || '').toLowerCase().includes(q) ||
      (pet.breed || '').toLowerCase().includes(q) ||
      (pet.found_near || '').toLowerCase().includes(q)
    );
  });

  const adoptedAlumniPets = filteredPets.filter((p) => p.adoption_status === 'Adopted');
  const strayPetsCollection = filteredPets.filter(
    (p) => p.adoption_status !== 'Adopted' && isStrayPet(p)
  );
  const activeUnadoptedPets = filteredPets.filter(
    (p) => p.adoption_status !== 'Adopted' && !isStrayPet(p)
  );

  const sortedActiveCollection = applySort(activeUnadoptedPets);
  const sortedAdoptedCollection = applySort(adoptedAlumniPets);
  const sortedStrayCollection = applySort(strayPetsCollection);

  // Metrics calculated from all active campus animals
  const activePets = pets.filter((p) => p.adoption_status !== 'Adopted');
  const totalPetsCount = activePets.length;
  const totalCatsCount = activePets.filter((p) => p.species?.toLowerCase() === 'cat').length;
  const totalDogsCount = activePets.filter((p) => p.species?.toLowerCase() === 'dog').length;
  const totalNeuteredCount = activePets.filter(
    (p) => p.spayed_neutered === true || String(p.spayed_neutered).toLowerCase() === 'true'
  ).length;
  const totalFullyVaccinatedCount = activePets.filter((p) =>
    (p.vaccination_status || '').toLowerCase().includes('fully')
  ).length;
  const totalCoreOnlyCount = activePets.filter((p) => {
    const s = (p.vaccination_status || '').toLowerCase();
    return s.includes('core') || s.includes('partial');
  }).length;
  const totalUnprotectedCount = activePets.filter((p) => {
    const s = (p.vaccination_status || '').toLowerCase();
    return !s.includes('fully') && !s.includes('core') && !s.includes('partial');
  }).length;

  const catPercentage = totalPetsCount > 0 ? (totalCatsCount / totalPetsCount) * 100 : 0;
  const dogPercentage = totalPetsCount > 0 ? (totalDogsCount / totalPetsCount) * 100 : 0;
  const neuteredPercentage = totalPetsCount > 0 ? (totalNeuteredCount / totalPetsCount) * 100 : 0;
  const fullyVaccinatedPercentage =
    totalPetsCount > 0 ? (totalFullyVaccinatedCount / totalPetsCount) * 100 : 0;
  const coreOnlyPercentage = totalPetsCount > 0 ? (totalCoreOnlyCount / totalPetsCount) * 100 : 0;
  const unprotectedPercentage =
    totalPetsCount > 0 ? (totalUnprotectedCount / totalPetsCount) * 100 : 0;

  const locationCounts = CAMPUS_LOCATIONS.reduce((acc, loc) => {
    acc[loc] = 0;
    return acc;
  }, {});

  activePets.forEach((pet) => {
    const normLoc = normalizeCampusLocation(pet.found_near, pet.pet_id);
    if (locationCounts[normLoc] !== undefined) {
      locationCounts[normLoc] += 1;
    }
  });

  const maxZoneCount = Math.max(...Object.values(locationCounts), 1);
  const densestZone = Object.keys(locationCounts).reduce(
    (a, b) => (locationCounts[a] >= locationCounts[b] ? a : b),
    CAMPUS_LOCATIONS[0]
  );

  const sortedLocationsData = CAMPUS_LOCATIONS.map((loc) => ({
    name: loc,
    count: locationCounts[loc] || 0,
  })).sort((a, b) => b.count - a.count);

  const displayedLocations = isLocationsExpanded
    ? sortedLocationsData
    : sortedLocationsData.slice(0, 4);

  const renderClassificationBadge = (pet) => (
    <span
      className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${
        pet.adoption_status === 'Adopted'
          ? 'bg-slate-100 text-slate-700 border-slate-300'
          : isStrayPet(pet)
          ? 'bg-orange-50 text-orange-800 border-orange-200'
          : isCampusPet(pet.pet_type) || isCampusPet(pet.adoption_status)
          ? 'bg-purple-50 text-purple-800 border-purple-200'
          : 'bg-amber-50 text-amber-800 border-amber-200'
      }`}
    >
      {pet.adoption_status === 'Adopted' ? 'Adopted' : getCanonicalClassification(pet)}
    </span>
  );

  const renderStatusBadge = (pet) =>
    isPetQuarantined(pet) ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
        Quarantine (RA 9482)
      </span>
    ) : (
      <span
        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${getVaccinationBadgeStyles(
          pet.vaccination_status
        )}`}
      >
        {pet.vaccination_status || 'Not Vaccinated'}
      </span>
    );

  const renderExpandedDetails = (pet) => {
    const detail = expandedPetData?.pet_id === pet.pet_id ? expandedPetData : pet;

    if (!readOnly && isEditingId === pet.pet_id) {
      return (
        <form
          onSubmit={submitUpdatePatch}
          className="space-y-4 w-full bg-white p-4 sm:p-5 border border-slate-200 rounded-xl shadow-inner text-left"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Name</label>
              <input
                type="text"
                name="name"
                required
                value={editFormData.name || ''}
                onChange={handleEditChange}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm sm:text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Species</label>
              <select
                name="species"
                value={editFormData.species || 'Cat'}
                onChange={handleEditChange}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm sm:text-xs bg-white"
              >
                <option value="Cat">Cat</option>
                <option value="Dog">Dog</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                Classification
              </label>
              <select
                name="pet_type"
                value={editFormData.pet_type || 'Campus Pet'}
                onChange={handleEditChange}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm sm:text-xs bg-white"
              >
                <option value="Campus Pet">Campus Pet</option>
                <option value="Pet for Adoption">Pet for Adoption</option>
                <option value="Stray">Stray</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Breed</label>
              <input
                type="text"
                name="breed"
                value={editFormData.breed || ''}
                onChange={handleEditChange}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm sm:text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Gender</label>
              <select
                name="gender"
                value={editFormData.gender || 'Male'}
                onChange={handleEditChange}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm sm:text-xs bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Age</label>
              <input
                type="text"
                name="age"
                value={editFormData.age || ''}
                onChange={handleEditChange}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm sm:text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Size (Auto)</label>
              <select
                name="size"
                value={editFormData.size || 'Small'}
                disabled
                className="w-full p-2 border border-slate-200 bg-slate-100 text-slate-600 rounded-lg cursor-not-allowed text-sm sm:text-xs"
              >
                <option value="Small">Small (&lt; 10 kg)</option>
                <option value="Medium">Medium (10 - 25 kg)</option>
                <option value="Large">Large (&gt; 25 kg)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Weight (kg) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="weight"
                placeholder="e.g. 4.5"
                value={editFormData.weight || ''}
                onChange={handleEditChange}
                required
                className="w-full p-2 border border-slate-200 rounded-lg font-mono text-sm sm:text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Clinical Status:</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getVaccinationBadgeStyles(
                  editFormData.vaccination_status
                )}`}
              >
                {editFormData.vaccination_status || 'Not Vaccinated'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                {editFormData.spayed_neutered ? 'TNR Sterilized' : 'Intact'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Updated automatically from Medical &amp; Vaccination Logs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Campus Zone *</label>
              <select
                name="found_near"
                value={editFormData.found_near || CAMPUS_LOCATIONS[0]}
                onChange={handleEditChange}
                className="w-full p-2 border border-slate-200 bg-white rounded-lg text-sm sm:text-xs"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Rescue Date</label>
              <input
                type="date"
                name="rescue_date"
                value={editFormData.rescue_date || ''}
                onChange={handleEditChange}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono text-sm sm:text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                Medical Conditions
              </label>
              <input
                type="text"
                name="current_conditions"
                value={editFormData.current_conditions || ''}
                onChange={handleEditChange}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm sm:text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Temperament</label>
              <select
                name="behavior_notes"
                value={editFormData.behavior_notes || 'Friendly'}
                onChange={handleEditChange}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm sm:text-xs bg-white"
              >
                <option value="Friendly">Friendly</option>
                <option value="Not Friendly">Not Friendly</option>
                <option value="Friendly but be cautious">Friendly but be cautious</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">Photo URL</label>
            <input
              type="url"
              name="primary_image"
              value={editFormData.primary_image || ''}
              onChange={handleEditChange}
              className="w-full p-2 border border-slate-200 rounded-lg font-mono text-sm sm:text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Biography</label>
              <textarea
                name="about_text"
                rows="2"
                value={editFormData.about_text || ''}
                onChange={handleEditChange}
                className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm sm:text-xs resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#5C0612] mb-1">
                Visual Traits (for Search Matching) *
              </label>
              <textarea
                name="description"
                rows="2"
                required
                value={editFormData.description || ''}
                onChange={handleEditChange}
                placeholder="e.g. orange tabby, white paws, red collar"
                className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm sm:text-xs resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              disabled={savingEdit}
              onClick={() => setIsEditingId(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-5 py-2 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm text-xs"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-700 animate-fade-in text-left">
        <div className="w-full bg-slate-100 rounded-xl aspect-[4/3] max-w-[260px] overflow-hidden shadow-xs border border-slate-200">
          {loadingDetails ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
              Loading photo...
            </div>
          ) : (
            <img
              src={safeImageUrl(detail?.primary_image, DEFAULT_PET_IMAGE)}
              alt={detail?.name || 'Campus companion'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 bg-white p-4 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Gender</span>
              <strong className="text-slate-900 font-semibold">{detail?.gender || 'Unknown'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Age</span>
              <strong className="text-slate-900 font-semibold">{detail?.age || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Weight</span>
              <strong className="text-slate-900 font-mono font-semibold">{detail?.weight || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Size</span>
              <strong className="text-slate-900 font-semibold">{detail?.size || 'Medium'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Sterilized</span>
              <strong className="text-slate-900 font-semibold">
                {detail?.spayed_neutered ? 'Yes (TNR Certified)' : 'No'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Classification</span>
              <strong className="text-slate-900 font-semibold">{getCanonicalClassification(detail)}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block text-[10px]">Campus Zone</span>
              <strong className="text-slate-900 font-semibold">
                {normalizeCampusLocation(detail?.found_near, detail?.pet_id)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Rescue Date</span>
              <strong className="text-slate-900 font-mono font-semibold">{detail?.rescue_date || 'N/A'}</strong>
            </div>

            {isPetQuarantined(detail) && (
              <div className="col-span-2 sm:col-span-3 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-xs">Campus Rabies Observation (RA 9482)</span>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-rose-200 rounded text-rose-950 w-fit">
                  Release: {detail?.quarantine_until || '14-Day Observation'}
                </span>
              </div>
            )}

            <div className="col-span-2 sm:col-span-3 border-t border-slate-100 pt-2">
              <span className="text-rose-700 font-semibold">Medical Conditions: </span>
              <span className="text-slate-700">{detail?.current_conditions || 'None'}</span>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <span className="text-slate-600 font-semibold">Temperament: </span>
              <span className="text-slate-800">{detail?.behavior_notes || 'Friendly'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Biography
              </span>
              <p className="text-slate-600 text-xs leading-relaxed">
                {detail?.about_text || 'No biography added yet.'}
              </p>
            </div>
            <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-200/80">
              <span className="block text-[10px] font-semibold uppercase text-amber-800 mb-1">
                Visual Traits
              </span>
              <p className="text-slate-700 text-xs leading-relaxed">
                {detail?.description || 'No visual traits recorded yet.'}
              </p>
            </div>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => handleGenerateQrTag(pet)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl font-semibold text-xs transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-[#5C0612]" />
                <span>Generate Collar Tag QR</span>
              </button>
              <button
                type="button"
                onClick={() => startEditing(pet)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold text-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              {pet.archived_at ? (
                <button
                  type="button"
                  onClick={() => handleRestorePet(pet.pet_id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-semibold text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPetIdToDelete(pet.pet_id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-semibold text-xs transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPetSection = (sectionTitle, collection) => (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs text-slate-700">
      <div className="bg-slate-50 px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <h4 className="font-bold text-[#5C0612] tracking-tight text-xs sm:text-sm">
          {sectionTitle}
        </h4>
        <span className="font-mono text-[11px] font-bold bg-white border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-lg">
          {collection.length}
        </span>
      </div>

      {collection.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">No animals in this category yet.</div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-slate-100">
            {collection.map((pet) => {
              const isExpanded = expandedPetId === pet.pet_id;
              return (
                <div key={pet.pet_id} className="p-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => handleRowClick(pet.pet_id)}
                    className="w-full text-left flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <img
                        src={safeImageUrl(pet.primary_image, DEFAULT_PET_IMAGE)}
                        alt={pet.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm truncate">{pet.name}</span>
                          <span className="font-mono text-[10px] font-bold text-[#5C0612] bg-[#5C0612]/5 px-1.5 py-0.5 rounded">
                            {pet.pet_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {pet.species} &bull; {pet.breed || 'Mix'} &bull;{' '}
                          {normalizeCampusLocation(pet.found_near, pet.pet_id)}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {renderClassificationBadge(pet)}
                          {renderStatusBadge(pet)}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform ${
                        isExpanded ? 'rotate-90 text-[#5C0612]' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100">{renderExpandedDetails(pet)}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Sortable Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px] select-none">
                  <th
                    className="p-3.5 w-32 cursor-pointer hover:bg-slate-100"
                    onClick={() => requestSortAction('pet_id')}
                  >
                    Pet ID {renderSortArrow('pet_id')}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100"
                    onClick={() => requestSortAction('name')}
                  >
                    Name {renderSortArrow('name')}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100"
                    onClick={() => requestSortAction('pet_type')}
                  >
                    Classification {renderSortArrow('pet_type')}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100"
                    onClick={() => requestSortAction('species')}
                  >
                    Species / Breed {renderSortArrow('species')}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100"
                    onClick={() => requestSortAction('weight')}
                  >
                    Weight {renderSortArrow('weight')}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100"
                    onClick={() => requestSortAction('found_near')}
                  >
                    Campus Zone {renderSortArrow('found_near')}
                  </th>
                  <th className="p-3.5 text-center">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collection.map((pet) => (
                  <React.Fragment key={pet.pet_id}>
                    <tr
                      onClick={() => handleRowClick(pet.pet_id)}
                      className={`transition-colors cursor-pointer ${
                        expandedPetId === pet.pet_id ? 'bg-slate-50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-[#5C0612] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                              expandedPetId === pet.pet_id ? 'rotate-90 text-[#5C0612]' : ''
                            }`}
                          />
                          {pet.pet_id}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900 text-sm">{pet.name}</td>
                      <td className="p-3.5">{renderClassificationBadge(pet)}</td>
                      <td className="p-3.5 text-slate-600">
                        {pet.species} &bull; {pet.breed || 'Mix'}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">{pet.weight || 'N/A'}</td>
                      <td className="p-3.5 text-slate-600 truncate max-w-[160px]">
                        {normalizeCampusLocation(pet.found_near, pet.pet_id)}
                      </td>
                      <td className="p-3.5 text-center">{renderStatusBadge(pet)}</td>
                    </tr>

                    {expandedPetId === pet.pet_id && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={7} className="p-5 border-b border-slate-200">
                          {renderExpandedDetails(pet)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );

  return (
    <div className="w-full space-y-5 pb-6">
      {(errorMessage || loadError) && (
        <div
          role="alert"
          className="w-full p-3.5 bg-rose-50 border border-rose-200 text-rose-900 font-medium rounded-xl flex items-center justify-between gap-2 text-xs"
        >
          <span>{errorMessage || loadError}</span>
          <div className="flex items-center gap-2 shrink-0">
            {loadError && onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-rose-200 rounded-lg text-rose-800 font-semibold"
              >
                <RotateCw className="w-3 h-3" />
                Retry
              </button>
            )}
            {errorMessage && (
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                aria-label="Dismiss error"
                className="p-1 text-rose-500 hover:text-rose-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by pet name, tag ID, breed, or campus zone..."
            className="w-full bg-transparent text-base sm:text-xs text-slate-800 focus:outline-none placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['All', 'Cat', 'Dog'].map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setSpeciesFilter(sp)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  speciesFilter === sp
                    ? 'bg-[#5C0612] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sp === 'All' ? 'All' : `${sp}s`}
              </button>
            ))}
          </div>

          {!readOnly && onToggleArchived && (
            <button
              type="button"
              onClick={() => onToggleArchived(!includeArchived)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition-colors ${
                includeArchived
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{includeArchived ? 'Showing Archived' : 'Archived'}</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Analytics Cards */}
      {!loadingPets && totalPetsCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between text-left">
            <div>
              <h5 className="font-bold text-slate-900 text-xs">Species Breakdown</h5>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active cats and dogs registered on campus.
              </p>
            </div>
            <div className="my-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                  Cats ({totalCatsCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-600" />
                  Dogs ({totalDogsCount})
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full flex overflow-hidden">
                <div style={{ width: `${catPercentage}%` }} className="h-full bg-amber-500" />
                <div style={{ width: `${dogPercentage}%` }} className="h-full bg-indigo-600" />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              Total active animals:{' '}
              <strong className="text-slate-800">{totalPetsCount}</strong>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between text-left">
            <div>
              <h5 className="font-bold text-slate-900 text-xs">Campus Zone Distribution</h5>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active animal count by campus landmark.
              </p>
            </div>

            <div className="my-3 space-y-2">
              {displayedLocations.map((locObj) => (
                <div key={locObj.name} className="space-y-0.5">
                  <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                    <span className="truncate pr-2">{locObj.name}</span>
                    <span className="font-mono font-bold text-slate-900 shrink-0">{locObj.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(locObj.count / maxZoneCount) * 100}%` }}
                      className="h-full bg-[#5C0612] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            {sortedLocationsData.length > 4 && (
              <button
                type="button"
                onClick={() => setIsLocationsExpanded((prev) => !prev)}
                className="text-[11px] font-semibold text-[#5C0612] hover:underline mb-2 text-right block w-full"
              >
                {isLocationsExpanded ? 'Show fewer zones' : 'Show all zones'}
              </button>
            )}

            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 truncate">
              Most active zone: <strong className="text-slate-800">{densestZone}</strong>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between text-left md:col-span-2 lg:col-span-1">
            <div>
              <h5 className="font-bold text-slate-900 text-xs">Health &amp; Sterilization Progress</h5>
              <p className="text-[11px] text-slate-500 mt-0.5">
                TNR sterilization and vaccination coverage.
              </p>
            </div>

            <div className="my-3 space-y-2.5">
              {[
                {
                  label: 'Sterilized (TNR)',
                  count: totalNeuteredCount,
                  pct: neuteredPercentage,
                  bar: 'bg-purple-600',
                  text: 'text-purple-700',
                },
                {
                  label: 'Fully Vaccinated',
                  count: totalFullyVaccinatedCount,
                  pct: fullyVaccinatedPercentage,
                  bar: 'bg-emerald-600',
                  text: 'text-emerald-700',
                },
                {
                  label: 'Core Only (No Rabies)',
                  count: totalCoreOnlyCount,
                  pct: coreOnlyPercentage,
                  bar: 'bg-amber-500',
                  text: 'text-amber-700',
                },
                {
                  label: 'Unvaccinated / Overdue',
                  count: totalUnprotectedCount,
                  pct: unprotectedPercentage,
                  bar: 'bg-rose-600',
                  text: 'text-rose-700',
                },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-600">
                    <span>{row.label}</span>
                    <span className={`font-mono font-bold ${row.text}`}>
                      {row.count}/{totalPetsCount} ({Math.round(row.pct)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${row.pct}%` }} className={`h-full rounded-full ${row.bar}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              Goal: <strong className="text-purple-700">100% TNR &amp; anti-rabies coverage</strong>
            </div>
          </div>
        </div>
      )}

      {/* Registry Sections */}
      {loadingPets ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2.5">
          <div className="w-7 h-7 border-3 border-slate-200 border-t-[#5C0612] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading animal directory...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {renderPetSection('Campus & Adoption Companions', sortedActiveCollection)}
          {renderPetSection('Strays Available for Adoption', sortedStrayCollection)}
          {renderPetSection('Adopted Alumni', sortedAdoptedCollection)}
        </div>
      )}

      {/* Printable 300 DPI Collar Tag QR Modal */}
      {qrTagModal.isOpen && qrTagModal.pet && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() =>
            setQrTagModal({ isOpen: false, pet: null, qrDataUrl: '', badgeDataUrl: '', targetUrl: '' })
          }
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 shadow-2xl rounded-3xl max-w-sm w-full max-h-[92dvh] overflow-y-auto p-5 sm:p-6 text-center space-y-4 animate-scale-up"
          >
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <img
                src={qrTagModal.badgeDataUrl || qrTagModal.qrDataUrl}
                alt={`Collar QR tag for ${qrTagModal.pet.name}`}
                className="w-full h-auto object-contain"
              />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Download this 300 DPI collar tag PNG to print and laminate. Scanning it opens{' '}
              <strong>{qrTagModal.pet.name}&apos;s</strong> public passport and emergency hotline.
            </p>

            <div className="flex flex-wrap gap-2">
              <a
                href={qrTagModal.badgeDataUrl || qrTagModal.qrDataUrl}
                download={`${qrTagModal.pet.name.replace(/\s+/g, '_')}_CollarTag_300DPI.png`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#5C0612] hover:bg-[#42040B] text-white font-semibold rounded-xl text-xs shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setQrTagModal({
                    isOpen: false,
                    pet: null,
                    qrDataUrl: '',
                    badgeDataUrl: '',
                    targetUrl: '',
                  })
                }
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive / Delete Pet Confirmation Modal */}
      {petIdToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !deletingPet && setPetIdToDelete(null)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-sm w-full p-6 text-center animate-scale-up space-y-3"
          >
            <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Archive Animal Profile</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Archiving <strong className="text-slate-800">#{petIdToDelete}</strong> hides it from the
              public directory while preserving its RA 9482 medical &amp; vaccination audit trail. You can restore it anytime.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={deletingPet}
                onClick={() => setPetIdToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingPet}
                onClick={() => handleDeletePet(false)}
                className="flex-1 py-2.5 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-sm"
              >
                {deletingPet ? 'Archiving...' : 'Archive Profile'}
              </button>
            </div>
            <button
              type="button"
              disabled={deletingPet}
              onClick={() => handleDeletePet(true)}
              className="w-full pt-1 text-[11px] font-semibold text-rose-600 hover:underline disabled:opacity-50 inline-flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Or permanently delete (erases clinical history)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
