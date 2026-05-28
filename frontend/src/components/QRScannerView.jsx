import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

/**
 * ARCHITECTURAL DESIGN BOUNDARY NOTICE:
 * This component is strictly an internal telemetry lookup node for scanning or typing 
 * asset IDs (PET-XXXX / STRAY-XXXX) to load profile/medical contexts. 
 * Do NOT introduce adoption application submission fields, forms, or POST handles here.
 */
export default function QRScannerView({ onProfileIdentified }) {
  const [manualId, setManualId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActiveCamera, setIsActiveCamera] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Clean up streaming channels if the user navigates away abruptly
  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    onProfileIdentified(manualId.trim().toUpperCase());
  };

  const startCameraStream = async () => {
    setErrorMessage('');
    setIsProcessing(true);
    setStatusMessage('Requesting camera permissions...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Prevents iOS Safari fullscreen hijacking
        videoRef.current.play();
      }
      
      setIsActiveCamera(true);
      setIsProcessing(false);
      setStatusMessage('Scanning visual matrix elements...');
      animationFrameRef.current = requestAnimationFrame(tickScanLoop);
    } catch (err) {
      console.error('Optical capture error:', err);
      setIsProcessing(false);
      setErrorMessage('Camera access denied or device interface unavailable.');
    }
  };

  const stopCameraStream = () => {
    setIsActiveCamera(false);
    setStatusMessage('');
    
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
      if (assetMatch) {
        onProfileIdentified(assetMatch[0].toUpperCase());
      } else {
        onProfileIdentified(rawDecodedText);
      }
    } else {
      animationFrameRef.current = requestAnimationFrame(tickScanLoop);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    stopCameraStream();
    setIsProcessing(true);
    setStatusMessage('Decoding matrix arrays...');
    setErrorMessage('');

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

          setIsProcessing(false);

          if (qrCode) {
            const rawDecodedText = qrCode.data.trim();
            const assetMatch = rawDecodedText.match(/(PET|STRAY)-\d+/i);
            
            if (assetMatch) {
              onProfileIdentified(assetMatch[0].toUpperCase());
            } else {
              onProfileIdentified(rawDecodedText);
            }
          } else {
            setErrorMessage('Matrix reading failed. Ensure target boundaries are clear.');
          }
        } catch (err) {
          setIsProcessing(false);
          setErrorMessage('Memory parsing error processing pixel buffers.');
        }
      };

      image.onerror = () => {
        setIsProcessing(false);
        setErrorMessage('Failed to resolve image asset data layers.');
      };

      image.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full min-h-[500px] md:min-h-[650px] flex items-center justify-center relative p-3 sm:p-8 bg-gradient-to-br from-slate-200 via-zinc-200 to-stone-300 rounded-3xl overflow-hidden shadow-inner">
      
      {/* 1. OUTER BACKGROUND CANVAS */}
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 md:w-[550px] h-72 md:h-[550px] bg-[#5C0612]/10 rounded-full blur-[60px] md:blur-[100px]"></div>
      </div>

      {/* 2. DEVICE INTERFACE PANEL DOCK */}
      <div className="w-full max-w-md bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-[28px] md:rounded-[32px] overflow-hidden shadow-[0_30px_70px_-15px_rgba(56,4,10,0.4)] border-4 border-[#5C0612] p-4 sm:p-6 text-white flex flex-col justify-between relative transition-all duration-300 z-10 min-h-[550px] md:min-h-[580px]">
        
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="inner-mesh" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#inner-mesh)" />
          </svg>
        </div>

        {/* Top Status Indicators */}
        <div className="flex justify-between items-center text-[10px] opacity-40 font-mono tracking-widest z-10 mb-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isActiveCamera ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span>{isActiveCamera ? 'FEED_LIVE_DECODING' : 'SYS_FEED_STANDBY'}</span>
          </div>
          <span>MATRIX_v1.3</span>
        </div>

        {/* Center Optical Capture Frame Box */}
        <div className="my-auto flex flex-col items-center z-10 w-full">
          <span className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest mb-1.5 bg-[#D4AF37]/5 px-2.5 py-0.5 rounded-md border border-[#D4AF37]/10">
            Optical Scanner Node
          </span>
          <h3 className="text-sm md:text-base font-medium tracking-tight text-slate-200 mb-5 text-center px-2">Scan or Upload Collar Matrix</h3>

          <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-3xl border border-white/10 bg-slate-950 relative flex items-center justify-center overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] border-b-2 border-[#D4AF37]/20">
            
            <video 
              ref={videoRef} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isActiveCamera ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
            />

            {/* Viewfinder Target Crosshairs */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-[#D4AF37] rounded-tl shadow-[0_0_8px_rgba(212,175,55,0.3)] z-20"></div>
            <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-[#D4AF37] rounded-tr shadow-[0_0_8px_rgba(212,175,55,0.3)] z-20"></div>
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-[#D4AF37] rounded-bl shadow-[0_0_8px_rgba(212,175,55,0.3)] z-20"></div>
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-[#D4AF37] rounded-br shadow-[0_0_8px_rgba(212,175,55,0.3)] z-20"></div>

            {isProcessing && !isActiveCamera ? (
              <div className="text-center space-y-2.5 z-10 px-4 animate-pulse">
                <div className="w-7 h-7 border-2 border-t-transparent border-[#D4AF37] rounded-full animate-spin mx-auto"></div>
                <span className="text-[9px] text-[#D4AF37] font-mono tracking-widest block uppercase font-bold">{statusMessage}</span>
              </div>
            ) : !isActiveCamera ? (
              <button 
                onClick={startCameraStream}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 group hover:bg-white/[0.02] active:bg-white/[0.04] transition-all focus:outline-none z-10"
              >
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-white/5 text-slate-400 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/20 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  </svg>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-white font-medium tracking-wide transition-colors">
                  Initialize Lens Context
                </span>
              </button>
            ) : (
              <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-20">
                <span className="text-[9px] bg-slate-950/80 text-[#D4AF37] border border-[#D4AF37]/20 px-2 py-0.5 rounded font-mono uppercase tracking-widest animate-pulse font-bold">
                  FEEDING LAYER...
                </span>
              </div>
            )}

            <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_10px_#D4AF37] top-0 animate-[bounce_2s_infinite] z-20"></div>
          </div>

          {isActiveCamera && (
            <button 
              onClick={stopCameraStream} 
              className="mt-3 px-3 py-1 bg-rose-950/40 border border-rose-900/60 rounded-lg text-[9px] font-mono uppercase font-bold tracking-widest text-rose-300 hover:bg-rose-900/40 transition-colors focus:outline-none"
            >
              Terminate Feed
            </button>
          )}

          {errorMessage && (
            <div className="text-[10px] text-rose-400 font-medium bg-rose-950/30 border border-rose-900/40 px-3 py-1.5 rounded-xl mt-4 max-w-[224px] text-center shadow-sm">
              {errorMessage}
            </div>
          )}

          {statusMessage && isActiveCamera && (
            <div className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-4 animate-pulse">
              {statusMessage}
            </div>
          )}

          {/* Document Upload Option */}
          <div className="w-full px-2 mt-4">
            <input 
              type="file" 
              id="qr-file-input" 
              accept="image/*" 
              onChange={handleFileUpload} 
              disabled={isProcessing}
              className="hidden" 
            />
            <label 
              htmlFor="qr-file-input"
              className={`w-full flex items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-[#D4AF37]/40 bg-white/[0.02] hover:bg-white/[0.05] py-2.5 px-4 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer text-center group ${
                isProcessing ? 'opacity-30 pointer-events-none' : ''
              }`}
            >
              <svg className="w-4 h-4 text-slate-400 group-hover:text-[#D4AF37] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-slate-300 group-hover:text-white">Upload Digital QR File</span>
            </label>
          </div>
        </div>

        {/* Terminal Manual Override (Pure ID Lookup - No applications submitted here) */}
        <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-white/5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] z-10 mt-4">
          <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 text-center font-mono">
            Terminal Override Console
          </label>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input 
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="SYS_REF_ID (Ex: PET-2041)"
              className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-transparent font-mono tracking-wider text-white placeholder-slate-700 shadow-inner min-w-0"
            />
            <button 
              type="submit" 
              className="bg-[#5C0612] hover:bg-[#42040B] px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 active:scale-95 transition-all text-white shrink-0 shadow-md font-mono"
            >
              LOAD
            </button>
          </form>
        </div>

      </div>
      
    </div>
  );
}