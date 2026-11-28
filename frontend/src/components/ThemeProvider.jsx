import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  THEME_STORAGE_KEY,
  ThemeContext,
  VALID_THEMES,
  applyThemeToDocument,
  getInitialTheme,
  getSystemPrefersDark,
} from '../lib/theme';

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [systemDark, setSystemDark] = useState(getSystemPrefersDark);

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === THEME_STORAGE_KEY) {
        const next = e.newValue && VALID_THEMES.has(e.newValue) ? e.newValue : 'system';
        setThemeState(next);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((nextTheme) => {
    if (!VALID_THEMES.has(nextTheme)) return;
    const root = document.documentElement;
    root.classList.add('theme-transition');
    setThemeState(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage quota errors
    }
    window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 260);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, isDark, setTheme, toggleTheme }),
    [theme, resolvedTheme, isDark, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
