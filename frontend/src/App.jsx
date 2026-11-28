import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import Login from './components/Login';
import Register from './components/Register';
import MDCAuthGate from './components/MDCAuthGate';
import { apiGet, apiPost, SESSION_REFRESHED_EVENT, UNAUTHORIZED_EVENT, warmUpApi } from './lib/api';
import {
  INACTIVITY_TIMEOUT_MS,
  SESSION_STORAGE_KEY,
  clearStoredSession,
  isStaffSession,
  loadStoredSession,
  saveStoredSession,
} from './lib/auth';

const DashboardContainer = lazy(() => import('./components/DashboardContainer'));
const StaffDashboard = lazy(() => import('./components/StaffDashboard'));
const PublicPetPassport = lazy(() => import('./components/PublicPetPassport'));

function getInitialPublicPetId() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const petQuery = urlParams.get('pet') || urlParams.get('id');
    if (petQuery) return petQuery.trim();

    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if (
      pathSegments.length >= 2 &&
      (pathSegments[0].toLowerCase() === 'pet' || pathSegments[0].toLowerCase() === 'passport')
    ) {
      return decodeURIComponent(pathSegments[1]).trim();
    }
  } catch {
    return null;
  }
  return null;
}

function PageLoadingFallback() {
  return (
    <div className="min-h-dvh bg-[#F3EFE9] dark:bg-[#0E0C14] flex flex-col items-center justify-center p-6 text-slate-500 dark:text-slate-400">
      <div className="w-9 h-9 border-3 border-slate-200 dark:border-slate-700 border-t-[#5C0612] dark:border-t-[#D4AF37] rounded-full animate-spin mb-3" />
      <p className="text-xs font-medium">Loading Wildcat Welfare Portal...</p>
    </div>
  );
}

function getInitialRecoveryToken() {
  try {
    const hash = (window.location.hash || '').replace(/^#/, '');
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const token = hashParams.get('access_token');
      const type = hashParams.get('type');
      if (token && type === 'recovery') {
        window.history.replaceState(null, '', '/reset-password');
        return token;
      }
    }
    const queryParams = new URLSearchParams(window.location.search);
    const qToken = queryParams.get('access_token');
    if (qToken && window.location.pathname.toLowerCase().includes('reset-password')) {
      window.history.replaceState(null, '', '/reset-password');
      return qToken;
    }
  } catch {
    return '';
  }
  return '';
}

export default function App() {
  const [publicPetId, setPublicPetId] = useState(getInitialPublicPetId);
  const [recoveryToken, setRecoveryToken] = useState(getInitialRecoveryToken);
  const [session, setSession] = useState(loadStoredSession);

  const [toast, setToast] = useState(() => {
    try {
      const currentPath = window.location.pathname.toLowerCase();
      if ((currentPath.includes('/mdc/dashboard') || currentPath.startsWith('/mdc')) && !isStaffSession(session)) {
        window.history.replaceState(null, '', session ? '/student/dashboard' : '/login');
        return { type: 'error', text: 'Access Denied: MDC Personnel Only' };
      }
    } catch {
      return null;
    }
    return null;
  });

  const [isLogin, setIsLogin] = useState(() => {
    try {
      return window.location.pathname.toLowerCase() !== '/register';
    } catch {
      return true;
    }
  });

  const lastActivityUpdateRef = useRef(0);
  const isStaff = isStaffSession(session);

  const showToast = useCallback((text, type = 'info') => {
    setToast({ text, type });
  }, []);

  // Silently pre-warm the backend API on initial load and when returning to a mobile/browser tab
  useEffect(() => {
    warmUpApi();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        warmUpApi();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLogout = useCallback(
    (noticeText = '', noticeType = 'info') => {
      const activeToken = session?.access_token;
      if (activeToken) {
        apiPost('/logout/', {}, { auth: true }).catch(() => {});
      }
      clearStoredSession();
      sessionStorage.clear();
      setSession(null);
      setIsLogin(true);
      if (noticeText) {
        showToast(noticeText, noticeType);
      }
      try {
        window.history.pushState(null, '', '/login');
      } catch {
        // Ignore restricted history API contexts
      }
    },
    [session?.access_token, showToast]
  );

  const handleLoginSuccess = useCallback(
    (sessionData, welcomeMessage = '') => {
      const normalized = saveStoredSession(sessionData);
      setSession(normalized);
      if (welcomeMessage) {
        showToast(welcomeMessage, 'success');
      }
      try {
        const targetPath = isStaffSession(normalized) ? '/mdc/dashboard' : '/student/dashboard';
        window.history.pushState(null, '', targetPath);
      } catch {
        // Ignore history API errors
      }
    },
    [showToast]
  );

  // Verify cached session token against the backend on mount to sync authoritative role & profile
  useEffect(() => {
    if (!session?.access_token) return undefined;
    let cancelled = false;

    const verifySession = async () => {
      const res = await apiGet('/session/');
      if (cancelled) return;
      if (res.ok && res.data?.user) {
        const serverUser = res.data.user;
        setSession((prev) => {
          if (!prev) return null;
          const synced = saveStoredSession({
            ...prev,
            email: serverUser.email || prev.email,
            role: serverUser.role || prev.role,
            is_staff: serverUser.is_staff,
            first_name: serverUser.first_name || prev.first_name,
            last_name: serverUser.last_name || prev.last_name,
            full_name: serverUser.full_name || prev.full_name,
            custom_id: serverUser.custom_id || prev.custom_id,
            student_id: serverUser.student_id || prev.student_id,
          });
          return synced;
        });
      } else if (res.status === 401) {
        handleLogout('Your session has expired. Please sign in again.', 'error');
      }
    };

    verifySession();
    return () => {
      cancelled = true;
    };
  }, [session?.access_token, handleLogout]);

  // Listen for global 401 unauthorized & silent JWT refresh events from the API client
  useEffect(() => {
    const onUnauthorized = () => {
      if (session) {
        handleLogout('Your session has expired. Please sign in again.', 'error');
      }
    };
    const onSessionRefreshed = (event) => {
      if (event?.detail?.access_token) {
        setSession(event.detail);
      }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    window.addEventListener(SESSION_REFRESHED_EVENT, onSessionRefreshed);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
      window.removeEventListener(SESSION_REFRESHED_EVENT, onSessionRefreshed);
    };
  }, [session, handleLogout]);

  // Keep browser URL synchronized with authenticated role & auth screen
  useEffect(() => {
    if (publicPetId || recoveryToken) return;
    try {
      const targetPath = !session
        ? isLogin
          ? '/login'
          : '/register'
        : isStaff
        ? '/mdc/dashboard'
        : '/student/dashboard';

      if (window.location.pathname !== targetPath || window.location.search) {
        window.history.replaceState(null, '', targetPath);
      }
    } catch {
      // Ignore history API errors
    }
  }, [session, isStaff, isLogin, publicPetId, recoveryToken]);

  // Browser back/forward route sync & /mdc route protection
  useEffect(() => {
    const checkRoute = () => {
      try {
        const currentPath = window.location.pathname.toLowerCase();
        if ((currentPath.includes('/mdc/dashboard') || currentPath.startsWith('/mdc')) && !isStaffSession(session)) {
          window.history.replaceState(null, '', session ? '/student/dashboard' : '/login');
          showToast('Access Denied: MDC Personnel Only', 'error');
          return;
        }
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        if (
          pathSegments.length >= 2 &&
          (pathSegments[0].toLowerCase() === 'pet' || pathSegments[0].toLowerCase() === 'passport')
        ) {
          setPublicPetId(decodeURIComponent(pathSegments[1]).trim());
          return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const petQuery = urlParams.get('pet') || urlParams.get('id');
        if (petQuery) {
          setPublicPetId(petQuery.trim());
          return;
        }
        setPublicPetId(null);
        if (!session) {
          if (currentPath === '/register') setIsLogin(false);
          else if (currentPath === '/login' || currentPath === '/') setIsLogin(true);
        }
      } catch {
        // Ignore malformed URL parameters
      }
    };
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, [session, showToast]);

  // Sliding 15-minute inactivity timeout for shared campus devices
  useEffect(() => {
    if (!session) return undefined;

    let idleTimer;
    lastActivityUpdateRef.current = Date.now();

    const recordUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityUpdateRef.current > 15000) {
        lastActivityUpdateRef.current = now;
        try {
          const current = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '{}');
          if (current?.email) {
            current.lastActiveAt = now;
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(current));
          }
        } catch {
          // Ignore storage quota errors
        }
      }

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        handleLogout('Your session has expired due to 15 minutes of inactivity.', 'error');
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, recordUserActivity, { passive: true }));
    recordUserActivity();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((evt) => window.removeEventListener(evt, recordUserActivity));
    };
  }, [session, handleLogout]);

  return (
    <>
      {/* Global Non-Blocking Toast Banner */}
      {toast?.text && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[120] flex justify-center pointer-events-none animate-fade-in"
        >
          <div
            className={`pointer-events-auto max-w-md w-full sm:w-auto px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-950 text-white border-rose-500/40'
                : toast.type === 'success'
                ? 'bg-emerald-950 text-white border-emerald-500/40'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Public Pet Passport Modal (Unauthenticated Collar QR Lookup) */}
      {publicPetId && (
        <Suspense fallback={<PageLoadingFallback />}>
          <PublicPetPassport
            petId={publicPetId}
            isLoggedIn={Boolean(session)}
            onClose={() => {
              setPublicPetId(null);
              const fallbackPath = !session
                ? isLogin
                  ? '/login'
                  : '/register'
                : isStaff
                ? '/mdc/dashboard'
                : '/student/dashboard';
              window.history.pushState(null, '', fallbackPath);
            }}
            onGoLogin={() => {
              setPublicPetId(null);
              setIsLogin(true);
              window.history.pushState(null, '', '/login');
            }}
          />
        </Suspense>
      )}

      {/* Core Portal Views */}
      {!session ? (
        <div className="min-h-dvh bg-[#F3EFE9] dark:bg-[#0E0C14] font-sans antialiased">
          {isLogin ? (
            <Login
              onLoginSuccess={(s) => handleLoginSuccess(s)}
              togglePage={() => {
                setIsLogin(false);
                window.history.pushState(null, '', '/register');
              }}
              onScanCollar={(id) => setPublicPetId(id)}
              recoveryToken={recoveryToken}
              onClearRecovery={() => {
                setRecoveryToken('');
                window.history.replaceState(null, '', '/login');
              }}
            />
          ) : (
            <Register
              onRegisterSuccess={(s, msg) => handleLoginSuccess(s, msg)}
              togglePage={() => {
                setIsLogin(true);
                window.history.pushState(null, '', '/login');
              }}
            />
          )}
        </div>
      ) : isStaff ? (
        <MDCAuthGate
          session={session}
          onRedirectToNewsfeed={() => {
            showToast('Access Denied: MDC Personnel Only', 'error');
            window.history.replaceState(null, '', '/student/dashboard');
          }}
        >
          <Suspense fallback={<PageLoadingFallback />}>
            <StaffDashboard
              key={`staff-${session.email}`}
              session={session}
              onLogout={() => handleLogout()}
            />
          </Suspense>
        </MDCAuthGate>
      ) : (
        <Suspense fallback={<PageLoadingFallback />}>
          <DashboardContainer
            key={`user-${session.email}`}
            session={session}
            onLogout={() => handleLogout()}
          />
        </Suspense>
      )}
    </>
  );
}
