import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Download,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MoreHorizontal,
  Newspaper,
  Package,
  PawPrint,
  Pencil,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Stethoscope,
  X,
} from 'lucide-react';
import EmergencyProtocolModal from './EmergencyProtocolModal';
import ProfileSettingsModal from './ProfileSettingsModal';
import UserAvatar from './UserAvatar';
import PageBackdrop from './PageBackdrop';
import ThemeToggle from './ThemeToggle';
import { apiGet } from '../lib/api';
import { getUserDisplayName, getUserInitials } from '../lib/auth';
import { downloadCsv } from '../lib/csv';

const NewsfeedView = lazy(() => import('./NewsfeedView'));
const PendingApplications = lazy(() => import('./PendingApplications'));
const PetListings = lazy(() => import('./PetListings'));
const AddNewPet = lazy(() => import('./AddNewPet'));
const MedicalLogs = lazy(() => import('./MedicalLogs'));
const InventoryControl = lazy(() => import('./InventoryControl'));
const SightingTriage = lazy(() => import('./SightingTriage'));
const PostAnnouncement = lazy(() => import('./PostAnnouncement'));
const CampusMap = lazy(() => import('./CampusMap'));

const STAFF_NAV_ITEMS = [
  { key: 'Pet Listings', label: 'Pet Directory', Icon: PawPrint },
  { key: 'Campus Map', label: 'CIT-U Campus Map', Icon: MapPin },
  { key: 'Pending Applications', label: 'Applications', Icon: ClipboardCheck },
  { key: 'Sighting Reports', label: 'Sighting Reports', Icon: Siren },
  { key: 'Medical Logs', label: 'Medical & Vaccines', Icon: Stethoscope },
  { key: 'Add New Pet', label: 'Add New Pet', Icon: PlusCircle },
  { key: 'Inventory Control', label: 'Inventory Control', Icon: Package },
  { key: 'Community Newsfeed', label: 'Community Newsfeed', Icon: Newspaper },
  { key: 'Broadcast Bulletin', label: 'Broadcast Bulletin', Icon: Megaphone },
];

const VALID_MENUS = new Set(STAFF_NAV_ITEMS.map((i) => i.key));

const STAFF_BACKDROP_MAP = {
  'Pet Listings': 'pet-listings',
  'Campus Map': 'campus-map',
  'Pending Applications': 'applications',
  'Sighting Reports': 'sightings',
  'Medical Logs': 'medical',
  'Add New Pet': 'add-pet',
  'Inventory Control': 'inventory',
  'Community Newsfeed': 'newsfeed',
  'Broadcast Bulletin': 'broadcast',
};

function StaffSpinner() {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400">
      <div className="w-7 h-7 border-3 border-slate-200 border-t-[#5C0612] rounded-full animate-spin mb-2.5" />
      <span className="text-xs font-medium">Loading staff workspace...</span>
    </div>
  );
}

export default function StaffDashboard({ session, onLogout, onProfileUpdated }) {
  const [activeMenu, setActiveMenu] = useState(() => {
    const saved = localStorage.getItem('tfb_staff_tab');
    return saved && VALID_MENUS.has(saved) ? saved : 'Pet Listings';
  });

  const [pets, setPets] = useState([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loadingPets, setLoadingPets] = useState(false);
  const [petsError, setPetsError] = useState('');

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [showKpiStrip, setShowKpiStrip] = useState(true);
  const [exportingCsv, setExportingCsv] = useState('');

  const [inventoryItems, setInventoryItems] = useState([]);
  const [transactionLedger, setTransactionLedger] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState('');

  const [summary, setSummary] = useState(null);

  const displayName = getUserDisplayName(session, 'MDC Staff');
  const initials = getUserInitials(session, 'MS');
  const currentNav = STAFF_NAV_ITEMS.find((i) => i.key === activeMenu) || STAFF_NAV_ITEMS[0];

  useEffect(() => {
    localStorage.setItem('tfb_staff_tab', activeMenu);
  }, [activeMenu]);

  const fetchStaffSummary = useCallback(async (signal) => {
    const res = await apiGet('/staff/summary/', { signal });
    if (!signal?.aborted && res.ok && res.data) {
      setSummary(res.data);
    }
  }, []);

  const fetchAllRegisteredPets = useCallback(
    async (withArchived = includeArchived) => {
      setLoadingPets(true);
      setPetsError('');
      const query = withArchived ? '/pets/?include_archived=true' : '/pets/';
      const [res] = await Promise.all([apiGet(query), fetchStaffSummary()]);
      if (res.ok && Array.isArray(res.data)) {
        setPets(res.data);
      } else if (!res.aborted) {
        setPetsError(res.error || 'Unable to load pet records.');
      }
      setLoadingPets(false);
    },
    [includeArchived, fetchStaffSummary]
  );

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
    fetchStaffSummary();
  }, [fetchStaffSummary]);

  useEffect(() => {
    const controller = new AbortController();
    const loadInitial = async () => {
      setLoadingPets(true);
      setLoadingInventory(true);
      const [petsRes, invRes, ledRes, sumRes] = await Promise.all([
        apiGet('/pets/', { signal: controller.signal }),
        apiGet('/inventory/', { signal: controller.signal }),
        apiGet('/inventory/transactions/', { signal: controller.signal }),
        apiGet('/staff/summary/', { signal: controller.signal }),
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

      if (sumRes.ok && sumRes.data) {
        setSummary(sumRes.data);
      }

      setLoadingPets(false);
      setLoadingInventory(false);
    };
    loadInitial();

    // Poll live operational summary every 60 seconds for urgent sightings & queue alerts
    const intervalId = setInterval(() => {
      fetchStaffSummary();
    }, 60000);

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, [fetchStaffSummary]);

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
    fetchStaffSummary();
  };

  const handleToggleArchived = (nextVal) => {
    setIncludeArchived(nextVal);
    fetchAllRegisteredPets(nextVal);
  };

  const handleExportCsv = async (kind) => {
    if (exportingCsv) return;
    setExportingCsv(kind);
    const stamp = new Date().toISOString().slice(0, 10);
    try {
      if (kind === 'pets') {
        const res = await apiGet('/pets/?include_archived=true');
        const list = res.ok && Array.isArray(res.data) ? res.data : pets;
        downloadCsv(
          `tfb-pet-registry-${stamp}.csv`,
          [
            'Pet ID',
            'Name',
            'Species',
            'Type',
            'Breed',
            'Gender',
            'Age',
            'Vaccination Status',
            'Spayed/Neutered (TNR)',
            'Adoption Status',
            'Quarantined',
            'Campus Zone',
            'Archived At',
          ],
          list.map((p) => [
            p.pet_id,
            p.name,
            p.species,
            p.pet_type,
            p.breed || '',
            p.gender || '',
            p.age || '',
            p.vaccination_status || 'Not Vaccinated',
            p.spayed_neutered ? 'Yes' : 'No',
            p.adoption_status || '',
            p.is_quarantined ? `Yes (until ${p.quarantine_until || 'TBD'})` : 'No',
            p.found_near || '',
            p.archived_at || '',
          ])
        );
      } else if (kind === 'clinical') {
        const [medRes, vacRes] = await Promise.all([
          apiGet('/medical/all/'),
          apiGet('/vaccinations/all/'),
        ]);
        const meds = medRes.ok && Array.isArray(medRes.data) ? medRes.data : [];
        const vacs = vacRes.ok && Array.isArray(vacRes.data) ? vacRes.data : [];
        const rows = [
          ...meds.map((m) => [
            'Medical Record',
            m.record_id,
            m.pet_id,
            m.record_type,
            m.log_date,
            m.next_followup_date || '',
            m.medication_prescribed || '',
            m.veterinarian || '',
            m.notes || '',
          ]),
          ...vacs.map((v) => [
            'Vaccination',
            v.log_id,
            v.pet_id,
            v.vaccine_name,
            v.administered_date,
            v.next_due_date || '',
            v.batch_lot_number || '',
            v.administered_by || '',
            `Weight: ${v.weight_at_vaccination || 'N/A'}`,
          ]),
        ];
        downloadCsv(
          `tfb-ra9482-clinical-report-${stamp}.csv`,
          [
            'Entry Category',
            'Record ID',
            'Pet ID',
            'Type / Vaccine',
            'Date',
            'Next Follow-up / Due Date',
            'Medication / Batch',
            'Attending Clinician',
            'Clinical Notes',
          ],
          rows
        );
      } else if (kind === 'inventory') {
        const res = await apiGet('/inventory/transactions/');
        const txs = res.ok && Array.isArray(res.data) ? res.data : transactionLedger;
        downloadCsv(
          `tfb-inventory-audit-${stamp}.csv`,
          [
            'Transaction ID',
            'Item',
            'Unit',
            'Direction',
            'Quantity Changed',
            'Reason',
            'Supplier / Donor',
            'Logged By',
            'Timestamp',
          ],
          txs.map((t) => [
            t.transaction_id,
            t.inventory?.item_name || `Item #${t.item_id}`,
            t.inventory?.unit || '',
            t.transaction_type,
            t.quantity_changed,
            t.reason || '',
            t.supplier_donor || '',
            t.logged_by || 'MDC Staff',
            t.logged_at || '',
          ])
        );
      }
    } finally {
      setExportingCsv('');
    }
  };

  const getBadgeForMenu = (key) => {
    if (!summary) return null;
    if (key === 'Pending Applications' && summary.pending_applications_total > 0) {
      return { count: summary.pending_applications_total, urgent: false };
    }
    if (key === 'Sighting Reports') {
      if (summary.urgent_sightings > 0) {
        return { count: summary.urgent_sightings, urgent: true };
      }
      if (summary.pending_sightings > 0) {
        return { count: summary.pending_sightings, urgent: false };
      }
    }
    if (key === 'Medical Logs') {
      if (summary.active_quarantines > 0) {
        return { count: summary.active_quarantines, urgent: true };
      }
      if (summary.overdue_vaccines > 0) {
        return { count: summary.overdue_vaccines, urgent: false };
      }
    }
    if (key === 'Inventory Control' && summary.low_stock_items > 0) {
      return { count: summary.low_stock_items, urgent: true };
    }
    return null;
  };

  const vaxPct =
    summary && summary.total_active_pets > 0
      ? Math.round((summary.fully_vaccinated_pets / summary.total_active_pets) * 100)
      : 0;
  const tnrPct =
    summary && summary.total_active_pets > 0
      ? Math.round((summary.tnr_certified_pets / summary.total_active_pets) * 100)
      : 0;

  return (
    <div className="h-dvh flex bg-[#F3EFE9] dark:bg-[#0E0C14] text-slate-800 dark:text-slate-100 font-sans antialiased relative overflow-hidden">
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
              const badge = getBadgeForMenu(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleMenuChange(key)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    isActive
                      ? 'bg-white text-[#5C0612] dark:bg-[#D4AF37] dark:text-[#3B030B] shadow-sm font-semibold'
                      : 'text-stone-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#5C0612] dark:text-[#3B030B]' : 'text-[#D4AF37]/85'
                      }`}
                    />
                    <span className="truncate">{label}</span>
                  </span>

                  {badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums shrink-0 ${
                        badge.urgent
                          ? 'bg-rose-500 text-white animate-pulse'
                          : isActive
                          ? 'bg-[#5C0612] text-[#D4AF37]'
                          : 'bg-[#D4AF37] text-[#5C0612]'
                      }`}
                    >
                      {badge.count}
                    </span>
                  )}
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

        <div className="border-t border-white/10 p-4 flex flex-col gap-3 shrink-0 bg-black/15">
          <ThemeToggle variant="sidebar" />

          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(true);
              setIsMobileOpen(false);
            }}
            aria-label="Edit staff profile"
            title="Edit profile info and photo"
            className="w-full flex items-center gap-2.5 min-w-0 p-1.5 -m-1.5 rounded-xl hover:bg-white/10 transition-colors text-left group"
          >
            <UserAvatar
              src={session?.avatar_url}
              initials={initials}
              name={displayName}
              size="md"
              className="ring-1 ring-[#D4AF37]/50"
            />
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white leading-tight truncate">{displayName}</p>
              <span className="text-[11px] text-stone-300/80 block truncate mt-0.5">
                {session?.email || ''}
              </span>
            </div>
            <Pencil className="w-3.5 h-3.5 text-[#D4AF37]/80 group-hover:text-[#D4AF37] shrink-0" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(true);
                setIsMobileOpen(false);
              }}
              className="py-2 bg-white/10 hover:bg-white/20 text-[#D4AF37] hover:text-white rounded-xl text-xs font-semibold border border-[#D4AF37]/25 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5 shrink-0" />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="py-2 bg-white/10 hover:bg-rose-950/60 text-stone-200 hover:text-white rounded-xl text-xs font-medium border border-white/10 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-dvh overflow-hidden min-w-0 pb-16 md:pb-0">
        <header className="shrink-0 h-15 sm:h-16 md:h-auto bg-white border-b border-slate-200 flex items-center justify-between gap-3 px-3 sm:px-6 md:px-8 md:py-4 z-10">
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
            <ThemeToggle variant="compact" />

            <button
              type="button"
              onClick={() => setShowKpiStrip((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              title="Toggle MDC KPI Summary & CSV Exports"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#5C0612] shrink-0" />
              <span className="hidden sm:inline">KPIs &amp; CSV</span>
              {showKpiStrip ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={() => setIsEmergencyOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold transition-colors"
              title="Bite Protocol & Rabies Guidelines (RA 9482)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="hidden sm:inline">Bite Protocol</span>
              <span className="sm:hidden">RA 9482</span>
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              aria-label="Open staff profile settings"
              title="Edit Profile & Photo"
              className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 p-1 lg:pl-1.5 lg:pr-3 lg:py-1 rounded-xl border border-slate-200 text-slate-700 transition-colors"
            >
              <UserAvatar
                src={session?.avatar_url}
                initials={initials}
                name={displayName}
                size="sm"
                roundedClass="rounded-lg"
              />
              <ShieldCheck className="hidden lg:inline w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden lg:inline max-w-[120px] truncate">{displayName}</span>
              <Pencil className="hidden lg:inline w-3 h-3 text-slate-400 shrink-0" />
            </button>
          </div>
        </header>

        <ProfileSettingsModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          session={session}
          onProfileUpdated={onProfileUpdated}
        />

        <EmergencyProtocolModal
          isOpen={isEmergencyOpen}
          onClose={() => setIsEmergencyOpen(false)}
          onNavigateToReport={() => {
            setActiveMenu('Sighting Reports');
            setIsMobileOpen(false);
          }}
        />

        <div className="flex-1 relative min-h-0 bg-[#F3EFE9] dark:bg-[#0E0C14] overflow-hidden">
          <PageBackdrop variant={STAFF_BACKDROP_MAP[activeMenu] || 'pet-listings'} />
          <div className="relative z-10 h-full overflow-y-auto p-3 sm:p-5 md:p-7 space-y-5">
          {/* Collapsible Live MDC Operations KPI & RA 9482 Export Strip */}
          {showKpiStrip && summary && (
            <section className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-left">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Active Pets</span>
                  <span className="text-lg font-black text-slate-900 tabular-nums">
                    {summary.total_active_pets}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block">Anti-Rabies</span>
                  <span className="text-lg font-black text-emerald-900 tabular-nums">{vaxPct}%</span>
                  <span className="text-[10px] text-emerald-700 ml-1">({summary.fully_vaccinated_pets})</span>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/70">
                  <span className="text-[10px] font-bold uppercase text-indigo-700 block">TNR Rate</span>
                  <span className="text-lg font-black text-indigo-900 tabular-nums">{tnrPct}%</span>
                  <span className="text-[10px] text-indigo-700 ml-1">({summary.tnr_certified_pets})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleMenuChange('Medical Logs')}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    summary.active_quarantines > 0
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase text-rose-700 block">Quarantine</span>
                  <span className="text-lg font-black text-rose-900 tabular-nums">
                    {summary.active_quarantines}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuChange('Pending Applications')}
                  className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-left hover:bg-amber-100/60 transition-colors"
                >
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">Pending Queue</span>
                  <span className="text-lg font-black text-amber-950 tabular-nums">
                    {summary.pending_applications_total}
                  </span>
                  <span className="text-[10px] text-amber-800 ml-1">
                    ({summary.pending_adoptions}A/{summary.pending_volunteers}V)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuChange('Sighting Reports')}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    summary.urgent_sightings > 0
                      ? 'bg-rose-600 text-white border-rose-700'
                      : 'bg-slate-50 border-slate-200/70 text-slate-900'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase block ${
                      summary.urgent_sightings > 0 ? 'text-rose-100' : 'text-slate-500'
                    }`}
                  >
                    Urgent Sightings
                  </span>
                  <span className="text-lg font-black tabular-nums">{summary.urgent_sightings}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500">
                  RA 9482 &amp; Operations CSV Exports:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={Boolean(exportingCsv)}
                    onClick={() => handleExportCsv('pets')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3 h-3 text-[#5C0612]" />
                    <span>{exportingCsv === 'pets' ? 'Exporting...' : 'Pet Registry CSV'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(exportingCsv)}
                    onClick={() => handleExportCsv('clinical')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3 h-3 text-[#5C0612]" />
                    <span>{exportingCsv === 'clinical' ? 'Exporting...' : 'RA 9482 Clinical CSV'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(exportingCsv)}
                    onClick={() => handleExportCsv('inventory')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3 h-3 text-[#5C0612]" />
                    <span>{exportingCsv === 'inventory' ? 'Exporting...' : 'Inventory Ledger CSV'}</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          <Suspense fallback={<StaffSpinner />}>
            {activeMenu === 'Community Newsfeed' && <NewsfeedView session={session} />}
            {activeMenu === 'Campus Map' && (
              <CampusMap
                mode="explorer"
                onInspectPet={() => setActiveMenu('Pet Listings')}
              />
            )}
            {activeMenu === 'Pending Applications' && (
              <PendingApplications onRefresh={fetchAllRegisteredPets} />
            )}
            {activeMenu === 'Pet Listings' && (
              <PetListings
                pets={pets}
                loadingPets={loadingPets}
                loadError={petsError}
                onRefresh={() => fetchAllRegisteredPets(includeArchived)}
                includeArchived={includeArchived}
                onToggleArchived={handleToggleArchived}
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
                onSummaryRefresh={fetchStaffSummary}
              />
            )}
            {activeMenu === 'Broadcast Bulletin' && <PostAnnouncement session={session} />}
          </Suspense>
          </div>
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
            const badge = getBadgeForMenu(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleMenuChange(key)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
                  isActive ? 'text-[#5C0612] font-bold' : 'text-slate-500 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {badge && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                        badge.urgent ? 'bg-rose-600 text-white' : 'bg-[#D4AF37] text-[#5C0612]'
                      }`}
                    >
                      {badge.count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">{label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
              ['Campus Map', 'Add New Pet', 'Inventory Control', 'Community Newsfeed', 'Broadcast Bulletin'].includes(
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
