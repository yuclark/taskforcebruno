import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Building2,
  MapPin,
  PawPrint,
  RotateCw,
  ShieldCheck,
  Siren,
  Sparkles,
} from 'lucide-react';
import { apiGet } from '../lib/api';
import {
  CITU_CAMPUS_ZONES,
  DEFAULT_PET_IMAGE,
  isPetQuarantined,
  isUrgentSightingText,
  matchZoneId,
  safeImageUrl,
  stripUrgentPrefix,
} from '../lib/pets';

/**
 * Interactive Isometric CIT-U Campus Locator Map
 * Modeled faithfully on the official CIT-U Campus Locator layout:
 * NGE, ALLIED, RTL, LINK, G-LECROOM, G-PHYSLAB, SAL, P.E AREA, Learning Pad 1–10, GLE, ACAD & Main Gate.
 *
 * Props:
 * - mode: 'picker' | 'explorer'
 * - selectedZoneName: string (for picker mode, matches zone.name)
 * - onSelectZone: (zoneObj) => void (called when user picks a building)
 * - onReportAtZone: (zoneName) => void (optional CTA in explorer mode)
 * - onInspectPet: (petId) => void (optional CTA in explorer mode)
 */
export default function CampusMap({
  mode = 'explorer',
  selectedZoneName = '',
  onSelectZone,
  onReportAtZone,
  onInspectPet,
}) {
  const [pets, setPets] = useState([]);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(mode === 'explorer');
  const [loadError, setLoadError] = useState('');
  const [layerFilter, setLayerFilter] = useState('all'); // 'all' | 'pets' | 'sightings' | 'urgent'
  const [activeZoneId, setActiveZoneId] = useState(() =>
    selectedZoneName ? matchZoneId(selectedZoneName) : 'GLE'
  );

  const effectiveZoneId =
    mode === 'picker' && selectedZoneName ? matchZoneId(selectedZoneName) : activeZoneId;

  const fetchMapData = async (signal) => {
    setLoading(true);
    setLoadError('');
    const [petsRes, feedRes] = await Promise.all([
      apiGet('/pets/', { signal }),
      apiGet('/newsfeed/', { signal }),
    ]);
    if (signal?.aborted) return;

    if (petsRes.ok && Array.isArray(petsRes.data)) {
      setPets(petsRes.data);
    } else if (!petsRes.aborted) {
      setLoadError(petsRes.error || 'Unable to load campus pet locations.');
    }

    if (feedRes.ok && Array.isArray(feedRes.data)) {
      const feedSightings = feedRes.data.filter((item) => item.item_type === 'sighting');
      setSightings(feedSightings);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (mode !== 'explorer') return undefined;
    const controller = new AbortController();
    const load = async () => {
      const [petsRes, feedRes] = await Promise.all([
        apiGet('/pets/', { signal: controller.signal }),
        apiGet('/newsfeed/', { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;

      if (petsRes.ok && Array.isArray(petsRes.data)) {
        setPets(petsRes.data);
      } else {
        setLoadError(petsRes.error || 'Unable to load campus pet locations.');
      }

      if (feedRes.ok && Array.isArray(feedRes.data)) {
        setSightings(feedRes.data.filter((item) => item.item_type === 'sighting'));
      }
      setLoading(false);
    };
    load();
    return () => controller.abort();
  }, [mode]);

  const zoneBuckets = useMemo(() => {
    const map = {};
    CITU_CAMPUS_ZONES.forEach((z) => {
      map[z.id] = { pets: [], sightings: [], urgentCount: 0 };
    });

    pets.forEach((pet) => {
      if ((pet.adoption_status || '').toLowerCase() === 'adopted') return;
      const zId = matchZoneId(pet.found_near || pet.feeding_area || '');
      if (map[zId]) map[zId].pets.push(pet);
    });

    sightings.forEach((s) => {
      const zId = matchZoneId(s.campus_zone || s.meta_details || s.location_details || '');
      const isUrgent = Boolean(s.is_urgent || isUrgentSightingText(s.body || s.badge_text));
      if (map[zId]) {
        map[zId].sightings.push({ ...s, isUrgent });
        if (isUrgent) map[zId].urgentCount += 1;
      }
    });

    return map;
  }, [pets, sightings]);

  const activeZone =
    CITU_CAMPUS_ZONES.find((z) => z.id === effectiveZoneId) || CITU_CAMPUS_ZONES[0];
  const activeBucket = zoneBuckets[activeZone.id] || { pets: [], sightings: [], urgentCount: 0 };

  const handleZoneClick = (zone) => {
    setActiveZoneId(zone.id);
    if (onSelectZone) onSelectZone(zone);
  };

  const totalActivePets = useMemo(
    () => Object.values(zoneBuckets).reduce((acc, b) => acc + b.pets.length, 0),
    [zoneBuckets]
  );
  const totalActiveSightings = useMemo(
    () => Object.values(zoneBuckets).reduce((acc, b) => acc + b.sightings.length, 0),
    [zoneBuckets]
  );
  const totalUrgent = useMemo(
    () => Object.values(zoneBuckets).reduce((acc, b) => acc + b.urgentCount, 0),
    [zoneBuckets]
  );

  const isCompact = mode === 'picker';

  return (
    <div className={isCompact ? 'space-y-3' : 'w-full max-w-7xl mx-auto space-y-5 pb-8 animate-fade-in'}>
      {/* Explorer Header */}
      {!isCompact && (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-[#5C0612]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C0612]">
                CIT-U Interactive Campus Locator
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Campus Animal &amp; Sighting Map
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Tap any CIT-U building to see resident companions, verified sightings, and active emergency rescue alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              <PawPrint className="w-3.5 h-3.5 text-[#5C0612]" />
              <span>{totalActivePets} Pets</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{totalActiveSightings} Sightings</span>
            </div>
            {totalUrgent > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                <Siren className="w-3.5 h-3.5 text-rose-600" />
                <span>{totalUrgent} Urgent</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fetchMapData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      {loadError && !isCompact && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center justify-between gap-2">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => fetchMapData()}
            className="px-3 py-1 bg-white border border-rose-200 rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      <div className={isCompact ? 'space-y-2.5' : 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'}>
        {/* Interactive Isometric Map Canvas */}
        <div
          className={`${
            isCompact ? 'w-full' : 'lg:col-span-8'
          } bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs`}
        >
          {/* Map Top Toolbar */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#5C0612] to-[#7D0C1B] text-white flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span className="text-xs font-bold tracking-tight truncate">
                {isCompact
                  ? `Tap a CIT-U Building: ${activeZone.shortLabel}`
                  : 'Cebu Institute of Technology – University'}
              </span>
            </div>

            {!isCompact ? (
              <div className="flex items-center gap-1 bg-black/25 p-1 rounded-xl text-[11px]">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'pets', label: 'Pets' },
                  { key: 'sightings', label: 'Sightings' },
                  { key: 'urgent', label: 'Urgent' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setLayerFilter(f.key)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      layerFilter === f.key
                        ? 'bg-[#D4AF37] text-[#5C0612]'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                Official Campus Layout
              </span>
            )}
          </div>

          {/* Interactive SVG + Pin Overlay */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9.5] bg-gradient-to-br from-[#FBF8F3] via-[#F4EFE6] to-[#EAE2D6] select-none overflow-hidden">
            {/* Architectural Isometric SVG faithfully matching CIT-U Campus Locator */}
            <svg
              viewBox="0 0 1000 600"
              className="w-full h-full block"
              role="img"
              aria-label="CIT-U Interactive Campus Locator Map"
            >
              <defs>
                <linearGradient id="campusGround" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FAF6F0" />
                  <stop offset="100%" stopColor="#EDE4D7" />
                </linearGradient>
                <linearGradient id="maroonRoof" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7C0B1B" />
                  <stop offset="100%" stopColor="#4A040E" />
                </linearGradient>
                <filter id="bldgShadow" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1E293B" floodOpacity="0.16" />
                </filter>
              </defs>

              {/* Soft Campus Terrain & Road */}
              <rect width="1000" height="600" fill="url(#campusGround)" />

              {/* Subtle grid lines for architectural polish */}
              <g stroke="#D6CBB8" strokeWidth="1" opacity="0.35">
                <line x1="0" y1="150" x2="1000" y2="150" />
                <line x1="0" y1="300" x2="1000" y2="300" />
                <line x1="0" y1="450" x2="1000" y2="450" />
                <line x1="250" y1="0" x2="250" y2="600" />
                <line x1="500" y1="0" x2="500" y2="600" />
                <line x1="750" y1="0" x2="750" y2="600" />
              </g>

              {/* Main Campus Slab / Courtyard Baseplate */}
              <polygon
                points="115,275 590,115 895,255 830,365 565,455 345,515 110,365"
                fill="#E2DCD2"
                stroke="#C9BFAF"
                strokeWidth="3"
              />
              {/* Open Central Quadrangle & PE Plaza */}
              <polygon
                points="425,225 635,160 805,245 645,325 460,290"
                fill="#EFEAE0"
                stroke="#D4C9B8"
                strokeWidth="2"
              />

              {/* Natalio Bacalso Ave (Front Green Lawn Strip & Road) */}
              <polygon
                points="325,525 535,380 565,398 355,545"
                fill="#2E7D32"
                opacity="0.72"
              />
              <polygon
                points="280,565 570,395 605,418 330,590"
                fill="#CBD5E1"
                opacity="0.55"
              />

              {/* 1. ALLIED Engineering Building (mid-left rear wing) */}
              <g filter="url(#bldgShadow)">
                <polygon points="105,270 185,235 220,260 140,296" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
                <polygon points="105,270 140,296 140,322 105,296" fill="#CBD5E1" />
                <polygon points="140,296 220,260 220,286 140,322" fill="#E2E8F0" />
                <polygon points="111,270 184,239 213,259 140,291" fill="url(#maroonRoof)" opacity="0.88" />
              </g>

              {/* 2. RTL Building (Don Rodolfo T. Lizares - Large Quadrangle Rectangle) */}
              <g filter="url(#bldgShadow)">
                {/* Outer wall */}
                <polygon points="175,260 320,202 515,305 370,382" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
                {/* Front extruded facades */}
                <polygon points="175,260 370,382 370,425 175,300" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
                <polygon points="370,382 515,305 515,348 370,425" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                {/* Maroon perimeter roof frame */}
                <polygon points="184,261 320,208 505,305 370,376" fill="none" stroke="url(#maroonRoof)" strokeWidth="10" />
                {/* Inner open courtyard */}
                <polygon points="240,266 324,232 442,296 358,338" fill="#E8E3D9" stroke="#94A3B8" strokeWidth="1.5" />
              </g>

              {/* 3. NGE Building (Nicolas G. Escario - Bottom-Left) */}
              <g filter="url(#bldgShadow)">
                <polygon points="88,435 288,342 355,392 355,442 195,525 88,468" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
                <polygon points="88,435 288,342 355,392 162,486" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
                <polygon points="162,486 355,392 355,442 162,535" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                {/* Maroon roof border */}
                <polygon points="98,434 287,348 346,392 162,479" fill="none" stroke="url(#maroonRoof)" strokeWidth="9" />
                {/* Center atrium slot */}
                <polygon points="175,428 265,386 290,405 200,448" fill="#64748B" opacity="0.35" />
              </g>

              {/* 4. LINK Building (Connecting bridge between RTL & SAL) */}
              <g filter="url(#bldgShadow)">
                <polygon points="348,200 465,160 495,180 378,220" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
                <polygon points="378,220 495,180 495,212 378,252" fill="#CBD5E1" />
                <polygon points="354,200 464,163 488,179 378,216" fill="url(#maroonRoof)" opacity="0.85" />
              </g>

              {/* 5. SAL Building (Don Simplicio A. Lizares - Top Center Long Wing) */}
              <g filter="url(#bldgShadow)">
                <polygon points="468,158 625,112 655,130 498,178" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
                <polygon points="498,178 655,130 655,162 498,210" fill="#CBD5E1" />
                <polygon points="476,158 622,116 646,130 500,172" fill="#64748B" opacity="0.35" />
              </g>

              {/* 6. G-LECROOM & G-PHYSLAB (Inner Courtyard Buildings) */}
              <g filter="url(#bldgShadow)">
                {/* G-LECROOM */}
                <polygon points="448,218 525,195 548,212 472,238" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
                <polygon points="472,238 548,212 548,232 472,258" fill="#CBD5E1" />
                {/* G-PHYSLAB */}
                <polygon points="468,262 540,242 560,258 488,280" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
                <polygon points="488,280 560,258 560,278 488,300" fill="#CBD5E1" />
              </g>

              {/* 7. P.E AREA (Covered Court with Iconic Maroon Roof) */}
              <g filter="url(#bldgShadow)">
                <polygon points="562,188 648,162 692,190 606,218" fill="url(#maroonRoof)" stroke="#D4AF37" strokeWidth="2" />
                <polygon points="562,188 606,218 606,232 562,202" fill="#94A3B8" opacity="0.6" />
                <polygon points="606,218 692,190 692,204 606,232" fill="#CBD5E1" opacity="0.7" />
              </g>

              {/* 8. Learning Pad 1-10 (Top-Right Pavilion) */}
              <g filter="url(#bldgShadow)">
                <polygon points="738,142 820,122 855,142 772,165" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
                <polygon points="772,165 855,142 855,164 772,187" fill="#CBD5E1" />
                <polygon points="746,143 818,126 845,142 773,160" fill="#D4AF37" opacity="0.7" />
                {/* Upper East Classroom Strip */}
                <polygon points="668,142 775,204 755,218 648,155" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
              </g>

              {/* 9. ACAD Building (Academic Building - Far Right Angled Wing) */}
              <g filter="url(#bldgShadow)">
                <polygon points="762,285 812,268 925,355 872,382" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.8" />
                <polygon points="762,285 872,382 872,430 762,332" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
                <polygon points="872,382 925,355 925,402 872,430" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                {/* Window bands */}
                <line x1="775" y1="308" x2="862" y2="386" stroke="#64748B" strokeWidth="2" opacity="0.45" />
                <line x1="775" y1="322" x2="862" y2="400" stroke="#64748B" strokeWidth="2" opacity="0.45" />
              </g>

              {/* 10. GLE Building (Gregorio L. Escario - Iconic Front-Right Tower with CIT Sign) */}
              <g filter="url(#bldgShadow)">
                {/* Roof */}
                <polygon points="545,302 740,224 785,254 590,335" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
                <polygon points="556,302 738,230 774,254 592,328" fill="none" stroke="url(#maroonRoof)" strokeWidth="6" />
                {/* Maroon CIT front-left face */}
                <polygon points="545,302 590,335 590,432 545,398" fill="url(#maroonRoof)" stroke="#4A040E" strokeWidth="1.2" />
                <text
                  x="568"
                  y="366"
                  textAnchor="middle"
                  fill="#D4AF37"
                  fontSize="13"
                  fontWeight="900"
                  fontFamily="sans-serif"
                  letterSpacing="1"
                >
                  CIT
                </text>
                {/* Wide windowed facade */}
                <polygon points="590,335 785,254 785,352 590,432" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
                {/* Floor window lines */}
                {[0, 1, 2, 3, 4].map((floor) => {
                  const dy = floor * 16;
                  return (
                    <line
                      key={floor}
                      x1="600"
                      y1={345 + dy}
                      x2="775"
                      y2={272 + dy}
                      stroke="#475569"
                      strokeWidth="3"
                      strokeDasharray="10 6"
                      opacity="0.45"
                    />
                  );
                })}
              </g>

              {/* Compass / Road Label */}
              <text
                x="470"
                y="565"
                textAnchor="middle"
                fill="#64748B"
                fontSize="12"
                fontWeight="700"
                letterSpacing="2"
                fontFamily="sans-serif"
              >
                NATALIO BACALSO AVE &bull; CIT-U MAIN ENTRANCE
              </text>
            </svg>

            {/* Interactive Clickable Building Pins */}
            {CITU_CAMPUS_ZONES.map((zone) => {
              const bucket = zoneBuckets[zone.id] || { pets: [], sightings: [], urgentCount: 0 };
              const isSelected = activeZone.id === zone.id;
              const petCount = bucket.pets.length;
              const sightingCount = bucket.sightings.length;
              const urgentCount = bucket.urgentCount;

              let badgeCount = 0;
              if (!isCompact) {
                if (layerFilter === 'pets') badgeCount = petCount;
                else if (layerFilter === 'sightings') badgeCount = sightingCount;
                else if (layerFilter === 'urgent') badgeCount = urgentCount;
                else badgeCount = petCount + sightingCount;
              }

              const dimmed =
                !isCompact &&
                layerFilter !== 'all' &&
                badgeCount === 0 &&
                !isSelected;

              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => handleZoneClick(zone)}
                  style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                  title={zone.name}
                  aria-label={`Select ${zone.name}`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-all duration-150 ${
                    isSelected ? 'z-30 scale-110' : urgentCount > 0 ? 'z-20' : 'z-10 hover:z-25 hover:scale-105'
                  } ${dimmed ? 'opacity-40' : 'opacity-100'}`}
                >
                  {/* Urgent pulse ring */}
                  {!isCompact && urgentCount > 0 && (
                    <span className="absolute -inset-2 rounded-full bg-rose-500/35 animate-ping pointer-events-none" />
                  )}

                  {/* Selected halo */}
                  {isSelected && (
                    <span className="absolute -inset-1.5 rounded-full bg-[#D4AF37]/40 ring-2 ring-[#D4AF37] pointer-events-none" />
                  )}

                  <div className="flex flex-col items-center">
                    <div
                      className={`relative flex items-center justify-center rounded-full shadow-md border-2 transition-colors ${
                        isSelected
                          ? 'w-7 h-7 sm:w-8 sm:h-8 bg-[#5C0612] border-[#D4AF37] text-[#D4AF37]'
                          : !isCompact && urgentCount > 0
                          ? 'w-6 h-6 sm:w-7 sm:h-7 bg-rose-600 border-white text-white'
                          : 'w-5 h-5 sm:w-6 sm:h-6 bg-[#D4AF37] border-[#5C0612] text-[#5C0612]'
                      }`}
                    >
                      {!isCompact && urgentCount > 0 ? (
                        <Siren className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-black leading-none">
                          {!isCompact && badgeCount > 0 ? badgeCount : ''}
                        </span>
                      )}
                      {(isCompact || badgeCount === 0) && (!urgentCount || isCompact) && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? 'bg-[#D4AF37]' : 'bg-[#5C0612]'
                          }`}
                        />
                      )}
                    </div>

                    <span
                      className={`mt-0.5 px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-extrabold tracking-tight whitespace-nowrap shadow-xs border ${
                        isSelected
                          ? 'bg-[#5C0612] text-white border-[#D4AF37]'
                          : 'bg-white/95 text-slate-900 border-slate-300/80 group-hover:border-[#5C0612]'
                      }`}
                    >
                      {zone.shortLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mobile-Friendly Quick Building Chip Selector */}
          <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CITU_CAMPUS_ZONES.map((zone) => {
              const bucket = zoneBuckets[zone.id];
              const isSelected = activeZone.id === zone.id;
              const count = isCompact ? 0 : (bucket?.pets.length || 0) + (bucket?.sightings.length || 0);
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => handleZoneClick(zone)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors whitespace-nowrap inline-flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-[#5C0612] text-white border-[#5C0612] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#5C0612]/40'
                  }`}
                >
                  <span>{zone.shortLabel}</span>
                  {!isCompact && count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                        bucket?.urgentCount > 0
                          ? 'bg-rose-500 text-white'
                          : isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explorer Mode: Selected Building Activity Panel */}
        {!isCompact && (
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 text-left lg:sticky lg:top-4">
            <div className="border-b border-slate-100 pb-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#5C0612] text-[#D4AF37] font-mono text-[10px] font-bold uppercase tracking-wider">
                  {activeZone.shortLabel}
                </span>
                {activeBucket.urgentCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                    <Siren className="w-3 h-3" />
                    {activeBucket.urgentCount} Urgent Alert
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug pt-0.5">
                {activeZone.name}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">{activeZone.description}</p>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading building activity...</div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {/* Resident / Campus Pets in this Building */}
                {(layerFilter === 'all' || layerFilter === 'pets') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Registered Pets Here ({activeBucket.pets.length})
                      </span>
                    </div>

                    {activeBucket.pets.length === 0 ? (
                      <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        No registered pets currently pinned to {activeZone.shortLabel}.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activeBucket.pets.map((pet) => {
                          const quarantined = isPetQuarantined(pet);
                          const img = safeImageUrl(pet.primary_image, DEFAULT_PET_IMAGE);
                          return (
                            <div
                              key={pet.pet_id}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 hover:border-[#5C0612]/40 transition-colors"
                            >
                              <img
                                src={img}
                                alt={pet.name}
                                className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 bg-white"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-xs truncate">
                                    {pet.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                    {pet.pet_id}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-slate-500">
                                    {pet.species} &bull; {pet.adoption_status || 'Campus Pet'}
                                  </span>
                                  {quarantined ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                      Quarantine
                                    </span>
                                  ) : (pet.vaccination_status || '').toLowerCase().includes('fully') ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                      <ShieldCheck className="w-2.5 h-2.5" />
                                      Vaccinated
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              {onInspectPet && (
                                <button
                                  type="button"
                                  onClick={() => onInspectPet(pet.pet_id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#5C0612] hover:text-white border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors shrink-0"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Sightings in this Building */}
                {(layerFilter === 'all' || layerFilter === 'sightings' || layerFilter === 'urgent') && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Active Sightings ({activeBucket.sightings.length})
                    </span>

                    {activeBucket.sightings.length === 0 ? (
                      <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        No active sighting alerts reported at {activeZone.shortLabel}.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activeBucket.sightings
                          .filter((s) => layerFilter !== 'urgent' || s.isUrgent)
                          .map((s) => (
                            <div
                              key={s.feed_id || s.sighting_id}
                              className={`p-3 rounded-xl border text-xs space-y-1 ${
                                s.isUrgent
                                  ? 'bg-rose-50 border-rose-200'
                                  : 'bg-amber-50/50 border-amber-200/70'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900">{s.title}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    s.isUrgent
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  {s.isUrgent ? 'Urgent' : s.badge_text || 'Sighting'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 leading-snug">
                                {stripUrgentPrefix(s.body || '')}
                              </p>
                              {s.meta_details && (
                                <p className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5">
                                  <MapPin className="w-3 h-3 text-[#5C0612] shrink-0" />
                                  <span className="truncate">{s.meta_details}</span>
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {onReportAtZone && (
              <button
                type="button"
                onClick={() => onReportAtZone(activeZone.name)}
                className="w-full py-2.5 bg-[#5C0612] hover:bg-[#42040B] text-white font-bold rounded-xl text-xs border-b-2 border-[#D4AF37] transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Report a Sighting at {activeZone.shortLabel}</span>
              </button>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
