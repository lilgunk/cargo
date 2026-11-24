import { useState } from 'react';
import { Check, Download, FileJson, FileSpreadsheet, Save } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface HeaderProps {
  projectName: string;
  lastSaved: Date | null;
  canExportPlan: boolean;
  onSave: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export function Header({ projectName, lastSaved, canExportPlan, onSave, onExportJson, onExportCsv }: HeaderProps) {
  const { t, lang } = useSettings();
  const [menu, setMenu] = useState(false);
  const locale = lang === 'pl' ? 'pl-PL' : lang === 'ru' ? 'ru-RU' : 'en-GB';
  const btn = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0';

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center px-5 gap-4 flex-shrink-0">
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{projectName}</span>
        <span className="text-[11px] text-gray-400 dark:text-slate-500">
          {lastSaved
            ? `${t.header_last_save} ${lastSaved.toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
            : t.header_not_saved}
        </span>
      </div>

      <div className="flex-1" />

      <button onClick={onSave} className={btn}>
        {lastSaved ? <Check size={13} className="text-green-600" /> : <Save size={13} />}
        {t.header_save}
      </button>
      <div className="relative">
        <button onClick={() => setMenu(m => !m)} onBlur={() => setTimeout(() => setMenu(false), 150)} className={btn}>
          <Download size={13} />
          {t.header_export}
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 ml-0.5 fill-current text-gray-400">
            <path d="M6 8L1 3h10L6 8z" />
          </svg>
        </button>
        {menu && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-30 p-1">
            <button onClick={onExportJson} className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700">
              <FileJson size={14} /> {t.header_export_json}
            </button>
            <button onClick={onExportCsv} disabled={!canExportPlan} className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40">
              <FileSpreadsheet size={14} /> {t.header_export_csv}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
