import React, { useState } from 'react';
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
      role: (sessionData?.role || 'user').trim().toLowerCase()
    };
    setSession(normalized);
    localStorage.setItem('tfb_session', JSON.stringify(normalized));
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('tfb_session');
      sessionStorage.clear();
    } catch {}
    setSession(null);
    setIsLogin(true);
    window.location.replace('/');
  };

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