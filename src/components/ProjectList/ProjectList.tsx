import { FolderOpen, Trash2, Truck } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import type { ProjectSummary } from '../../services/projectService';

interface Props {
  projects: ProjectSummary[];
  currentId?: string;
  onOpen: (id: string) => void;
  onDelete?: (p: ProjectSummary) => void;
}

/** The user's saved projects (from Supabase), newest first. */
export function ProjectList({ projects, currentId, onOpen, onDelete }: Props) {
  const { t, lang } = useSettings();
  const locale = lang === 'pl' ? 'pl-PL' : lang === 'ru' ? 'ru-RU' : 'en-GB';

  if (projects.length === 0) {
    return <p className="px-6 py-8 text-sm text-center text-gray-400 dark:text-slate-500">{t.projects_empty}</p>;
  }
  return (
    <ul className="divide-y divide-gray-100 dark:divide-slate-700">
      {projects.map(p => (
        <li key={p.id} className="group px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/60 dark:hover:bg-slate-700/40 transition-colors">
          <button onClick={() => onOpen(p.id)} className="flex-1 min-w-0 flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Truck size={17} className="text-gray-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                <span className="truncate">{p.name}</span>
                {p.id === currentId && (
                  <span className="text-[10px] px-1.5 py-px rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">{t.projects_current}</span>
                )}
              </div>
              <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">
                {p.vehicleName} · {p.units} {t.unit_pcs} · {p.planned ? t.projects_planned : t.projects_not_planned} ·{' '}
                {new Date(p.savedAt).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </button>
          <button onClick={() => onOpen(p.id)} title={t.projects_open}
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <FolderOpen size={16} />
          </button>
          {onDelete && (
            <button onClick={() => onDelete(p)} title={t.projects_delete} aria-label={t.projects_delete}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
