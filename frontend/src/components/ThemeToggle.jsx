import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';

/**
 * Reusable Theme Toggle for Desktop, Mobile, Sidebar, Auth, and Public Passport views.
 * - variant="compact": One-tap Light/Dark button for headers & floating corners
 * - variant="sidebar": 3-way Light / Dark / Auto segmented control styled for the maroon sidebar
 * - variant="on-maroon": Compact toggle styled for dark maroon headers (e.g. Public Passport, Mobile Auth bar)
 */
export default function ThemeToggle({ variant = 'compact', className = '' }) {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();

  if (variant === 'sidebar') {
    const options = [
      { key: 'light', label: 'Light', Icon: Sun },
      { key: 'dark', label: 'Dark', Icon: Moon },
      { key: 'system', label: 'Auto', Icon: Monitor },
    ];
    return (
      <div
        role="group"
        aria-label="Appearance theme"
        className={`grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/25 dark:bg-white/[0.04] border border-white/10 dark:border-white/[0.08] ${className}`}
      >
        {options.map(({ key, label, Icon }) => {
          const active = theme === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              aria-pressed={active}
              title={`Switch to ${label} theme`}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                active
                  ? 'bg-[#D4AF37] text-[#3B030B] dark:bg-white/[0.14] dark:text-white shadow-xs'
                  : 'text-stone-300/85 dark:text-zinc-400 hover:text-white hover:bg-white/10 dark:hover:bg-white/[0.06]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'on-maroon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`inline-flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/12 hover:bg-white/22 border border-white/15 text-[#D4AF37] text-xs font-semibold transition-colors shrink-0 ${className}`}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        <span className="hidden sm:inline text-white/95">{isDark ? 'Light' : 'Dark'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shrink-0 bg-stone-100/90 hover:bg-stone-200/80 border-stone-200/90 text-slate-700 dark:bg-[#1E1E22] dark:hover:bg-[#27272C] dark:border-[#2E2E34] dark:text-zinc-200 ${className}`}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-[#5C0612] shrink-0" />
      )}
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
