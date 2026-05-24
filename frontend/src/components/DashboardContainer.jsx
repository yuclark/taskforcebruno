import React, { useState } from 'react';
import QRScannerView from './QRScannerView';
import PetProfileView from './PetProfileView';

export default function DashboardContainer({ session, onLogout }) {
  const [currentTab, setCurrentTab] = useState('newsfeed');
  const [activePetId, setActivePetId] = useState(null);

  const handleNavigation = (tabId) => {
    setCurrentTab(tabId);
    setActivePetId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
      
      {/* SaaS Sidebar Navigation Panel - Expanded width to fix button alignment text wrapping */}
      <aside className="w-72 bg-[#5C0612] text-white flex flex-col justify-between border-r-4 border-[#D4AF37] shrink-0 sticky top-0 h-screen z-20 shadow-xl">
        <div>
          {/* Logo Brand Header Block */}
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#D4AF37] to-amber-500 text-[#5C0612] p-2 rounded-xl shadow-md shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white leading-none">Wildcat Welfare</h2>
              <span className="text-[10px] text-[#D4AF37] tracking-widest uppercase font-semibold block mt-1">Portal Node</span>
            </div>
          </div>

          {/* Core App Directives Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-3 mb-2">Main Modules</p>
            
            <button 
              onClick={() => handleNavigation('newsfeed')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-normal break-words ${
                currentTab === 'newsfeed' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H3.375a1.125 1.125 0 0 1-1.125-1.125V4.625c0-.621.504-1.125 1.125-1.125H9.75M10.5 7.5h.008v.008h-.008V7.5Zm0 3h.008v.008h-.008V10.5Z"/></svg>
              <span>Community Newsfeed</span>
            </button>

            <button 
              onClick={() => handleNavigation('report')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-normal break-words ${
                currentTab === 'report' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
              <span>Report Animal Sighting</span>
            </button>

            <button 
              onClick={() => handleNavigation('scanner')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-normal break-words ${
                currentTab === 'scanner' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"/></svg>
              <span>Collar QR Scanner</span>
            </button>

            <button 
              onClick={() => handleNavigation('gallery')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-normal break-words ${
                currentTab === 'gallery' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
              <span>Adoption Gallery</span>
            </button>

            <button 
              onClick={() => handleNavigation('resources')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-normal break-words ${
                currentTab === 'resources' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"/></svg>
              <span>Supply Logistics & Donations</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Parameters Card */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#5C0612] font-bold flex items-center justify-center text-xs shrink-0">
              CU
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white leading-none truncate">Campus User</p>
              <span className="text-[9px] text-stone-300 font-mono mt-1 block truncate">{session.email}</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-2 bg-white/5 hover:bg-rose-950/40 text-stone-300 hover:text-rose-200 rounded-xl text-[11px] font-medium tracking-wide transition-all border border-white/10"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Global Right App Workspace Pane */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Information Hub Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-slate-400">CIT-U ECOSYSTEM</span>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-xs font-semibold text-[#5C0612] uppercase tracking-wider font-mono">
              {activePetId ? 'Medical Record File' : `${currentTab} Module`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>POV: General Community</span>
          </div>
        </header>

        {/* Main Interface Content View Routing Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          
          {/* TAB 1: Community Newsfeed - Empty structure per instruction */}
          {currentTab === 'newsfeed' && (
            <div className="max-w-4xl mx-auto text-center py-12">
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 bg-white max-w-md mx-auto">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H3.375a1.125 1.125 0 0 1-1.125-1.125V4.625c0-.621.504-1.125 1.125-1.125H9.75M10.5 7.5h.008v.008h-.008V7.5Zm0 3h.008v.008h-.008V10.5Z"/></svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Community Newsfeed</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">System feed parameters initialized. Sighting stream allocations are currently blank.</p>
              </div>
            </div>
          )}

          {/* TAB 2: Report Sighting Placeholder */}
          {currentTab === 'report' && (
            <div className="max-w-4xl mx-auto text-center py-12">
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 bg-white max-w-md mx-auto">
                <div className="w-12 h-12 bg-amber-50 border border-[#D4AF37]/30 text-[#5C0612] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Sighting Hub Form Panel</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Crowdsourced tracking forms are scheduled for Module 2 deployment[cite: 116]. This segment is currently offline.</p>
                <div className="mt-4 text-[9px] font-mono tracking-widest text-[#5C0612] uppercase font-bold">Sprint 2 Integration Target</div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE CODE - Collar QR Scanner & Pet Profiles Lookups */}
          {currentTab === 'scanner' && (
            <div className="h-full flex items-center justify-center">
              {!activePetId ? (
                <QRScannerView onProfileIdentified={(id) => setActivePetId(id)} />
              ) : (
                <PetProfileView petId={activePetId} onBackToScanner={() => setActivePetId(null)} />
              )}
            </div>
          )}

          {/* TAB 4: Adoption Gallery Placeholder */}
          {currentTab === 'gallery' && (
            <div className="max-w-md mx-auto bg-white border border-slate-200 shadow-sm rounded-3xl p-8 text-center my-12 animate-fade-in">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Adoption Pipeline Workspace</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">Integrated formal trackable adoption matrices will initialize inside this subview component[cite: 117].</p>
              <div className="mt-5 text-[9px] font-mono tracking-widest text-[#5C0612] uppercase font-bold">Coming Soon</div>
            </div>
          )}

          {/* TAB 5: Supply Logistics & Donations - Empty placeholder structure per instruction */}
          {currentTab === 'resources' && (
            <div className="max-w-4xl mx-auto text-center py-12">
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 bg-white max-w-md mx-auto">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"/></svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Donation Logistics Hub</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Live inventory tracking dashboard configurations and optional online payment gateway instances are offline[cite: 118].</p>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}