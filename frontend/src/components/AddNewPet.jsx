import React, { useState } from 'react';

export default function AddNewPet({ onRefresh }) {
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
  
  // File state node for handling direct binary upload attachments
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

    // Pack metrics inside FormData instance to allow multi-part binary stream routing
    const multiPartFormPayload = new FormData();
    
    multiPartFormPayload.append('pet_id', newPetForm.pet_id.trim().toUpperCase());
    multiPartFormPayload.append('name', newPetForm.name.trim());
    multiPartFormPayload.append('species', newPetForm.species);
    multiPartFormPayload.append('pet_type', newPetForm.pet_type);
    multiPartFormPayload.append('breed', newPetForm.breed.trim() || 'Mix');
    multiPartFormPayload.append('gender', newPetForm.gender);
    multiPartFormPayload.append('age', newPetForm.age.trim() || 'Unknown');
    multiPartFormPayload.append('weight', newPetForm.weight.trim() || 'Unknown');
    multiPartFormPayload.append('size', newPetForm.size);
    multiPartFormPayload.append('vaccination_status', newPetForm.vaccination_status);
    multiPartFormPayload.append('spayed_neutered', newPetForm.spayed_neutered);
    multiPartFormPayload.append('adoption_status', newPetForm.adoption_status);
    multiPartFormPayload.append('found_near', newPetForm.found_near.trim());
    multiPartFormPayload.append('rescue_date', newPetForm.rescue_date);
    multiPartFormPayload.append('current_conditions', newPetForm.current_conditions.trim() || 'None');
    multiPartFormPayload.append('behavior_notes', newPetForm.behavior_notes.trim() || 'Stable baseline parameters.');
    multiPartFormPayload.append('about_text', newPetForm.about_text.trim());

    // Append file structure chunk if populated
    if (imageFile) {
      multiPartFormPayload.append('image', imageFile);
    }

    try {
      const res = await fetch('http://localhost:8000/api/pets/', {
        method: 'POST',
        // NOTE: Content-Type headers are left blank intentionally here so the 
        // browser automatically configures custom multi-part form boundaries.
        body: multiPartFormPayload
      });
      
      if (res.ok) {
        setFormMessage({ type: 'success', text: `Profile successfully generated for ${newPetForm.name.trim()}!` });
        setNewPetForm({
          pet_id: '', name: '', species: 'Cat', pet_type: 'Campus Pet', breed: '', gender: 'Male', age: '', weight: '', size: 'Small',
          vaccination_status: 'Fully Vaccinated', spayed_neutered: true, adoption_status: 'Available',
          found_near: '', rescue_date: new Date().toISOString().split('T')[0], current_conditions: 'None',
          behavior_notes: '', about_text: ''
        });
        setImageFile(null);
        
        // Reset raw HTML form file selection elements safely
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
    <div className="max-w-3xl bg-white border border-slate-200 shadow-xl rounded-3xl p-6 mx-auto animate-fade-in text-xs text-slate-700">
      {formMessage.text && (
        <div className={`p-3 border text-xs font-light rounded-xl mb-4 ${formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>{formMessage.text}</div>
      )}
      <form onSubmit={handleCreateSubmit} className="space-y-4">
        
        {/* Core System Identifiers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unique Pet ID *</label><input type="text" name="pet_id" required value={newPetForm.pet_id} onChange={handleCreateChange} placeholder="PET-3011" className="w-full px-3 py-2 border rounded-xl font-mono focus:outline-none" /></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pet Name *</label><input type="text" name="name" required value={newPetForm.name} onChange={handleCreateChange} placeholder="Tiger" className="w-full px-3 py-2 border rounded-xl focus:outline-none font-medium text-slate-900" /></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Species Subtype *</label><select name="species" value={newPetForm.species} onChange={handleCreateChange} className="w-full px-3 py-2 border rounded-xl focus:outline-none font-medium"><option value="Cat">Cat</option><option value="Dog">Dog</option></select></div>
          
          {/* LABELED CLASSIFICATION SELECTOR */}
          <div>
            <label className="block text-[10px] font-bold text-[#5C0612] uppercase mb-1">System Classification *</label>
            <select name="pet_type" value={newPetForm.pet_type} onChange={handleCreateChange} className="w-full px-3 py-2 border-2 border-[#D4AF37]/40 bg-amber-50/20 text-slate-900 rounded-xl focus:outline-none font-bold">
              <option value="Campus Pet">Campus Pet (Resident)</option>
              <option value="For Adoption">For Adoption (Outside Placement)</option>
            </select>
          </div>
        </div>

        {/* Animal Demographics metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Breed Line</label><input type="text" name="breed" value={newPetForm.breed} onChange={handleCreateChange} placeholder="Puspin, Mix" className="w-full px-3 py-2 border rounded-xl focus:outline-none" /></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</label><select name="gender" value={newPetForm.gender} onChange={handleCreateChange} className="w-full px-3 py-2 border rounded-xl focus:outline-none font-medium"><option value="Male">Male</option><option value="Female">Female</option></select></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estimated Age</label><input type="text" name="age" value={newPetForm.age} onChange={handleCreateChange} placeholder="Ex: 2 years" className="w-full px-3 py-2 border rounded-xl focus:outline-none" /></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Size Bracket</label><select name="size" value={newPetForm.size} onChange={handleCreateChange} className="w-full px-3 py-2 border rounded-xl focus:outline-none font-medium"><option value="Small">Small</option><option value="Medium">Medium</option><option value="Large">Large</option></select></div>
        </div>

        {/* Operational Health Status Frameworks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Current Weight</label><input type="text" name="weight" value={newPetForm.weight} onChange={handleCreateChange} placeholder="Ex: 4.5 kg" className="w-full px-3 py-2 border rounded-xl focus:outline-none" /></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Immunization State</label><select name="vaccination_status" value={newPetForm.vaccination_status} onChange={handleCreateChange} className="w-full px-3 py-2 border rounded-xl focus:outline-none font-medium"><option value="Fully Vaccinated">Fully Vaccinated</option><option value="Partially Vaccinated">Partially Vaccinated</option><option value="Not Vaccinated">Not Vaccinated</option></select></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Adoption Pipeline Stage</label><select name="adoption_status" value={newPetForm.adoption_status} onChange={handleCreateChange} className="w-full px-3 py-2 border rounded-xl focus:outline-none font-medium"><option value="Available">Available</option><option value="Fostered">Fostered</option><option value="Adopted">Adopted</option></select></div>
          <div className="flex items-center h-full pt-4 pl-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" name="spayed_neutered" checked={newPetForm.spayed_neutered} onChange={handleCreateChange} className="w-4 h-4 checked:bg-[#5C0612] accent-[#5C0612] rounded" />
              <span className="text-[10px] font-bold uppercase text-slate-500">Sterilized (Neutered)</span>
            </label>
          </div>
        </div>

        {/* Sighting Origin & Environmental Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rescue Colony Zone</label><input type="text" name="found_near" required value={newPetForm.found_near} onChange={handleCreateChange} placeholder="Ex: CIT-U Main Gymnasium" className="w-full px-3 py-2 border rounded-xl focus:outline-none" /></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rescue Capture Date</label><input type="date" name="rescue_date" value={newPetForm.rescue_date} onChange={handleCreateChange} className="w-full px-3 py-2 border rounded-xl font-mono focus:outline-none" /></div>
        </div>

        {/* Extended Diagnostic Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Clinical / Medical Conditions</label><input type="text" name="current_conditions" value={newPetForm.current_conditions} onChange={handleCreateChange} placeholder="None, minor observations" className="w-full px-3 py-2 border rounded-xl focus:outline-none" /></div>
          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Behavioral Assessment Analytics</label><input type="text" name="behavior_notes" value={newPetForm.behavior_notes} onChange={handleCreateChange} placeholder="Friendly, timid around foot traffic" className="w-full px-3 py-2 border rounded-xl focus:outline-none" /></div>
        </div>

        {/* MODIFIED: Direct File Input Component instead of URL string */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Upload Profile Picture Asset *</label>
          <input 
            type="file" 
            accept="image/*" 
            required
            onChange={handleFileChange} 
            className="w-full px-3 py-1.5 bg-slate-50 border rounded-xl focus:outline-none font-mono text-slate-600 text-[11px] file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-mono file:font-bold file:bg-[#5C0612] file:text-white hover:file:opacity-90 file:cursor-pointer" 
          />
        </div>

        {/* Narrative Description Background Summary */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Narrative Profile Summary Biography</label>
          <textarea name="about_text" rows="2" value={newPetForm.about_text} onChange={handleCreateChange} placeholder="Describe personality traits or special details..." className="w-full px-3 py-2 border rounded-xl focus:outline-none text-slate-800 leading-relaxed"></textarea>
        </div>

        <button type="submit" className="w-full py-3 bg-[#5C0612] text-white font-bold tracking-widest rounded-xl border-b-4 border-[#D4AF37] hover:bg-[#42040B] transition-all uppercase shadow-md">Synchronize Asset Parameters</button>
      </form>
    </div>
  );
}