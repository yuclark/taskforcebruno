function resolveApiBaseUrl(rawUrl) {
  const cleaned = String(rawUrl || 'https://taskforcebruno.onrender.com/api')
    .trim()
    .replace(/\/+$/, '');
  if (!cleaned) return 'https://taskforcebruno.onrender.com/api';
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const PUBLIC_APP_URL = (
  import.meta.env.VITE_PUBLIC_APP_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://taskforcebruno.vercel.app')
).replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 45000;

export const UNAUTHORIZED_EVENT = 'tfb:unauthorized';
export const SESSION_REFRESHED_EVENT = 'tfb:session-refreshed';

let activeRefreshPromise = null;

function getStoredSessionObj() {
  try {
    const raw = localStorage.getItem('tfb_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getStoredAccessToken() {
  const parsed = getStoredSessionObj();
  return typeof parsed?.access_token === 'string' ? parsed.access_token.trim() : '';
}

async function tryRefreshSessionToken() {
  if (activeRefreshPromise) return activeRefreshPromise;

  const current = getStoredSessionObj();
  const refreshToken = typeof current?.refresh_token === 'string' ? current.refresh_token.trim() : '';
  if (!refreshToken) return null;

  activeRefreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data?.session?.access_token) return null;

      const updated = {
        ...current,
        ...data.session,
        lastActiveAt: Date.now(),
      };
      localStorage.setItem('tfb_session', JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SESSION_REFRESHED_EVENT, { detail: updated }));
      }
      return updated.access_token;
    } catch {
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export function extractErrorMessage(data, fallback = 'Request failed. Please try again.', statusCode = 0) {
  if (data && typeof data === 'object') {
    if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail.trim();

    for (const val of Object.values(data)) {
      if (Array.isArray(val) && typeof val[0] === 'string' && val[0].trim()) {
        return val[0].trim();
      }
      if (typeof val === 'string' && val.trim()) {
        return val.trim();
      }
    }
  }

  if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
    return 'The server is temporarily restarting or waking up. Please try again in a few seconds.';
  }
  if (statusCode === 429) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (statusCode >= 500) {
    return 'An unexpected server error occurred. Please try again shortly.';
  }
  return fallback;
}

/**
 * Centralized fetch wrapper with automatic Bearer token injection,
 * silent JWT refresh retry on 401, timeout handling, and JSON parsing.
 */
export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers: customHeaders = {},
    auth = true,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: externalSignal,
    _retried = false,
  } = options;

  const url = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = { ...customHeaders };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData && body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getStoredAccessToken();
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (response.status === 401 && auth) {
      // Attempt silent refresh once before expiring the session
      if (!_retried && !String(path).includes('/auth/refresh')) {
        const refreshedToken = await tryRefreshSessionToken();
        if (refreshedToken) {
          return apiRequest(path, {
            ...options,
            headers: {
              ...customHeaders,
              Authorization: `Bearer ${refreshedToken}`,
            },
            _retried: true,
          });
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? '' : extractErrorMessage(data, 'Request failed. Please try again.', response.status),
    };
  } catch (err) {
    if (err?.name === 'AbortError') {
      return {
        ok: false,
        status: 0,
        data: null,
        aborted: Boolean(externalSignal?.aborted),
        error: 'Request timed out. The server may be waking up—please try again.',
      };
    }
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Unable to reach the server. Please check your internet connection.',
    };
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export const apiGet = (path, options = {}) => apiRequest(path, { ...options, method: 'GET' });
export const apiPost = (path, body, options = {}) => apiRequest(path, { ...options, method: 'POST', body });
export const apiPut = (path, body, options = {}) => apiRequest(path, { ...options, method: 'PUT', body });
export const apiDelete = (path, options = {}) => apiRequest(path, { ...options, method: 'DELETE' });
