import { useState, useEffect, useRef, useCallback } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import DashboardContainer from './components/DashboardContainer';
import StaffDashboard from './components/StaffDashboard';
import PublicPetPassport from './components/PublicPetPassport';

const STAFF_ROLES = new Set(['staff', 'mdc', 'admin', 'clinician', 'nurse', 'veterinarian']);

function isStaffOrMDCSession(session) {
  if (!session) return false;
  const role = (session.role || '').trim().toLowerCase();
  const email = (session.email || '').trim().toLowerCase();
  if (role === 'student' || role === 'user') return false;
  return STAFF_ROLES.has(role) || email.includes('mdc') || email.includes('staff');
}

export default function App() {
  // TC-QR-001: Public Pet Passport trigger from physical QR scan (e.g. /passport/PET-001 or ?pet=PET-001)
  const [publicPetId, setPublicPetId] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const petQuery = urlParams.get('pet') || urlParams.get('id');
      if (petQuery) return petQuery.trim();

      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      if (pathSegments.length >= 2 && (pathSegments[0].toLowerCase() === 'pet' || pathSegments[0].toLowerCase() === 'passport')) {
        return decodeURIComponent(pathSegments[1]).trim();
      }
    } catch {
      return null;
    }
    return null;
  });

  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('tfb_session');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      const fifteenMinutes = 15 * 60 * 1000;
      const lastActive = parsed.lastActiveAt || parsed.createdAt;

      // Sliding window: only invalidate if there was no active interaction in the last 15 minutes
      if (lastActive && Date.now() - lastActive > fifteenMinutes) {
        localStorage.removeItem('tfb_session');
        localStorage.removeItem('tfb_staff_tab');
        localStorage.removeItem('tfb_user_tab');
        return null;
      }

      // Refresh activity stamp on successful hydration
      const refreshed = {
        ...parsed,
        lastActiveAt: Date.now(),
        email: (parsed?.email || '').trim().toLowerCase(),
        role: (parsed?.role || 'user').trim().toLowerCase()
      };
      localStorage.setItem('tfb_session', JSON.stringify(refreshed));
      return refreshed;
    } catch {
      localStorage.removeItem('tfb_session');
      return null;
    }
  });

  // TC-MED-003: Guard restricted /mdc/dashboard route from unauthorized students on load
  const [toastMessage, setToastMessage] = useState(() => {
    try {
      const currentPath = window.location.pathname.toLowerCase();
      if ((currentPath.includes('/mdc/dashboard') || currentPath.startsWith('/mdc')) && !isStaffOrMDCSession(session)) {
        window.history.replaceState(null, '', session ? '/student/dashboard' : '/login');
        return 'Access Denied: MDC Personnel Only';
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

  const isStaff = isStaffOrMDCSession(session);

  // Keep browser URL synchronized with authenticated role & auth screen
  useEffect(() => {
    if (publicPetId) return;
    try {
      const targetPath = !session
        ? (isLogin ? '/login' : '/register')
        : isStaff
        ? '/mdc/dashboard'
        : '/student/dashboard';

      if (window.location.pathname !== targetPath || window.location.search) {
        window.history.replaceState(null, '', targetPath);
      }
    } catch {
      // Ignore history API errors in restricted environments
    }
  }, [session, isStaff, isLogin, publicPetId]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const checkRoute = () => {
      try {
        const currentPath = window.location.pathname.toLowerCase();
        if ((currentPath.includes('/mdc/dashboard') || currentPath.startsWith('/mdc')) && !isStaffOrMDCSession(session)) {
          window.history.replaceState(null, '', session ? '/student/dashboard' : '/login');
          setToastMessage('Access Denied: MDC Personnel Only');
          return;
        }
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        if (pathSegments.length >= 2 && (pathSegments[0].toLowerCase() === 'pet' || pathSegments[0].toLowerCase() === 'passport')) {
          setPublicPetId(decodeURIComponent(pathSegments[1]).trim());
          return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const petQuery = urlParams.get('pet') || urlParams.get('id');
        if (petQuery) {
          setPublicPetId(petQuery.trim());
          return;
        }
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
  }, [session]);

  const handleLoginSuccess = (sessionData) => {
    const now = Date.now();
    const normalized = {
      ...sessionData,
      email: (sessionData?.email || '').trim().toLowerCase(),
      role: (sessionData?.role || 'user').trim().toLowerCase(),
      createdAt: now,
      lastActiveAt: now
    };
    localStorage.setItem('tfb_session', JSON.stringify(normalized));
    setSession(normalized);
    try {
      const targetPath = isStaffOrMDCSession(normalized) ? '/mdc/dashboard' : '/student/dashboard';
      window.history.pushState(null, '', targetPath);
    } catch {
      // Ignore history API errors
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('tfb_session');
    localStorage.removeItem('tfb_staff_tab'); 
    localStorage.removeItem('tfb_user_tab');  
    sessionStorage.clear();
    setSession(null);
    setIsLogin(true);
    try {
      window.history.pushState(null, '', '/login');
    } catch {
      // Ignore history API errors
    }
  }, []);

  // ── SLIDING INACTIVITY TIMER: Resets on user actions, only expires after 15m of pure zero activity ──
  useEffect(() => {
    if (!session) return;

    let idleTimer;
    const fifteenMinutes = 15 * 60 * 1000;
    lastActivityUpdateRef.current = Date.now();

    const recordUserActivity = () => {
      // Throttle localStorage updates to once every 15 seconds to maintain smooth 60fps performance
      const now = Date.now();
      if (now - lastActivityUpdateRef.current > 15000) {
        lastActivityUpdateRef.current = now;
        try {
          const current = JSON.parse(localStorage.getItem('tfb_session') || '{}');
          if (current?.email) {
            current.lastActiveAt = now;
            localStorage.setItem('tfb_session', JSON.stringify(current));
          }
        } catch {
          // Ignore storage quota errors
        }
      }

      // Reset the 15-minute sliding countdown
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        handleLogout();
        alert("Your session has timed out due to 15 minutes of inactivity for institutional safety.");
      }, fifteenMinutes);
    };

    const userInteractionEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    userInteractionEvents.forEach(event => 
      window.addEventListener(event, recordUserActivity, { passive: true })
    );

    // Initial countdown start
    recordUserActivity();

    return () => {
      clearTimeout(idleTimer);
      userInteractionEvents.forEach(event => 
        window.removeEventListener(event, recordUserActivity)
      );
    };
  }, [session, handleLogout]);

  return (
    <>
      {/* ACCESS DENIED SECURITY TOAST NOTIFICATION (TC-MED-003) */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="bg-rose-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-rose-500/50 flex items-center gap-3 text-xs font-bold tracking-wide">
            <svg className="w-5 h-5 text-rose-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 7.5h.008v.008H12v-.008Z" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* PUBLIC PET PASSPORT MODAL (Emergency Collar QR Scan view) */}
      {publicPetId && (
        <PublicPetPassport
          petId={publicPetId}
          onClose={() => {
            setPublicPetId(null);
            const fallbackPath = !session
              ? (isLogin ? '/login' : '/register')
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
      )}

      {/* CORE APPLICATION ROUTING */}
      {!session ? (
        <div className="min-h-screen bg-slate-100 font-sans antialiased">
          {isLogin ? (
            <Login 
              onLoginSuccess={handleLoginSuccess} 
              togglePage={() => {
                setIsLogin(false);
                window.history.pushState(null, '', '/register');
              }} 
              onScanCollar={(id) => setPublicPetId(id)}
            />
          ) : (
            <Register
              togglePage={() => {
                setIsLogin(true);
                window.history.pushState(null, '', '/login');
              }}
            />
          )}
        </div>
      ) : isStaff ? (
        <StaffDashboard
          key={`staff-${session.email}`}
          session={session}
          onLogout={handleLogout}
        />
      ) : (
        <DashboardContainer
          key={`user-${session.email}`}
          session={session}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}