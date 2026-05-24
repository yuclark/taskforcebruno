import React, { useState } from 'react';

export default function PetListings({ pets, loadingPets, onRefresh }) {
  const [expandedPetId, setExpandedPetId] = useState(null);
  const [expandedPetData, setExpandedPetData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditingId, setIsEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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
      const res = await fetch(`http://localhost:8000/api/pets/${petId}/`);
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
    try {
      const res = await fetch(`http://localhost:8000/api/pets/${isEditingId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        setIsEditingId(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executePurgeSequence = async (petId) => {
    if (!window.confirm('Permanently wipe this entry configuration out of database?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/pets/${petId}/`, { method: 'DELETE' });
      if (res.ok) {
        setExpandedPetId(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs text-slate-700">
      {loadingPets ? (
        <div className="p-12 text-center text-xs font-mono text-slate-400">PULLING RECORD SCHEMA CACHE...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px]">
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
                    <tr className="bg-slate-50/50">
                      <td colSpan={7} className="p-6 border-b border-slate-200 bg-white/40">
                        {isEditingId === pet.pet_id ? (
                          
                          /* ==========================================
                              MUTATION MODE: FULL PARAMETER FORM EDITING
                             ========================================== */
                          <form onSubmit={submitUpdatePatch} className="space-y-4 w-full bg-white p-5 border border-slate-200 rounded-xl shadow-inner text-left">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Name</label><input type="text" name="name" value={editFormData.name || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg" /></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Species</label><select name="species" value={editFormData.species || 'Cat'} onChange={handleEditChange} className="w-full p-2 border rounded-lg"><option value="Cat">Cat</option><option value="Dog">Dog</option></select></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Classification</label><select name="pet_type" value={editFormData.pet_type || 'Campus Pet'} onChange={handleEditChange} className="w-full p-2 border rounded-lg font-bold"><option value="Campus Pet">Campus Pet</option><option value="For Adoption">For Adoption</option></select></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Breed</label><input type="text" name="breed" value={editFormData.breed || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg" /></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Gender</label><select name="gender" value={editFormData.gender || 'Male'} onChange={handleEditChange} className="w-full p-2 border rounded-lg"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Age</label><input type="text" name="age" value={editFormData.age || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg" /></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Size Scale</label><select name="size" value={editFormData.size || 'Small'} onChange={handleEditChange} className="w-full p-2 border rounded-lg"><option value="Small">Small</option><option value="Medium">Medium</option><option value="Large">Large</option></select></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Weight</label><input type="text" name="weight" value={editFormData.weight || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg" /></div>
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
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Rescue Colony Zone</label><input type="text" name="found_near" value={editFormData.found_near || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg" /></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Rescue Date</label><input type="date" name="rescue_date" value={editFormData.rescue_date || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg font-mono" /></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Clinical / Medical Conditions</label><input type="text" name="current_conditions" value={editFormData.current_conditions || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg" /></div>
                              <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Behavioral Assessment Notes</label><input type="text" name="behavior_notes" value={editFormData.behavior_notes || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg" /></div>
                            </div>

                            <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Profile Photo Asset URL</label><input type="url" name="primary_image" value={editFormData.primary_image || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg font-mono text-[11px]" /></div>
                            <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Narrative biography Summary</label><textarea name="about_text" rows="2" value={editFormData.about_text || ''} onChange={handleEditChange} className="w-full p-2 border rounded-lg text-slate-800 leading-relaxed"></textarea></div>

                            <div className="flex gap-2 justify-end pt-2">
                              <button type="button" onClick={() => setIsEditingId(null)} className="px-3 py-1.5 bg-slate-100 rounded text-slate-600 font-medium">Abort</button>
                              <button type="submit" className="px-4 py-1.5 bg-[#5C0612] text-white font-semibold rounded-lg shadow">Commit System Updates</button>
                            </div>
                          </form>
                        ) : (
                          
                          /* ==========================================
                              READ MODE: COMPREHENSIVE FULL DATA TABLE
                             ========================================== */
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700 animate-fade-in text-left">
                            <div className="w-full bg-slate-900 rounded-xl aspect-[4/3] max-w-[240px] overflow-hidden shadow">
                              {loadingDetails ? (
                                <div className="w-full h-full flex items-center justify-center text-stone-400 font-mono text-[10px]">LOADING METADATA...</div>
                              ) : (
                                <img src={expandedPetData?.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'} alt="" className="w-full h-full object-cover" />
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

                              <p className="bg-slate-50 p-3 rounded-xl border italic text-slate-600 text-[11px]">
                                "{expandedPetData?.about_text || 'No narrative biography logged inside active archives.'}"
                              </p>
                              
                              <div className="flex gap-2 justify-end mt-2">
                                <button onClick={() => startEditing(pet)} className="px-4 py-2 bg-white border text-slate-700 rounded-xl text-xs font-semibold shadow-sm">Modify Entire Record</button>
                                <button onClick={() => executePurgeSequence(pet.pet_id)} className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold">Wipe Configuration</button>
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
}