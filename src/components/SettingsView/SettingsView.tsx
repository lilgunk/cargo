import { Check, Globe, Moon, Sun } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import type { Theme } from '../../contexts/SettingsContext';
import type { Lang } from '../../i18n/translations';

export function SettingsView() {
  const { lang, setLang, theme, setTheme, t } = useSettings();

  const LANGS: { id: Lang; label: string; native: string; flag: string }[] = [
    { id: 'ru', label: 'Русский', native: 'Русский', flag: '🇷🇺' },
    { id: 'pl', label: 'Polski',  native: 'Polski',  flag: '🇵🇱' },
    { id: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  ];

  const THEMES: { id: Theme; icon: typeof Sun; label: string; desc: string; preview: string }[] = [
    { id: 'light', icon: Sun,  label: t.settings_light, desc: t.settings_light_desc,
      preview: 'bg-white border-gray-200' },
    { id: 'dark',  icon: Moon, label: t.settings_dark,  desc: t.settings_dark_desc,
      preview: 'bg-slate-800 border-slate-600' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center px-8 flex-shrink-0">
        <div>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">{t.settings_title}</h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">{t.settings_saved}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 max-w-2xl">
        {/* Language */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-blue-500" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t.settings_lang}</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {LANGS.map(l => (
              <button key={l.id} onClick={() => setLang(l.id)}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                  lang === l.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}>
                <span className="text-3xl">{l.flag}</span>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${lang === l.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {l.native}
                  </div>
                </div>
                {lang === l.id && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Theme */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sun size={16} className="text-blue-500" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t.settings_theme}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map(th => {
              const Icon = th.icon;
              return (
                <button key={th.id} onClick={() => setTheme(th.id)}
                  className={`flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all text-left ${
                    theme === th.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
                  }`}>
                  {/* Mini preview */}
                  <div className={`w-full h-16 rounded-xl border ${th.preview} overflow-hidden flex`}>
                    <div className={`w-8 h-full ${th.id === 'dark' ? 'bg-slate-950' : 'bg-slate-800'}`} />
                    <div className="flex-1 p-2 flex flex-col gap-1.5">
                      <div className={`h-2 w-16 rounded ${th.id === 'dark' ? 'bg-slate-600' : 'bg-gray-200'}`} />
                      <div className={`h-2 w-10 rounded ${th.id === 'dark' ? 'bg-slate-700' : 'bg-gray-100'}`} />
                      <div className={`h-5 w-full rounded-lg mt-auto ${th.id === 'dark' ? 'bg-blue-600/40' : 'bg-blue-100'}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-semibold ${theme === th.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        <Icon size={14} className="inline mr-1.5 mb-0.5" />{th.label}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{th.desc}</div>
                    </div>
                    {theme === th.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
