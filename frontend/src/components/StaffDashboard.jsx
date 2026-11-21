import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  ClipboardCheck,
  LogOut,
  Megaphone,
  Menu,
  MoreHorizontal,
  Newspaper,
  Package,
  PawPrint,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Stethoscope,
  X,
} from 'lucide-react';
import EmergencyProtocolModal from './EmergencyProtocolModal';
import { apiGet } from '../lib/api';
import { getUserDisplayName, getUserInitials } from '../lib/auth';

const NewsfeedView = lazy(() => import('./NewsfeedView'));
const PendingApplications = lazy(() => import('./PendingApplications'));
const PetListings = lazy(() => import('./PetListings'));
const AddNewPet = lazy(() => import('./AddNewPet'));
const MedicalLogs = lazy(() => import('./MedicalLogs'));
const InventoryControl = lazy(() => import('./InventoryControl'));
const SightingTriage = lazy(() => import('./SightingTriage'));
const PostAnnouncement = lazy(() => import('./PostAnnouncement'));

const STAFF_NAV_ITEMS = [
  { key: 'Pet Listings', label: 'Pet Directory', Icon: PawPrint },
  { key: 'Pending Applications', label: 'Applications', Icon: ClipboardCheck },
  { key: 'Sighting Reports', label: 'Sighting Reports', Icon: Siren },
  { key: 'Medical Logs', label: 'Medical & Vaccines', Icon: Stethoscope },
  { key: 'Add New Pet', label: 'Add New Pet', Icon: PlusCircle },
  { key: 'Inventory Control', label: 'Inventory Control', Icon: Package },
  { key: 'Community Newsfeed', label: 'Community Newsfeed', Icon: Newspaper },
  { key: 'Broadcast Bulletin', label: 'Broadcast Bulletin', Icon: Megaphone },
];

const VALID_MENUS = new Set(STAFF_NAV_ITEMS.map((i) => i.key));

function StaffSpinner() {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400">
      <div className="w-7 h-7 border-3 border-slate-200 border-t-[#5C0612] rounded-full animate-spin mb-2.5" />
      <span className="text-xs font-medium">Loading staff workspace...</span>
    </div>
  );
}

export default function StaffDashboard({ session, onLogout }) {
  const [activeMenu, setActiveMenu] = useState(() => {
    const saved = localStorage.getItem('tfb_staff_tab');
    return saved && VALID_MENUS.has(saved) ? saved : 'Pet Listings';
  });

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [petsError, setPetsError] = useState('');

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  const [inventoryItems, setInventoryItems] = useState([]);
  const [transactionLedger, setTransactionLedger] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState('');

  const displayName = getUserDisplayName(session, 'MDC Staff');
  const initials = getUserInitials(session, 'MS');
  const currentNav = STAFF_NAV_ITEMS.find((i) => i.key === activeMenu) || STAFF_NAV_ITEMS[0];

  useEffect(() => {
    localStorage.setItem('tfb_staff_tab', activeMenu);
  }, [activeMenu]);

  const fetchAllRegisteredPets = useCallback(async () => {
    setLoadingPets(true);
    setPetsError('');
    const res = await apiGet('/pets/');
    if (res.ok && Array.isArray(res.data)) {
      setPets(res.data);
    } else if (!res.aborted) {
      setPetsError(res.error || 'Unable to load pet records.');
    }
    setLoadingPets(false);
  }, []);

  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    setInventoryError('');
    const [invRes, ledRes] = await Promise.all([
      apiGet('/inventory/'),
      apiGet('/inventory/transactions/'),
    ]);
    if (invRes.ok && Array.isArray(invRes.data)) {
      setInventoryItems(invRes.data);
    } else if (!invRes.aborted) {
      setInventoryError(invRes.error || 'Unable to load inventory records.');
    }
    if (ledRes.ok && Array.isArray(ledRes.data)) {
      setTransactionLedger(ledRes.data);
    }
    setLoadingInventory(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadInitial = async () => {
      setLoadingPets(true);
      setLoadingInventory(true);
      const [petsRes, invRes, ledRes] = await Promise.all([
        apiGet('/pets/', { signal: controller.signal }),
        apiGet('/inventory/', { signal: controller.signal }),
        apiGet('/inventory/transactions/', { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;

      if (petsRes.ok && Array.isArray(petsRes.data)) {
        setPets(petsRes.data);
      } else {
        setPetsError(petsRes.error || 'Unable to load pet records.');
      }

      if (invRes.ok && Array.isArray(invRes.data)) {
        setInventoryItems(invRes.data);
      } else {
        setInventoryError(invRes.error || 'Unable to load inventory records.');
      }

      if (ledRes.ok && Array.isArray(ledRes.data)) {
        setTransactionLedger(ledRes.data);
      }

      setLoadingPets(false);
      setLoadingInventory(false);
    };
    loadInitial();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isMobileOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileOpen]);

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    setIsMobileOpen(false);
    if (menu === 'Pet Listings' || menu === 'Medical Logs') {
      fetchAllRegisteredPets();
    }
    if (menu === 'Inventory Control') {
      fetchInventory();
    }
  };

  return (
    <div className="h-dvh flex bg-slate-50 text-slate-800 font-sans antialiased relative overflow-hidden">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] z-30 md:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Staff Sidebar */}
      <aside
        aria-label="Staff navigation"
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
                <h2 className="text-sm font-bold tracking-tight truncate">Task Force Bruno</h2>
                <span className="text-[10px] text-[#D4AF37] font-semibold tracking-wider uppercase block mt-0.5 truncate">
                  MDC Staff Portal
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close staff menu"
              className="md:hidden p-1.5 text-stone-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3.5 space-y-1 overflow-y-auto flex-1">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-white/45 block px-3 pb-1.5">
              Clinic &amp; Operations
            </span>
            {STAFF_NAV_ITEMS.map(({ key, label, Icon }) => {
              const isActive = activeMenu === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleMenuChange(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    isActive
                      ? 'bg-white text-[#5C0612] shadow-sm font-semibold'
                      : 'text-stone-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#5C0612]' : 'text-[#D4AF37]/85'
                    }`}
                  />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}

            <div className="pt-3 border-t border-white/10 mt-3">
              <button
                type="button"
                onClick={() => {
                  setIsEmergencyOpen(true);
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-100 hover:text-white bg-rose-950/50 hover:bg-rose-900/70 border border-rose-400/30 transition-colors text-left"
              >
                <ShieldAlert className="w-4 h-4 text-rose-300 shrink-0" />
                <span>Bite Protocol (RA 9482)</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="border-t border-white/10 p-4 flex flex-col gap-3 shrink-0 bg-black/10">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-dvh overflow-hidden min-w-0 pb-16 md:pb-0">
        <header className="shrink-0 h-15 sm:h-16 md:h-auto bg-white border-b border-slate-200 flex items-center justify-between gap-3 px-3 sm:px-6 md:px-8 md:py-5 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open staff menu"
              className="md:hidden p-2 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            <img
              src="/logo.png"
              alt="Task Force Bruno"
              className="w-7 h-7 object-contain md:hidden shrink-0 select-none"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-xl font-bold tracking-tight text-slate-900 truncate">
                {currentNav.label}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 hidden md:block">
                Campus animal welfare, clinical records, and clinic operations portal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEmergencyOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold transition-colors"
              title="Bite Protocol & Rabies Guidelines (RA 9482)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="hidden sm:inline">Bite Protocol (RA 9482)</span>
              <span className="sm:hidden">RA 9482</span>
            </button>
            <div className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>MDC Staff</span>
            </div>
          </div>
        </header>

        <EmergencyProtocolModal
          isOpen={isEmergencyOpen}
          onClose={() => setIsEmergencyOpen(false)}
          onNavigateToReport={() => {
            setActiveMenu('Sighting Reports');
            setIsMobileOpen(false);
          }}
        />

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-7">
          <Suspense fallback={<StaffSpinner />}>
            {activeMenu === 'Community Newsfeed' && <NewsfeedView session={session} />}
            {activeMenu === 'Pending Applications' && (
              <PendingApplications onRefresh={fetchAllRegisteredPets} />
            )}
            {activeMenu === 'Pet Listings' && (
              <PetListings
                pets={pets}
                loadingPets={loadingPets}
                loadError={petsError}
                onRefresh={fetchAllRegisteredPets}
              />
            )}
            {activeMenu === 'Add New Pet' && <AddNewPet onRefresh={fetchAllRegisteredPets} />}
            {activeMenu === 'Medical Logs' && (
              <MedicalLogs pets={pets} onRefresh={fetchAllRegisteredPets} />
            )}
            {activeMenu === 'Inventory Control' && (
              <InventoryControl
                inventoryItems={inventoryItems}
                transactionLedger={transactionLedger}
                loadingInventory={loadingInventory}
                loadError={inventoryError}
                onRefresh={fetchInventory}
              />
            )}
            {activeMenu === 'Sighting Reports' && (
              <SightingTriage
                session={session}
                onAdmitStray={() => setActiveMenu('Add New Pet')}
              />
            )}
            {activeMenu === 'Broadcast Bulletin' && <PostAnnouncement session={session} />}
          </Suspense>
        </div>
      </main>

      {/* Staff Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile staff quick navigation"
        className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center justify-around h-16 px-1">
          {[
            { key: 'Pet Listings', label: 'Pets', Icon: PawPrint },
            { key: 'Pending Applications', label: 'Apps', Icon: ClipboardCheck },
            { key: 'Sighting Reports', label: 'Sightings', Icon: Siren },
            { key: 'Medical Logs', label: 'Medical', Icon: Stethoscope },
          ].map(({ key, label, Icon }) => {
            const isActive = activeMenu === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleMenuChange(key)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
                  isActive ? 'text-[#5C0612] font-bold' : 'text-slate-500 font-medium'
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
              ['Add New Pet', 'Inventory Control', 'Community Newsfeed', 'Broadcast Bulletin'].includes(
                activeMenu
              )
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
