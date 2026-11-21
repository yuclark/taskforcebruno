export const STAFF_ROLES = new Set([
  'staff',
  'mdc',
  'mdc_staff',
  'admin',
  'clinician',
  'nurse',
  'veterinarian',
]);

export const SESSION_STORAGE_KEY = 'tfb_session';
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export const ID_PATTERN = /^\d{2}-\d{4}-\d{3}$/;
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@cit\.edu$/;
export const PHONE_PATTERN = /^(09\d{9}|\+639\d{9}|\d{7,12})$/;

export function isStaffSession(session) {
  if (!session) return false;
  if (session.is_staff === true) return true;
  if (session.is_staff === false) return false;

  const role = (session.role || '').trim().toLowerCase();
  if (role === 'student' || role === 'user' || role.includes('student')) {
    return false;
  }
  return STAFF_ROLES.has(role);
}

export function getUserDisplayName(session, fallback = 'Campus Member') {
  if (!session) return fallback;
  const full = (session.full_name || '').trim();
  if (full) return full;

  const combined = `${session.first_name || ''} ${session.last_name || ''}`.trim();
  if (combined) return combined;

  const email = (session.email || '').trim().toLowerCase();
  if (email) {
    try {
      const saved = JSON.parse(localStorage.getItem(`tfb_user_profile_${email}`) || '{}');
      if (saved.full_name) return saved.full_name;
      if (saved.first_name) return `${saved.first_name} ${saved.last_name || ''}`.trim();
    } catch {
      // Ignore malformed profile storage
    }
    const localPart = email.split('@')[0];
    const formatted = localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    if (formatted) return formatted;
  }

  return fallback;
}

export function getUserInitials(session, fallback = 'TF') {
  const name = getUserDisplayName(session, '');
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  const email = (session?.email || '').trim();
  if (email.length >= 2) return email.slice(0, 2).toUpperCase();
  return fallback;
}

export function formatStudentIdInput(rawValue) {
  const digits = String(rawValue || '').replace(/\D/g, '').slice(0, 9);
  let formatted = '';
  if (digits.length > 0) formatted += digits.slice(0, 2);
  if (digits.length > 2) formatted += '-' + digits.slice(2, 6);
  if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
  return formatted;
}

export function loadStoredSession() {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (!parsed?.access_token || !parsed?.email) {
      clearStoredSession();
      return null;
    }

    const lastActive = parsed.lastActiveAt || parsed.createdAt;
    if (lastActive && Date.now() - lastActive > INACTIVITY_TIMEOUT_MS) {
      clearStoredSession();
      return null;
    }

    const refreshed = {
      ...parsed,
      lastActiveAt: Date.now(),
      email: (parsed.email || '').trim().toLowerCase(),
      role: (parsed.role || 'user').trim().toLowerCase(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(refreshed));
    return refreshed;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function saveStoredSession(sessionData) {
  const now = Date.now();
  const normalized = {
    ...sessionData,
    email: (sessionData?.email || '').trim().toLowerCase(),
    role: (sessionData?.role || 'user').trim().toLowerCase(),
    createdAt: sessionData?.createdAt || now,
    lastActiveAt: now,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem('tfb_staff_tab');
  localStorage.removeItem('tfb_user_tab');
}
