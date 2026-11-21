import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  ArrowRight,
  Camera,
  Image as ImageIcon,
  Info,
  MapPin,
  QrCode,
  RotateCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import { DEFAULT_PET_IMAGE, isPetQuarantined, safeImageUrl } from '../lib/pets';
import { extractPetIdFromQr } from '../lib/qr';

const QUICK_PRESETS = [
  'Calico cat near library',
  'Orange tabby near canteen',
  'Tan aspin dog with floppy ears',
  'White stray cat near gym',
];

export default function QRScannerView({ onProfileIdentified }) {
  const [manualId, setManualId] = useState('');
  const [isQrProcessing, setIsQrProcessing] = useState(false);
  const [isActiveCamera, setIsActiveCamera] = useState(false);
  const [qrStatusMessage, setQrStatusMessage] = useState('');
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const [card1PetData, setCard1PetData] = useState(null);
  const [loadingCard1Profile, setLoadingCard1Profile] = useState(false);

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
  const isMountedRef = useRef(true);

  const stopCameraStream = useCallback(() => {
    setIsActiveCamera(false);
    setQrStatusMessage('');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const resolveCard1Profile = async (rawTarget) => {
    const targetId = extractPetIdFromQr(rawTarget);
    if (!targetId) return;
    setQrErrorMessage('');
    setLoadingCard1Profile(true);

    const res = await apiGet(`/pets/${encodeURIComponent(targetId)}/`);
    if (res.ok && res.data) {
      setCard1PetData(res.data);
      setLoadingCard1Profile(false);
      return;
    }

    const listRes = await apiGet('/pets/');
    if (listRes.ok && Array.isArray(listRes.data)) {
      const cleanTarget = targetId.toLowerCase();
      const matched = listRes.data.find(
        (p) =>
          (p.pet_id && p.pet_id.toLowerCase() === cleanTarget) ||
          (p.name && p.name.toLowerCase() === cleanTarget)
      );
      if (matched) {
        setCard1PetData(matched);
        setLoadingCard1Profile(false);
        return;
      }
    }

    setQrErrorMessage(
      res.status === 0
        ? res.error
        : `Animal ID "${targetId}" was not found in the campus registry.`
    );
    setLoadingCard1Profile(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    resolveCard1Profile(manualId.trim());
  };

  const tickScanLoop = () => {
    if (!isMountedRef.current) return;
    const video = videoRef.current;
    if (
      !video ||
      video.readyState !== video.HAVE_ENOUGH_DATA ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      animationFrameRef.current = requestAnimationFrame(tickScanLoop);
      return;
    }

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
      inversionAttempts: 'attemptBoth',
    });

    if (qrCode) {
      const rawDecodedText = qrCode.data.trim();
      stopCameraStream();
      resolveCard1Profile(rawDecodedText);
    } else {
      animationFrameRef.current = requestAnimationFrame(tickScanLoop);
    }
  };

  const startCameraStream = async () => {
    setQrErrorMessage('');
    setIsQrProcessing(true);
    setQrStatusMessage('Requesting camera permission...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsQrProcessing(false);
      setQrErrorMessage(
        'Live camera scanning requires HTTPS or camera support. Use "Take Photo" or "Upload QR Photo" below instead.'
      );
      return;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 640 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play().catch(() => {});
      }

      setIsActiveCamera(true);
      setIsQrProcessing(false);
      setQrStatusMessage('Point camera at the collar QR tag');
      animationFrameRef.current = requestAnimationFrame(tickScanLoop);
    } catch {
      setIsQrProcessing(false);
      setQrErrorMessage(
        'Camera access was blocked or busy. Enable camera permissions or use "Take Photo" / "Upload QR Photo" below.'
      );
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    stopCameraStream();
    setIsQrProcessing(true);
    setQrStatusMessage('Reading QR code from image...');
    setQrErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = image.width;
          canvas.height = image.height;
          context.drawImage(image, 0, 0, image.width, image.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          setIsQrProcessing(false);
          setQrStatusMessage('');

          if (qrCode) {
            resolveCard1Profile(qrCode.data.trim());
          } else {
            setQrErrorMessage(
              'No readable QR code was detected. Please make sure the tag is clear and well-lit.'
            );
          }
        } catch {
          setIsQrProcessing(false);
          setQrErrorMessage('Error reading image file. Please try another photo.');
        }
      };
      image.onerror = () => {
        setIsQrProcessing(false);
        setQrErrorMessage('Could not load the selected image.');
      };
      image.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const resolveCard2Profile = async (targetId) => {
    if (!targetId) return;
    setAiErrorMessage('');
    setLoadingCard2Profile(true);
    const res = await apiGet(`/pets/${encodeURIComponent(targetId)}/`);
    if (res.ok && res.data) {
      setCard2PetData(res.data);
    } else {
      setAiErrorMessage(res.error || 'Could not load profile details for this match.');
    }
    setLoadingCard2Profile(false);
  };

  const handleAISearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!petDescription.trim() || isAiProcessing) return;

    stopCameraStream();
    setIsAiProcessing(true);
    setAiStatusMessage('Searching campus animal profiles...');
    setAiErrorMessage('');
    setAiCandidates([]);

    const res = await apiPost('/pets/ai-search/', { description: petDescription.trim() });
    setIsAiProcessing(false);
    setAiStatusMessage('');

    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      setAiCandidates(res.data);
    } else if (res.ok && Array.isArray(res.data) && res.data.length === 0) {
      setAiErrorMessage(
        'No matching animals found. Try describing coat color, species, or a nearby campus landmark.'
      );
    } else {
      setAiErrorMessage(res.error || 'Unable to run trait search right now.');
    }
  };

  const renderEmbeddedProfile = (petData, onReset) => (
    <div className="flex flex-col justify-between h-full w-full animate-fade-in text-left gap-4">
      <div className="space-y-3.5 flex-1">
        <div className="w-full h-44 sm:h-48 bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-700/60">
          <img
            src={safeImageUrl(petData.primary_image, DEFAULT_PET_IMAGE)}
            alt={petData.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-black/65 text-[#D4AF37] border border-[#D4AF37]/40 backdrop-blur-sm">
            #{petData.pet_id}
          </span>

          <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase ${
                petData.adoption_status === 'Adopted'
                  ? 'bg-slate-800/90 text-slate-200 border-slate-600'
                  : (petData.pet_type || '').toLowerCase().includes('adoption') ||
                    petData.adoption_status === 'Available'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-[#5C0612]/95 text-[#D4AF37] border-[#D4AF37]/40'
              }`}
            >
              {petData.adoption_status === 'Adopted' ? 'Adopted Alumni' : petData.pet_type || 'Campus Pet'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                petData.vaccination_status?.toLowerCase().includes('fully')
                  ? 'bg-emerald-950/85 text-emerald-300 border-emerald-600/50'
                  : petData.vaccination_status?.toLowerCase().includes('core') ||
                    petData.vaccination_status?.toLowerCase().includes('partial')
                  ? 'bg-amber-950/85 text-amber-300 border-amber-600/50'
                  : 'bg-rose-950/85 text-rose-300 border-rose-600/50'
              }`}
            >
              {petData.vaccination_status || 'Not Vaccinated'}
            </span>
          </div>
        </div>

        {isPetQuarantined(petData) && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/70 rounded-xl text-rose-100 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-200 uppercase tracking-wider text-[10px]">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>14-Day Health Observation (RA 9482)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-200">
              Currently under routine 14-day campus observation. Please <strong>do not feed, touch, or handle</strong>.
            </p>
          </div>
        )}

        <div className="border-b border-slate-800 pb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xl font-bold text-white tracking-tight">{petData.name}</h3>
          <span className="text-xs font-medium text-slate-400">
            {petData.species} &bull; {petData.breed || 'Domestic Mix'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block">Sex</span>
            <span className="text-xs font-bold text-slate-100">{petData.gender || 'Unknown'}</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block">Age</span>
            <span className="text-xs font-bold text-slate-100">{petData.age || 'Adult'}</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block">Weight</span>
            <span className="text-xs font-bold text-slate-100 font-mono">{petData.weight || 'N/A'}</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block">Size</span>
            <span className="text-xs font-bold text-slate-100">{petData.size || 'Medium'}</span>
          </div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
          <div className="flex justify-between items-center gap-2">
            <span className="text-slate-400 inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              Campus Zone
            </span>
            <strong className="text-white font-medium truncate">
              {petData.found_near || 'CIT-U Grounds'}
            </strong>
          </div>
          <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-800">
            <span className="text-slate-400 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              TNR Sterilized
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                petData.spayed_neutered
                  ? 'bg-sky-950 text-sky-300 border border-sky-800/60'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {petData.spayed_neutered ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {petData.about_text && (
          <p className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {petData.about_text}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800 space-y-2">
        {onProfileIdentified && (
          <button
            type="button"
            onClick={() => onProfileIdentified(petData.pet_id)}
            className="w-full py-2.5 bg-[#5C0612] hover:bg-[#700816] text-white rounded-xl text-xs font-semibold border border-[#D4AF37]/40 shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Open Full Health &amp; Welfare Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2 bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Scan Another Animal</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col gap-5 pb-6 text-slate-100">
      {/* Page Intro */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C0612] block mb-1">
            Animal Identification
          </span>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Collar QR Scanner &amp; Visual Trait Search
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Scan a companion&apos;s collar QR tag, upload a photo, or describe an untagged animal&apos;s appearance to find its record.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600 shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Camera className="w-3.5 h-3.5 text-[#5C0612]" />
            Camera Scan
          </span>
          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <ImageIcon className="w-3.5 h-3.5 text-[#5C0612]" />
            Photo Upload
          </span>
          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Trait Search
          </span>
        </div>
      </div>

      {/* Dual Modality Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Card 1: QR Scanner */}
        <div className="bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-lg overflow-hidden flex flex-col justify-between p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#5C0612] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">Collar QR Scanner</h3>
                <p className="text-[11px] text-slate-400">Scan collar tag or enter ID</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
              <span
                className={`w-2 h-2 rounded-full ${
                  card1PetData ? 'bg-sky-400' : isActiveCamera ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              {card1PetData ? 'Loaded' : isActiveCamera ? 'Live' : 'Ready'}
            </span>
          </div>

          {loadingCard1Profile ? (
            <div className="my-auto py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-slate-700 border-t-[#D4AF37] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-300">Loading animal profile...</p>
            </div>
          ) : card1PetData ? (
            renderEmbeddedProfile(card1PetData, () => {
              setCard1PetData(null);
              setManualId('');
            })
          ) : (
            <div className="flex flex-col gap-4 flex-1 justify-between">
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[260px] aspect-square rounded-2xl bg-slate-950 border-2 border-slate-800 relative flex items-center justify-center overflow-hidden">
                  <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                      isActiveCamera ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />

                  <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#D4AF37] rounded-tl z-20" />
                  <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#D4AF37] rounded-tr z-20" />
                  <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#D4AF37] rounded-bl z-20" />
                  <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#D4AF37] rounded-br z-20" />

                  {isActiveCamera && (
                    <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-scanline z-20" />
                  )}

                  {isQrProcessing && !isActiveCamera ? (
                    <div className="text-center space-y-2 z-10 px-4">
                      <div className="w-6 h-6 border-2 border-slate-700 border-t-[#D4AF37] rounded-full animate-spin mx-auto" />
                      <span className="text-xs text-[#D4AF37] font-medium block">{qrStatusMessage}</span>
                    </div>
                  ) : !isActiveCamera ? (
                    <div className="flex flex-col items-center justify-center text-center p-4 z-10">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-[#D4AF37] mb-2">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold text-white">Camera Viewfinder</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Tap below to start scanning</p>
                    </div>
                  ) : (
                    <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none z-20">
                      <span className="text-[10px] bg-black/75 text-[#D4AF37] border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-full font-medium">
                        Center QR code in frame
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 justify-center w-full">
                  {!isActiveCamera ? (
                    <>
                      <button
                        type="button"
                        onClick={startCameraStream}
                        disabled={isQrProcessing}
                        className="inline-flex items-center gap-2 bg-[#5C0612] hover:bg-[#700816] text-white px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#D4AF37]/40 shadow-sm transition-colors"
                      >
                        <Video className="w-4 h-4 text-[#D4AF37]" />
                        <span>Start Live Viewfinder</span>
                      </button>

                      <label
                        htmlFor="qr-direct-camera-input"
                        className="inline-flex items-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 text-[#D4AF37] px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#D4AF37]/40 transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Photo</span>
                        <input
                          type="file"
                          id="qr-direct-camera-input"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileUpload}
                          disabled={isQrProcessing}
                          className="hidden"
                        />
                      </label>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="inline-flex items-center gap-1.5 bg-rose-950/90 hover:bg-rose-900 border border-rose-700 text-rose-100 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Stop Camera</span>
                    </button>
                  )}
                </div>

                {qrErrorMessage && (
                  <div className="mt-3 text-xs text-rose-200 bg-rose-950/70 border border-rose-800 px-3.5 py-2.5 rounded-xl w-full text-center leading-relaxed">
                    {qrErrorMessage}
                  </div>
                )}
              </div>

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
                  className={`w-full flex items-center justify-center gap-2 border border-slate-700 hover:border-[#D4AF37]/50 bg-slate-800/50 hover:bg-slate-800 py-2.5 px-4 rounded-xl text-xs font-medium transition-colors cursor-pointer text-slate-200 ${
                    isQrProcessing ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                  <span>Upload QR Photo from Gallery</span>
                </label>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <label htmlFor="manual-pet-id" className="block text-xs font-medium text-slate-400 mb-1.5">
                  Or enter a Tag ID directly
                </label>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    id="manual-pet-id"
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="e.g. PET-001 or STRAY-004"
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-white placeholder-slate-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="shrink-0 bg-[#5C0612] hover:bg-[#720817] px-4 py-2 rounded-xl text-xs font-semibold border border-[#D4AF37]/30 text-white transition-colors"
                  >
                    Search
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Trait Search */}
        <div className="bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-lg overflow-hidden flex flex-col justify-between p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">Visual Trait Search</h3>
                <p className="text-[11px] text-slate-400">Find untagged animals by description</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
              <span
                className={`w-2 h-2 rounded-full ${
                  card2PetData ? 'bg-sky-400' : aiCandidates.length > 0 ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              {card2PetData ? 'Loaded' : aiCandidates.length > 0 ? `${aiCandidates.length} Matches` : 'Ready'}
            </span>
          </div>

          {loadingCard2Profile ? (
            <div className="my-auto py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-slate-700 border-t-[#D4AF37] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-300">Loading matched profile...</p>
            </div>
          ) : card2PetData ? (
            renderEmbeddedProfile(card2PetData, () => {
              setCard2PetData(null);
              setAiCandidates([]);
              setPetDescription('');
            })
          ) : (
            <div className="flex flex-col gap-4 flex-1 justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-2">
                  Quick search examples:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPetDescription(preset)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center min-h-[160px]">
                {aiCandidates.length > 0 ? (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-semibold text-[#D4AF37]">
                        Top Matches ({aiCandidates.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAiCandidates([]);
                          setPetDescription('');
                        }}
                        className="text-xs text-rose-300 hover:text-rose-200 font-medium"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                      {aiCandidates.map((candidate, idx) => (
                        <div
                          key={candidate.pet_id}
                          className="p-2.5 border border-slate-800 bg-slate-950/70 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={safeImageUrl(candidate.primary_image, DEFAULT_PET_IMAGE)}
                              alt={candidate.name}
                              className="w-11 h-11 object-cover rounded-xl border border-slate-700 shrink-0"
                            />
                            <div className="min-w-0 text-xs">
                              <div className="font-bold text-white truncate flex items-center gap-1.5">
                                <span className="truncate">{candidate.name}</span>
                                <span className="text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded font-mono font-semibold shrink-0">
                                  #{idx + 1}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {candidate.species} &bull; {candidate.breed || 'Mixed'} &bull;{' '}
                                {candidate.found_near || 'Campus'}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => resolveCard2Profile(candidate.pet_id)}
                            className="px-3 py-1.5 bg-[#5C0612] hover:bg-[#720817] text-white border border-[#D4AF37]/30 text-xs font-semibold rounded-xl shrink-0 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-5 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-slate-400">
                    {isAiProcessing ? (
                      <div className="space-y-2 py-4">
                        <div className="w-7 h-7 border-2 border-slate-700 border-t-[#D4AF37] rounded-full animate-spin mx-auto" />
                        <span className="text-xs text-[#D4AF37] block font-medium">{aiStatusMessage}</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                          <Search className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-200">Describe an animal to search</p>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-xs leading-relaxed">
                          Include coat color, species (e.g. aspin, puspin), or where you saw it on campus.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {aiErrorMessage && (
                  <div className="mt-2 text-xs text-rose-200 bg-rose-950/50 border border-rose-800 px-3.5 py-2 rounded-xl text-center">
                    {aiErrorMessage}
                  </div>
                )}
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label htmlFor="trait-search-input" className="block text-xs font-medium text-slate-400">
                  Appearance &amp; location description
                </label>
                <form onSubmit={handleAISearchSubmit} className="space-y-2.5">
                  <textarea
                    id="trait-search-input"
                    rows="2"
                    maxLength={300}
                    value={petDescription}
                    onChange={(e) => setPetDescription(e.target.value)}
                    placeholder="e.g. Orange tabby cat with white paws near the canteen..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-white placeholder-slate-500 resize-none leading-relaxed"
                  />
                  <button
                    type="submit"
                    disabled={isAiProcessing || !petDescription.trim()}
                    className="w-full bg-[#5C0612] hover:bg-[#700816] text-white py-2.5 rounded-xl border border-[#D4AF37]/40 text-xs font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4 text-[#D4AF37]" />
                    <span>{isAiProcessing ? 'Searching...' : 'Search by Description'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scanning Tips */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs text-slate-700 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#5C0612]/10 text-[#5C0612] flex items-center justify-center">
            <Info className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Scanning Tips</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100 text-xs leading-relaxed text-slate-600">
          <div>
            <span className="font-semibold text-slate-900 block mb-0.5">1. Device Support</span>
            <p>Works on Android Chrome, iOS Safari, tablets, and laptop webcams.</p>
          </div>
          <div>
            <span className="font-semibold text-slate-900 block mb-0.5">2. Good Lighting</span>
            <p>Hold the collar QR tag 4–6 inches from the lens in clear lighting for instant detection.</p>
          </div>
          <div>
            <span className="font-semibold text-slate-900 block mb-0.5">3. Private On-Device Scanning</span>
            <p>QR codes are decoded locally on your device—live camera video is never uploaded.</p>
          </div>
          <div>
            <span className="font-semibold text-slate-900 block mb-0.5">4. Untagged Animals</span>
            <p>If an animal has no collar tag, use Visual Trait Search to look up matching campus records.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
