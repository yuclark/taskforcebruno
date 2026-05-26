import React, { useState } from 'react';

export default function AddNewPet({ onRefresh }) {
  const [isStrayMode, setIsStrayMode] = useState(false);
  const [newPetForm, setNewPetForm] = useState({
    pet_id: '',
    name: '',
    species: 'Cat',
    pet_type: 'Campus Pet', 
    breed: '',
    gender: 'Male',
    age: '',
    weight: '',
    size: 'Small',
    vaccination_status: 'Fully Vaccinated',
    spayed_neutered: true,
    adoption_status: 'Available',
    found_near: '',
    rescue_date: new Date().toISOString().split('T')[0],
    current_conditions: 'None',
    behavior_notes: '',
    about_text: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPetForm({ ...newPetForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    const multiPartFormPayload = new FormData();
    
    const massValueString = newPetForm.weight.toString().trim();
    const formattedWeightPayload = massValueString ? `${massValueString} kg` : 'Unknown';

    let finalizedPetId = newPetForm.pet_id.trim().toUpperCase();
    let finalizedSpecies = newPetForm.species;
    let finalizedPetType = newPetForm.pet_type;
    let finalizedName = newPetForm.name.trim();

    // ── NEW FEAT LOGIC: AUTO-INCREMENTAL FALLBACK STRINGS GENERATION ENGINE ──
    if (isStrayMode) {
      finalizedPetId = `STRAY-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
      finalizedPetType = 'For Adoption';
      
      let strayCount = 1;
      try {
        const checkRes = await fetch('https://taskforcebruno.onrender.com/api/pets/');
        if (checkRes.ok) {
          const allIndexedPets = await checkRes.json();
          // Count existing active stray profiles matching this specific biological species line
          const matchingStrays = allIndexedPets.filter(p => 
            p.pet_id?.startsWith('STRAY-') && 
            p.species?.toLowerCase() === finalizedSpecies.toLowerCase()
          );
          strayCount = matchingStrays.length + 1;
        }
      } catch (err) {
        console.error('Error calculating incremental profile matrices:', err);
      }

      if (!finalizedName) {
        finalizedName = `Stray ${finalizedSpecies} #${strayCount}`;
      }
    }

    multiPartFormPayload.append('pet_id', finalizedPetId);
    multiPartFormPayload.append('name', finalizedName);
    multiPartFormPayload.append('species', finalizedSpecies);
    multiPartFormPayload.append('pet_type', finalizedPetType);
    multiPartFormPayload.append('breed', isStrayMode ? (newPetForm.breed.trim() || `Stray ${finalizedSpecies} Line`) : (newPetForm.breed.trim() || 'Mix'));
    multiPartFormPayload.append('gender', newPetForm.gender);
    multiPartFormPayload.append('age', newPetForm.age.trim() || 'Unknown');
    multiPartFormPayload.append('weight', formattedWeightPayload);
    multiPartFormPayload.append('size', newPetForm.size);
    multiPartFormPayload.append('vaccination_status', newPetForm.vaccination_status);
    multiPartFormPayload.append('spayed_neutered', newPetForm.spayed_neutered);
    multiPartFormPayload.append('adoption_status', newPetForm.adoption_status);
    multiPartFormPayload.append('found_near', newPetForm.found_near.trim());
    multiPartFormPayload.append('rescue_date', newPetForm.rescue_date);
    multiPartFormPayload.append('current_conditions', newPetForm.current_conditions.trim() || 'None');
    multiPartFormPayload.append('behavior_notes', newPetForm.behavior_notes.trim() || 'Stable baseline parameters.');
    multiPartFormPayload.append('about_text', newPetForm.about_text.trim());

    if (imageFile) {
      multiPartFormPayload.append('image', imageFile);
    }

    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/pets/', {
        method: 'POST',
        body: multiPartFormPayload
      });
      
      if (res.ok) {
        setFormMessage({ type: 'success', text: `Profile successfully generated for ${finalizedName}!` });
        setNewPetForm({
          pet_id: '', name: '', species: 'Cat', pet_type: 'Campus Pet', breed: '', gender: 'Male', age: '', weight: '', size: 'Small',
          vaccination_status: 'Fully Vaccinated', spayed_neutered: true, adoption_status: 'Available',
          found_near: '', rescue_date: new Date().toISOString().split('T')[0], current_conditions: 'None',
          behavior_notes: '', about_text: ''
        });
        setImageFile(null);
        if (e.target) e.target.reset();
        onRefresh();
      } else {
        const errorData = await res.json();
        setFormMessage({ type: 'error', text: errorData.error || 'Failed to instantiate database mapping.' });
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: 'Ecosystem communication target network down.' });
    }
  };

  return (
    <div className="w-full max-w-5xl bg-white border border-slate-200 shadow-xl rounded-3xl p-6 mx-auto animate-fade-in text-xs text-slate-700">
      
      <div className="border-b pb-3 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Initialize Resident Animal File</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Generate core biometric logs, colony location keys, and primary visual metadata attachments.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 font-mono text-[10px] font-bold uppercase select-none shrink-0">
          <button type="button" onClick={() => setIsStrayMode(false)} className={`px-3 py-1.5 rounded-lg transition-all ${!isStrayMode ? 'bg-white text-[#5C0612] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Standard Pet</button>
          <button type="button" onClick={() => setIsStrayMode(true)} className={`px-3 py-1.5 rounded-lg transition-all ${isStrayMode ? 'bg-white text-[#5C0612] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Add Stray Dog/Cat</button>
        </div>
      </div>

      {formMessage.text && (
        <div className={`p-3 border text-xs font-medium rounded-xl mb-4 text-left ${formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>{formMessage.text}</div>
      )}
      <form onSubmit={handleCreateSubmit} className="space-y-5 text-left">
        
        {/* Core System Identifiers */}
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
          <span className="block font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">01 &bull; Identification Framework tokens</span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {isStrayMode ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unique Pet ID</label>
                <input type="text" disabled value="AUTO-GENERATED STRAY KEY" className="w-full px-3 py-2 border bg-slate-100 rounded-xl font-mono text-slate-400 focus:outline-none select-none font-bold tracking-tight text-[10px]" />
              </div>
            ) : (
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unique Pet ID *</label><input type="text" name="pet_id" required={!isStrayMode} value={newPetForm.pet_id} onChange={handleCreateChange} placeholder="PET-3011" className="w-full px-3 py-2 border bg-white rounded-xl font-mono focus:outline-none" /></div>
            )}
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pet Name {isStrayMode && '(Optional)'}</label>
              <input type="text" name="name" required={!isStrayMode} value={newPetForm.name} onChange={handleCreateChange} placeholder={isStrayMode ? "Auto-Generated Fallback Name" : "Tiger"} className="w-full px-3 py-2 border bg-white rounded-xl focus:outline-none font-medium text-slate-900" />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Species Subtype *</label>
              <select name="species" value={newPetForm.species} onChange={handleCreateChange} className="w-full px-3 py-2 border bg-white rounded-xl focus:outline-none font-medium">
                <option value="Cat">Cat</option>
                <option value="Dog">Dog</option>
              </select>
            </div>

            {isStrayMode ? (
              <div>
                <label className="block text-[10px] font-bold text-[#5C0612] uppercase mb-1">System Classification</label>
                <input type="text" disabled value="For Adoption" className="w-full px-3 py-2 border-2 border-[#D4AF37]/30 bg-amber-50/20 text-slate-900 rounded-xl font-sans font-bold focus:outline-none" />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-[#5C0612] uppercase mb-1">System Classification *</label>
                <select name="pet_type" value={newPetForm.pet_type} onChange={handleCreateChange} className="w-full px-3 py-2 border-2 border-[#D4AF37]/40 bg-amber-50/30 text-slate-900 rounded-xl focus:outline-none font-bold">
                  <option value="Campus Pet">Campus Pet (Resident)</option>
                  <option value="For Adoption">For Adoption (Outside Placement)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Animal Demographics metrics */}
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
          <span className="block font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">02 &bull; Somatic Markers & Demographics</span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Breed Line</label><input type="text" name="breed" value={newPetForm.breed} onChange={handleCreateChange} placeholder={isStrayMode ? "Native / Mix Line" : "Puspin, Mix"} className="w-full px-3 py-2 border bg-white rounded-xl focus:outline-none" /></div>
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</label><select name="gender" value={newPetForm.gender} onChange={handleCreateChange} className="w-full px-3 py-2 border bg-white rounded-xl focus:outline-none font-medium"><option value="Male">Male</option><option value="Female">Female</option></select></div>
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estimated Age</label><input type="text" name="age" value={newPetForm.age} onChange={handleCreateChange} placeholder="Ex: 2 years" className="w-full px-3 py-2 border bg-white rounded-xl focus:outline-none" /></div>
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Size Bracket</label><select name="size" value={newPetForm.size} onChange={handleCreateChange} className="w-full px-3 py-2 border bg-white rounded-xl focus:outline-none font-medium"><option value="Small">Small</option><option value="Medium">Medium</option><option value="Large">Large</option></select></div>
          </div>
        </div>

        {/* Operational Health Status Frameworks */}
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
          <span className="block font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">03 &bull; Clinical & Pipeline Parameters</span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#5C0612] uppercase mb-1">Current Weight *</label>
              <div className="relative flex items-center">
                <input type="number" step="0.01" name="weight" required value={newPetForm.weight} onChange={handleCreateChange} placeholder="Ex: 4.5" className="w-full px-3 py-2 pr-8 border bg-white rounded-xl font-mono focus:outline-none focus:border-[#5C0612]" />
                <span className="absolute right-3 text-slate-400 font-mono font-bold text-[10px] select-none">kg</span>
              </div>
            </div>

            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Immunization State</label><select name="vaccination_status" value={newPetForm.vaccination_status} onChange={handleCreateChange} className="w-full px-3 py-2 border bg-white rounded-xl focus:outline-none font-medium"><option value="Fully Vaccinated">Fully Vaccinated</option><option value="Partially Vaccinated">Partially Vaccinated</option><option value="Not Vaccinated">Not Vaccinated</option></select></div>
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Adoption Pipeline Stage</label><select name="adoption_status" value={newPetForm.adoption_status} onChange={handleCreateChange} className="w-full px-3 py-2 border bg-white rounded-xl focus:outline-none font-medium"><option value="Available">Available</option><option value="Fostered">Fostered</option><option value="Adopted">Adopted</option></select></div>
            <div className="flex items-center h-full pt-4 pl-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" name="spayed_neutered" checked={newPetForm.spayed_neutered} onChange={handleCreateChange} className="w-4 h-4 checked:bg-[#5C0612] accent-[#5C0612] rounded border-slate-300" />
                <span className="text-[10px] font-bold uppercase text-slate-500">Sterilized (Neutered)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Colony Context, Diagnostic & Asset Row Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rescue Colony Zone *</label><input type="text" name="found_near" required value={newPetForm.found_near} onChange={handleCreateChange} placeholder="Ex: CIT-U Main Gymnasium" className="w-full px-3 py-2 border rounded-xl focus:outline-none" /></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rescue Capture Date</label><input type="date" name="rescue_date" value={newPetForm.rescue_date} onChange={handleCreateChange} className="w-full px-3 py-2 border rounded-xl font-mono focus:outline-none" /></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Clinical / Medical Conditions</label><input type="text" name="current_conditions" value={newPetForm.current_conditions} onChange={handleCreateChange} placeholder="None, minor observations" className="w-full px-3 py-2 border rounded-xl focus:outline-none" /></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Behavioral Assessment Analytics</label><input type="text" name="behavior_notes" value={newPetForm.behavior_notes} onChange={handleCreateChange} placeholder="Friendly, timid around foot traffic" className="w-full px-3 py-2 border rounded-xl focus:outline-none" /></div>
        </div>

        {/* Photo Asset Upload Component */}
        <div className="bg-amber-50/10 border border-dashed border-amber-500/20 p-4 rounded-xl">
          <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Primary Profile Photo Asset Upload *</label>
          <input 
            type="file" 
            accept="image/*" 
            required
            onChange={handleFileChange} 
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none font-mono text-slate-600 text-[11px] file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-mono file:font-bold file:bg-[#5C0612] file:text-white hover:file:opacity-90 file:cursor-pointer shadow-sm" 
          />
        </div>

        {/* Narrative Description Background Summary */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Narrative Profile Summary Biography</label>
          <textarea name="about_text" rows="3" value={newPetForm.about_text} onChange={handleCreateChange} placeholder="Describe unique traits, habits, or special administrative logs details..." className="w-full px-3 py-2 border rounded-xl focus:outline-none text-slate-800 leading-relaxed font-sans resize-none"></textarea>
        </div>

        <button type="submit" className="w-full py-3.5 bg-[#5C0612] text-white font-bold tracking-widest rounded-xl border-b-4 border-[#D4AF37] hover:bg-[#42040B] transition-all uppercase shadow-md text-xs">Synchronize Asset Parameters</button>
      </form>
    </div>
  );
}