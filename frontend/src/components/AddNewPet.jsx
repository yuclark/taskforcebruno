import React, { useState, useEffect } from 'react';

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
    adoption_status: 'Permanent Resident',
    found_near: 'Wildcat Innovation Labs',
    rescue_date: new Date().toISOString().split('T')[0],
    current_conditions: 'None',
    behavior_notes: '',
    about_text: '',
    description: ''
  });

  // Hydrate handoff from an investigated Sighting Triage report
  useEffect(() => {
    try {
      const handoff = sessionStorage.getItem('tfb_stray_handoff');
      if (handoff) {
        const data = JSON.parse(handoff);
        setIsStrayMode(true);
        setNewPetForm(prev => ({
          ...prev,
          pet_type: 'For Adoption',
          adoption_status: 'Available',
          species: data.species || 'Cat',
          found_near: data.found_near || prev.found_near,
          description: data.description || ''
        }));
        sessionStorage.removeItem('tfb_stray_handoff');
      }
    } catch {}
  }, []);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPetForm({ ...newPetForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });
    setSubmitting(true);

    const multiPartFormPayload = new FormData();

    const massValueString = newPetForm.weight.toString().trim();
    const formattedWeightPayload = massValueString ? `${massValueString} kg` : 'Unknown';

    let finalizedPetId = newPetForm.pet_id.trim().toUpperCase();
    let finalizedSpecies = newPetForm.species;
    let finalizedPetType = newPetForm.pet_type;
    let finalizedName = newPetForm.name.trim();

    if (isStrayMode) {
      finalizedPetId = `STRAY-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
      finalizedPetType = 'For Adoption';

      let strayCount = 1;
      try {
        const checkRes = await fetch('https://taskforcebruno.onrender.com/api/pets/');
        if (checkRes.ok) {
          const allIndexedPets = await checkRes.json();
          const matchingStrays = allIndexedPets.filter(p =>
            p.pet_id?.startsWith('STRAY-') &&
            p.species?.toLowerCase() === finalizedSpecies.toLowerCase()
          );
          strayCount = matchingStrays.length + 1;
        }
      } catch (err) {
        console.error('Error calculating incremental profile counts:', err);
      }

      if (!finalizedName) {
        finalizedName = `Stray ${finalizedSpecies} #${strayCount}`;
      }
    }

    multiPartFormPayload.append('pet_id', finalizedPetId);
    multiPartFormPayload.append('name', finalizedName);
    multiPartFormPayload.append('species', finalizedSpecies);
    multiPartFormPayload.append('pet_type', finalizedPetType);
    multiPartFormPayload.append('breed', isStrayMode ? (newPetForm.breed.trim() || `Stray ${finalizedSpecies}`) : (newPetForm.breed.trim() || 'Domestic Mix'));
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
    multiPartFormPayload.append('behavior_notes', newPetForm.behavior_notes.trim() || 'Healthy baseline behavior.');
    multiPartFormPayload.append('about_text', newPetForm.about_text.trim());
    multiPartFormPayload.append('description', newPetForm.description.trim());

    if (imageFile) {
      multiPartFormPayload.append('image', imageFile);
    }

    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/pets/', {
        method: 'POST',
        body: multiPartFormPayload
      });

      if (res.ok) {
        setFormMessage({ type: 'success', text: `Animal profile registered successfully for ${finalizedName} (${finalizedPetId})!` });
        setNewPetForm({
          pet_id: '', name: '', species: 'Cat', pet_type: 'Campus Pet', breed: '', gender: 'Male', age: '', weight: '', size: 'Small',
          vaccination_status: 'Fully Vaccinated', spayed_neutered: true, adoption_status: 'Available',
          found_near: 'Wildcat Innovation Labs', rescue_date: new Date().toISOString().split('T')[0], current_conditions: 'None',
          behavior_notes: '', about_text: '', description: ''
        });
        setImageFile(null);
        setImagePreviewUrl(null);
        if (e.target) e.target.reset();
        onRefresh();
      } else {
        const errorData = await res.json();
        setFormMessage({ type: 'error', text: errorData.error || 'Failed to register animal record.' });
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: 'Network connection failure with animal registry server.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-xs text-slate-700 animate-fade-in pb-12">
      
      {/* Top Header Banner with Mode Toggle */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
            Animal Registry Intake Portal
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Register resident campus pets or intake unidentified stray animals with biometric and colony records.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl font-mono text-[10px] font-bold uppercase select-none shrink-0 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setIsStrayMode(false);
              setNewPetForm(prev => ({ ...prev, pet_type: 'Campus Pet', adoption_status: 'Permanent Resident' }));
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${
              !isStrayMode ? 'bg-white text-[#5C0612] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Standard Campus Pet
          </button>
          <button
            type="button"
            onClick={() => {
              setIsStrayMode(true);
              setNewPetForm(prev => ({ ...prev, pet_type: 'For Adoption', adoption_status: 'Available' }));
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${
              isStrayMode ? 'bg-white text-[#5C0612] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Intake Stray Dog / Cat
          </button>
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
                {!isStrayMode && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Pet ID (Collar Tag) *
                    </label>
                    <input
                      type="text"
                      required
                      name="pet_id"
                      value={newPetForm.pet_id}
                      onChange={handleCreateChange}
                      placeholder="e.g. TF-BRUNO-01"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs text-slate-800"
                    />
                  </div>
                )}

                <div className={isStrayMode ? 'sm:col-span-2' : ''}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Animal Name {isStrayMode && '(Optional - Auto Assigned)'} *
                  </label>
                  <input
                    type="text"
                    required={!isStrayMode}
                    name="name"
                    value={newPetForm.name}
                    onChange={handleCreateChange}
                    placeholder={isStrayMode ? "Auto-generates Stray # if blank" : "e.g. Bruno"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 font-semibold"
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
                    Classification Status
                  </label>
                  <select
                    name="pet_type"
                    value={isStrayMode ? 'For Adoption' : newPetForm.pet_type}
                    onChange={handleCreateChange}
                    disabled={isStrayMode}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 disabled:opacity-60"
                  >
                    <option value="Campus Pet">Campus Resident Pet</option>
                    <option value="For Adoption">For Adoption (Rescue)</option>
                  </select>
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
                    Sex / Gender
                  </label>
                  <select
                    name="gender"
                    value={newPetForm.gender}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Physical Vitals & Sterilization */}
            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                2. Physical Vitals & Medical Baseline
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Estimated Age
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
                    name="weight"
                    value={newPetForm.weight}
                    onChange={handleCreateChange}
                    placeholder="e.g. 4.5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Size Category
                  </label>
                  <select
                    name="size"
                    value={newPetForm.size}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                  >
                    <option value="Small">Small (&lt; 10 kg)</option>
                    <option value="Medium">Medium (10 - 25 kg)</option>
                    <option value="Large">Large (&gt; 25 kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Vaccination Status
                  </label>
                  <select
                    name="vaccination_status"
                    value={newPetForm.vaccination_status}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                  >
                    <option value="Fully Vaccinated">Fully Vaccinated</option>
                    <option value="Partially Vaccinated">Partially Vaccinated</option>
                    <option value="Not Vaccinated">Not Vaccinated</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    name="spayed_neutered"
                    checked={newPetForm.spayed_neutered}
                    onChange={handleCreateChange}
                    className="w-4 h-4 accent-[#5C0612] rounded"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Spayed / Neutered (TNR Program Certified)
                  </span>
                </label>
              </div>
            </div>

            {/* 3. Campus Location & Rescue Context */}
            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                3. Campus Colony Location & Rescue Record
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {isStrayMode ? 'Adoption Pipeline Stage' : 'Campus Residency Status'}
                  </label>
                  <select
                    name="adoption_status"
                    value={newPetForm.adoption_status}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 font-semibold"
                  >
                    {!isStrayMode ? (
                      <>
                        <option value="Permanent Resident">Permanent Campus Resident (Not for Adoption)</option>
                        <option value="Campus Mascot">Campus Mascot</option>
                        <option value="Fostered">Temporary Campus Foster</option>
                      </>
                    ) : (
                      <>
                        <option value="Available">Available for Adoption</option>
                        <option value="Fostered">Fostered</option>
                        <option value="Adopted">Adopted</option>
                      </>
                    )}
                  </select>
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
                    placeholder="e.g. None, Minor coat dermatitis, Under observation"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Behavioral Assessment Notes
                  </label>
                  <input
                    type="text"
                    name="behavior_notes"
                    value={newPetForm.behavior_notes}
                    onChange={handleCreateChange}
                    placeholder="e.g. Friendly with students, docile, timid near crowds"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
                  />
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
                {newPetForm.pet_id || (isStrayMode ? 'STRAY-AUTO' : 'PET-ID')}
              </div>

              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-slate-800 font-mono text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                {newPetForm.adoption_status}
              </div>
            </div>

            {/* Preview Card Body */}
            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">
                    {newPetForm.name || (isStrayMode ? 'Stray Animal' : 'Animal Name')}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {newPetForm.gender} &bull; {newPetForm.age || 'Age Unknown'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {newPetForm.species} &bull; {newPetForm.breed || 'Domestic Mix'}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                  {newPetForm.found_near}
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {newPetForm.vaccination_status}
                </span>
                {newPetForm.spayed_neutered && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    TNR Sterilized
                  </span>
                )}
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
