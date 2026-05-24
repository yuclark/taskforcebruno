import React, { useState, useEffect } from 'react';

export default function StaffDashboard({ session, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('Pending Applications');
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [errorPets, setErrorPets] = useState('');
  
  // Accordion drawer tracking states
  const [expandedPetId, setExpandedPetId] = useState(null);
  const [expandedPetData, setExpandedPetData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // CRUD operation state flags
  const [isEditingId, setIsEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Form model initialization for inserting a brand new pet profile
  const [newPetForm, setNewPetForm] = useState({
    pet_id: '', name: '', species: 'Cat', breed: '', gender: 'Male',
    age: '', weight: '', vaccination_status: 'Fully Vaccinated',
    spayed_neutered: true, adoption_status: 'Available',
    found_near: '', rescue_date: '', size: 'Small',
    about_text: '', last_checkup: '', current_conditions: 'None',
    behavior_notes: ''
  });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const fetchAllRegisteredPets = async () => {
    setLoadingPets(true);
    setErrorPets('');
    setExpandedPetId(null);
    setExpandedPetData(null);
    setIsEditingId(null);
    try {
      const res = await fetch('http://localhost:8000/api/pets/');
      if (!res.ok) throw new Error('Could not pull active asset schema from server records.');
      const data = await res.json();
      setPets(data);
    } catch (err) {
      setErrorPets(err.message);
    } finally {
      setLoadingPets(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'Pet Listings') {
      fetchAllRegisteredPets();
    }
  }, [activeMenu]);

  const handleRowClick = async (petId) => {
    if (isEditingId) return; // Prevent row shifts during active edit locks
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
      if (res.ok) {
        const data = await res.json();
        setExpandedPetData(data);
      }
    } catch (err) {
      console.error('Error fetching extended asset logs:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // --- CRUD: CREATE HANDLER ---
  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPetForm({
      ...newPetForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });
    try {
      const res = await fetch('http://localhost:8000/api/pets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPetForm)
      });
      const data = await res.json();
      if (res.ok) {
        setFormMessage({ type: 'success', text: `Profile successfully generated for ${newPetForm.name} under identifier ${newPetForm.pet_id}!` });
        setNewPetForm({
          pet_id: '', name: '', species: 'Cat', breed: '', gender: 'Male',
          age: '', weight: '', vaccination_status: 'Fully Vaccinated',
          spayed_neutered: true, adoption_status: 'Available',
          found_near: '', rescue_date: '', size: 'Small',
          about_text: '', last_checkup: '', current_conditions: 'None',
          behavior_notes: ''
        });
      } else {
        setFormMessage({ type: 'error', text: data.error || 'Failed to initialize profile.' });
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: 'Connection to server target node refused.' });
    }
  };

  // --- CRUD: UPDATE INITIALIZER ---
  const startEditing = (pet) => {
    setIsEditingId(pet.pet_id);
    setEditFormData({ ...pet });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : value
    });
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
        // Refresh local memory data configurations
        fetchAllRegisteredPets();
      } else {
        alert('Server rejected mutation request schemas.');
      }
    } catch (err) {
      alert('Error updating asset log properties.');
    }
  };

  // --- CRUD: DELETE PURGE HANDLER ---
  const executePurgeSequence = async (petId) => {
    const doubleConfirm = window.confirm(`Warning: You are initiating a structural drop parameter for entry code ${petId}. This clear operation is irreversible. Proceed?`);
    if (!doubleConfirm) return;

    try {
      const res = await fetch(`http://localhost:8000/api/pets/${petId}/`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setExpandedPetId(null);
        setExpandedPetData(null);
        fetchAllRegisteredPets();
      } else {
        alert('Database execution framework failed to drop the target row entity.');
      }
    } catch (err) {
      alert('Network failure connecting to remote infrastructure storage tables.');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      
      {/* Sidebar Control Area Panel - Configured with standard w-72 layout width to prevent text clipping */}
      <aside className="w-72 bg-[#5C0612] text-white p-6 flex flex-col justify-between border-r-4 border-[#D4AF37] shrink-0 sticky top-0 h-screen overflow-y-auto z-10 shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
            <div className="bg-white/10 p-2 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Task Force Bruno</h2>
              <span className="text-[10px] text-[#D4AF37] font-semibold tracking-wider uppercase block mt-0.5">MDC Staff Portal</span>
            </div>
          </div>

          <p className="text-[9px] uppercase tracking-widest font-bold text-stone-400 mb-3 px-2">Management</p>
          <nav className="space-y-1.5">
            {[
              { id: 'Pending Applications', label: 'Pending Applications' },
              { id: 'Pet Listings', label: 'Pet Listings' },
              { id: 'Add New Pet', label: '+ Add New Pet' },
              { id: 'Medical Logs', label: 'Medical Logs' },
              { id: 'Inventory Control', label: 'Inventory Control' }
            ].map((menu) => (
              <button
                key={menu.id}
                onClick={() => setActiveMenu(menu.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-normal break-words ${
                  activeMenu === menu.id 
                    ? 'bg-white text-[#5C0612] shadow-md font-semibold' 
                    : 'text-stone-200 hover:bg-white/5'
                }`}
              >
                <span>{menu.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#5C0612] font-bold flex items-center justify-center text-xs shrink-0">
              AS
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold truncate leading-none text-white">Admin Staff</p>
              <span className="text-[9px] text-stone-300 font-mono block mt-1 truncate">{session.email}</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-2 bg-white/5 hover:bg-rose-950/40 text-stone-300 hover:text-rose-200 rounded-xl text-[11px] font-medium tracking-wide transition-all border border-white/10"
          >
            DISCONNECT NODE
          </button>
        </div>
      </aside>

      {/* Main Operations Workspace Area Right */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{activeMenu}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage and execute state mutations on active institutional records.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-600">Clearance Secured: STAFF</span>
          </div>
        </div>

        {/* TAB 1: Pending Applications - Empty Structure */}
        {activeMenu === 'Pending Applications' && (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 bg-white max-w-xl mx-auto">
            <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375M9 9h3.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-xs font-medium tracking-wide">No incoming adoption applications currently in the review queue.</p>
          </div>
        )}

        {/* TAB 2: Live Pet Listings View Sheet with Full Update/Delete CRUD Drawer */}
        {activeMenu === 'Pet Listings' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
            {loadingPets ? (
              <div className="p-12 text-center text-xs font-mono text-slate-400">
                <div className="w-6 h-6 border-2 border-[#5C0612] border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-2"></div>
                PULLING RECORD SCHEMA CACHE...
              </div>
            ) : errorPets ? (
              <div className="p-8 text-center text-xs text-rose-600 bg-rose-50 border-t border-b border-rose-100 font-medium">{errorPets}</div>
            ) : pets.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-light">No animals registered in the database cache yet.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="p-4 w-28">Pet ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Species / Breed</th>
                    <th className="p-4">Scale Metric</th>
                    <th className="p-4">Colony Location</th>
                    <th className="p-4 text-center">Status Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-light text-slate-700">
                  {pets.map((pet) => (
                    <React.Fragment key={pet.pet_id}>
                      <tr 
                        onClick={() => handleRowClick(pet.pet_id)} 
                        className={`transition-colors cursor-pointer select-none ${expandedPetId === pet.pet_id ? 'bg-slate-50 font-medium' : 'hover:bg-slate-50/60'}`}
                      >
                        <td className="p-4 font-mono font-bold text-[#5C0612] flex items-center gap-2">
                          <svg className={`w-3 h-3 text-slate-400 transition-transform transform ${expandedPetId === pet.pet_id ? 'rotate-90 text-[#5C0612]' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
                          <span>{pet.pet_id}</span>
                        </td>
                        <td className="p-4 font-semibold text-slate-950 text-sm">{pet.name}</td>
                        <td className="p-4 text-slate-600">{pet.species} • {pet.breed || 'Mix'}</td>
                        <td className="p-4 font-mono text-slate-500">{pet.weight}</td>
                        <td className="p-4 text-slate-600 truncate max-w-[160px]">{pet.found_near}</td>
                        <td className="p-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">{pet.vaccination_status}</span>
                        </td>
                      </tr>
                      
                      {/* Interactive Expanded Actions Core Drawer */}
                      {expandedPetId === pet.pet_id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={6} className="p-6 border-b border-slate-200 bg-white/40">
                            {isEditingId === pet.pet_id ? (
                              /* CRUD: UPDATE INLINE EDITING INTERFACE PANELS */
                              <form onSubmit={submitUpdatePatch} className="space-y-4 text-xs max-w-2xl bg-white p-5 border border-slate-200 rounded-xl shadow-inner">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                  <span className="font-mono font-bold text-[#5C0612] uppercase tracking-wider">Modifying Record: {pet.pet_id}</span>
                                  <button type="button" onClick={() => setIsEditingId(null)} className="text-slate-400 hover:text-slate-900">✕ Cancel</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block font-bold text-slate-400 text-[9px] uppercase tracking-wider mb-1">Name</label>
                                    <input type="text" name="name" value={editFormData.name || ''} onChange={handleEditChange} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-slate-400 text-[9px] uppercase tracking-wider mb-1">Breed Subtype</label>
                                    <input type="text" name="breed" value={editFormData.breed || ''} onChange={handleEditChange} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block font-bold text-slate-400 text-[9px] uppercase tracking-wider mb-1">Age</label>
                                    <input type="text" name="age" value={editFormData.age || ''} onChange={handleEditChange} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-slate-400 text-[9px] uppercase tracking-wider mb-1">Weight Mass</label>
                                    <input type="text" name="weight" value={editFormData.weight || ''} onChange={handleEditChange} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-slate-400 text-[9px] uppercase tracking-wider mb-1">Territory Colony</label>
                                    <input type="text" name="found_near" value={editFormData.found_near || ''} onChange={handleEditChange} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                                  </div>
                                </div>
                                <div>
                                  <label className="block font-bold text-slate-400 text-[9px] uppercase tracking-wider mb-1">Profile Narrative Summary</label>
                                  <textarea name="about_text" rows="2" value={editFormData.about_text || ''} onChange={handleEditChange} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none"></textarea>
                                </div>
                                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                                  <button type="button" onClick={() => setIsEditingId(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium">Abort</button>
                                  <button type="submit" className="px-4 py-1.5 bg-[#5C0612] hover:bg-[#42040B] text-white border-b-2 border-[#D4AF37] font-semibold rounded-lg shadow-sm">Save Structural Changes</button>
                                </div>
                              </form>
                            ) : (
                              /* CRUD: READ DRAWER COMPONENT HOOKED WITH INLINE ACTION MUTATORS */
                              <div className="animate-fade-in text-xs text-slate-700">
                                {loadingDetails ? (
                                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400"><div className="w-4 h-4 border-2 border-[#5C0612] border-t-transparent rounded-full animate-spin"></div><span>ASSEMBLING IMAGE DATA BUFFERS...</span></div>
                                ) : expandedPetData ? (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="w-full bg-slate-900 rounded-xl overflow-hidden border-2 border-[#D4AF37] aspect-[4/3] max-w-[240px] shadow-sm relative shrink-0">
                                      <img src={expandedPetData.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'} alt={expandedPetData.name} className="w-full h-full object-cover" />
                                      <div className="absolute top-2 left-2 bg-black/60 text-white font-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">{expandedPetData.adoption_status}</div>
                                    </div>
                                    <div className="md:col-span-2 flex flex-col justify-between">
                                      <div className="space-y-3">
                                        <p className="font-light leading-relaxed text-slate-600 bg-white p-3 rounded-xl border border-slate-200/60 shadow-inner">"{expandedPetData.about_text}"</p>
                                        <div className="text-[11px] text-slate-500 font-mono grid grid-cols-2 bg-slate-100/50 p-2.5 rounded-lg border border-slate-100">
                                          <span>CNVR Status: {expandedPetData.spayed_neutered ? 'Sterilized' : 'Intact'}</span>
                                          <span>Last Checkup: {expandedPetData.last_checkup}</span>
                                        </div>
                                      </div>
                                      
                                      {/* ACTION DOCK INJECTING UPDATE & DELETE PIPELINES */}
                                      <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-4">
                                        <button 
                                          onClick={() => startEditing(pet)}
                                          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1"
                                        >
                                          Edit Profile
                                        </button>
                                        <button 
                                          onClick={() => executePurgeSequence(pet.pet_id)}
                                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1"
                                        >
                                          Delete Profile
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : <p className="text-xs text-rose-500 font-medium pl-4">Failed to assemble secondary row structures.</p>}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: CRUD - CREATE NEW PET TRANS-PIPELINES */}
        {activeMenu === 'Add New Pet' && (
          <div className="max-w-3xl bg-white border border-slate-200 shadow-sm rounded-2xl p-6 animate-fade-in mx-auto">
            <div className="mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#5C0612] uppercase tracking-wider font-mono">Create Campus Animal Asset Profile</h3>
              <p className="text-xs text-slate-400 mt-0.5">Input parameters to synchronize new animal identification row elements inside Supabase.</p>
            </div>

            {formMessage.text && (
              <div className={`p-3 border text-xs font-light rounded-xl mb-4 ${formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>
                {formMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unique Pet ID *</label>
                  <input type="text" name="pet_id" required value={newPetForm.pet_id} onChange={handleCreateChange} placeholder="Ex: PET-3011" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 font-mono tracking-wider focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Pet Given Name *</label>
                  <input type="text" name="name" required value={newPetForm.name} onChange={handleCreateChange} placeholder="Ex: Tiger" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 font-medium focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Species Entry *</label>
                  <select name="species" value={newPetForm.species} onChange={handleCreateChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none">
                    <option value="Cat">Cat (Feline)</option>
                    <option value="Dog">Dog (Canine)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Breed Sub-variant</label>
                  <input type="text" name="breed" value={newPetForm.breed} onChange={handleCreateChange} placeholder="Ex: Tabby Shorthair" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Biological Gender</label>
                  <select name="gender" value={newPetForm.gender} onChange={handleCreateChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Age Matrix Metrics</label>
                  <input type="text" name="age" value={newPetForm.age} onChange={handleCreateChange} placeholder="Ex: 1.5 years" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Weight Value</label>
                  <input type="text" name="weight" value={newPetForm.weight} onChange={handleCreateChange} placeholder="Ex: 10 lbs" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Colony Territory Zone</label>
                  <input type="text" name="found_near" value={newPetForm.found_near} onChange={handleCreateChange} placeholder="Ex: Lawganan Zone" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Rescue Timeline Date</label>
                  <input type="date" name="rescue_date" value={newPetForm.rescue_date} onChange={handleCreateChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Size Bracket</label>
                  <select name="size" value={newPetForm.size} onChange={handleCreateChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none">
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Vaccination Compliance</label>
                  <select name="vaccination_status" value={newPetForm.vaccination_status} onChange={handleCreateChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none">
                    <option value="Fully Vaccinated">Fully Vaccinated</option>
                    <option value="Partially Vaccinated">Partially Vaccinated</option>
                    <option value="Unvaccinated">Unvaccinated</option>
                  </select>
                </div>
                <div className="flex items-center h-full pt-4 pl-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" name="spayed_neutered" checked={newPetForm.spayed_neutered} onChange={handleCreateChange} className="w-4 h-4 rounded text-[#5C0612] accent-[#5C0612]" />
                    <span className="text-[10px] font-bold uppercase text-slate-500">CNVR Sterilization Compliance</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Narrative Profile Summary</label>
                <textarea name="about_text" rows="2" value={newPetForm.about_text} onChange={handleCreateChange} placeholder="Describe personality traits..." className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none"></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Behavioral Matrix Alerts</label>
                <input type="text" name="behavior_notes" value={newPetForm.behavior_notes} onChange={handleCreateChange} placeholder="Ex: Gentle with students." className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none" />
              </div>

              <button type="submit" className="w-full py-3 bg-[#5C0612] hover:bg-[#42040B] text-white font-bold tracking-widest rounded-xl border-b-4 border-[#D4AF37] transition-all">
                SYNCHRONIZE NEW ASSET RECORD
              </button>
            </form>
          </div>
        )}

        {/* TAB 4 & 5: Placeholders */}
        {(activeMenu === 'Medical Logs' || activeMenu === 'Inventory Control') && (
          <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 max-w-xl mx-auto bg-white">
            <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18m-18 0v-4.5A2.25 2.25 0 0 1 4.5 6.75h15A2.25 2.25 0 0 1 21.75 9v4.5m-18 0v6a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25v-6Z"/></svg>
            <p className="text-xs font-medium tracking-wide">Data module initialization records segment empty.</p>
          </div>
        )}
      </div>

    </div>
  );
}

function loadingLinesSection(isLoading, data) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] py-2 pl-4">
        <div className="w-4 h-4 border-2 border-[#5C0612] border-t-transparent rounded-full animate-spin"></div>
        <span>ASSEMBLING GRAPHICAL IMAGE BUFFERS...</span>
      </div>
    );
  }
  if (!data) return <p className="text-xs text-rose-500 font-medium pl-4">Failed to assemble secondary row structures.</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in text-xs text-slate-700">
      <div className="w-full bg-slate-900 rounded-xl overflow-hidden border-2 border-[#D4AF37] aspect-[4/3] max-w-[260px] shadow-sm relative">
        <img src={data.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'} alt={data.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 bg-black/60 text-white font-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">{data.adoption_status}</div>
      </div>
      <div className="md:col-span-2 space-y-4">
        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">MDC Clinical Framework</h4>
            <p className="text-slate-800"><span className="font-medium">CNVR Status:</span> {data.spayed_neutered ? 'Sterilized' : 'Intact'}</p>
            <p className="text-slate-800 mt-1"><span className="font-medium">Last Checkup:</span> <span className="font-mono">{data.last_checkup}</span></p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Risk Vector Tracking</h4>
            <p className="text-slate-800"><span className="font-medium">Conditions:</span> {data.current_conditions}</p>
            <p className="text-slate-800 mt-1"><span className="font-medium">Scale Bracket:</span> {data.size}</p>
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Background Profile</h4>
          <p className="font-light leading-relaxed text-slate-600 bg-white p-3 rounded-xl border border-slate-200/60 shadow-inner">{data.about_text}</p>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Behavior Notes Matrix</h4>
          <p className="font-light leading-relaxed text-slate-600 bg-slate-100/60 p-2.5 rounded-lg border border-slate-200/40 italic">"{data.behavior_notes}"</p>
        </div>
      </div>
    </div>
  );
}