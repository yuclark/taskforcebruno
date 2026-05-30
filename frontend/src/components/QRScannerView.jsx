import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

/**
 * ARCHITECTURAL DESIGN BOUNDARY NOTICE:
 * This component is strictly an internal telemetry lookup node for scanning or typing 
 * asset IDs (PET-XXXX / STRAY-XXXX) to load profile/medical contexts. 
 * Do NOT introduce adoption application submission fields, forms, or POST handles here.
 */
export default function QRScannerView() {
  // ── CARD 1: HARDWARE OPTICAL SCANNER & MANUAL OVERRIDE STATES ──
  const [manualId, setManualId] = useState('');
  const [isQrProcessing, setIsQrProcessing] = useState(false);
  const [isActiveCamera, setIsActiveCamera] = useState(false);
  const [qrStatusMessage, setQrStatusMessage] = useState('');
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const [card1PetData, setCard1PetData] = useState(null);
  const [loadingCard1Profile, setLoadingCard1Profile] = useState(false);

  // ── CARD 2: AI DESCRIPTIVE SEARCH CONTROLS & LEDGER STATES ──
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

  // ── CARD 1 CORE UTILITIES & ACTION HANDLERS ──
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
        setQrErrorMessage('Unresolved Signature: Invalid reference key.');
      }
    } catch (err) {
      setQrErrorMessage('Network communication error loading profile details.');
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
    setQrStatusMessage('Requesting camera permissions...');

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
      setQrStatusMessage('Scanning visual matrix elements...');
      animationFrameRef.current = requestAnimationFrame(tickScanLoop);
    } catch (err) {
      console.error('Optical capture error:', err);
      setIsQrProcessing(false);
      setQrErrorMessage('Camera access denied or hardware unit interface unavailable.');
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
    setQrStatusMessage('Decoding matrix arrays...');
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
            setQrErrorMessage('Matrix reading failed. Ensure target boundaries are clear.');
          }
        } catch (err) {
          setIsQrProcessing(false);
          setQrErrorMessage('Memory parsing error processing pixel buffers.');
        }
      };
      image.onerror = () => {
        setIsQrProcessing(false);
        setQrErrorMessage('Failed to resolve image asset data layers.');
      };
      image.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ── CARD 2 CORE UTILITIES & ACTION HANDLERS ──
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
        setAiErrorMessage('Failed to fetch full record files for selected candidate.');
      }
    } catch (err) {
      setAiErrorMessage('Network timeout connecting to database files.');
    } finally {
      setLoadingCard2Profile(false);
    }
  };

  const handleAISearchSubmit = async (e) => {
    e.preventDefault();
    if (!petDescription.trim()) return;

    stopCameraStream();
    setIsAiProcessing(true);
    setAiStatusMessage('Querying analytical descriptor registers...');
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

      if (res.ok && data.length > 0) {
        setAiCandidates(data);
      } else if (data.length === 0) {
        setAiErrorMessage('No matching profiles indexed within system registers.');
      } else {
        setAiErrorMessage(data.error || 'Cognitive parsing gateway failure.');
      }
    } catch (err) {
      setIsAiProcessing(false);
      setAiErrorMessage('Network timeout connecting to backend AI modules.');
    }
  };

  // ── REUSABLE RENDERING ENGINE: READ-ONLY HIGH-TECH PROFILE CONTAINER ──
  const renderEmbeddedProfile = (petData, onDisconnect) => (
    <div className="flex flex-col justify-between h-full w-full animate-fade-in text-left">
      <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 mb-3">
        
        {/* Media Frame Container */}
        <div className="w-full h-36 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden relative shadow-inner shrink-0">
          <img src={petData.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'} alt="" className="w-full h-full object-cover" />
          <span className={`absolute bottom-3 left-3 px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-widest border uppercase ${
            petData.adoption_status === 'Adopted'
              ? 'bg-slate-800 text-slate-200 border-slate-700'
              : petData.pet_type === 'For Adoption' 
              ? 'bg-amber-500 text-slate-950 border-amber-400' 
              : 'bg-[#5C0612] text-[#D4AF37] border-[#D4AF37]/30'
          }`}>
            {petData.adoption_status === 'Adopted' ? 'Adopted' : (petData.pet_type || 'Campus Pet')}
          </span>
        </div>

        {/* Identity Headings */}
        <div>
          <h3 className="text-lg font-black text-slate-100 tracking-tight leading-none truncate">{petData.name}</h3>
          <p className="text-[9px] font-mono text-slate-500 font-bold uppercase mt-1 truncate">{petData.species} &bull; {petData.breed || 'Mixed Breed Line'}</p>
        </div>

        {/* Vitals Grid Block */}
        <div className="grid grid-cols-4 gap-1 text-[8px] font-mono font-bold text-slate-400 uppercase text-center select-none shrink-0">
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-white/5"><span className="text-[7px] text-slate-600 block mb-0.5">SEX</span>{petData.gender}</div>
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-white/5"><span className="text-[7px] text-slate-600 block mb-0.5">AGE</span>{petData.age || 'Adult'}</div>
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-white/5"><span className="text-[7px] text-slate-600 block mb-0.5">MASS</span>{petData.weight || 'N/A'}</div>
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-white/5"><span className="text-[7px] text-slate-600 block mb-0.5">SCALE</span>{petData.size || 'Medium'}</div>
        </div>

        {/* Environmental Tracking Fields */}
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 space-y-1 font-sans text-[10px] text-slate-400">
          <span className="text-[8px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Environmental Rescue Tracking:</span>
          <div className="flex justify-between gap-2"><span className="truncate">Colony Zone:</span><strong className="text-slate-200 font-mono font-normal truncate max-w-[150px]">{petData.found_near}</strong></div>
          <div className="flex justify-between"><span className="taruncate">Pipeline Stage:</span><strong className="text-slate-200 font-mono font-normal">{petData.adoption_status}</strong></div>
        </div>

        {/* Clinical Variables */}
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-[10px] text-slate-400">
          <span className="text-[8px] font-bold font-mono text-[#D4AF37] uppercase tracking-wider block">Clinical Diagnostics Metrics:</span>
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div>Immunization: <strong className="text-emerald-400 block font-sans font-semibold truncate">{petData.vaccination_status}</strong></div>
            <div>Sterilization: <strong className="text-blue-400 block font-sans font-semibold">{petData.spayed_neutered ? 'Yes (Neutered)' : 'No'}</strong></div>
          </div>
          <div className="pt-1.5 border-t border-white/5">
            Medical Monitoring Logs:
            <span className="text-rose-400 font-mono block mt-0.5 text-[9px] bg-rose-950/20 px-2 py-0.5 rounded border border-rose-900/30 break-words">{petData.current_conditions || 'None registered.'}</span>
          </div>
        </div>

        {/* Biography Paragraph Text */}
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 shadow-inner">
          <span className="text-[8px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Biography Summary:</span>
          <p className="text-[10px] leading-relaxed text-slate-300 font-light font-sans mt-0.5 italic max-h-[64px] overflow-y-auto pr-1">
            "{petData.about_text || 'No comprehensive history logged inside active system archives.'}"
          </p>
        </div>

      </div>

      {/* Disconnect CTA Trigger at baseline */}
      <button onClick={onDisconnect} className="w-full py-2.5 mt-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-[9px] font-bold font-mono tracking-wider transition-all uppercase shrink-0">
        Disconnect Asset Session
      </button>
    </div>
  );

  return (
    <div className="w-full min-h-screen md:min-h-0 flex flex-col items-center justify-start md:justify-center relative p-3 sm:p-6 bg-gradient-to-br from-slate-200 via-zinc-200 to-stone-300 rounded-2xl md:rounded-3xl overflow-hidden shadow-inner">
      
      {/* BACKGROUND GRAPHIC INTERFACES */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <svg className="w-full h-full opacity-100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="outer-scanner-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(92, 6, 18, 0.12)" strokeWidth="1" />
              <circle cx="40" cy="40" r="1.5" fill="rgba(212, 175, 55, 0.4)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#outer-scanner-grid)" />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[450px] bg-[#5C0612]/5 rounded-full blur-[100px]" />
      </div>

      {/* DUAL COMPONENT VIEWPORT GRID RENDER MATRIX */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative z-10">

        {/* =========================================================
            CARD 1: HARDWARE OPTICAL SCANNER & MANUAL OVERRIDE
           ========================================================= */}
        <div className="w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-[28px] md:rounded-[32px] overflow-hidden shadow-2xl border-4 border-[#5C0612] p-4 sm:p-5 text-white flex flex-col justify-between relative min-h-[500px] md:min-h-[590px]">
          
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <pattern id="inner-mesh" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#inner-mesh)" />
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] opacity-40 font-mono tracking-widest z-10 mb-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${card1PetData ? 'bg-indigo-400' : isActiveCamera ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{card1PetData ? 'PROFILE_NODE_LOADED' : isActiveCamera ? 'HARDWARE_LIVE_FEED' : 'HARDWARE_STANDBY'}</span>
            </div>
            <span>LOGIC_v1.5_QR</span>
          </div>

          {loadingCard1Profile ? (
            <div className="my-auto py-12 text-center space-y-2 font-mono text-[10px] text-slate-400 animate-pulse">
              <div className="w-6 h-6 border-2 border-t-transparent border-[#D4AF37] rounded-full animate-spin mx-auto" />
              <span>RESOLVING DATA ARCHIVE LINK...</span>
            </div>
          ) : card1PetData ? (
            renderEmbeddedProfile(card1PetData, () => { setCard1PetData(null); setManualId(''); })
          ) : (
            <div className="flex-1 flex flex-col justify-between h-full w-full">
              <div className="flex flex-col items-center justify-center z-10 w-full space-y-4 flex-1 py-4">
                <span className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest bg-[#D4AF37]/5 px-2.5 py-0.5 rounded-md border border-[#D4AF37]/10 shrink-0">
                  Collar Lens Reader
                </span>
                
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl border border-white/10 bg-slate-950 relative flex items-center justify-center overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] border-b-2 border-[#D4AF37]/20 shrink-0">
                  <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isActiveCamera ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

                  <div className="absolute top-3 left-3 w-5 h-5 border-t-4 border-l-4 border-[#D4AF37] rounded-tl z-20" />
                  <div className="absolute top-3 right-3 w-5 h-5 border-t-4 border-r-4 border-[#D4AF37] rounded-tr z-20" />
                  <div className="absolute bottom-3 left-3 w-5 h-5 border-b-4 border-l-4 border-[#D4AF37] rounded-bl z-20" />
                  <div className="absolute bottom-3 right-3 w-5 h-5 border-b-4 border-r-4 border-[#D4AF37] rounded-br z-20" />

                  {isQrProcessing && !isActiveCamera ? (
                    <div className="text-center space-y-2 z-10 px-4 animate-pulse">
                      <div className="w-6 h-6 border-2 border-t-transparent border-[#D4AF37] rounded-full animate-spin mx-auto" />
                      <span className="text-[9px] text-[#D4AF37] font-mono tracking-widest block uppercase font-bold">{qrStatusMessage}</span>
                    </div>
                  ) : !isActiveCamera ? (
                    <button onClick={startCameraStream} className="absolute inset-0 flex flex-col items-center justify-center gap-2 group hover:bg-white/[0.01] transition-all focus:outline-none z-10">
                      <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-white/5 text-slate-400 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/20 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        </svg>
                      </div>
                      <span className="text-[10px] text-slate-400 group-hover:text-white font-medium tracking-wide">Initialize Lens Context</span>
                    </button>
                  ) : (
                    <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-20">
                      <span className="text-[8px] bg-slate-950/80 text-[#D4AF37] border border-[#D4AF37]/20 px-2 py-0.5 rounded font-mono uppercase tracking-widest animate-pulse font-bold">FEEDING TRACKS...</span>
                    </div>
                  )}
                  <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_10px_#D4AF37] top-0 animate-[bounce_2s_infinite] z-20" />
                </div>

                {isActiveCamera && (
                  <button onClick={stopCameraStream} className="px-3 py-1 bg-rose-950/40 border border-rose-900/60 rounded-lg text-[9px] font-mono uppercase font-bold tracking-widest text-rose-300 hover:bg-rose-900/40 transition-colors focus:outline-none">Terminate Feed</button>
                )}

                {qrErrorMessage && (
                  <div className="text-[10px] text-rose-400 font-medium bg-rose-950/30 border border-rose-900/40 px-3 py-1.5 rounded-xl max-w-xs text-center shadow-sm">{qrErrorMessage}</div>
                )}

                {qrStatusMessage && isActiveCamera && (
                  <div className="text-[9px] text-slate-400 font-mono tracking-widest uppercase animate-pulse">{qrStatusMessage}</div>
                )}

                {/* Matrix File Input Vector */}
                <div className="w-full px-2 max-w-[260px]">
                  <input type="file" id="qr-file-input" accept="image/*" onChange={handleFileUpload} disabled={isQrProcessing} className="hidden" />
                  <label htmlFor="qr-file-input" className={`w-full flex items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-[#D4AF37]/40 bg-white/[0.02] hover:bg-white/[0.05] py-2 px-4 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer text-center group ${isQrProcessing ? 'opacity-30 pointer-events-none' : ''}`}>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-[#D4AF37] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-slate-300 group-hover:text-white">Upload Digital QR File</span>
                  </label>
                </div>
              </div>

              {/* Terminal Manual Override Input Console */}
              <div className="bg-slate-950/90 p-3 sm:p-3.5 rounded-2xl border border-white/5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] z-10 mt-auto text-left shrink-0 w-full">
                <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 text-center Richmond font-mono">
                  SYS_MANUAL_OVERRIDE_CONSOLE
                </label>
                <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
                  <input type="text" value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="SYS_REF_ID (Ex: PET-1001)" className="w-full sm:flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-mono tracking-wider text-white placeholder-slate-700 shadow-inner min-w-0" />
                  <button type="submit" className="w-full sm:w-auto bg-[#5C0612] hover:bg-[#42040B] px-4 py-2 rounded-xl text-xs font-bold tracking-wider border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 active:scale-95 transition-all text-white shrink-0 shadow-md font-mono">LOAD</button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
            CARD 2: AI DESCRIPTIVE MARKS SEARCH ENGINE
           ========================================================= */}
        <div className="w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-[28px] md:rounded-[32px] overflow-hidden shadow-2xl border-4 border-[#5C0612] p-4 sm:p-5 text-white flex flex-col justify-between relative min-h-[500px] md:min-h-[590px]">
          
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <pattern id="inner-mesh-2" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#inner-mesh-2)" />
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] opacity-40 font-mono tracking-widest z-10 mb-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${card2PetData ? 'bg-indigo-400' : aiCandidates.length > 0 ? 'bg-emerald-500' : isAiProcessing ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`} />
              <span>{card2PetData ? 'AI_PROFILE_LOADED' : aiCandidates.length > 0 ? 'MATRIX_MATCHES_FOUND' : 'AI_PARSER_READY'}</span>
            </div>
            <span>LOGIC_v1.5_AI</span>
          </div>

          {loadingCard2Profile ? (
            <div className="my-auto py-12 text-center space-y-2 font-mono text-[10px] text-slate-400 animate-pulse">
              <div className="w-6 h-6 border-2 border-t-transparent border-[#D4AF37] rounded-full animate-spin mx-auto" />
              <span>RESOLVING DATA ARCHIVE LINK...</span>
            </div>
          ) : card2PetData ? (
            renderEmbeddedProfile(card2PetData, () => { setCard2PetData(null); setAiCandidates([]); setPetDescription(''); })
          ) : (
            <div className="flex-1 flex flex-col justify-between h-full w-full">
              <div className="flex flex-col justify-start items-center z-10 w-full space-y-3 flex-1 pt-1 overflow-hidden">
                <span className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest bg-[#D4AF37]/5 px-2.5 py-0.5 rounded-md border border-[#D4AF37]/10 shrink-0">
                  AI Trait-matching Engine
                </span>

                {aiCandidates.length > 0 ? (
                  <div className="w-full space-y-2 animate-fade-in flex flex-col flex-1 overflow-hidden min-h-0">
                    <div className="flex justify-between items-baseline shrink-0">
                      <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider">Top Structured Predictions</span>
                      <button onClick={() => { setAiCandidates([]); setPetDescription(''); }} className="text-[9px] font-mono font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wider focus:outline-none">Flush Table</button>
                    </div>
                    
                    <div className="space-y-2 overflow-y-auto pr-1 border border-white/5 rounded-2xl p-1.5 bg-slate-950/60 flex-1 w-full max-h-[220px] md:max-h-none">
                      {aiCandidates.map((candidate, idx) => (
                        <div key={candidate.pet_id} className="p-2 border border-white/5 bg-slate-900/50 rounded-xl flex items-center justify-between gap-3 shadow-inner hover:bg-slate-900 transition-colors">
                          <div className="flex items-center gap-2.5 truncate flex-1 text-left">
                            <img src={candidate.primary_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'} alt="" className="w-9 h-9 object-cover rounded-lg border border-white/10 shrink-0 select-none pointer-events-none" />
                            <div className="truncate text-xs">
                              <div className="font-black text-slate-100 truncate flex items-center gap-1.5">
                                {candidate.name}
                                <span className="font-mono text-[8px] bg-slate-800 text-[#D4AF37] px-1 rounded-sm font-bold">Rank {idx + 1}</span>
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono truncate uppercase font-bold mt-0.5">{candidate.species} &bull; {candidate.breed}</div>
                            </div>
                          </div>
                          <button onClick={() => resolveCard2Profile(candidate.pet_id)} className="px-3 py-1.5 bg-[#5C0612] hover:bg-[#42040B] text-white border border-[#D4AF37]/20 text-[9px] font-mono font-bold uppercase rounded-lg shrink-0 transition-all shadow-md">Load</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-2xl bg-slate-950/30 text-slate-500 italic font-sans text-[11px] min-h-[160px] md:min-h-[200px]">
                    {isAiProcessing ? (
                      <div className="space-y-2 animate-pulse not-italic">
                        <div className="w-6 h-6 border-2 border-t-transparent border-[#D4AF37] rounded-full animate-spin mx-auto" />
                        <span className="text-[9px] font-mono text-[#D4AF37] block uppercase tracking-widest font-bold">{aiStatusMessage}</span>
                      </div>
                    ) : (
                      <p className="px-4 leading-relaxed">Awaiting text characteristic parameters inside the descriptive layout console below...</p>
                    )}
                  </div>
                )}

                {aiErrorMessage && (
                  <div className="text-[10px] text-rose-400 font-medium bg-rose-950/30 border border-rose-900/40 px-3 py-1.5 rounded-xl text-center shadow-sm shrink-0">{aiErrorMessage}</div>
                )}
              </div>

              {/* AI Description Input Console */}
              <div className="bg-slate-950/90 p-3 sm:p-3.5 rounded-2xl border border-white/5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] z-10 mt-4 text-left shrink-0 w-full">
                <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 text-center font-mono">
                  AI_PREDICTIVE_DESCRIPTOR_CONSOLE
                </label>
                <form onSubmit={handleAISearchSubmit} className="space-y-2 animate-fade-in">
                  <textarea rows="2" value={petDescription} onChange={(e) => setPetDescription(e.target.value)} placeholder="Describe visual markers... (Ex: tan coat askal with floppy left ear, orange tabby found near canteen)" className="w-full bg-slate-900/60 border border-white/10 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans tracking-wide text-white placeholder-slate-600 shadow-inner shadow-black resize-none leading-relaxed min-w-0" />
                  <button type="submit" disabled={isAiProcessing || !petDescription.trim()} className="w-full bg-gradient-to-r from-[#5C0612] to-[#7A0918] text-white py-2 rounded-xl border border-[#D4AF37]/30 hover:brightness-110 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-md disabled:opacity-30 disabled:pointer-events-none">Initialize Predictive Matching</button>
                </form>
              </div>
            </div>
          )}

        </div>

      </div>
      
    </div>
  );
}