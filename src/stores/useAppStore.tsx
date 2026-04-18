// Hub OS – App Store (React Context + localStorage)
// Manages: organization info, theme preference, resolved theme
// Keys: 'hubos-org', 'hubos-preferences'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

// ─── Types ──────────────────────────────────────────

export interface OrgInfo {
  name: string;
  type: 'personal' | 'studio' | 'company';
  industry: string;
  tagline: string;
  avatarUrl: string;
}

export type ThemeSetting = 'warm' | 'dark' | 'system';
export type ResolvedTheme = 'warm' | 'dark';
export type BackgroundStyle = 'grid' | 'solid' | 'paper' | 'gradient';

interface Preferences {
  language: string;
  theme: ThemeSetting;
  bgStyle: BackgroundStyle;
  notifications: boolean;
  autoSave: boolean;
}

interface OrgContextValue {
  org: OrgInfo;
  setOrg: (org: OrgInfo) => void;
  updateOrg: (patch: Partial<OrgInfo>) => void;
}

interface ThemeContextValue {
  theme: ThemeSetting;
  resolvedTheme: ResolvedTheme;
  bgStyle: BackgroundStyle;
  setTheme: (theme: ThemeSetting) => void;
  setBgStyle: (style: BackgroundStyle) => void;
}

// ─── Constants ──────────────────────────────────────

const STORAGE_ORG = 'hubos-org';
const STORAGE_PREFS = 'hubos-preferences';

const DEFAULT_ORG: OrgInfo = {
  name: '半人马 OPC',
  type: 'personal',
  industry: '',
  tagline: '',
  avatarUrl: '',
};

const DEFAULT_PREFS: Preferences = {
  language: 'zh-CN',
  theme: 'warm',
  bgStyle: 'grid',
  notifications: true,
  autoSave: true,
};

// ─── Helpers ────────────────────────────────────────

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    /* corrupted data – ignore */
  }
  return fallback;
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded – ignore */
  }
}

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveTheme(setting: ThemeSetting): ResolvedTheme {
  if (setting === 'system') {
    return getSystemPrefersDark() ? 'dark' : 'warm';
  }
  return setting;
}

function applyThemeToDOM(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// ─── Contexts ───────────────────────────────────────

const OrgContext = createContext<OrgContextValue | null>(null);
const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ───────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Org state ─────────────────────────────────
  const [org, setOrgState] = useState<OrgInfo>(() =>
    loadJSON<OrgInfo>(STORAGE_ORG, DEFAULT_ORG),
  );

  const setOrg = useCallback((next: OrgInfo) => {
    setOrgState(next);
    saveJSON(STORAGE_ORG, next);
  }, []);

  const updateOrg = useCallback((patch: Partial<OrgInfo>) => {
    setOrgState((prev) => {
      const next = { ...prev, ...patch };
      saveJSON(STORAGE_ORG, next);
      return next;
    });
  }, []);

  const orgValue = useMemo<OrgContextValue>(
    () => ({ org, setOrg, updateOrg }),
    [org, setOrg, updateOrg],
  );

  // ── Theme state ───────────────────────────────
  const [themeSetting, setThemeSettingState] = useState<ThemeSetting>(() => {
    const prefs = loadJSON<Preferences>(STORAGE_PREFS, DEFAULT_PREFS);
    return prefs.theme;
  });

  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme(themeSetting),
  );

  // Persist theme into the shared preferences object
  const setTheme = useCallback((next: ThemeSetting) => {
    setThemeSettingState(next);
    const existing = loadJSON<Preferences>(STORAGE_PREFS, DEFAULT_PREFS);
    saveJSON(STORAGE_PREFS, { ...existing, theme: next });
  }, []);

  // ── Background style state ─────────────────────
  const [bgStyle, setBgStyleState] = useState<BackgroundStyle>(() => {
    const prefs = loadJSON<Preferences>(STORAGE_PREFS, DEFAULT_PREFS);
    return prefs.bgStyle;
  });

  const setBgStyle = useCallback((next: BackgroundStyle) => {
    setBgStyleState(next);
    const existing = loadJSON<Preferences>(STORAGE_PREFS, DEFAULT_PREFS);
    saveJSON(STORAGE_PREFS, { ...existing, bgStyle: next });
  }, []);

  // Resolve + apply whenever themeSetting changes
  useEffect(() => {
    const r = resolveTheme(themeSetting);
    setResolved(r);
    applyThemeToDOM(r);
  }, [themeSetting]);

  // Listen for system preference changes when theme='system'
  useEffect(() => {
    if (themeSetting !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const r: ResolvedTheme = e.matches ? 'dark' : 'warm';
      setResolved(r);
      applyThemeToDOM(r);
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [themeSetting]);

  // Apply on initial mount (SSR-safe guard)
  useEffect(() => {
    applyThemeToDOM(resolveTheme(themeSetting));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const themeValue = useMemo<ThemeContextValue>(
    () => ({ theme: themeSetting, resolvedTheme: resolved, bgStyle, setTheme, setBgStyle }),
    [themeSetting, resolved, bgStyle, setTheme, setBgStyle],
  );

  // ── Render ────────────────────────────────────
  return (
    <OrgContext.Provider value={orgValue}>
      <ThemeContext.Provider value={themeValue}>
        {children}
      </ThemeContext.Provider>
    </OrgContext.Provider>
  );
}

// ─── Hooks ──────────────────────────────────────────

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error('useOrg() must be used within <AppProvider>');
  }
  return ctx;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() must be used within <AppProvider>');
  }
  return ctx;
}
