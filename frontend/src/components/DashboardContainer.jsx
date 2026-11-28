import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Heart,
  HeartHandshake,
  LogOut,
  MapPin,
  Menu,
  MoreHorizontal,
  Newspaper,
  Package,
  PawPrint,
  QrCode,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import NewsfeedView from './NewsfeedView';
import UserGuideModal from './UserGuideModal';
import EmergencyProtocolModal from './EmergencyProtocolModal';
import PageBackdrop from './PageBackdrop';
import ThemeToggle from './ThemeToggle';
import { apiGet } from '../lib/api';
import { getUserDisplayName, getUserInitials } from '../lib/auth';

const QRScannerView = lazy(() => import('./QRScannerView'));
const PetProfileView = lazy(() => import('./PetProfileView'));
const PetListings = lazy(() => import('./PetListings'));
const SupplyLogistics = lazy(() => import('./SupplyLogistics'));
const AdoptionGallery = lazy(() => import('./AdoptionGallery'));
const ReportSightingView = lazy(() => import('./ReportSightingView'));
const SupportAndVolunteers = lazy(() => import('./SupportAndVolunteers'));
const CampusMap = lazy(() => import('./CampusMap'));

const NAV_ITEMS = [
  { key: 'newsfeed', label: 'Community Newsfeed', shortLabel: 'Feed', Icon: Newspaper },
  { key: 'campus-map', label: 'CIT-U Campus Map', shortLabel: 'Map', Icon: MapPin },
  { key: 'pet-listings', label: 'Pet Directory', shortLabel: 'Pets', Icon: PawPrint },
  { key: 'scanner', label: 'Collar QR Scanner', shortLabel: 'Scan', Icon: QrCode },
  { key: 'adoption', label: 'Adoption Portal', shortLabel: 'Adopt', Icon: Heart },
  { key: 'report', label: 'Report Sighting', shortLabel: 'Report', Icon: AlertTriangle },
  { key: 'support', label: 'Support & Volunteers', shortLabel: 'Support', Icon: HeartHandshake },
  { key: 'resources', label: 'Supply Logistics', shortLabel: 'Supplies', Icon: Package },
];

const VALID_TABS = new Set(NAV_ITEMS.map((i) => i.key));

function TabSpinner() {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400">
      <div className="w-7 h-7 border-3 border-slate-200 border-t-[#5C0612] rounded-full animate-spin mb-2.5" />
      <span className="text-xs font-medium">Loading view...</span>
    </div>
  );
}

export default function DashboardContainer({ session, onLogout }) {
  const [currentTab, setCurrentTab] = useState(() => {
    const saved = localStorage.getItem('tfb_user_tab');
    return saved && VALID_TABS.has(saved) ? saved : 'newsfeed';
  });

  const [activePetId, setActivePetId] = useState(null);
  const [prefilledSightingZone, setPrefilledSightingZone] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(() => {
    try {
      return localStorage.getItem('tfb_onboarding_completed') !== 'true';
    } catch {
      return false;
    }
  });
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [petsError, setPetsError] = useState('');

  const displayName = getUserDisplayName(session, 'Community Member');
  const initials = getUserInitials(session, 'CM');
  const currentNav = NAV_ITEMS.find((i) => i.key === currentTab) || NAV_ITEMS[0];

  const handleCloseGuide = () => {
    setIsGuideOpen(false);
    try {
      localStorage.setItem('tfb_onboarding_completed', 'true');
    } catch {
      // Ignore storage errors
    }
  };

  const fetchAllPets = useCallback(async () => {
    setLoadingPets(true);
    setPetsError('');
    const res = await apiGet('/pets/');
    if (res.ok && Array.isArray(res.data)) {
      setPets(res.data);
    } else if (!res.aborted) {
      setPetsError(res.error || 'Unable to load the campus pet directory.');
    }
    setLoadingPets(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('tfb_user_tab', currentTab);
  }, [currentTab]);

  useEffect(() => {
    if (currentTab !== 'pet-listings') return undefined;
    const controller = new AbortController();
    const run = async () => {
      setLoadingPets(true);
      setPetsError('');
      const res = await apiGet('/pets/', { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (res.ok && Array.isArray(res.data)) {
        setPets(res.data);
      } else {
        setPetsError(res.error || 'Unable to load the campus pet directory.');
      }
      setLoadingPets(false);
    };
    run();
    return () => controller.abort();
  }, [currentTab]);

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!isMobileOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileOpen]);

  const navigateTo = (tabKey) => {
    setCurrentTab(tabKey);
    setActivePetId(null);
    setIsMobileOpen(false);
  };

  return (
    <div className="h-dvh bg-[#F3EFE9] dark:bg-[#0E0C14] flex text-slate-800 dark:text-slate-100 font-sans antialiased relative overflow-hidden">
      <UserGuideModal isOpen={isGuideOpen} onClose={handleCloseGuide} />

      <EmergencyProtocolModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        onNavigateToReport={() => navigateTo('report')}
      />

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] z-30 md:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        aria-label="Main navigation"
        className={`
          w-72 max-w-[85vw] bg-[#5C0612] text-white flex flex-col justify-between border-r-4 border-[#D4AF37] shrink-0
          fixed md:sticky top-0 h-dvh z-40 shadow-2xl md:shadow-none transition-transform duration-250 ease-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col min-h-0 flex-1">
          <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/logo.png"
                alt="Wildcat Welfare Portal Logo"
                className="w-10 h-10 object-contain drop-shadow-md shrink-0 select-none"
              />
              <div className="min-w-0">
                <h2 className="text-sm font-bold tracking-tight text-white leading-tight truncate">
                  Task Force Bruno
                </h2>
                <span className="text-[10px] text-[#D4AF37] tracking-widest uppercase font-semibold block mt-0.5 truncate">
                  Wildcat Welfare Portal
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close navigation menu"
              className="md:hidden p-1.5 text-stone-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3.5 space-y-1 overflow-y-auto flex-1">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-white/45 block px-3 pb-1.5">
              Community Portal
            </span>

            {NAV_ITEMS.map(({ key, label, Icon }) => {
              const isActive = currentTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => navigateTo(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    isActive
                      ? 'bg-white text-[#5C0612] dark:bg-[#D4AF37] dark:text-[#3B030B] font-semibold shadow-sm'
                      : 'text-stone-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#5C0612] dark:text-[#3B030B]' : 'text-[#D4AF37]/85'
                    }`}
                  />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}

            <div className="pt-3 border-t border-white/10 mt-3 space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsEmergencyOpen(true);
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-100 hover:text-white bg-rose-950/50 hover:bg-rose-900/70 border border-rose-400/30 transition-colors text-left"
              >
                <ShieldAlert className="w-4 h-4 text-rose-300 shrink-0" />
                <span>Bite &amp; Emergency Guide</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsGuideOpen(true);
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#D4AF37] hover:bg-white/10 transition-colors text-left"
              >
                <BookOpen className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>Getting Started Guide</span>
              </button>
            </div>
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-white/10 p-4 flex flex-col gap-3 shrink-0 bg-black/15">
          <ThemeToggle variant="sidebar" />

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#5C0612] font-bold flex items-center justify-center text-xs shrink-0">
              {initials}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white leading-tight truncate">{displayName}</p>
              <span className="text-[11px] text-stone-300/80 block truncate mt-0.5">
                {session?.email || ''}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 bg-white/10 hover:bg-rose-950/60 text-stone-200 hover:text-white rounded-xl text-xs font-medium border border-white/10 transition-colors inline-flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <main className="flex-1 flex flex-col h-dvh overflow-hidden relative min-w-0 pb-16 md:pb-0">
        {/* Top Bar */}
        <header className="h-15 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 md:px-8 shrink-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden p-2 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            <img
              src="/logo.png"
              alt="Task Force Bruno"
              className="w-7 h-7 object-contain md:hidden shrink-0 select-none"
            />
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {currentNav.label}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle variant="compact" />

            <button
              type="button"
              onClick={() => setIsEmergencyOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold transition-colors"
              title="Immediate Bite & Injury Protocol (RA 9482)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="hidden xs:inline sm:inline">Emergency</span>
              <span className="hidden md:inline">Protocol</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#5C0612] rounded-xl text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>User Guide</span>
            </button>

            <div className="hidden lg:inline-flex items-center gap-1.5 text-xs font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Community Member</span>
            </div>
          </div>
        </header>

        {/* Active View Surface with Ambient Page Backdrop */}
        <div className="flex-1 relative min-h-0 bg-[#F3EFE9] dark:bg-[#0E0C14] overflow-hidden">
          <PageBackdrop variant={currentTab} />
          <div className="relative z-10 h-full overflow-y-auto">
            {currentTab === 'newsfeed' && (
              <div className="w-full lg:h-full p-3 sm:p-5 md:p-7">
                <NewsfeedView session={session} />
              </div>
            )}

            {currentTab === 'campus-map' && (
              <div className="w-full p-3 sm:p-5 md:p-7">
                <Suspense fallback={<TabSpinner />}>
                  <CampusMap
                    mode="explorer"
                    onReportAtZone={(zoneName) => {
                      setPrefilledSightingZone(zoneName);
                      navigateTo('report');
                    }}
                    onInspectPet={(petId) => {
                      setCurrentTab('scanner');
                      setActivePetId(petId);
                    }}
                  />
                </Suspense>
              </div>
            )}

            {currentTab === 'pet-listings' && (
              <div className="w-full p-3 sm:p-5 md:p-7">
                <div className="max-w-7xl mx-auto pb-6">
                  <Suspense fallback={<TabSpinner />}>
                    <PetListings
                      pets={pets}
                      loadingPets={loadingPets}
                      loadError={petsError}
                      onRefresh={fetchAllPets}
                      readOnly
                    />
                  </Suspense>
                </div>
              </div>
            )}

            {currentTab === 'scanner' && (
              <div className="w-full p-3 sm:p-5 md:p-7">
                <Suspense fallback={<TabSpinner />}>
                  {!activePetId ? (
                    <QRScannerView onProfileIdentified={(id) => setActivePetId(id)} />
                  ) : (
                    <PetProfileView
                      petId={activePetId}
                      onBackToScanner={() => setActivePetId(null)}
                    />
                  )}
                </Suspense>
              </div>
            )}

            {currentTab === 'report' && (
              <div className="w-full p-3 sm:p-5 md:p-7">
                <Suspense fallback={<TabSpinner />}>
                  <ReportSightingView
                    key={prefilledSightingZone || 'default-zone'}
                    session={session}
                    initialZone={prefilledSightingZone}
                  />
                </Suspense>
              </div>
            )}

            {currentTab === 'adoption' && (
              <div className="w-full p-3 sm:p-5 md:p-7">
                <Suspense fallback={<TabSpinner />}>
                  <AdoptionGallery session={session} />
                </Suspense>
              </div>
            )}

            {currentTab === 'support' && (
              <div className="w-full p-3 sm:p-5 md:p-7">
                <Suspense fallback={<TabSpinner />}>
                  <SupportAndVolunteers session={session} />
                </Suspense>
              </div>
            )}

            {currentTab === 'resources' && (
              <div className="w-full p-3 sm:p-5 md:p-7">
                <Suspense fallback={<TabSpinner />}>
                  <SupplyLogistics />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile quick navigation"
        className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center justify-around h-16 px-1">
          {[
            { key: 'newsfeed', label: 'Feed', Icon: Newspaper, activeColor: 'text-[#5C0612]' },
            { key: 'campus-map', label: 'Map', Icon: MapPin, activeColor: 'text-[#5C0612]' },
            { key: 'scanner', label: 'Scan', Icon: QrCode, activeColor: 'text-[#5C0612]' },
            { key: 'report', label: 'Report', Icon: AlertTriangle, activeColor: 'text-rose-600' },
          ].map(({ key, label, Icon, activeColor }) => {
            const isActive = currentTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigateTo(key)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
                  isActive ? `${activeColor} font-bold` : 'text-slate-500 font-medium'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-1 tracking-tight">{label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
              ['pet-listings', 'adoption', 'support', 'resources'].includes(currentTab)
                ? 'text-[#5C0612] font-bold'
                : 'text-slate-500 font-medium'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
