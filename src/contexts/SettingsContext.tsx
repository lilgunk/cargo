import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import type { Lang, Translations } from '../i18n/translations';

export type Theme = 'light' | 'dark';

interface SettingsCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  t: Translations;
}

const Ctx = createContext<SettingsCtx | null>(null);

const STORAGE_KEY = 'lo_settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangRaw] = useState<Lang>(() => {
    try { return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').lang ?? 'pl') as Lang; }
    catch { return 'pl'; }
  });
  const [theme, setThemeRaw] = useState<Theme>(() => {
    try { return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').theme ?? 'light') as Theme; }
    catch { return 'light'; }
  });

  function save(l: Lang, th: Theme) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang: l, theme: th }));
  }

  function setLang(l: Lang) { setLangRaw(l); save(l, theme); }
  function setTheme(th: Theme) { setThemeRaw(th); save(lang, th); }

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
  }, [theme]);

  return (
    <Ctx.Provider value={{ lang, setLang, theme, setTheme, t: TRANSLATIONS[lang] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
}
