import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

/**
 * Task Force Bruno — CollarQRScanner.jsx (SDD Component / TC-QR-001)
 * Hardware Camera QR Scanning & Public Passport Lookup
 * Captures collar QR tag matrix in < 2.0s and redirects to /passport/:id
 */
export default function CollarQRScanner({ onScanSuccess, onClose }) {
  const [isActiveCamera, setIsActiveCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing camera...');
  const [errorMessage, setErrorMessage] = useState('');
  const [manualTagId, setManualTagId] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const scanStartTimeRef = useRef(Date.now());

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const extractPetId = (raw) => {
    if (!raw) return '';
    const trimmed = raw.trim();

    // Check if full URL (e.g. /passport/PET-001 or ?pet=PET-001)
    if (/^https?:\/\//i.test(trimmed)) {
      try {
        const url = new URL(trimmed);
        for (const [key, val] of url.searchParams.entries()) {
          if (['pet', 'id', 'pet_id', 'passport'].includes(key.toLowerCase()) && val) {
            return decodeURIComponent(val).trim().toUpperCase();
          }
        }
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length >= 2 && (segments[0].toLowerCase() === 'passport' || segments[0].toLowerCase() === 'pet')) {
          return decodeURIComponent(segments[1]).trim().toUpperCase();
        }
        if (segments.length > 0) {
          const last = decodeURIComponent(segments[segments.length - 1]).trim();
          if (last && !['passport', 'pet'].includes(last.toLowerCase())) {
            return last.toUpperCase();
          }
        }
      } catch {}
    }

    // Path match /passport/PET-001
    const pathMatch = trimmed.match(/(?:\/passport\/|\/pet\/)([A-Za-z0-9_-]+)/i);
    if (pathMatch) return pathMatch[1].toUpperCase();

    // Standard ID regex
    const idMatch = trimmed.match(/(?:PET|STRAY|TF|CIT|ADOPT)[-_A-Z0-9]+/i);
    if (idMatch) return idMatch[0].toUpperCase();

    return trimmed.replace(/^[#\/]+/, '').trim().toUpperCase();
  };

  const handleDetected = (rawResult) => {
    const petId = extractPetId(rawResult);
    if (!petId) return;

    const elapsed = Date.now() - scanStartTimeRef.current;
    setStatusMessage(`Collar QR Decoded in ${elapsed}ms: ${petId}`);
    stopCamera();

    // Update browser URL directly to /passport/:id without full page reload
    try {
      window.history.pushState(null, '', `/passport/${encodeURIComponent(petId)}`);
    } catch {}

    if (onScanSuccess) {
      onScanSuccess(petId);
    }
  };

  const startCamera = async () => {
    setErrorMessage('');
    setIsProcessing(true);
    setStatusMessage('Requesting camera permissions...');
    scanStartTimeRef.current = Date.now();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsProcessing(false);
      setErrorMessage('Hardware camera access is not supported on this browser context. Please enter collar ID manually.');
      return;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 640 } }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play().catch(() => {});
      }

      setIsActiveCamera(true);
      setIsProcessing(false);
      setStatusMessage('Point camera at the collar QR tag...');
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err) {
      console.warn('Camera stream error:', err);
      setIsProcessing(false);
      setErrorMessage('Camera access was blocked or busy. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    setIsActiveCamera(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanLoop = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      handleDetected(code.data);
    } else {
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    }
  };

  const handleManualLookup = (e) => {
    e.preventDefault();
    if (!manualTagId.trim()) return;
    handleDetected(manualTagId.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-[#5C0612] text-white p-4 flex items-center justify-between border-b-4 border-[#D4AF37]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-bold tracking-widest block">SDD Hardware Scanner</span>
              <h3 className="text-sm font-black">Scan Collar QR Tag</h3>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Viewfinder Area */}
        <div className="p-5 space-y-4">
          <div className="relative aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-inner flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" />
            
            {/* Viewfinder Target Overlays */}
            <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-[#D4AF37]/70 rounded-xl flex items-center justify-center">
              <div className="w-12 h-12 border-2 border-[#D4AF37] rounded-lg animate-ping opacity-25"></div>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-mono">
                Starting camera...
              </div>
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs font-mono text-slate-600 font-medium">{statusMessage}</p>
            {errorMessage && (
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">{errorMessage}</p>
            )}
          </div>

          {/* Fallback Manual Tag ID Entry */}
          <form onSubmit={handleManualLookup} className="pt-2 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={manualTagId}
              onChange={(e) => setManualTagId(e.target.value)}
              placeholder="Or enter Animal ID (e.g. PET-001)"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#5C0612]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#5C0612] hover:bg-[#42040B] text-white text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              Lookup
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

