export const CAMPUS_LOCATIONS = [
  'Wildcat Innovation Labs',
  'NGE Building 1st Floor',
  'GLE Building 1st Floor',
  'Espacio',
  'CIT-U Basketball Court',
  'CIT-U Canteen',
  'SAL Building',
  'CIT-U Gymnasium',
  'Elementary Building',
];

export const SIGHTING_CAMPUS_ZONES = [
  'CIT-U Main Building & Quadrangle',
  'GLE Building (Science & Technology)',
  'Engineering Complex & Canteen',
  'Main Library & Study Halls',
  'Gymnasium & Covered Courts',
  'Main Gate 1 (Natalio Bacalso Ave)',
  'Gate 2 (Back Gate)',
  'Elementary & High School Grounds',
  'Administration & Clinic Area',
  'Other Campus Location',
];

export const DEFAULT_PET_IMAGE = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba';

export function safeImageUrl(rawUrl, fallback = '') {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:') || trimmed.startsWith('/')) {
    return trimmed;
  }
  return fallback;
}

export function normalizeCampusLocation(locStr, fallbackKey = '') {
  if (!locStr) return CAMPUS_LOCATIONS[0];
  const s = String(locStr).toLowerCase().trim();

  if (s.includes('lab') || s.includes('wildcat') || s.includes('innovation')) return 'Wildcat Innovation Labs';
  if (s.includes('nge')) return 'NGE Building 1st Floor';
  if (s.includes('gle') || s.includes('science')) return 'GLE Building 1st Floor';
  if (s.includes('espacio')) return 'Espacio';
  if (s.includes('court') || s.includes('basketball')) return 'CIT-U Basketball Court';
  if (s.includes('canteen') || s.includes('cafeteria') || s.includes('eat') || s.includes('engineering')) return 'CIT-U Canteen';
  if (s.includes('sal')) return 'SAL Building';
  if (s.includes('gym') || s.includes('gymnasium')) return 'CIT-U Gymnasium';
  if (s.includes('elementary') || s.includes('high school')) return 'Elementary Building';

  if (CAMPUS_LOCATIONS.includes(locStr)) return locStr;
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
  return Boolean(
    pet.is_quarantined ||
      (pet.status || '').includes('Quarantine') ||
      (pet.current_conditions || '').includes('Observation') ||
      (pet.current_conditions || '').includes('Quarantine')
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
