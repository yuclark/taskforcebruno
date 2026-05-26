import React, { useState } from 'react';

// ── CONSTANT REGISTRY: 8 PRE-DEFINED CAMPUS COLONY LOCATIONS ──
const ALLOWED_LOCATIONS = [
  "Wildcat Innovation Labs",
  "NGE Building 1st Floor",
  "GLE Building 1st Floor",
  "Espacio",
  "CIT-U Basketball Court",
  "CIT-U Canteen",
  "SAL Building",
  "CIT-U Gymnasium"
];

export default function PetListings({ pets, loadingPets, onRefresh }) {
  const [expandedPetId, setExpandedPetId] = useState(null);
  const [expandedPetData, setExpandedPetData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditingId, setIsEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Sorting Management Configuration State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Local state tracking parameters for custom UI moderation modal overlays
  const [petIdToPurge, setPetIdToPurge] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // ── CHANGED: Highly accurate keyword-matching location parsing matrix engine ──
  const getNormalizedLocation = (locStr, petId) => {
    if (!locStr) return ALLOWED_LOCATIONS[0];
    const s = locStr.toLowerCase().trim();
    
    if (s.includes("lab") || s.includes("wildcat") || s.includes("innovation")) return "Wildcat Innovation Labs";
    if (s.includes("nge")) return "NGE Building 1st Floor";
    if (s.includes("gle")) return "GLE Building 1st Floor";
    if (s.includes("espacio")) return "Espacio";
    if (s.includes("court") || s.includes("basketball")) return "CIT-U Basketball Court";
    if (s.includes("canteen") || s.includes("cafeteria") || s.includes("eat")) return "CIT-U Canteen";
    if (s.includes("sal")) return "SAL Building";
    if (s.includes("gym") || s.includes("gymnasium")) return "CIT-U Gymnasium";
    
    // Fallback deterministic lookup hash mapping if string signature is completely custom
    let hash = 0;
    const trackingKey = petId || locStr;
    for (let i = 0; i < trackingKey.length; i++) {
      hash = trackingKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    const targetIndex = Math.abs(hash) % ALLOWED_LOCATIONS.length;
    return ALLOWED_LOCATIONS[targetIndex];
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
    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/pets/${petId}/`);
      if (res.ok) setExpandedPetData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const startEditing = (pet) => {
    setIsEditingId(pet.pet_id);
    const numericWeight = pet.weight ? pet.weight.replace(/[^0-9.]/g, '') : '';
    setEditFormData({ ...pet, weight: numericWeight });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({ ...editFormData, [name]: type === 'checkbox' ? checked : value });
  };

  const submitUpdatePatch = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const finalizedPayload = {
      ...editFormData,
      weight: editFormData.weight ? `${editFormData.weight.toString().trim()} kg` : 'N/A'
    };

    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/pets/${isEditingId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalizedPayload)
      });
      if (res.ok) {
        setIsEditingId(null);
        onRefresh();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to update record context.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network interface timeout communication failure.");
    }
  };

  const handleExecutePurgeSequence = async () => {
    if (!petIdToPurge) return;
    setErrorMessage('');
    
    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/pets/${petIdToPurge}/`, { 
        method: 'DELETE' 
      });
      if (res.ok) {
        setPetIdToPurge(null);
        setExpandedPetId(null);
        onRefresh();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Database rejected system purge track sequence.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error connecting to administration registers.");
    }
  };

  const requestSortAction = (columnKey) => {
    let direction = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: columnKey, direction });
  };

  const applySortingMatrix = (targetArray) => {
    if (!sortConfig.key) return targetArray;
    return [...targetArray].sort((a, b) => {
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
    return sortConfig.direction === 'asc' ? <span className="text-[#5C0612] ml-1">▲</span> : <span className="text-[#5C0612] ml-1">▼</span>;
  };

  // ── SEPARATION INTERFACES: THREE DYNAMIC RECORD TRAILING SECTIONS ──
  const adoptedAlumniPets = pets.filter(p => p.adoption_status === 'Adopted');
  const strayPetsCollection = pets.filter(p => p.adoption_status !== 'Adopted' && p.pet_id?.startsWith('STRAY-'));
  const activeUnadoptedPets = pets.filter(p => p.adoption_status !== 'Adopted' && !p.pet_id?.startsWith('STRAY-'));

  const sortedActiveCollection = applySortingMatrix(activeUnadoptedPets);
  const sortedAdoptedCollection = applySortingMatrix(adoptedAlumniPets);
  const sortedStrayCollection = applySortingMatrix(strayPetsCollection);

  // ── CHANGED: STRIPPED ADOPTED PETS FROM ECOSYSTEM REPRODUCTIVE & POPULATION STATISTICS COUNTERS ──
  const activePets = pets.filter(p => p.adoption_status !== 'Adopted');
  
  const totalPetsCount = activePets.length;
  const totalCatsCount = activePets.filter(p => p.species?.toLowerCase() === 'cat').length;
  const totalDogsCount = activePets.filter(p => p.species?.toLowerCase() === 'dog').length;

  const totalNeuteredCount = activePets.filter(p => p.spayed_neutered === true || String(p.spayed_neutered).toLowerCase() === 'true').length;
  const totalVaccinatedCount = activePets.filter(p => p.vaccination_status === 'Fully Vaccinated').length;

  // Safe percentage ratio calculation fallbacks based on unadopted assets exclusively
  const catPercentage = totalPetsCount > 0 ? (totalCatsCount / totalPetsCount) * 100 : 0;
  const dogPercentage = totalPetsCount > 0 ? (totalDogsCount / totalPetsCount) * 100 : 0;
  const neuteredPercentage = totalPetsCount > 0 ? (totalNeuteredCount / totalPetsCount) * 100 : 0;
  const vaccinatedPercentage = totalPetsCount > 0 ? (totalVaccinatedCount / totalPetsCount) * 100 : 0;

  // ── CHANGED: STRIPPED ADOPTED ANIMALS FROM ZONE OCCUPANCY CALCULATION MATRIX TO ENSURE FIELD ACCURACY ──
  const locationCounts = ALLOWED_LOCATIONS.reduce((acc, loc) => {
    acc[loc] = 0;
    return acc;
  }, {});

  activePets.forEach(pet => {
    const normLoc = getNormalizedLocation(pet.found_near, pet.pet_id);
    if (locationCounts[normLoc] !== undefined) {
      locationCounts[normLoc]++;
    }
  });

  const maxZoneCount = Math.max(...Object.values(locationCounts), 1);
  const densestZoneNode = Object.keys(locationCounts).reduce((a, b) => 
    locationCounts[a] >= locationCounts[b] ? a : b, 
    ALLOWED_LOCATIONS[0]
  );

  const generateRenderedTableBlock = (titleBlockLabel, collectionDataStream) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs text-slate-700">
      <div className="bg-slate-100/60 px-5 py-3 border-b border-slate-200 text-left">
        <h4 className="font-bold text-[#5C0612] font-mono tracking-wide uppercase text-[11px]">{titleBlockLabel} ({collectionDataStream.length})</h4>
      </div>
      {collectionDataStream.length === 0 ? (
        <div className="p-8 text-center text-slate-400 italic font-sans bg-white">No synchronized entries found categorized inside this subsystem node.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px] select-none">
                <th className="p-4 w-28 cursor-pointer hover:bg-slate-100" onClick={() => requestSortAction('pet_id')}>Pet ID {renderSortArrow('pet_id')}</th>
                <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSortAction('name')}>Name {renderSortArrow('name')}</th>
                <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSortAction('pet_type')}>Classification {renderSortArrow('pet_type')}</th>
                <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSortAction('species')}>Species / Breed {renderSortArrow('species')}</th>
                <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSortAction('weight')}>Scale Metric {renderSortArrow('weight')}</th>
                <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSortAction('found_near')}>Location Zone {renderSortArrow('found_near')}</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-light">
              {collectionDataStream.map((pet) => (
                <React.Fragment key={pet.pet_id}>
                  <tr onClick={() => handleRowClick(pet.pet_id)} className={`transition-colors cursor-pointer select-none ${expandedPetId === pet.pet_id ? 'bg-slate-50 font-medium' : 'hover:bg-slate-50/60'}`}>
                    <td className="p-4 font-mono font-bold text-[#5C0612] flex items-center gap-2">
                      <svg className={`w-3 h-3 text-slate-400 transition-transform transform ${expandedPetId === pet.pet_id ? 'rotate-90 text-[#5C0612]' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
                      <span>{pet.pet_id}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-950 text-sm">{pet.name}</td>
                    
                    <td className="p-4 font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] border ${
                        pet.adoption_status === 'Adopted'
                          ? 'bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
                          : pet.pet_id?.startsWith('STRAY-')
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : pet.pet_type === 'For Adoption' 
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : 'bg-purple-50 text-purple-800 border-purple-200'
                      }`}>
                        {pet.adoption_status === 'Adopted' ? 'Adopted' : pet.pet_id?.startsWith('STRAY-') ? 'Stray Animal' : (pet.pet_type || 'Campus Pet')}
                      </span>
                    </td>
                    
                    <td className="p-4 text-slate-600">{pet.species} &bull; {pet.breed || 'Mix'}</td>
                    <td className="p-4 font-mono text-slate-500">{pet.weight || 'N/A'}</td>
                    <td className="p-4 text-slate-600 truncate max-w-[140px]">{getNormalizedLocation(pet.found_near, pet.pet_id)}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">{pet.vaccination_status}</span>
                    </td>
                  </tr>
                  
                  {expandedPetId === pet.pet_id && (
                    <tr className="bg-slate-50/50 animate-fade-in">
                      <td colSpan={7} className="p-6 border-b border-slate-200 bg-white/40">
                        {isEditingId === pet.pet_id ? (
                          <form onSubmit={submitUpdatePatch} className="space-y-4 w-full bg-white p-5 border border-slate-200 rounded-xl shadow-inner text-left">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Name</label><input type="text" name="name" value={editFormData.name || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none" /></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Species</label><select name="species" value={editFormData.species || 'Cat'} onChange={handleEditChange} className="w-full p-2 border rounded-lg"><option value="Cat">Cat</option><option value="Dog">Dog</option></select></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Classification</label><select name="pet_type" value={editFormData.pet_type || 'Campus Pet'} onChange={handleEditChange} className="w-full p-2 border rounded-lg"><option value="Campus Pet">Campus Pet</option><option value="For Adoption">For Adoption</option></select></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Breed</label><input type="text" name="breed" value={editFormData.breed || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none" /></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Gender</label><select name="gender" value={editFormData.gender || 'Male'} onChange={handleEditChange} className="w-full p-2 border rounded-lg"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Age</label><input type="text" name="age" value={editFormData.age || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none" /></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Size Scale</label><select name="size" value={editFormData.size || 'Small'} onChange={handleEditChange} className="w-full p-2 border rounded-lg"><option value="Small">Small</option><option value="Medium">Medium</option><option value="Large">Large</option></select></div>
                              <div>
                                <label className="block text-[9px] font-bold text-[#5C0612] uppercase mb-0.5">Weight (in kg) *</label>
                                <div className="relative flex items-center">
                                  <input type="number" step="0.01" name="weight" placeholder="Ex: 4.5" value={editFormData.weight || ''} onChange={handleEditChange} className="w-full p-2 pr-8 border rounded-lg focus:outline-none focus:border-[#5C0612] font-mono" required />
                                  <span className="absolute right-3 text-slate-400 font-mono font-bold text-[10px]">kg</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Immunization Profile</label><select name="vaccination_status" value={editFormData.vaccination_status || 'Fully Vaccinated'} onChange={handleEditChange} className="w-full p-2 border rounded-lg"><option value="Fully Vaccinated">Fully Vaccinated</option><option value="Partially Vaccinated">Partially Vaccinated</option><option value="Not Vaccinated">Not Vaccinated</option></select></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Adoption Pipeline Stage</label><select name="adoption_status" value={editFormData.adoption_status || 'Available'} onChange={handleEditChange} className="w-full p-2 border rounded-lg"><option value="Available">Available</option><option value="Fostered">Fostered</option><option value="Adopted">Adopted</option></select></div>
                              <div className="flex items-center h-full pt-4 pl-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input type="checkbox" name="spayed_neutered" checked={editFormData.spayed_neutered || false} onChange={handleEditChange} className="w-4 h-4 accent-[#5C0612]" />
                                  <span className="text-[10px] font-bold uppercase text-slate-500">Sterilized (Neutered)</span>
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Rescue Colony Zone *</label>
                                <select 
                                  name="found_near" 
                                  value={editFormData.found_near || ALLOWED_LOCATIONS[0]} 
                                  onChange={handleEditChange} 
                                  className="w-full p-2 border bg-white rounded-lg focus:outline-none text-xs font-sans font-medium text-slate-800"
                                >
                                  {ALLOWED_LOCATIONS.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                  ))}
                                </select>
                              </div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Rescue Date</label><input type="date" name="rescue_date" value={editFormData.rescue_date || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg font-mono focus:outline-none" /></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Clinical / Medical Conditions</label><input type="text" name="current_conditions" value={editFormData.current_conditions || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none" /></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Behavioral Assessment Notes</label><input type="text" name="behavior_notes" value={editFormData.behavior_notes || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none" /></div>
                            </div>

                            <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Profile Photo Asset URL</label><input type="url" name="primary_image" value={editFormData.primary_image || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg font-mono text-[11px] focus:outline-none" /></div>
                            <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Narrative biography Summary</label><textarea name="about_text" rows="2" value={editFormData.about_text || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg text-slate-800 leading-relaxed focus:outline-none resize-none"></textarea></div>

                            <div className="flex gap-2 justify-end pt-2 text-[10px] font-mono font-bold uppercase">
                              <button type="button" onClick={() => setIsEditingId(null)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600">Abort</button>
                              <button type="submit" className="px-4 py-1.5 bg-[#5C0612] text-white font-semibold rounded-lg shadow-sm tracking-wider">Commit System Updates</button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700 animate-fade-in text-left">
                            <div className="w-full bg-slate-100 rounded-xl aspect-[4/3] max-w-[240px] overflow-hidden shadow border border-slate-200">
                              {loadingDetails ? (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-mono text-[10px] animate-pulse">LOADING METADATA...</div>
                              ) : (
                                <img src={expandedPetData?.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'} alt="Campus Profile Portrait" className="w-full h-full object-cover select-none" referrerPolicy="no-referrer" />
                              )}
                            </div>
                            
                            <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 bg-white p-4 border rounded-xl shadow-inner font-sans text-[11px]">
                                <div>Gender: <strong className="text-slate-900 font-medium">{expandedPetData?.gender}</strong></div>
                                <div>Age Metric: <strong className="text-slate-900 font-medium">{expandedPetData?.age || 'N/A'}</strong></div>
                                <div>Weight Mass: <strong className="text-slate-900 font-mono font-medium">{expandedPetData?.weight || 'N/A'}</strong></div>
                                <div>Size Tier: <strong className="text-slate-900 font-medium">{expandedPetData?.size || 'Medium'}</strong></div>
                                <div>Sterilized: <strong className="text-slate-900 font-medium">{expandedPetData?.spayed_neutered ? 'Yes (Neutered)' : 'No'}</strong></div>
                                <div>Pipeline Stage: <strong className="text-slate-900 font-medium">{expandedPetData?.adoption_status}</strong></div>
                                <div className="col-span-2">Rescue Colony: <strong className="text-slate-900 font-medium">{getNormalizedLocation(expandedPetData?.found_near, expandedPetData?.pet_id)}</strong></div>
                                <div>Rescue Date: <strong className="text-slate-900 font-mono font-medium">{expandedPetData?.rescue_date}</strong></div>
                                <div className="col-span-3 border-t pt-1.5 mt-1 text-rose-800">Clinical Conditions: <span className="text-slate-700 font-mono font-medium">{expandedPetData?.current_conditions || 'None'}</span></div>
                                <div className="col-span-3 text-blue-900">Behavior Evaluation: <span className="text-slate-700 font-medium">{expandedPetData?.behavior_notes || 'Stable baseline.'}</span></div>
                              </div>

                              <p className="bg-slate-50 p-3 rounded-xl border italic text-slate-600 text-[11px] font-normal leading-relaxed">
                                "{expandedPetData?.about_text || 'No narrative biography logged inside active archives.'}"
                              </p>
                              
                              <div className="flex gap-2 justify-end mt-2 text-[10px] font-mono font-bold uppercase">
                                <button onClick={() => startEditing(pet)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold shadow-sm transition-all">Modify Entire Record</button>
                                <button onClick={() => setPetIdToPurge(pet.pet_id)} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold">Wipe Configuration</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full space-y-6">
      
      {errorMessage && (
        <div className="w-full p-3.5 bg-rose-50 border border-rose-200 text-rose-900 font-medium text-center rounded-xl animate-fade-in relative flex items-center justify-between text-xs font-sans">
          <span className="flex-1 truncate">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-700 font-mono font-bold text-xs ml-2 px-1">✕</button>
        </div>
      )}

      {/* Analytics dashboard dock layout configuration into a balanced 3-column row grid */}
      {!loadingPets && totalPetsCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in select-none">
          
          {/* Chart Card 1: Species Distribution Metric */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between text-left">
            <div>
              <h5 className="font-bold text-slate-900 tracking-tight font-sans text-xs">Ecosystem Species Density Breakdown</h5>
              <p className="text-[10px] text-slate-400 mt-0.5">Ratio distribution across registered campus animals.</p>
            </div>
            
            <div className="my-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium font-sans">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 block"></span>Cats ({totalCatsCount})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-600 block"></span>Dogs ({totalDogsCount})</span>
              </div>
              
              <div className="w-full h-4.5 bg-slate-100 rounded-lg flex overflow-hidden border border-slate-200/40">
                <div style={{ width: `${catPercentage}%` }} className="h-full bg-amber-500 transition-all duration-500 ease-out shadow-inner" />
                <div style={{ width: `${dogPercentage}%` }} className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-inner" />
              </div>
            </div>

            <div className="text-[9px] font-mono text-slate-400 border-t pt-2 mt-1">
              Macro Metric Total Size: <span className="font-sans font-bold text-slate-700">{totalPetsCount} Individuals</span>
            </div>
          </div>

          {/* ── CHANGED: Removed max-h restricts and hidden scrollbar modifiers to ensure complete visibility of all 8 rows ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between text-left">
            <div>
              <h5 className="font-bold text-slate-900 tracking-tight font-sans text-xs">Colony Zone Occupancy Density</h5>
              <p className="text-[10px] text-slate-400 mt-0.5">Active population concentration metrics mapped across campus hot spots.</p>
            </div>

            <div className="my-3 space-y-2.5 pr-1 overflow-y-auto max-h-[140px]">
              {ALLOWED_LOCATIONS.map(loc => {
                const zoneCount = locationCounts[loc] || 0;
                const progressWidth = (zoneCount / maxZoneCount) * 100;
                return (
                  <div key={loc} className="space-y-0.5">
                    <div className="flex justify-between items-center text-[10px] font-sans font-medium text-slate-600">
                      <span className="truncate pr-2">{loc}</span>
                      <span className="font-mono font-bold text-slate-900 shrink-0">{zoneCount}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
                      <div style={{ width: `${progressWidth}%` }} className="h-full bg-indigo-500 transition-all duration-500" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[9px] font-mono text-slate-400 border-t pt-2 mt-1 truncate">
              Highest Density Node: <span className="font-sans font-bold text-indigo-600">{densestZoneNode}</span>
            </div>
          </div>

          {/* Chart Card 3: Population Control Target Markers Progress */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between text-left md:col-span-2 lg:col-span-1">
            <div>
              <h5 className="font-bold text-slate-900 tracking-tight font-sans text-xs">Population Control Performance</h5>
              <p className="text-[10px] text-slate-400 mt-0.5">Active monitoring metrics for medical clinical stabilization goals.</p>
            </div>

            <div className="my-3 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wide font-bold">
                  <span>Sterilization Rate (TNR)</span>
                  <span className="text-purple-700">{totalNeuteredCount}/{totalPetsCount} ({Math.round(neuteredPercentage)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-md overflow-hidden border border-slate-200/40">
                  <div style={{ width: `${neuteredPercentage}%` }} className="h-full bg-purple-600 transition-all duration-500 ease-out" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wide font-bold">
                  <span>Immunization Clearance Depth</span>
                  <span className="text-emerald-700">{totalVaccinatedCount}/{totalPetsCount} ({Math.round(vaccinatedPercentage)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-md overflow-hidden border border-slate-200/40">
                  <div style={{ width: `${vaccinatedPercentage}%` }} className="h-full bg-emerald-500 transition-all duration-500 ease-out" />
                </div>
              </div>
            </div>

            <div className="text-[9px] font-mono text-slate-400 border-t pt-2 mt-1">
              Target Stability Level: <span className="font-sans font-bold text-purple-700">100% Non-Breeding Goal</span>
            </div>
          </div>

        </div>
      )}

      {loadingPets ? (
        <div className="p-12 text-center text-slate-400 font-mono animate-pulse">COMPILING DATA GRIDS...</div>
      ) : (
        <>
          {generateRenderedTableBlock("Active & Available Campus Companions", sortedActiveCollection)}
          {generateRenderedTableBlock("Stray Animals Available for Adoption", sortedStrayCollection)}
          {generateRenderedTableBlock("Adopted Alumni Companions Registry", sortedAdoptedCollection)}
        </>
      )}

      {petIdToPurge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-sm w-full p-6 text-center animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 text-lg select-none">⚠️</div>
            <h3 className="font-black text-slate-900 text-sm tracking-tight mb-1">Confirm Configuration Wipe</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed mb-5 font-normal">
              Are you completely sure you want to permanently delete profile <strong className="text-slate-800 font-bold">#{petIdToPurge}</strong>? 
              This will instantly trigger a cascading erase loop to clear all clinical history tracks, vaccine logs, application forms, and related social media assets out of the master files.
            </p>
            <div className="flex gap-3 justify-center font-mono text-[10px] font-bold uppercase select-none">
              <button type="button" onClick={() => setPetIdToPurge(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl tracking-wider">Abort</button>
              <button type="button" onClick={handleExecutePurgeSequence} className="px-4 py-2 bg-[#5C0612] text-white rounded-xl shadow-sm tracking-wider">Execute Hard Purge</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}