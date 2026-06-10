import { Edit2, Save, Users } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export function Header({ projectName }: { projectName: string }) {
  const { t } = useSettings();
  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center px-5 gap-4 flex-shrink-0">
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{projectName}</span>
          <button className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0">
            <Edit2 size={12} />
          </button>
        </div>
        <span className="text-[11px] text-gray-400 dark:text-slate-500">{t.header_last_save}</span>
      </div>

      <div className="flex-1" />

      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
        <Save size={13} />
        {t.header_save}
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
        <Users size={13} />
        {t.header_export}
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 ml-0.5 fill-current text-gray-400">
          <path d="M6 8L1 3h10L6 8z" />
        </svg>
      </button>
    </header>
  );
}
