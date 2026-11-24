export const CITU_CAMPUS_ZONES = [
  {
    id: 'NGE',
    shortLabel: 'NGE',
    name: 'NGE Building (Nicolas G. Escario)',
    description: 'Nicolas G. Escario Building — CCS, Innovation Labs & lower campus entrance.',
    x: 22,
    y: 66,
  },
  {
    id: 'ALLIED',
    shortLabel: 'ALLIED',
    name: 'ALLIED Building (Allied Engineering)',
    description: 'Allied Engineering Building — west wing workshops and rear corridor.',
    x: 15.5,
    y: 45,
  },
  {
    id: 'RTL',
    shortLabel: 'RTL',
    name: 'RTL Building (Don Rodolfo T. Lizares)',
    description: 'Don Rodolfo T. Lizares Building — central quadrangle & engineering courtyard.',
    x: 31.5,
    y: 44,
  },
  {
    id: 'LINK',
    shortLabel: 'LINK',
    name: 'LINK Building',
    description: 'Link Building — connecting bridge between RTL, canteen, and upper wings.',
    x: 41.5,
    y: 34.5,
  },
  {
    id: 'G-LECROOM',
    shortLabel: 'G-LECROOM',
    name: 'G-LECROOM (General Lecture Rooms)',
    description: 'General Lecture Rooms — mid-campus walkway and shaded benches.',
    x: 49.5,
    y: 38.5,
  },
  {
    id: 'G-PHYSLAB',
    shortLabel: 'G-PHYSLAB',
    name: 'G-PHYSLAB (General Physics Lab)',
    description: 'General Physics Lab — inner pathway between RTL and GLE.',
    x: 51,
    y: 46.5,
  },
  {
    id: 'SAL',
    shortLabel: 'SAL',
    name: 'SAL Building (Don Simplicio A. Lizares)',
    description: 'Don Simplicio A. Lizares Building — northern classrooms and study walkways.',
    x: 56,
    y: 25.5,
  },
  {
    id: 'PE_AREA',
    shortLabel: 'P.E AREA',
    name: 'P.E. Area / Covered Court',
    description: 'P.E. Area, Gymnasium & Covered Basketball Court.',
    x: 61.5,
    y: 34.5,
  },
  {
    id: 'LEARNING_PAD',
    shortLabel: 'Learning Pad',
    name: 'Learning Pad 1–10',
    description: 'Learning Pad 1–10 — open study pavilions and upper campus grounds.',
    x: 78.5,
    y: 26,
  },
  {
    id: 'GLE',
    shortLabel: 'GLE',
    name: 'GLE Building (Gregorio L. Escario)',
    description: 'Gregorio L. Escario Building — main facade, MDC Clinic & Admin complex.',
    x: 68,
    y: 56.5,
  },
  {
    id: 'ACAD',
    shortLabel: 'ACAD',
    name: 'ACAD Building (Academic Building)',
    description: 'Academic Building — east wing classrooms and shaded walkway.',
    x: 84.5,
    y: 55.5,
  },
  {
    id: 'MAIN_GATE',
    shortLabel: 'Main Gate',
    name: 'Main Gate & Campus Grounds',
    description: 'Natalio Bacalso Ave Main Gate, Security Post, Canteen & Feeding Stations.',
    x: 47,
    y: 66,
  },
];

export const CAMPUS_LOCATIONS = CITU_CAMPUS_ZONES.map((z) => z.name);
export const SIGHTING_CAMPUS_ZONES = CITU_CAMPUS_ZONES.map((z) => z.name);

export const DEFAULT_PET_IMAGE = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba';

export function safeImageUrl(rawUrl, fallback = '') {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:') || trimmed.startsWith('/')) {
    return trimmed;
  }
  return fallback;
}

export function matchZoneId(rawLocation) {
  const s = String(rawLocation || '').toLowerCase().trim();
  if (!s) return 'MAIN_GATE';

  if (s.includes('nge') || s.includes('nicolas') || s.includes('wildcat') || s.includes('innovation') || s.includes('espacio')) return 'NGE';
  if (s.includes('allied')) return 'ALLIED';
  if (s.includes('rtl') || s.includes('rodolfo') || s.includes('quadrangle') || s.includes('main building')) return 'RTL';
  if (s.includes('link')) return 'LINK';
  if (s.includes('lecroom') || s.includes('lecture')) return 'G-LECROOM';
  if (s.includes('physlab') || s.includes('physics')) return 'G-PHYSLAB';
  if (s.includes('sal') || s.includes('simplicio') || s.includes('library')) return 'SAL';
  if (s.includes('p.e') || s.includes('pe area') || s.includes('gym') || s.includes('court') || s.includes('basketball')) return 'PE_AREA';
  if (s.includes('learning pad') || s.includes('elementary') || s.includes('high school') || s.includes('gate 2') || s.includes('back gate')) return 'LEARNING_PAD';
  if (s.includes('gle') || s.includes('gregorio') || s.includes('clinic') || s.includes('mdc') || s.includes('admin') || s.includes('science')) return 'GLE';
  if (s.includes('acad') || s.includes('academic')) return 'ACAD';
  if (s.includes('gate') || s.includes('canteen') || s.includes('cafeteria') || s.includes('ground') || s.includes('engineering')) return 'MAIN_GATE';

  return 'MAIN_GATE';
}

export function normalizeCampusLocation(locStr, fallbackKey = '') {
  if (!locStr) return CAMPUS_LOCATIONS[0];
  if (CAMPUS_LOCATIONS.includes(locStr)) return locStr;

  const matchedId = matchZoneId(locStr);
  const found = CITU_CAMPUS_ZONES.find((z) => z.id === matchedId);
  if (found && String(locStr).trim()) return found.name;

  if (!fallbackKey) return CAMPUS_LOCATIONS[0];
  let hash = 0;
  const key = String(fallbackKey || locStr);
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CAMPUS_LOCATIONS[Math.abs(hash) % CAMPUS_LOCATIONS.length];
}

export function calculateSizeCategory(weightVal) {
  const num = parseFloat(weightVal);
  if (Number.isNaN(num) || num <= 0) return 'Small';
  if (num < 10) return 'Small';
  if (num <= 25) return 'Medium';
  return 'Large';
}

export function isCampusPet(typeOrStatus) {
  if (!typeOrStatus) return false;
  const str = String(typeOrStatus).toLowerCase();
  return str.includes('campus') || str.includes('resident') || str === 'not for adoption';
}

export function isStrayPet(petOrType) {
  if (!petOrType) return false;
  if (typeof petOrType === 'string') return petOrType.toLowerCase().includes('stray');
  return (
    (petOrType.pet_type || '').toLowerCase().includes('stray') ||
    (petOrType.adoption_status || '').toLowerCase() === 'stray' ||
    (petOrType.pet_id || '').toUpperCase().startsWith('STRAY-')
  );
}

export function getCanonicalClassification(pet) {
  if (!pet) return 'Campus Pet';
  if (isStrayPet(pet)) return 'Stray';
  if (isCampusPet(pet.pet_type) || isCampusPet(pet.adoption_status)) return 'Campus Pet';
  return 'Pet for Adoption';
}

export function isAdoptablePet(pet) {
  if (!pet) return false;
  const type = (pet.pet_type || '').toLowerCase();
  const status = (pet.adoption_status || '').toLowerCase();
  const isCampus = isCampusPet(type) || isCampusPet(status);
  const isAdopted = status === 'adopted';
  return (
    !isCampus &&
    !isAdopted &&
    (status === 'available' ||
      status === 'stray' ||
      type.includes('adoption') ||
      type.includes('stray') ||
      (pet.pet_id || '').toUpperCase().startsWith('STRAY-'))
  );
}

export function isPetQuarantined(pet) {
  if (!pet) return false;
  if (typeof pet.is_quarantined === 'boolean') {
    return pet.is_quarantined;
  }
  const conditions = String(pet.current_conditions || '');
  const conditionsLower = conditions.toLowerCase();
  if (conditionsLower.includes('cleared') || conditionsLower.includes('completed')) {
    return false;
  }
  return Boolean(
    (pet.status || '').includes('Quarantine') ||
      conditions.includes('Observation') ||
      conditions.includes('Quarantine')
  );
}

export function getVaccinationBadgeStyles(statusStr) {
  const s = (statusStr || '').toLowerCase();
  if (s.includes('fully')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (s.includes('core') || s.includes('partial')) return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-rose-50 text-rose-800 border-rose-200';
}

export function isUrgentSightingText(text) {
  const s = String(text || '');
  return s.includes('[URGENT EMERGENCY]') || s.includes('[🚨 URGENT EMERGENCY]');
}

export function stripUrgentPrefix(text) {
  return String(text || '')
    .replace('[🚨 URGENT EMERGENCY]', '')
    .replace('[URGENT EMERGENCY]', '')
    .trim();
}
