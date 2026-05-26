import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import DashboardContainer from './components/DashboardContainer';
import StaffDashboard from './components/StaffDashboard';

export default function App() {
  // ── MODIFIED: State initializer function reads from long-term storage on refresh ──
  const [session, setSession] = useState(() => {
    const savedSession = localStorage.getItem('tfb_session');
    return savedSession ? JSON.parse(savedSession) : null;
  });
  
  const [isLogin, setIsLogin] = useState(true);

  // ── MODIFIED: Persists session data into browser disk upon successful auth handshake ──
  const handleLoginSuccess = (sessionData) => {
    setSession(sessionData);
    localStorage.setItem('tfb_session', JSON.stringify(sessionData));
  };

  // ── MODIFIED: Clears the storage footprint completely on manual disconnection ──
  const handleLogout = () => {
    setSession(null);
    setIsLogin(true);
    localStorage.removeItem('tfb_session');
  };

  // 1. Unauthenticated Gateway State View
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

  // 2. Authenticated Staff POV: Desktop Administrative Workspace Panel
  if (session.role === 'staff') {
    return <StaffDashboard session={session} onLogout={handleLogout} />;
  }

  // 3. Authenticated User POV: Mobile-Responsive General Public Community Portal
  return <DashboardContainer session={session} onLogout={handleLogout} />;
}