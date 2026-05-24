import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import DashboardContainer from './components/DashboardContainer';
import StaffDashboard from './components/StaffDashboard';

export default function App() {
  const [session, setSession] = useState(null);
  const [isLogin, setIsLogin] = useState(true);

  const handleLoginSuccess = (sessionData) => {
    setSession(sessionData);
  };

  const handleLogout = () => {
    setSession(null);
    setIsLogin(true);
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