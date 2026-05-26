import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import DashboardContainer from './components/DashboardContainer';
import StaffDashboard from './components/StaffDashboard';

export default function App() {
  const [session, setSession] = useState(() => {
    const savedSession = localStorage.getItem('tfb_session');
    return savedSession ? JSON.parse(savedSession) : null;
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

  const handleLogout = () => {
    setSession(null);
    setIsLogin(true);
    localStorage.removeItem('tfb_session');
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

  if ((session.role || '').toLowerCase() === 'staff') {
    return <StaffDashboard key={session.email} session={session} onLogout={handleLogout} />;
  }

  return <DashboardContainer key={session.email} session={session} onLogout={handleLogout} />;
}