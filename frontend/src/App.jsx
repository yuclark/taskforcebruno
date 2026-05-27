import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import DashboardContainer from './components/DashboardContainer';
import StaffDashboard from './components/StaffDashboard';

export default function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('tfb_session');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      
      // ── MODIFIED: Check absolute timestamp validity on mount/refresh (15 Mins = 900,000ms) ──
      const fifteenMinutes = 15 * 60 * 1000;
      if (parsed.createdAt && Date.now() - parsed.createdAt > fifteenMinutes) {
        localStorage.removeItem('tfb_session');
        localStorage.removeItem('tfb_staff_tab');
        localStorage.removeItem('tfb_user_tab');
        return null;
      }

      return {
        ...parsed,
        email: (parsed?.email || '').trim().toLowerCase(),
        role: (parsed?.role || 'user').trim().toLowerCase()
      };
    } catch {
      localStorage.removeItem('tfb_session');
      return null;
    }
  });

  const [isLogin, setIsLogin] = useState(true);

  const handleLoginSuccess = (sessionData) => {
    const normalized = {
      ...sessionData,
      email: (sessionData?.email || '').trim().toLowerCase(),
      role: (sessionData?.role || 'user').trim().toLowerCase(),
      createdAt: Date.now() // ── MODIFIED: Inject entry timestamp on successful authentication loop ──
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

  // ── NEW FEAT EFFECT: GLOBAL REAL-TIME IDLE INACTIVITY TRACKING MATRIX ──
  useEffect(() => {
    if (!session) return;

    let idleTimer;
    const fifteenMinutes = 15 * 60 * 1000;

    const resetInactivityTimeout = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        handleLogout();
        alert("Security Alert: System session terminated automatically due to 15 minutes of inactivity.");
      }, fifteenMinutes);
    };

    // Track active user interactions across device viewport windows
    const userInteractionEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    userInteractionEvents.forEach(event => 
      window.addEventListener(event, resetInactivityTimeout)
    );

    // Initialize timer track on hook activation mount
    resetInactivityTimeout();

    return () => {
      clearTimeout(idleTimer);
      userInteractionEvents.forEach(event => 
        window.removeEventListener(event, resetInactivityTimeout)
      );
    };
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans antialiased">
        {isLogin ? (
          <Login onLoginSuccess={handleLoginSuccess} togglePage={() => setIsLogin(false)} />
        ) : (
          <Register togglePage={() => setIsLogin(true)} />
        )}
      </div>
    );
  }

  if (session.role === 'staff') {
    return (
      <StaffDashboard
        key={`staff-${session.email}`}
        session={session}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <DashboardContainer
      key={`user-${session.email}`}
      session={session}
      onLogout={handleLogout}
    />
  );
}