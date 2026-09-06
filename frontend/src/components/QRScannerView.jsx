import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

/**
 * Task Force Bruno — Collar QR Scanner & AI Trait Search View
 * Dual-modality animal identification node:
 *   1. Hardware camera QR viewfinder + file upload + manual tag ID lookup
 *   2. Natural language AI trait keyword matching for untagged animals
 */
export default function QRScannerView({ onProfileIdentified }) {
  // ── CARD 1: QR SCANNER & MANUAL LOOKUP STATES ──
  const [manualId, setManualId] = useState('');
  const [isQrProcessing, setIsQrProcessing] = useState(false);
  const [isActiveCamera, setIsActiveCamera] = useState(false);
  const [qrStatusMessage, setQrStatusMessage] = useState('');
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const [card1PetData, setCard1PetData] = useState(null);
  const [loadingCard1Profile, setLoadingCard1Profile] = useState(false);

  // ── CARD 2: AI DESCRIPTIVE SEARCH STATES ──
  const [petDescription, setPetDescription] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [aiErrorMessage, setAiErrorMessage] = useState('');
  const [aiCandidates, setAiCandidates] = useState([]);
  const [card2PetData, setCard2PetData] = useState(null);
  const [loadingCard2Profile, setLoadingCard2Profile] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  // ── CARD 1 ACTION HANDLERS ──
  const resolveCard1Profile = async (targetId) => {
    if (!targetId) return;
    setQrErrorMessage('');
    setLoadingCard1Profile(true);
    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/pets/${targetId}/`);
      if (res.ok) {
        const data = await res.json();
        setCard1PetData(data);
      } else {
        setQrErrorMessage(`Animal ID "${targetId}" was not found in the campus registry.`);
      }
    } catch (err) {
      setQrErrorMessage('Unable to connect to server. Please check your network connection.');
    } finally {
      setLoadingCard1Profile(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    resolveCard1Profile(manualId.trim().toUpperCase());
  };

  const startCameraStream = async () => {
    setQrErrorMessage('');
    setIsQrProcessing(true);
    setQrStatusMessage('Requesting camera access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
      }

      setIsActiveCamera(true);
      setIsQrProcessing(false);
      setQrStatusMessage('Point camera at the collar QR tag...');
      animationFrameRef.current = requestAnimationFrame(tickScanLoop);
    } catch (err) {
      console.error('Camera access error:', err);
      setIsQrProcessing(false);
      setQrErrorMessage('Camera access was denied or no camera device is available.');
    }
  };

  const stopCameraStream = () => {
    setIsActiveCamera(false);
    setQrStatusMessage('');

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const tickScanLoop = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(tickScanLoop);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    const context = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (qrCode) {
      const rawDecodedText = qrCode.data.trim();
      const assetMatch = rawDecodedText.match(/(PET|STRAY)-\d+/i);

      stopCameraStream();
      const resolvedId = assetMatch ? assetMatch[0].toUpperCase() : rawDecodedText.toUpperCase();
      resolveCard1Profile(resolvedId);
    } else {
      animationFrameRef.current = requestAnimationFrame(tickScanLoop);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    stopCameraStream();
    setIsQrProcessing(true);
    setQrStatusMessage('Analyzing uploaded image...');
    setQrErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = image.width;
          canvas.height = image.height;
          context.drawImage(image, 0, 0, image.width, image.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          setIsQrProcessing(false);
          setQrStatusMessage('');

          if (qrCode) {
            const rawDecodedText = qrCode.data.trim();
            const assetMatch = rawDecodedText.match(/(PET|STRAY)-\d+/i);
            const resolvedId = assetMatch ? assetMatch[0].toUpperCase() : rawDecodedText.toUpperCase();
            resolveCard1Profile(resolvedId);
          } else {
            setQrErrorMessage('No valid QR code detected. Please ensure the QR code is clear and in focus.');
          }
        } catch (err) {
          setIsQrProcessing(false);
          setQrErrorMessage('Error processing image file. Please try another image.');
        }
      };
      image.onerror = () => {
        setIsQrProcessing(false);
        setQrErrorMessage('Failed to read image file.');
      };
      image.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ── CARD 2 ACTION HANDLERS ──
  const resolveCard2Profile = async (targetId) => {
    if (!targetId) return;
    setAiErrorMessage('');
    setLoadingCard2Profile(true);
    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/pets/${targetId}/`);
      if (res.ok) {
        const data = await res.json();
        setCard2PetData(data);
      } else {
        setAiErrorMessage('Could not load profile details for the selected candidate.');
      }
    } catch (err) {
      setAiErrorMessage('Network timeout loading candidate profile.');
    } finally {
      setLoadingCard2Profile(false);
    }
  };

  const handleAISearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!petDescription.trim()) return;

    stopCameraStream();
    setIsAiProcessing(true);
    setAiStatusMessage('Matching visual traits against campus records...');
    setAiErrorMessage('');
    setAiCandidates([]);

    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/pets/ai-search/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: petDescription.trim() })
      });

      const data = await res.json();
      setIsAiProcessing(false);
      setAiStatusMessage('');

      if (res.ok && Array.isArray(data) && data.length > 0) {
        setAiCandidates(data);
      } else if (Array.isArray(data) && data.length === 0) {
        setAiErrorMessage('No matching animal profiles found. Try describing general coat colors or location.');
      } else {
        setAiErrorMessage(data.error || 'AI search service was unable to parse the query.');
      }
    } catch (err) {
      setIsAiProcessing(false);
      setAiErrorMessage('Network error connecting to AI search service.');
    }
  };

  const handleApplyPreset = (presetText) => {
    setPetDescription(presetText);
  };

  // ── REUSABLE PROFILE CARD RENDERING ──
  const renderEmbeddedProfile = (petData, onDisconnect) => (
    <div className="flex flex-col justify-between h-full w-full animate-fade-in text-left">
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">

        {/* Media Frame & Status Badges */}
        <div className="w-full h-44 sm:h-48 bg-slate-950 rounded-2xl overflow-hidden relative shadow-md shrink-0 border border-slate-700/60">
          <img
            src={petData.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'}
            alt={petData.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
          
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider bg-black/60 text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm backdrop-blur-sm">
              #{petData.pet_id}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide border uppercase shadow-sm ${
              petData.adoption_status === 'Adopted'
                ? 'bg-slate-800/90 text-slate-200 border-slate-600'
                : petData.pet_type === 'For Adoption'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                : 'bg-[#5C0612]/95 text-[#D4AF37] border-[#D4AF37]/40'
            }`}>
              {petData.adoption_status === 'Adopted' ? 'Adopted Alumni' : (petData.pet_type || 'Campus Pet')}
            </span>

            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
              petData.vaccination_status?.toLowerCase().includes('fully')
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                : 'bg-amber-950/80 text-amber-300 border-amber-600/50'
            }`}>
              {petData.vaccination_status || 'Vaccination Pending'}
            </span>
          </div>
        </div>

        {/* Identity & Basic Info */}
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight">{petData.name}</h3>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {petData.species} &bull; {petData.breed || 'Domestic Line'}
            </span>
          </div>
        </div>

        {/* Vitals Grid */}
        <div className="grid grid-cols-4 gap-2 text-center select-none shrink-0">
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[9px] text-slate-400 block font-medium">SEX</span>
            <span className="text-xs font-bold text-slate-100">{petData.gender || 'Unknown'}</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[9px] text-slate-400 block font-medium">AGE</span>
            <span className="text-xs font-bold text-slate-100">{petData.age || 'Adult'}</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[9px] text-slate-400 block font-medium">WEIGHT</span>
            <span className="text-xs font-bold text-slate-100">{petData.weight || 'N/A'}</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[9px] text-slate-400 block font-medium">SIZE</span>
            <span className="text-xs font-bold text-slate-100">{petData.size || 'Medium'}</span>
          </div>
        </div>

        {/* Campus Location & Welfare Info */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
          <div className="flex justify-between items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Campus Zone:
            </span>
            <strong className="text-white font-medium truncate">{petData.found_near || 'CIT-U Grounds'}</strong>
          </div>

          <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              TNR Sterilized:
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${petData.spayed_neutered ? 'bg-blue-950 text-blue-300 border border-blue-800/40' : 'bg-slate-800 text-slate-400'}`}>
              {petData.spayed_neutered ? 'Yes (Spayed/Neutered)' : 'No'}
            </span>
          </div>

          {petData.current_conditions && petData.current_conditions !== 'None' && (
            <div className="pt-2 border-t border-slate-800/80 text-[11px]">
              <span className="text-rose-400 font-semibold block mb-0.5">Medical Notes:</span>
              <p className="text-rose-200 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-900/40">
                {petData.current_conditions}
              </p>
            </div>
          )}
        </div>

        {/* Bio */}
        {petData.about_text && (
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 italic">
            "{petData.about_text}"
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-800 space-y-2 shrink-0">
        {onProfileIdentified && (
          <button
            onClick={() => onProfileIdentified(petData.pet_id)}
            className="w-full py-2.5 bg-gradient-to-r from-[#5C0612] to-[#7A0918] hover:from-[#6D0816] hover:to-[#8E0B1C] text-white rounded-xl text-xs font-bold tracking-wide border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>View Complete Medical & Adoption Profile</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}

        <button
          onClick={onDisconnect}
          className="w-full py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700/60 transition-all flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Scan Another Animal</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 py-2 px-1 text-slate-100">

      {/* HEADER BANNER */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#5C0612]">
              Campus Animal Telemetry
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Collar QR Scanner & Trait Search
          </h2>
          <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Quickly identify registered CIT-U campus companions. Scan their collar QR tag with your camera, upload a photo, or use AI description search for untagged animals.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-600 shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            📷 Camera Scanner
          </span>
          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            🖼️ Image Upload
          </span>
          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            ✨ AI Search
          </span>
        </div>
      </div>

      {/* DUAL COLUMN MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* =========================================================
            CARD 1: COLLAR QR SCANNER & MANUAL LOOKUP
           ========================================================= */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between p-5 md:p-6 relative">

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#5C0612]/80 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Collar QR Scanner</h3>
                <p className="text-[11px] text-slate-400">Scan physical tag or enter ID</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700">
              <span className={`w-2 h-2 rounded-full ${card1PetData ? 'bg-indigo-400' : isActiveCamera ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-slate-300">
                {card1PetData ? 'Profile Loaded' : isActiveCamera ? 'Scanning Live' : 'Scanner Ready'}
              </span>
            </div>
          </div>

          {/* Body */}
          {loadingCard1Profile ? (
            <div className="my-auto py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-t-transparent border-[#D4AF37] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-slate-300">Retrieving animal records from campus registry...</p>
            </div>
          ) : card1PetData ? (
            renderEmbeddedProfile(card1PetData, () => { setCard1PetData(null); setManualId(''); })
          ) : (
            <div className="flex flex-col gap-4 flex-1 justify-between">

              {/* Viewfinder / Camera Area */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[240px] aspect-square rounded-2xl bg-slate-950 border-2 border-slate-800 relative flex items-center justify-center overflow-hidden shadow-inner group">
                  <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isActiveCamera ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  />

                  {/* Corner Targets */}
                  <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#D4AF37] rounded-tl z-20" />
                  <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#D4AF37] rounded-tr z-20" />
                  <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#D4AF37] rounded-bl z-20" />
                  <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#D4AF37] rounded-br z-20" />

                  {/* Laser line when active */}
                  {isActiveCamera && (
                    <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_8px_#D4AF37] top-0 animate-[bounce_2s_infinite] z-20" />
                  )}

                  {isQrProcessing && !isActiveCamera ? (
                    <div className="text-center space-y-2 z-10 px-4 animate-pulse">
                      <div className="w-6 h-6 border-2 border-t-transparent border-[#D4AF37] rounded-full animate-spin mx-auto" />
                      <span className="text-xs text-[#D4AF37] font-medium block">{qrStatusMessage}</span>
                    </div>
                  ) : !isActiveCamera ? (
                    <div className="flex flex-col items-center justify-center text-center p-4 z-10">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-[#D4AF37] mb-2 group-hover:scale-105 transition-transform shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-white">Camera Viewfinder</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Click below to start live scan</p>
                    </div>
                  ) : (
                    <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none z-20">
                      <span className="text-[10px] bg-black/75 text-[#D4AF37] border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-full font-medium">
                        Align QR within frame
                      </span>
                    </div>
                  )}
                </div>

                {/* Camera Toggle Button */}
                <div className="mt-3">
                  {!isActiveCamera ? (
                    <button
                      type="button"
                      onClick={startCameraStream}
                      className="inline-flex items-center gap-2 bg-[#5C0612] hover:bg-[#700816] text-white px-4 py-2 rounded-xl text-xs font-bold border border-[#D4AF37]/40 shadow-md transition-all active:scale-95"
                    >
                      <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Start Camera Scanner</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="inline-flex items-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Stop Camera</span>
                    </button>
                  )}
                </div>

                {qrErrorMessage && (
                  <div className="mt-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 px-3.5 py-2 rounded-xl w-full text-center">
                    {qrErrorMessage}
                  </div>
                )}
              </div>

              {/* Upload QR File Option */}
              <div className="pt-2 border-t border-slate-800">
                <input
                  type="file"
                  id="qr-file-input"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isQrProcessing}
                  className="hidden"
                />
                <label
                  htmlFor="qr-file-input"
                  className={`w-full flex items-center justify-center gap-2 border border-slate-700/80 hover:border-[#D4AF37]/50 bg-slate-800/40 hover:bg-slate-800 py-2.5 px-4 rounded-xl text-xs font-medium transition-all cursor-pointer text-slate-300 hover:text-white ${isQrProcessing ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Upload QR Photo from Gallery</span>
                </label>
              </div>

              {/* Manual ID Input Console */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Or enter Pet ID tag directly:
                </label>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="e.g. PET-0001 or STRAY-0042"
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-white placeholder-slate-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="shrink-0 bg-[#5C0612] hover:bg-[#720817] px-4 py-2 rounded-xl text-xs font-bold border border-[#D4AF37]/30 text-white transition-all shadow-sm active:scale-95"
                  >
                    Search ID
                  </button>
                </form>
              </div>

            </div>
          )}
        </div>

        {/* =========================================================
            CARD 2: AI VISUAL TRAIT SEARCH
           ========================================================= */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between p-5 md:p-6 relative">

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">AI Visual Trait Search</h3>
                <p className="text-[11px] text-slate-400">Search untagged animals by appearance</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700">
              <span className={`w-2 h-2 rounded-full ${card2PetData ? 'bg-indigo-400' : aiCandidates.length > 0 ? 'bg-emerald-400' : isAiProcessing ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-slate-300">
                {card2PetData ? 'Profile Loaded' : aiCandidates.length > 0 ? `${aiCandidates.length} Matches` : 'AI Ready'}
              </span>
            </div>
          </div>

          {/* Body */}
          {loadingCard2Profile ? (
            <div className="my-auto py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-t-transparent border-[#D4AF37] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-slate-300">Loading full profile for selected candidate...</p>
            </div>
          ) : card2PetData ? (
            renderEmbeddedProfile(card2PetData, () => { setCard2PetData(null); setAiCandidates([]); setPetDescription(''); })
          ) : (
            <div className="flex flex-col gap-4 flex-1 justify-between">

              {/* Suggestions / Prompt helpers */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Quick description presets:</span>
                  <span className="text-[10px] text-slate-500">Click to fill</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Calico cat near library",
                    "Orange tabby near canteen",
                    "Tan askal dog with floppy ears"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="text-[11px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700/60 transition-all"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Candidate Results or Empty State */}
              <div className="flex-1 flex flex-col justify-center min-h-[160px]">
                {aiCandidates.length > 0 ? (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-semibold text-[#D4AF37]">
                        Top Candidate Matches ({aiCandidates.length})
                      </span>
                      <button
                        onClick={() => { setAiCandidates([]); setPetDescription(''); }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
                      >
                        Clear Results
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {aiCandidates.map((candidate, idx) => (
                        <div
                          key={candidate.pet_id}
                          className="p-2.5 border border-slate-800 bg-slate-950/70 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 truncate min-w-0">
                            <img
                              src={candidate.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'}
                              alt={candidate.name}
                              className="w-11 h-11 object-cover rounded-xl border border-slate-700 shrink-0"
                            />
                            <div className="truncate text-xs min-w-0">
                              <div className="font-bold text-white truncate flex items-center gap-1.5">
                                {candidate.name}
                                <span className="text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                                  #{idx + 1}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {candidate.species} &bull; {candidate.breed || 'Mixed'} &bull; {candidate.found_near || 'Campus'}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => resolveCard2Profile(candidate.pet_id)}
                            className="px-3 py-1.5 bg-[#5C0612] hover:bg-[#720817] text-white border border-[#D4AF37]/30 text-xs font-bold rounded-xl shrink-0 transition-all shadow-sm"
                          >
                            Inspect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-5 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-slate-400">
                    {isAiProcessing ? (
                      <div className="space-y-2 py-4 animate-pulse">
                        <div className="w-7 h-7 border-2 border-t-transparent border-[#D4AF37] rounded-full animate-spin mx-auto" />
                        <span className="text-xs text-[#D4AF37] block font-medium">{aiStatusMessage}</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500 mb-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <p className="text-xs font-medium text-slate-300">No search executed yet</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs leading-relaxed">
                          Describe what the animal looks like or pick a preset above to find matching records.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {aiErrorMessage && (
                  <div className="mt-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 px-3.5 py-2 rounded-xl text-center">
                    {aiErrorMessage}
                  </div>
                )}
              </div>

              {/* AI Description Input Console */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-400">
                  Describe physical characteristics & location:
                </label>
                <form onSubmit={handleAISearchSubmit} className="space-y-2">
                  <textarea
                    rows="2"
                    value={petDescription}
                    onChange={(e) => setPetDescription(e.target.value)}
                    placeholder="e.g. Tan coat dog with floppy ears, or orange tabby cat seen near canteen..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-white placeholder-slate-500 resize-none leading-relaxed"
                  />
                  <button
                    type="submit"
                    disabled={isAiProcessing || !petDescription.trim()}
                    className="w-full bg-gradient-to-r from-[#5C0612] to-[#7A0918] hover:from-[#6D0816] hover:to-[#8E0B1C] text-white py-2.5 rounded-xl border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-xs font-bold tracking-wide transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Search by Description</span>
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}