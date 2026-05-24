import React, { useState } from 'react';
import QRScannerView from './QRScannerView';
import PetProfileView from './PetProfileView';
import SupplyLogistics from './SupplyLogistics';
import AdoptionGallery from './AdoptionGallery'; 

export default function DashboardContainer({ session, onLogout }) {
  const [currentTab, setCurrentTab] = useState('newsfeed');
  const [activePetId, setActivePetId] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans antialiased">
      
      <aside className="w-72 bg-[#5C0612] text-white flex flex-col justify-between border-r-4 border-[#D4AF37] shrink-0 sticky top-0 h-screen z-20 shadow-xl">
        <div>
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#D4AF37] to-amber-500 text-[#5C0612] p-2 rounded-xl shadow-md shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white leading-none">Task Force Bruno</h2>
              <span className="text-[10px] text-[#D4AF37] tracking-widest uppercase font-semibold block mt-1">Portal Node</span>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            <button onClick={() => { setCurrentTab('newsfeed'); setActivePetId(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${currentTab === 'newsfeed' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'}`}>Community Newsfeed</button>
            <button onClick={() => { setCurrentTab('report'); setActivePetId(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${currentTab === 'report' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'}`}>Report Animal Sighting</button>
            <button onClick={() => { setCurrentTab('scanner'); setActivePetId(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${currentTab === 'scanner' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'}`}>Collar QR Scanner</button>
            <button onClick={() => { setCurrentTab('adoption'); setActivePetId(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${currentTab === 'adoption' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'}`}>Adoption Placement Portal</button>
            <button onClick={() => { setCurrentTab('resources'); setActivePetId(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${currentTab === 'resources' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'}`}>Supply Logistics Hub</button>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#5C0612] font-bold flex items-center justify-center text-xs shrink-0">CU</div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white leading-none truncate">Campus User</p>
              <span className="text-[9px] text-stone-300 font-mono mt-1 block truncate">{session.email}</span>
            </div>
          </div>
          <button onClick={onLogout} className="w-full py-2 bg-white/5 text-stone-300 hover:bg-rose-950/40 rounded-xl text-[11px] font-medium border border-white/10 transition-all">Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
          <span className="text-xs font-bold font-mono text-[#5C0612] uppercase tracking-wider">
            {currentTab === 'adoption' ? 'Adoption Placement' : currentTab} Module
          </span>
          <div className="text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600">POV: General Community</div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-50 via-stone-50 to-slate-100 relative">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-40 overflow-hidden">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="user-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(92, 6, 18, 0.05)" strokeWidth="1" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#user-grid)" />
            </svg>
          </div>

          <div className="relative z-10 w-full h-full flex justify-center items-center">
            {currentTab === 'newsfeed' && <div className="bg-white p-6 rounded-2xl border text-center text-xs max-w-sm">Feed active. Streams are currently blank.</div>}
            {currentTab === 'report' && <div className="bg-white p-6 rounded-2xl border text-center text-xs max-w-sm">Sighting form entries offline until next sprint.</div>}
            
            {currentTab === 'scanner' && (
              <div className="w-full h-full flex items-center justify-center animate-fade-in">
                {!activePetId ? <QRScannerView onProfileIdentified={(id) => setActivePetId(id)} /> : <PetProfileView petId={activePetId} onBackToScanner={() => setActivePetId(null)} />}
              </div>
            )}

            {currentTab === 'adoption' && <AdoptionGallery session={session} />}
            {currentTab === 'resources' && <SupplyLogistics />}
          </div>
        </div>
      </main>

    </div>
  );
}