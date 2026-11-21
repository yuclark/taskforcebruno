import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, Image as ImageIcon, QrCode, Search, X } from 'lucide-react';
import { extractPetIdFromQr } from '../lib/qr';

export default function CollarQRScanner({ onScanSuccess, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Starting camera...');
  const [errorMessage, setErrorMessage] = useState('');
  const [manualTagId, setManualTagId] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isMountedRef = useRef(true);

  const stopCamera = useCallback(() => {
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

  const handleDetected = useCallback(
    (rawResult) => {
      const petId = extractPetIdFromQr(rawResult);
      if (!petId) return;

      setStatusMessage(`Tag detected: ${petId}`);
      stopCamera();

      try {
        window.history.pushState(null, '', `/passport/${encodeURIComponent(petId)}`);
      } catch {
        // Ignore restricted history API contexts
      }

      if (onScanSuccess) {
        onScanSuccess(petId);
      }
    },
    [onScanSuccess, stopCamera]
  );

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        stopCamera();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, stopCamera]);

  useEffect(() => {
    isMountedRef.current = true;

    const scanLoop = () => {
      if (!isMountedRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameRef.current = requestAnimationFrame(scanLoop);
        return;
      }

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
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data) {
        handleDetected(code.data);
      } else {
        animationFrameRef.current = requestAnimationFrame(scanLoop);
      }
    };

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMountedRef.current) {
          setIsProcessing(false);
          setStatusMessage('Camera unavailable');
          setErrorMessage('Live camera scanning is unavailable here. Upload a QR photo or enter the tag ID below.');
        }
        return;
      }

      if (isMountedRef.current) {
        setErrorMessage('');
        setIsProcessing(true);
        setStatusMessage('Requesting camera permission...');
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

        if (isMountedRef.current) {
          setIsProcessing(false);
          setStatusMessage('Point your camera at the collar QR tag');
          animationFrameRef.current = requestAnimationFrame(scanLoop);
        }
      } catch {
        if (isMountedRef.current) {
          setIsProcessing(false);
          setStatusMessage('Camera access blocked');
          setErrorMessage('Camera access blocked. Please upload a photo or enable permissions.');
        }
      }
    };

    startCamera();
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [handleDetected, stopCamera]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    stopCamera();
    setErrorMessage('');
    setIsProcessing(true);
    setStatusMessage('Reading QR code from image...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          setIsProcessing(false);
          if (code && code.data) {
            handleDetected(code.data);
          } else {
            setStatusMessage('No QR code found');
            setErrorMessage('Could not detect a valid QR code in this photo. Please try a clearer image.');
          }
        } catch {
          setIsProcessing(false);
          setErrorMessage('Failed to process the selected image.');
        }
      };
      img.onerror = () => {
        setIsProcessing(false);
        setErrorMessage('Unsupported or unreadable image file.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleManualLookup = (e) => {
    e.preventDefault();
    if (!manualTagId.trim()) return;
    handleDetected(manualTagId.trim());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collar-scanner-title"
      onClick={() => {
        stopCamera();
        if (onClose) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-scale-up"
      >
        {/* Header */}
        <div className="bg-[#5C0612] text-white px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between border-b-4 border-[#D4AF37] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-wider block">
                Public Passport Lookup
              </span>
              <h3 id="collar-scanner-title" className="text-sm font-bold truncate">
                Scan Collar QR Tag
              </h3>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              aria-label="Close scanner"
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <div className="relative aspect-square max-w-[260px] mx-auto rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-inner flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#D4AF37] rounded-tl pointer-events-none" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#D4AF37] rounded-tr pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#D4AF37] rounded-bl pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#D4AF37] rounded-br pointer-events-none" />

            {isProcessing && (
              <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2 text-white text-xs font-medium">
                <span className="w-5 h-5 border-2 border-white/30 border-t-[#D4AF37] rounded-full animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          <div className="text-center space-y-2.5">
            {!isProcessing && <p className="text-xs text-slate-600 font-medium">{statusMessage}</p>}
            {errorMessage && (
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 leading-relaxed">
                {errorMessage}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[#5C0612] hover:bg-[#42040B] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                <Camera className="w-4 h-4 text-[#D4AF37]" />
                <span>Take Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-[#5C0612] border border-[#D4AF37]/60 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                <ImageIcon className="w-4 h-4" />
                <span>Upload QR Photo from Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Manual Tag Lookup */}
          <form onSubmit={handleManualLookup} className="pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={manualTagId}
              onChange={(e) => setManualTagId(e.target.value)}
              placeholder="Tag ID (e.g. PET-001)"
              className="flex-1 min-w-0 px-3.5 py-2.5 text-base sm:text-xs rounded-xl border border-slate-200 uppercase placeholder:normal-case font-mono focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#5C0612] hover:bg-[#42040B] text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lookup</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
