import React, { useState } from 'react';

export default function PetListings({ pets, loadingPets, onRefresh }) {
  const [expandedPetId, setExpandedPetId] = useState(null);
  const [expandedPetData, setExpandedPetData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditingId, setIsEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Local state tracking parameters for custom UI moderation modal overlays
  const [petIdToPurge, setPetIdToPurge] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

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
    setEditFormData({ ...pet });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({ ...editFormData, [name]: type === 'checkbox' ? checked : value });
  };

  const submitUpdatePatch = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/pets/${isEditingId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
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

  // Execution dispatch block for custom validation purges (No event-pausing browser confirm modal)
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
        onRefresh(); // Hot reloads the tracking list instantly
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Database rejected system purge track sequence.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error connecting to administration registers.");
    }
  };

  return (
    <div className="w-full space-y-4">
      
      {/* Dynamic Error Messaging Alert Bar Frame */}
      {errorMessage && (
        <div className="w-full p-3.5 bg-rose-50 border border-rose-200 text-rose-900 font-medium text-center rounded-xl animate-fade-in relative flex items-center justify-between text-xs font-sans">
          <span className="flex-1 truncate">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-700 font-mono font-bold text-xs ml-2 px-1">✕</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs text-slate-700">
        {loadingPets ? (
          <div className="p-12 text-center text-xs font-mono text-slate-400 animate-pulse">PULLING RECORD SCHEMA CACHE...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px] select-none">
                  <th className="p-4 w-28">Pet ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Classification</th>
                  <th className="p-4">Species / Breed</th>
                  <th className="p-4">Scale Metric</th>
                  <th className="p-4">Location Zone</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-light">
                {pets.map((pet) => (
                  <React.Fragment key={pet.pet_id}>
                    <tr onClick={() => handleRowClick(pet.pet_id)} className={`transition-colors cursor-pointer select-none ${expandedPetId === pet.pet_id ? 'bg-slate-50 font-medium' : 'hover:bg-slate-50/60'}`}>
                      <td className="p-4 font-mono font-bold text-[#5C0612] flex items-center gap-2">
                        <svg className={`w-3 h-3 text-slate-400 transition-transform transform ${expandedPetId === pet.pet_id ? 'rotate-90 text-[#5C0612]' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
                        <span>{pet.pet_id}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-950 text-sm">{pet.name}</td>
                      <td className="p-4 font-mono">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${pet.pet_type === 'For Adoption' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-purple-50 text-purple-800 border border-purple-200'}`}>
                          {pet.pet_type || 'Campus Pet'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{pet.species} &bull; {pet.breed || 'Mix'}</td>
                      <td className="p-4 font-mono text-slate-500">{pet.weight || 'N/A'}</td>
                      <td className="p-4 text-slate-600 truncate max-w-[140px]">{pet.found_near}</td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">{pet.vaccination_status}</span>
                      </td>
                    </tr>
                    
                    {expandedPetId === pet.pet_id && (
                      <tr className="bg-slate-50/50 animate-fade-in">
                        <td colSpan={7} className="p-6 border-b border-slate-200 bg-white/40">
                          {isEditingId === pet.pet_id ? (
                            
                            /* ==========================================
                                MUTATION MODE: FULL PARAMETER FORM EDITING
                               ========================================== */
                            <form onSubmit={submitUpdatePatch} className="space-y-4 w-full bg-white p-5 border border-slate-200 rounded-xl shadow-inner text-left">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Name</label><input type="text" name="name" value={editFormData.name || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]" /></div>
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Species</label><select name="species" value={editFormData.species || 'Cat'} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]"><option value="Cat">Cat</option><option value="Dog">Dog</option></select></div>
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Classification</label><select name="pet_type" value={editFormData.pet_type || 'Campus Pet'} onChange={handleEditChange} className="w-full p-2 border rounded-lg font-bold focus:outline-none focus:border-[#5C0612]"><option value="Campus Pet">Campus Pet</option><option value="For Adoption">For Adoption</option></select></div>
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Breed</label><input type="text" name="breed" value={editFormData.breed || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]" /></div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Gender</label><select name="gender" value={editFormData.gender || 'Male'} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Age</label><input type="text" name="age" value={editFormData.age || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]" /></div>
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Size Scale</label><select name="size" value={editFormData.size || 'Small'} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]"><option value="Small">Small</option><option value="Medium">Medium</option><option value="Large">Large</option></select></div>
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Weight</label><input type="text" name="weight" value={editFormData.weight || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]" /></div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Immunization Profile</label><select name="vaccination_status" value={editFormData.vaccination_status || 'Fully Vaccinated'} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]"><option value="Fully Vaccinated">Fully Vaccinated</option><option value="Partially Vaccinated">Partially Vaccinated</option><option value="Not Vaccinated">Not Vaccinated</option></select></div>
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Adoption Pipeline Stage</label><select name="adoption_status" value={editFormData.adoption_status || 'Available'} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]"><option value="Available">Available</option><option value="Fostered">Fostered</option><option value="Adopted">Adopted</option></select></div>
                                <div className="flex items-center h-full pt-4 pl-2">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" name="spayed_neutered" checked={editFormData.spayed_neutered || false} onChange={handleEditChange} className="w-4 h-4 accent-[#5C0612]" />
                                    <span className="text-[10px] font-bold uppercase text-slate-500">Sterilized (Neutered)</span>
                                  </label>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Rescue Colony Zone</label><input type="text" name="found_near" value={editFormData.found_near || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]" /></div>
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Rescue Date</label><input type="date" name="rescue_date" value={editFormData.rescue_date || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg font-mono focus:outline-none focus:border-[#5C0612]" /></div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Clinical / Medical Conditions</label><input type="text" name="current_conditions" value={editFormData.current_conditions || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]" /></div>
                                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Behavioral Assessment Notes</label><input type="text" name="behavior_notes" value={editFormData.behavior_notes || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#5C0612]" /></div>
                              </div>

                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Profile Photo Asset URL</label><input type="url" name="primary_image" value={editFormData.primary_image || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg font-mono text-[11px] focus:outline-none focus:border-[#5C0612]" /></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Narrative biography Summary</label><textarea name="about_text" rows="2" value={editFormData.about_text || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg text-slate-800 leading-relaxed focus:outline-none focus:border-[#5C0612] resize-none"></textarea></div>

                              <div className="flex gap-2 justify-end pt-2 text-[10px] font-mono font-bold uppercase">
                                <button type="button" onClick={() => setIsEditingId(null)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 transition-all">Abort</button>
                                <button type="submit" className="px-4 py-1.5 bg-[#5C0612] hover:bg-[#42040B] text-white font-semibold rounded-lg shadow-sm transition-all tracking-wider">Commit System Updates</button>
                              </div>
                            </form>
                          ) : (
                            
                            /* ==========================================
                                READ MODE: COMPREHENSIVE FULL DATA TABLE
                               ========================================== */
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
                                  <div className="col-span-2">Rescue Colony: <strong className="text-slate-900 font-medium">{expandedPetData?.found_near}</strong></div>
                                  <div>Rescue Date: <strong className="text-slate-900 font-mono font-medium">{expandedPetData?.rescue_date}</strong></div>
                                  <div className="col-span-3 border-t pt-1.5 mt-1 text-rose-800">Clinical Conditions: <span className="text-slate-700 font-mono font-medium">{expandedPetData?.current_conditions || 'None'}</span></div>
                                  <div className="col-span-3 text-blue-900">Behavior Evaluation: <span className="text-slate-700 font-medium">{expandedPetData?.behavior_notes || 'Stable baseline.'}</span></div>
                                </div>

                                <p className="bg-slate-50 p-3 rounded-xl border italic text-slate-600 text-[11px] font-normal leading-relaxed">
                                  "{expandedPetData?.about_text || 'No narrative biography logged inside active archives.'}"
                                </p>
                                
                                <div className="flex gap-2 justify-end mt-2 text-[10px] font-mono font-bold uppercase">
                                  <button onClick={() => startEditing(pet)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold shadow-sm transition-all">Modify Entire Record</button>
                                  <button onClick={() => setPetIdToPurge(pet.pet_id)} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition-all">Wipe Configuration</button>
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

      {/* ================= INJECTED CUSTOM STATE-DRIVEN MODAL OVERLAY ================= */}
      {/* Completely isolates the delete trigger transaction path without blocking the browser event loops */}
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
              <button 
                type="button" 
                onClick={() => setPetIdToPurge(null)} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all tracking-wider"
              >
                Abort
              </button>
              <button 
                type="button" 
                onClick={handleExecutePurgeSequence} 
                className="px-4 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white rounded-xl transition-all shadow-sm tracking-wider"
              >
                Execute Hard Purge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}