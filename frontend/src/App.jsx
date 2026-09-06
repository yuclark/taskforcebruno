import React, { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import DashboardContainer from './components/DashboardContainer';
import StaffDashboard from './components/StaffDashboard';
import PublicPetPassport from './components/PublicPetPassport';

export default function App() {
  // Public Pet Passport trigger from physical QR scan (e.g. ?pet=BRUNO-01 or /pet/BRUNO-01)
  const [publicPetId, setPublicPetId] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const petQuery = urlParams.get('pet') || urlParams.get('id');
      if (petQuery) return petQuery.trim();

      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      if (pathSegments.length >= 2 && pathSegments[0].toLowerCase() === 'pet') {
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

  const [isLogin, setIsLogin] = useState(true);
  const lastActivityUpdateRef = useRef(Date.now());

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
  };

  const handleLogout = () => {
    localStorage.removeItem('tfb_session');
    localStorage.removeItem('tfb_staff_tab'); 
    localStorage.removeItem('tfb_user_tab');  
    sessionStorage.clear();
    setSession(null);
    setIsLogin(true);
  };

  // ── SLIDING INACTIVITY TIMER: Resets on user actions, only expires after 15m of pure zero activity ──
  useEffect(() => {
    if (!session) return;

    let idleTimer;
    const fifteenMinutes = 15 * 60 * 1000;

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
        } catch {}
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
  }, [session]);

  return (
    <>
      {/* PUBLIC PET PASSPORT MODAL (Emergency Collar QR Scan view) */}
      {publicPetId && (
        <PublicPetPassport
          petId={publicPetId}
          onClose={() => setPublicPetId(null)}
          onGoLogin={() => {
            setPublicPetId(null);
            setIsLogin(true);
          }}
        />
      )}

      {/* CORE APPLICATION ROUTING */}
      {!session ? (
        <div className="min-h-screen bg-slate-100 font-sans antialiased">
          {isLogin ? (
            <Login onLoginSuccess={handleLoginSuccess} togglePage={() => setIsLogin(false)} />
          ) : (
            <Register togglePage={() => setIsLogin(true)} />
          )}
        </div>
      ) : session.role === 'staff' ? (
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