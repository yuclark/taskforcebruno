import React, { useState } from 'react';
import jsQR from 'jsqr';

export default function QRScannerView({ onProfileIdentified }) {
  const [manualId, setManualId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    onProfileIdentified(manualId.trim().toUpperCase());
  };

  const simulateCameraScan = () => {
    setIsProcessing(true);
    setStatusMessage('Capturing optical feed...');
    setErrorMessage('');
    
    setTimeout(() => {
      setIsProcessing(false);
      onProfileIdentified('PET-2041');
    }, 950);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
            const assetMatch = rawDecodedText.match(/PET-\d+/i);
            
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
    <div className="w-full h-full min-h-[600px] flex items-center justify-center relative p-8 bg-gradient-to-br from-slate-200 via-zinc-200 to-stone-300 rounded-3xl overflow-hidden shadow-inner">
      
      {/* 1. OUTER BACKGROUND CANVAS: Crisp Engineering Blueprint Grid & Dynamic Ambient Backglow */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <svg className="w-full h-full opacity-100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="outer-scanner-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              {/* Distinct cross-hatch layout lines */}
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(92, 6, 18, 0.12)" strokeWidth="1" />
              <circle cx="40" cy="40" r="1.5" fill="rgba(212, 175, 55, 0.4)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#outer-scanner-grid)" />
        </svg>
        
        {/* Deep high-visibility backglow targets directly under the terminal card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#5C0612]/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#D4AF37]/15 rounded-full blur-[80px]"></div>
      </div>

      {/* 2. DEVICE INTERFACE PANEL DOCK */}
      <div className="max-w-sm w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-[32px] overflow-hidden shadow-[0_30px_70px_-15px_rgba(56,4,10,0.4)] border-4 border-[#5C0612] p-6 text-white aspect-[9/16] flex flex-col justify-between relative transition-all z-10">
        
        {/* Internal Blueprint Matrix Mesh */}
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
        <div className="flex justify-between items-center text-[10px] opacity-40 font-mono tracking-widest z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SYS_FEED_ONLINE</span>
          </div>
          <span>MATRIX_v1.2</span>
        </div>

        {/* Center Target Box */}
        <div className="my-auto flex flex-col items-center z-10 w-full">
          <span className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest mb-1.5 bg-[#D4AF37]/5 px-2.5 py-0.5 rounded-md border border-[#D4AF37]/10">
            Optical Scanner Node
          </span>
          <h3 className="text-base font-medium tracking-tight text-slate-200 mb-5 text-center">Scan or Upload Collar Matrix</h3>

          {/* Viewfinder Frame Container */}
          <div className="w-52 h-52 rounded-3xl border border-white/10 bg-slate-950/70 relative flex items-center justify-center overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] border-b-2 border-[#D4AF37]/20">
            
            {/* Target Crosshairs */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-[#D4AF37] rounded-tl shadow-[0_0_8px_rgba(212,175,55,0.3)]"></div>
            <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-[#D4AF37] rounded-tr shadow-[0_0_8px_rgba(212,175,55,0.3)]"></div>
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-[#D4AF37] rounded-bl shadow-[0_0_8px_rgba(212,175,55,0.3)]"></div>
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-[#D4AF37] rounded-br shadow-[0_0_8px_rgba(212,175,55,0.3)]"></div>

            {isProcessing ? (
              <div className="text-center space-y-2.5 z-10 px-4 animate-pulse">
                <div className="w-7 h-7 border-2 border-t-transparent border-[#D4AF37] rounded-full animate-spin mx-auto"></div>
                <span className="text-[9px] text-[#D4AF37] font-mono tracking-widest block uppercase font-bold">
                  {statusMessage}
                </span>
              </div>
            ) : (
              <button 
                onClick={simulateCameraScan}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 group hover:bg-white/[0.02] active:bg-white/[0.04] transition-all focus:outline-none"
              >
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-white/5 text-slate-400 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/20 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  </svg>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-white font-medium tracking-wide transition-colors">
                  Simulate Camera Optic
                </span>
              </button>
            )}

            {/* Laser Scanning Optic Beam Line */}
            <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_10px_#D4AF37] top-0 animate-[bounce_2.5s_infinite]"></div>
          </div>

          {errorMessage && (
            <div className="text-[10px] text-rose-400 font-medium bg-rose-950/30 border border-rose-900/40 px-3 py-1.5 rounded-xl mt-4 max-w-[224px] text-center shadow-sm">
              {errorMessage}
            </div>
          )}

          {/* Integrated Document Upload Trigger */}
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

        {/* Terminal Override Console Input Area */}
        <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-white/5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] z-10">
          <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 text-center font-mono">
            Terminal Override Console
          </label>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input 
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="SYS_REF_ID (Ex: PET-2041)"
              className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-transparent font-mono tracking-wider text-white placeholder-slate-700 shadow-inner"
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