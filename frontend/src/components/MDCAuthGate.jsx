import React, { useEffect, useState } from 'react';

/**
 * SDD Component: MDCAuthGate.jsx
 * Mapped Requirement: SRS-1.2 & SRS-4.2 / DRF RBAC
 * 
 * Verifies that only authenticated personnel with MDC / Staff permissions
 * can access medical forms, clinical write portals, or the MDC dashboard.
 * Intercepts unauthorized students and redirects them to the main newsfeed
 * with an access denied security notification.
 */
export default function MDCAuthGate({ session, onRedirectToNewsfeed, children }) {
  const [accessDeniedToast, setAccessDeniedToast] = useState(false);

  const isMDCAuthorized = () => {
    if (!session) return false;
    const role = (session.role || '').trim().toLowerCase();
    const email = (session.email || '').trim().toLowerCase();

    // Explicitly reject student role or student email domains
    if (role === 'student' || role === 'user' || email.includes('student')) {
      return false;
    }

    // Authorize staff and clinic personnel
    return role === 'staff' || role === 'mdc' || role === 'admin' || email.includes('mdc') || email.includes('staff');
  };

  useEffect(() => {
    if (!isMDCAuthorized()) {
      setAccessDeniedToast(true);
      const timer = setTimeout(() => {
        if (onRedirectToNewsfeed) {
          onRedirectToNewsfeed();
        } else {
          window.history.replaceState(null, '', '/dashboard');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [session]);

  if (!isMDCAuthorized()) {
    return (
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 p-6 max-w-sm w-full text-center space-y-3 animate-bounce">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900">Access Denied</h3>
          <p className="text-xs text-rose-700 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
            Access Denied: MDC Personnel Only
          </p>
          <p className="text-[11px] text-slate-400">
            Redirecting you to the campus newsfeed...
          </p>
        </div>
      </div>
    );
  }

  return children;
}

