import { createContext, useContext } from 'react';

export const THEME_STORAGE_KEY = 'tfb_theme';
export const VALID_THEMES = new Set(['light', 'dark', 'system']);

export const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function getSystemPrefersDark() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && VALID_THEMES.has(saved)) return saved;
  } catch {
    // Ignore storage access errors in private/restricted contexts
  }
  return 'system';
}

export function applyThemeToDocument(resolved) {
  if (typeof document === 'undefined') return;
  const isDark = resolved === 'dark';
  const root = document.documentElement;
  root.classList.toggle('dark', isDark);
  root.dataset.theme = resolved;
  root.style.colorScheme = isDark ? 'dark' : 'light';

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', isDark ? '#140C12' : '#5C0612');
  }
}

export function useTheme() {
  return useContext(ThemeContext);
}
