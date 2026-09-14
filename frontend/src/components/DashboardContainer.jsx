import React, { useState, useEffect } from 'react';
import QRScannerView from './QRScannerView';
import PetProfileView from './PetProfileView';
import SupplyLogistics from './SupplyLogistics';
import AdoptionGallery from './AdoptionGallery';
import ReportSightingView from './ReportSightingView';
import NewsfeedView from './NewsfeedView';
import SupportAndVolunteers from './SupportAndVolunteers';
import UserGuideModal from './UserGuideModal';

export default function DashboardContainer({ session, onLogout }) {
  // Hydrate current tab position from disk parameters on bootup loop
  const [currentTab, setCurrentTab] = useState(() => {
    return localStorage.getItem('tfb_user_tab') || 'newsfeed';
  });

  const [activePetId, setActivePetId] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Save current tab layout configuration dynamically upon mutation
  useEffect(() => {
    localStorage.setItem('tfb_user_tab', currentTab);
  }, [currentTab]);

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans antialiased relative overflow-hidden">

      {/* USER INTERACTIVE SYSTEM GUIDE MODAL */}
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          w-72 bg-[#5C0612] text-white flex flex-col justify-between border-r-4 border-[#D4AF37] shrink-0
          fixed md:sticky top-0 h-screen z-40 shadow-xl transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div>
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-[#D4AF37] to-amber-500 text-[#5C0612] p-2 rounded-xl shadow-md shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-sm font-bold tracking-tight text-white leading-none">
                  Task Force Bruno
                </h2>
                <span className="text-[10px] text-[#D4AF37] tracking-widest uppercase font-semibold block mt-1">
                  Portal Node
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1 text-stone-300 hover:text-white rounded-lg hover:bg-white/10"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
            <span className="text-[8px] font-mono font-bold tracking-widest uppercase text-white/40 block px-3 mb-1">
              Community Node Workspace
            </span>

            <button
              onClick={() => { setCurrentTab('newsfeed'); setActivePetId(null); setIsMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                currentTab === 'newsfeed' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <span>📰</span> Community Newsfeed
            </button>

            <button
              onClick={() => { setCurrentTab('scanner'); setActivePetId(null); setIsMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                currentTab === 'scanner' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <span>📷</span> Collar QR Scanner
            </button>

            <button
              onClick={() => { setCurrentTab('adoption'); setActivePetId(null); setIsMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                currentTab === 'adoption' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <span>🐾</span> Adoption Placement Portal
            </button>

            <button
              onClick={() => { setCurrentTab('report'); setActivePetId(null); setIsMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                currentTab === 'report' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <span>🚨</span> Report Animal Sighting
            </button>

            <button
              onClick={() => { setCurrentTab('support'); setActivePetId(null); setIsMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                currentTab === 'support' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <span>🤝</span> Support & Volunteers
            </button>

            <button
              onClick={() => { setCurrentTab('resources'); setActivePetId(null); setIsMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                currentTab === 'resources' ? 'bg-white text-[#5C0612] font-semibold shadow-md' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <span>📦</span> Supply Logistics Hub
            </button>

            <div className="pt-2 border-t border-white/10 mt-2">
              <button
                onClick={() => { setIsGuideOpen(true); setIsMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#D4AF37] hover:bg-white/10 transition-all text-left"
              >
                <span>🧭</span> System User Guide
              </button>
            </div>
          </nav>
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#5C0612] font-bold flex items-center justify-center text-xs shrink-0">
              CU
            </div>

            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white leading-none truncate">
                Campus User
              </p>
              <span className="text-[9px] text-stone-300 font-mono mt-1 block truncate">
                {session?.email || 'Loading profile...'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2 bg-white/5 text-stone-300 hover:bg-rose-950/40 rounded-xl text-[11px] font-medium border border-white/10 transition-all"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0 pb-16 md:pb-0">

        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all focus:outline-none"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>

            <span className="text-xs font-bold font-mono text-[#5C0612] uppercase tracking-wider">
              {currentTab === 'support' ? 'Support & Action' : `${currentTab.replace('-', ' ')} Module`}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#5C0612] rounded-xl font-mono text-[11px] font-bold transition-colors"
            >
              <span>🧭</span>
              <span>System Guide</span>
            </button>

            <div className="text-[11px] md:text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600">
              POV: General Community
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 relative min-h-0 bg-gradient-to-br from-slate-50 via-stone-50 to-slate-100 overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="user-grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="rgba(92, 6, 18, 0.05)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#user-grid)" />
            </svg>
          </div>

          {/* NEWSFEED */}
          {currentTab === 'newsfeed' && (
            <div className="relative z-10 w-full h-full min-h-0 p-4 md:p-8 overflow-hidden">
              <NewsfeedView session={session} />
            </div>
          )}

          {/* SCANNER */}
          {currentTab === 'scanner' && (
            <div className="relative z-10 w-full h-full overflow-y-auto">
              <div className="min-h-full flex items-start justify-center p-3 sm:p-5 md:p-6 lg:p-8">
                {!activePetId ? (
                  <QRScannerView onProfileIdentified={(id) => setActivePetId(id)} />
                ) : (
                  <PetProfileView
                    petId={activePetId}
                    onBackToScanner={() => setActivePetId(null)}
                  />
                )}
              </div>
            </div>
          )}

          {/* REPORT */}
          {currentTab === 'report' && (
            <div className="relative z-10 w-full h-full overflow-y-auto p-4 md:p-8">
              <ReportSightingView session={session} />
            </div>
          )}

          {/* ADOPTION */}
          {currentTab === 'adoption' && (
            <div className="relative z-10 w-full h-full overflow-y-auto p-4 md:p-8">
              <AdoptionGallery session={session} />
            </div>
          )}

          {/* SUPPORT & VOLUNTEERS */}
          {currentTab === 'support' && (
            <div className="relative z-10 w-full h-full overflow-y-auto p-4 md:p-8">
              <SupportAndVolunteers session={session} />
            </div>
          )}

          {/* RESOURCES */}
          {currentTab === 'resources' && (
            <div className="relative z-10 w-full h-full overflow-y-auto p-4 md:p-8">
              <SupplyLogistics />
            </div>
          )}
        </div>

      </main>

      {/* MODERN MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-around h-16 px-1 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {[
          { key: 'newsfeed', label: 'Feed', icon: '📰' },
          { key: 'scanner', label: 'Scan', icon: '📷' },
          { key: 'report', label: 'Report', icon: '🚨' },
          { key: 'adoption', label: 'Adopt', icon: '🐾' },
          { key: 'support', label: 'Support', icon: '🤝' },
        ].map((item) => {
          const isActive = currentTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setCurrentTab(item.key);
                setActivePetId(null);
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                isActive ? 'text-[#5C0612] font-black scale-105' : 'text-slate-500 font-medium'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#5C0612] mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>

    </div>
  );
}