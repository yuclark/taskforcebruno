import { useEffect } from 'react';
import { ShieldOff } from 'lucide-react';
import { isStaffSession } from '../lib/auth';

export default function MDCAuthGate({ session, onRedirectToNewsfeed, children }) {
  const authorized = isStaffSession(session);

  useEffect(() => {
    if (!authorized) {
      const timer = setTimeout(() => {
        if (onRedirectToNewsfeed) {
          onRedirectToNewsfeed();
        } else {
          window.history.replaceState(null, '', '/student/dashboard');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [authorized, onRedirectToNewsfeed]);

  if (!authorized) {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="mdc-auth-denied-title"
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 p-6 max-w-sm w-full text-center space-y-3 animate-scale-up">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldOff className="w-6 h-6" />
          </div>
          <h3 id="mdc-auth-denied-title" className="text-base font-bold text-slate-900">
            Access Denied
          </h3>
          <p className="text-xs text-rose-800 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            Access Denied: MDC Personnel Only
          </p>
          <p className="text-xs text-slate-500">Redirecting you to the campus portal...</p>
        </div>
      </div>
    );
  }

  return children;
}
